# 서버 모듈

## 범위

Express API 서버. DB 스키마 초기화, 이메일 OTP 인증, books·quotes·collections·stats REST 엔드포인트 제공.

## 소유하지 않는 것

- UI 렌더링 — client/
- 정적 파일 서빙 — Vercel
- 이메일 내용 템플릿 이외의 이메일 배달 — Resend

## 불변 규칙

- `requireAuth` 미들웨어를 거친 라우트에서 `req.userId`는 항상 존재하는 integer.
- 모든 `books`, `quotes`, `collections` 테이블 조회·수정·삭제 쿼리에 `WHERE user_id = req.userId` 조건 필수. 빠지면 데이터 격리 위반.
- `server/index.js`에 새 라우트를 등록할 때 `requireAuth` 적용 여부를 명시적으로 결정해야 함. 인증 없는 라우트는 `/api/auth/*`만.

## 핵심 패턴

**라우트 핸들러 구조**:
```js
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT ...', [req.userId]);
    res.json(result.rows);
  } catch (err) {
    next(err);  // 글로벌 에러 핸들러로 전달
  }
});
```

**DB 접근**: `server/db.js`의 `pool`만 사용. `pool.query(sql, params)` — parameterized query 필수.

**라우트 간 격리**: `routes/*.js` 파일은 서로 직접 import하지 않음.

**오류 응답 형식**: `res.status(코드).json({ error: "메시지" })`. 서버 오류는 `next(err)`로 글로벌 핸들러에 위임.

## 테스트 안내

현재 테스트 없음. 추가 시 가장 중요한 테스트:
1. 다른 `userId`로 타인의 책/문장/컬렉션 접근 → 404 또는 403 반환 확인
2. 문장 추가 시 다른 사용자의 책 id → 403 반환 확인
3. JWT 없거나 만료 → 401 반환 확인

## 파일 구조

```
server/
├── index.js          ← 서버 시작, 미들웨어, 라우트 등록
├── db.js             ← PostgreSQL 풀, 스키마 초기화
├── middleware/
│   └── auth.js       ← JWT Bearer 검증, req.userId 주입
└── routes/
    ├── auth.js       ← OTP 발행(send), 검증(verify), JWT 발급
    ├── books.js      ← 책 CRUD
    ├── quotes.js     ← 문장 CRUD
    ├── collections.js← 컬렉션 CRUD, 책-컬렉션 연결
    └── stats.js      ← 독서 통계 집계
```
