# 보안 정책

## 인증 흐름

### 성공 경로
1. 사용자가 이메일 입력 → `POST /api/auth/send`
2. 서버: 이메일로 사용자 UPSERT. 기존 미사용 토큰 전부 만료 처리 (`used = TRUE`).
3. 6자리 숫자 코드 생성 → DB에 `${userId}:${code}` 형식으로 저장 (10분 유효).
4. Resend API로 코드 이메일 발송.
5. 사용자가 코드 입력 → `POST /api/auth/verify`
6. 서버: `user_id:code` 매칭, `used = FALSE`, `expires_at > NOW()` 조건으로 토큰 조회.
7. 조회 성공 시 토큰을 `used = TRUE`로 갱신 → JWT 발급 (유효기간 30일).
8. 클라이언트: JWT를 `localStorage('auth_token')`에 저장.

### 실패 경로
- 이메일 형식 불일치 → 400
- 코드 발송 성공 후 존재하지 않는 이메일로 verify → 401 (이메일 존재 여부 노출하지 않음)
- 코드 불일치 또는 10분 만료 → 401
- 코드 재사용 시도 → 401 (`used = TRUE`이므로 조건 불일치)
- JWT 없는 요청 (`Authorization` 헤더 없음) → 401
- 만료되거나 서명 불일치 JWT → 401 (`jwt.verify` 예외 처리)

## 인가 모델

| 주체 | 대상 | 허용 | 차단 |
|------|------|------|------|
| 인증된 사용자 | 자신의 books/quotes/collections/stats | 조회·생성·수정·삭제 | — |
| 인증된 사용자 | 다른 사용자의 데이터 | — | 모든 접근 (404 또는 403 반환) |
| 미인증 요청 | `/api/auth/*` | 코드 발송·검증 | — |
| 미인증 요청 | 그 외 모든 `/api/*` | — | 401 반환 |

모든 DB 쿼리에 `WHERE user_id = req.userId` 조건이 포함되어야 함. 이 조건 없이 데이터를 반환하는 쿼리는 데이터 격리 위반.

## 자격증명 관리

| 자격증명 | 저장 위치 | 만료/교체 |
|----------|-----------|-----------|
| JWT_SECRET | 서버 환경변수 | 노출 시 즉시 교체 (기존 JWT 전체 무효화) |
| DATABASE_URL | 서버 환경변수 | Railway 패스워드 교체 후 환경변수 업데이트 |
| RESEND_API_KEY | 서버 환경변수 | Resend 대시보드에서 교체 |
| JWT (사용자 세션) | 클라이언트 localStorage | 30일 후 자동 만료. 서버 측 revocation 없음 |

JWT는 localStorage에 저장되어 XSS에 취약함. 현재 허용 중인 트레이드오프.

## 보안 미구현 사항 (개선 예정)

- **CORS 제한 없음**: `app.use(cors())`로 모든 오리진 허용. 어떤 도메인의 스크립트에서도 API 호출 가능. 배포 도메인만 허용하도록 `cors({ origin: [...] })` 설정 추가 예정.
- **인증 코드 발송 횟수 제한 없음**: `/api/auth/send`에 속도 제한 없어 임의 이메일로 무제한 코드 발송 가능. IP 기반 rate limiting 추가 예정.
- **server/.env git 추적**: `server/.gitignore`에 `.env`가 있으나 이미 커밋된 파일이라 추적 해제되지 않음. `git rm --cached server/.env` 후 자격증명 교체 필요.
