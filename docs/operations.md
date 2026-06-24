# 운영

## 사전 요구사항

- Node.js 20 이상
- PostgreSQL (또는 Railway 등 외부 PostgreSQL 접속 정보)
- Resend 계정 및 API 키 (이메일 발송용)

## 첫 실행 (의존성 설치)

```bash
cd server && npm install
cd ../client && npm install
```

## 환경변수 설정

`server/.env` 파일 생성 (현재 git 추적 중이므로 주의 — findings F-2 참조):

```
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=<충분히 긴 임의 문자열>
RESEND_API_KEY=re_...
RESEND_FROM=Marge <sender@yourdomain.com>
APP_URL=http://localhost:3000
PORT=3002
```

`client/.env` (개발용, 기본값 사용 시 불필요):
```
VITE_API_URL=
```

## 개발 서버 실행

터미널 두 개를 열어 각각 실행:

```bash
# 터미널 1 — 백엔드 (포트 3002)
cd server
npm run dev

# 터미널 2 — 프론트엔드 (포트 3000)
cd client
npm run dev
```

브라우저 → `http://localhost:3000`

DB 스키마 초기화는 서버 시작 시 `initDb()`가 자동으로 `CREATE TABLE IF NOT EXISTS` 실행. 첫 시작 전 별도의 마이그레이션 스크립트 불필요.

## 빌드

```bash
cd client && npm run build
# 결과물: client/dist/
```

서버는 빌드 불필요 (Node.js 직접 실행).

## 배포

### 프론트엔드 (Vercel)

1. Vercel 프로젝트를 `client/` 루트로 설정 (빌드 명령: `npm run build`, 출력: `dist`).
2. 환경변수 추가: `VITE_API_URL=https://your-railway-server.up.railway.app`
3. `vercel.json`의 SPA 리라이트(`/(.*) → /index.html`)가 클라이언트 라우팅을 지원함.

### 백엔드 (Railway)

1. Railway 프로젝트에 `server/` 디렉터리 배포.
2. 환경변수 설정: `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`.
3. 시작 명령: `npm start` (`node index.js`).
4. Railway가 `PORT` 환경변수를 자동 설정 — 서버가 이를 수신.

### 배포 순서

백엔드 → 프론트엔드 순으로 배포. 프론트엔드 빌드 전에 백엔드 URL을 확정해야 `VITE_API_URL`을 정확히 설정할 수 있음.

## 환경변수 항목

| 변수 | 필수 | 설명 |
|------|------|------|
| `DATABASE_URL` | 필수 | PostgreSQL 연결 문자열 |
| `JWT_SECRET` | 필수 | JWT 서명 키. 노출 시 모든 세션 무효화 필요 |
| `RESEND_API_KEY` | 필수 | OTP 이메일 발송 |
| `RESEND_FROM` | 선택 | 발신자 주소 (기본값: `onboarding@resend.dev`) |
| `APP_URL` | 선택 | 앱 URL (현재 미사용, 예약) |
| `PORT` | 선택 | 서버 포트 (기본값: 3002) |
| `VITE_API_URL` | 필수(배포) | 클라이언트가 호출할 API URL. 빌드 시 번들에 포함 |
