# Marge (여백) — 개인 독서 관리 앱

개인 독서 기록과 문장 수집을 위한 풀스택 웹 애플리케이션.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, React Router DOM 6, Vite 5 |
| Backend | Node.js, Express 4 |
| Database | SQLite (`better-sqlite3`, WAL 모드) |
| 개발 도구 | Nodemon (서버), Vite HMR (클라이언트) |
| 폰트 | Noto Serif KR, Noto Sans KR (Google Fonts) |

---

## 프로젝트 구조

```
marge/
├── client/                      # React 프론트엔드
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js         # API 클라이언트 함수 모음
│   │   ├── components/
│   │   │   ├── AddBookModal.jsx  # 책 추가 모달
│   │   │   ├── BookCard.jsx      # 책 카드
│   │   │   ├── Navbar.jsx        # 네비게이션 바
│   │   │   ├── QuoteCard.jsx     # 문장 카드
│   │   │   └── StarRating.jsx    # 별점 컴포넌트
│   │   ├── pages/
│   │   │   ├── BookList.jsx      # 서재 (책 목록)
│   │   │   ├── BookDetail.jsx    # 책 상세 / 문장 입력
│   │   │   ├── QuoteCollection.jsx # 문장 모음
│   │   │   └── Stats.jsx         # 통계
│   │   ├── App.jsx               # 라우팅
│   │   ├── index.css             # 전역 스타일 (CSS 변수 포함)
│   │   └── main.jsx              # 진입점
│   ├── index.html
│   ├── vite.config.js            # 프록시: /api → localhost:3001
│   └── package.json
└── server/                      # Express 백엔드
    ├── routes/
    │   ├── books.js              # /api/books CRUD
    │   ├── quotes.js             # /api/quotes CRUD
    │   └── stats.js              # /api/stats GET
    ├── db.js                     # DB 초기화 및 테이블 생성
    ├── index.js                  # 서버 진입점 (포트 3001)
    ├── marge.db                  # SQLite 데이터베이스 파일
    └── package.json
```

---

## DB 테이블

### `books`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `title` | TEXT NOT NULL | 책 제목 |
| `author` | TEXT | 저자 |
| `publisher` | TEXT | 출판사 |
| `status` | TEXT NOT NULL DEFAULT `'읽고 싶음'` | `'읽고 싶음'` / `'읽는 중'` / `'완독'` |
| `rating` | REAL | 별점 (1.0 ~ 5.0) |
| `review` | TEXT | 감상 |
| `start_date` | TEXT | 독서 시작일 |
| `end_date` | TEXT | 완독일 |
| `created_at` | TEXT DEFAULT `datetime('now','localtime')` | |

### `quotes`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `book_id` | INTEGER NOT NULL FK → `books.id` | CASCADE DELETE |
| `text` | TEXT NOT NULL | 수집한 문장 |
| `page` | INTEGER | 페이지 번호 |
| `memo` | TEXT | 메모 |
| `created_at` | TEXT DEFAULT `datetime('now','localtime')` | |

---

## API 엔드포인트

### Books
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/books` | 목록 조회 (`?status=`, `?search=`) |
| GET | `/api/books/:id` | 단건 조회 |
| POST | `/api/books` | 등록 |
| PUT | `/api/books/:id` | 수정 |
| DELETE | `/api/books/:id` | 삭제 |

### Quotes
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/quotes` | 목록 조회 (`?book_id=`) |
| POST | `/api/quotes` | 등록 |
| PUT | `/api/quotes/:id` | 수정 |
| DELETE | `/api/quotes/:id` | 삭제 |

### Stats
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/stats` | 통계 (상태별 권수, 연도별 완독, 평균 별점, 문장 수) |

---

## 실행 방법

### 첫 실행 (의존성 설치)

```bash
cd server && npm install
cd ../client && npm install
```

### 개발 서버 실행

터미널 두 개를 열어 각각 실행:

```bash
# 터미널 1 — 백엔드 (포트 3001)
cd server
npm run dev

# 터미널 2 — 프론트엔드 (포트 3000)
cd client
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

### 프로덕션 빌드

```bash
cd client && npm run build   # dist/ 생성
cd ../server && npm start    # 정적 파일은 별도 서빙 필요
```

---

## 포트 설정

| 서비스 | 포트 |
|--------|------|
| Vite 개발 서버 (프론트엔드) | 3000 |
| Express 서버 (백엔드) | 3002 |

Vite는 `/api/*` 요청을 `localhost:3002`로 프록시하므로 CORS 설정 없이 개발 가능.

---

## 라우팅 구조

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | BookList | 서재 — 책 목록, 필터, 검색 |
| `/books/:id` | BookDetail | 책 상세, 감상 수정, 문장 입력 |
| `/quotes` | QuoteCollection | 전체 문장 모음 |
| `/stats` | Stats | 통계 (연도별 완독, 상태별 분포) |
