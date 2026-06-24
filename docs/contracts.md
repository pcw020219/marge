# 외부 인터페이스

## 요청 인증

보호된 엔드포인트는 요청 헤더에 JWT를 포함해야 한다:

```
Authorization: Bearer <jwt_token>
```

JWT 없거나 만료/위조: `401 { "error": "..." }`

---

## 인증 API (`/api/auth`)

### POST /api/auth/send — 인증 코드 발송

- 요청: `{ "email": "user@example.com" }`
- 성공: `200 { "success": true }`
- 오류: `400 { "error": "유효한 이메일을 입력해주세요" }` (이메일 형식 불일치)

### POST /api/auth/verify — 코드 검증 및 JWT 발급

- 요청: `{ "email": "user@example.com", "code": "123456" }`
- 성공: `200 { "token": "<jwt>", "email": "user@example.com" }`
- 오류: `400 { "error": "이메일과 코드를 입력해주세요" }` (email 또는 code 누락)
- 오류: `401 { "error": "코드가 올바르지 않거나 만료되었습니다" }` (코드 불일치, 만료, 또는 이메일 미존재)

---

## 책 API (`/api/books`) — 인증 필요

공통 Book 객체 형태:
```json
{
  "id": 1,
  "user_id": 1,
  "title": "책 제목",
  "author": "저자명 또는 null",
  "publisher": "출판사 또는 null",
  "genre": "분야 또는 null",
  "status": "읽고 싶음 | 읽는 중 | 완독",
  "rating": 4.5,
  "review": "감상 또는 null",
  "start_date": "YYYY-MM-DD 또는 null",
  "end_date": "YYYY-MM-DD 또는 null",
  "is_favorite": 0,
  "reread_count": 0,
  "created_at": "2025-01-01T00:00:00Z"
}
```

### GET /api/books — 목록 조회
- 쿼리 파라미터: `status` (필터), `search` (제목·저자 부분 일치, 대소문자 무시)
- 성공: `200 Book[]` (생성일 역순)

### GET /api/books/:id — 단건 조회
- 성공: `200 Book`
- 오류: `404 { "error": "책을 찾을 수 없습니다" }`

### POST /api/books — 등록
- 요청: Book 객체 (title 필수, status 기본값 `'읽고 싶음'`)
- 성공: `201 Book`
- 오류: `400 { "error": "제목은 필수입니다" }`

### PUT /api/books/:id — 수정 (부분 업데이트)
- 요청: 변경할 필드만 포함. 전달하지 않은 필드는 기존 값 유지.
- 성공: `200 Book`
- 오류: `404`

### DELETE /api/books/:id — 삭제
- 성공: `200 { "success": true }`
- 오류: `404`

---

## 문장 API (`/api/quotes`) — 인증 필요

공통 Quote 객체 형태 (책 정보 포함):
```json
{
  "id": 1,
  "user_id": 1,
  "book_id": 1,
  "text": "인상 깊은 문장",
  "page": 42,
  "memo": "메모 또는 null",
  "created_at": "...",
  "book_title": "책 제목",
  "book_author": "저자명"
}
```

### GET /api/quotes — 목록 조회
- 쿼리 파라미터: `book_id` (특정 책의 문장만)
- 성공: `200 Quote[]` (생성일 역순)

### POST /api/quotes — 등록
- 요청: `{ "book_id": 1, "text": "문장", "page": 42, "memo": "메모" }` (text, book_id 필수)
- 성공: `201 Quote`
- 오류: `400` (필수값 누락), `403` (다른 사용자의 책)

### PUT /api/quotes/:id — 수정
- 요청: `{ "text", "page", "memo" }` (전달한 필드만 변경)
- 성공: `200 Quote`
- 오류: `404`

### DELETE /api/quotes/:id — 삭제
- 성공: `200 { "success": true }`
- 오류: `404`

---

## 컬렉션 API (`/api/collections`) — 인증 필요

### GET /api/collections — 목록
- 성공: `200 { id, name, created_at, book_count }[]` (이름순)

### POST /api/collections — 생성
- 요청: `{ "name": "컬렉션 이름" }`
- 성공: `201 { id, user_id, name, created_at }`
- 오류: `400` (이름 없음), `409` (중복 이름)

### DELETE /api/collections/:id — 삭제
- 성공: `200 { "success": true }`
- 오류: `404`

### GET /api/collections/book/:bookId — 책이 속한 컬렉션 목록
- 성공: `200 { id, name }[]`

### POST /api/collections/:id/books — 컬렉션에 책 추가
- 요청: `{ "book_id": 1 }`
- 성공: `201 { "success": true }`
- 오류: `400` (book_id 없음), `403` (컬렉션 또는 책이 해당 사용자 것이 아님)

### DELETE /api/collections/:id/books/:bookId — 컬렉션에서 책 제거
- 성공: `200 { "success": true }`
- 오류: `403` (컬렉션 권한 없음), `404` (컬렉션-책 연결 없음)

---

## 통계 API (`/api/stats`) — 인증 필요

### GET /api/stats

성공: `200`
```json
{
  "statusCounts": [{ "status": "완독", "count": 12 }],
  "yearlyCompleted": [{ "year": "2025", "count": 5 }],
  "monthlyCounts": [{ "year": "2025", "month": "03", "count": 2 }],
  "genreCounts": [{ "genre": "소설", "count": 4 }],
  "avgRating": 4.2,
  "totalQuotes": 38,
  "totalBooks": 25
}
```

- `avgRating`: null 가능 (평가한 책이 없을 때). 있으면 소수점 1자리.
- `yearlyCompleted`: 최근 연도 역순.
- `genreCounts`: 완독 책 중 genre가 있는 것만, 권수 내림차순.

---

## 공통 오류 형식

```json
{ "error": "한국어 오류 메시지" }
```

서버 내부 오류: `500 { "error": "서버 오류가 발생했습니다" }`
