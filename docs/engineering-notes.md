# 개발 참고

## OTP 토큰 저장 형식: `${userId}:${code}`

`magic_tokens.token` 컬럼에 UNIQUE 제약이 있다. 6자리 코드만 저장하면 다른 사용자 간에 같은 코드가 동시에 발생할 때 삽입이 실패한다. `userId`를 접두사로 붙여 전체 값의 유일성을 보장한다.

verify 시 코드 비교: `token = ${userId}:${code}` 형태로 조회 — `user_id` 조건과 `token` 조건을 둘 다 사용해야 올바른 검증.

## 재전송 시 기존 코드 만료 처리

새 코드 발송 전 `UPDATE magic_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE` 실행. 이 처리 없이 새 코드를 삽입하면 복수의 유효 코드가 동시에 존재하게 된다.

## `server/.env`가 git에 커밋된 상태

`server/.gitignore`에 `.env`가 있지만, 이미 커밋된 파일은 gitignore로 추적이 해제되지 않는다.
해제하려면: `git rm --cached server/.env` 실행 후 커밋. 이후 자격증명(DATABASE_URL, JWT_SECRET, RESEND_API_KEY) 교체 필요.

단순히 `.gitignore`에 추가하는 것만으로는 해제되지 않는 이유: git은 이미 인덱스에 올라간 파일의 추적을 `.gitignore`로 중단하지 않는다. 반드시 `git rm --cached`로 인덱스에서 제거해야 한다.

## 클라이언트 401 자동 리다이렉트

`client/src/api/index.js`의 `req()` 함수는 응답 401 시 localStorage 토큰을 제거하고 `window.location.href = '/login'`으로 이동한다. TanStack Query의 onError 핸들러가 이를 처리하지 않으므로, 401은 Query 레벨 에러가 아닌 전역 리다이렉트로 처리됨.

## 클라이언트 사이드 페이지네이션

`BookList.jsx`는 서버에서 전체 목록을 받아온 후 클라이언트에서 21개씩 페이지 처리한다. 책이 수백 권 이상으로 늘어나면 초기 응답 크기가 커진다. 서버 사이드 페이지네이션이 필요한 규모가 되면 API에 `limit`/`offset` 파라미터 추가가 필요하다.

## Rate Limit — Railway 프록시 환경 주의

`express-rate-limit`의 기본 `keyGenerator`는 `req.ip`를 사용한다. Railway는 리버스 프록시를 경유하므로, `trust proxy` 설정 없이는 실제 클라이언트 IP 대신 프록시 IP가 `req.ip`로 잡혀 모든 요청이 같은 IP로 집계될 수 있다. 적용 시: `app.set('trust proxy', 1)` 추가 필요 (Railway는 1홉 프록시). 미설정 상태에서는 Rate Limit이 사실상 전체 트래픽에 통합 적용됨.

## `client/snap4.cjs`

Playwright를 사용한 일회성 스크린샷 스크립트. 프로덕션 코드가 아니며, 빌드에 포함되지 않는다.

## TanStack Query 캐시 키 구조

| 데이터 | 쿼리 키 |
|--------|---------|
| 전체 책 목록 | `['books', status, search]` |
| 단일 책 | `['book', id]` |
| 단일 책의 문장 | `['quotes', id]` |
| 전체 문장 | `['quotes']` |
| 통계 | `['stats']` |

책 수정/삭제 후 `['books']`와 `['stats']`를 함께 무효화해야 한다. `['quotes']`와 `['quotes', bookId]`는 공유 접두사(`['quotes']`)를 사용하므로 `queryClient.invalidateQueries({ queryKey: ['quotes'] })`가 양쪽 모두 무효화함.
