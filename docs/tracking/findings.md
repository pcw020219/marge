# 미해결 문제

## F-1: 컬렉션에 완독 제약 미구현

- **증상**: `POST /api/collections/:id/books`에서 book.status 확인 없이 어떤 상태의 책도 컬렉션에 추가 가능.
- **영향**: 도메인 규칙(완독한 책만 컬렉션 추가 가능) 미준수. 읽는 중·읽고 싶은 책이 컬렉션에 들어갈 수 있음.
- **지금 해결 못하는 이유**: 컬렉션 뷰에서 미완독 책을 어떻게 처리할지 UX 결정 먼저 필요.
- **해결 방향**: `server/routes/collections.js`의 `POST /:id/books` 핸들러에서 `book.status === '완독'` 확인 후 아니면 400 반환.

## F-2: server/.env가 git에 추적됨

- **증상**: `git ls-files server/.env`가 파일을 반환함. `server/.gitignore`에 `.env`가 있지만 이미 커밋된 파일은 추적 해제되지 않음.
- **영향**: git 히스토리에 `DATABASE_URL`(Railway PostgreSQL 접속 정보), `JWT_SECRET`, `RESEND_API_KEY`가 포함되어 있음.
- **지금 해결 못하는 이유**: 자격증명 교체 여부를 먼저 결정해야 함.
- **해결 방향**: `git rm --cached server/.env` 실행 후 커밋. 이후 Railway에서 PostgreSQL 비밀번호 재설정, Resend에서 API 키 재발급, JWT_SECRET 새 값으로 교체.

## F-3: CORS 미제한

- **증상**: `app.use(cors())`로 모든 오리진 허용. 어떤 도메인의 스크립트에서도 API 호출 가능.
- **영향**: Vercel 배포 URL 외 도메인에서 인증된 요청 가능.
- **지금 해결 못하는 이유**: 배포 도메인 확정 + 개발 편의성 vs. 보안 트레이드오프 결정 필요.
- **해결 방향**: `cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [] })` 설정 + `ALLOWED_ORIGINS` 환경변수에 허용 도메인 목록.

## F-4: 인증 코드 발송 횟수 제한 없음

- **증상**: `POST /api/auth/send`에 속도 제한 없음. 임의 이메일로 무제한 코드 발송 가능.
- **영향**: Resend 무료 할당량 소진, 특정 이메일 주소에 스팸 피해 가능.
- **지금 해결 못하는 이유**: 현재 개인 사용 중심이라 긴급도 낮음. 공개 배포 전 적용 필요.
- **해결 방향**: `express-rate-limit` 패키지로 IP 기반 제한 추가 (예: 분당 5회).

## F-5: scripts/import.js 동작 불가 (삭제 예정)

- **증상**: `server/scripts/import.js`가 `better-sqlite3`의 동기 API(`.prepare()`, `.transaction()`)를 사용. 실행 시 즉시 오류.
- **영향**: 기존 독서 기록을 JSON 파일로 일괄 가져오는 기능 동작 안 함.
- **지금 해결 못하는 이유**: 대체 PostgreSQL 버전이 아직 없고, 데이터 마이그레이션 시나리오 없음.
- **해결 방향**: `git rm server/scripts/import.js`로 삭제. (필요 시 PostgreSQL 버전으로 재작성: `pool.query()` 비동기 API 사용)
