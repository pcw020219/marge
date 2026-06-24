# 규칙

## 데이터 격리 (절대 규칙)

모든 DB 조회·수정·삭제 쿼리에 `WHERE user_id = req.userId` 조건이 있어야 한다.
이 조건 없이 데이터를 반환하거나 변경하면 타 사용자 데이터 노출 또는 훼손이 발생한다.

위반 탐지: 라우트 핸들러에서 `pool.query()` 호출 시 `user_id` 파라미터 없이 `books`, `quotes`, `collections` 테이블을 조회하는 경우.

## 인증 미들웨어

`/api/books`, `/api/quotes`, `/api/stats`, `/api/collections`는 반드시 `requireAuth` 미들웨어를 거쳐야 한다.
새 라우트를 `server/index.js`에 추가할 때 `requireAuth` 적용 여부를 명시적으로 결정해야 한다 — 기본값은 "보호".

위반 탐지: `app.use('/api/새라우트', require('./routes/새라우트'))`에서 `requireAuth`가 빠진 경우.

## API 응답 형식

- 오류 응답은 항상 `{ error: "한국어 메시지" }` 형태.
- 생성 성공: 201 + 생성된 객체.
- 조회·수정 성공: 200 + 객체 또는 배열.
- 삭제 성공: 200 + `{ success: true }`.
- 위반 시 클라이언트 오류 파싱 로직이 깨진다.

## SQL 파라미터화

DB 쿼리는 반드시 `pool.query('SELECT ... WHERE id=$1', [value])` 형태로 파라미터화해야 한다.
문자열 보간(`WHERE id=${value}`)은 SQL 인젝션을 허용하므로 사용 불가.

## 클라이언트 데이터 요청

서버 데이터는 `client/src/api/index.js`의 `api` 객체를 통해서만 요청한다.
직접 `fetch`를 호출하면 401 자동 리다이렉트, 토큰 첨부 등 공통 처리가 누락된다.

뮤테이션(생성·수정·삭제) 후 관련 TanStack Query 캐시를 `queryClient.invalidateQueries()`로 무효화해야 한다.
무효화 없으면 화면이 구버전 데이터를 표시한다.

## 모듈 경계

- `client/` 코드는 `server/`를 직접 import하지 않는다 — REST API 호출로만 통신.
- `server/routes/*.js` 파일은 서로 직접 import하지 않는다.
- `server/db.js`의 `pool`은 route 파일과 `db.js` 자체에서만 사용한다.

## 환경변수

서버 필수 환경변수: `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`.
누락 시 서버가 시작되지만 해당 기능(DB 연결, 인증, 이메일)이 런타임에 실패한다.

`VITE_API_URL`은 클라이언트 빌드 시 번들에 포함되므로 Vercel 환경변수에서 프로덕션 URL로 설정해야 한다.
설정 누락 시 클라이언트가 상대 경로 `/api`를 호출하여 Vercel에서 API 요청이 실패한다.

## 검증 게이트

- 클라이언트 빌드: `cd client && npm run build` — 오류 없이 완료되어야 함.
- 서버 시작: `cd server && node index.js` — 오류 없이 기동되어야 함.
- 데이터 격리: 다른 userId로 타인 데이터 접근 시 404 또는 403을 반환하는지 확인.
