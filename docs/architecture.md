# 시스템 구성

## 컴포넌트 토폴로지

```
브라우저
  └─ Vercel (정적 SPA)
       └─ VITE_API_URL → Railway Express 서버 (포트 자동 할당)
                              ├─ Railway PostgreSQL (pool 연결)
                              └─ Resend API (이메일 발송, 인증 흐름에만 사용)
```

개발 환경에서는 Vite dev 서버(포트 3000)가 `/api/*` 요청을 `localhost:3002`로 프록시하므로 CORS 없이 동작한다.

## 대표 흐름: 책 목록 조회

1. 브라우저 → Vercel CDN: `GET /` → `index.html` (SPA)
2. React 초기화 → TanStack Query: `GET /api/books?status=읽는 중`
3. Express `requireAuth` 미들웨어: Authorization 헤더에서 JWT 추출 → `jwt.verify()` → `req.userId` 설정
4. `routes/books.js`: `SELECT * FROM books WHERE user_id=$1 AND status=$2 ORDER BY created_at DESC`
5. PostgreSQL → rows 반환 → Express `res.json()` → 브라우저

## 모듈 맵

| 모듈 | 역할 | 의존 방향 |
|------|------|-----------|
| `server/routes/auth.js` | OTP 발행/검증, JWT 발급 | → db.js, Resend |
| `server/routes/books.js` | 책 CRUD | → db.js |
| `server/routes/quotes.js` | 문장 CRUD | → db.js |
| `server/routes/collections.js` | 컬렉션 CRUD + 책-컬렉션 연결 | → db.js |
| `server/routes/stats.js` | 독서 통계 집계 | → db.js |
| `server/middleware/auth.js` | JWT Bearer 검증, req.userId 주입 | → jsonwebtoken |
| `server/db.js` | PostgreSQL 풀, 스키마 초기화 | → pg |
| `client/src/api/index.js` | REST 호출 함수 모음 | → fetch |
| `client/src/contexts/AuthContext.jsx` | JWT 상태 관리 (localStorage) | — |
| `client/src/pages/*` | 화면 단위 컴포넌트 | → api/, contexts/ |
| `client/src/components/*` | 재사용 UI 컴포넌트 | → api/ |
| `api/index.js` | Vercel serverless 진입점 | → server/index.js |

## 외부 의존성

| 서비스 | 용도 | 장애 영향 |
|--------|------|-----------|
| Railway PostgreSQL | 모든 영구 데이터 저장 | API 전체 불가 |
| Resend | OTP 이메일 발송 | 신규 로그인 불가 (기존 JWT 유효) |
| Vercel | 정적 파일 서빙 + SPA 라우팅 | 프론트엔드 접근 불가 |
| Railway (서버) | Express API 실행 | API 전체 불가 |

## 배포 구성

- **프론트엔드**: Vercel에 `client/` 연결. `vercel.json`의 SPA 리라이트(`/(.*) → /index.html`)로 클라이언트 라우팅 지원.
- **백엔드**: Railway에 `server/` 배포. `PORT` 환경변수로 포트 수신.
- **프로덕션 API URL**: `client/.env.production`의 `VITE_API_URL`에 Railway 서버 URL 설정. 빌드 시 번들에 포함됨.
