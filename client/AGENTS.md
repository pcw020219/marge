# 클라이언트 모듈

## 범위

React SPA. 사용자 인터페이스, 인증 상태 관리, 서버 API 호출, 테마 전환, 화면 캡처.

## 소유하지 않는 것

- 비즈니스 로직 — 서버 API가 결정. 클라이언트는 서버 응답을 신뢰하고 표시만 함.
- 데이터 영속성 — 서버/DB
- JWT 유효성 검증 (서버 측) — middleware/auth.js

## 불변 규칙

- 서버 데이터는 `client/src/api/index.js`의 `api` 객체를 통해서만 요청. 직접 `fetch` 호출 시 토큰 첨부, 401 처리가 누락됨.
- 뮤테이션 후 관련 TanStack Query 캐시를 반드시 `queryClient.invalidateQueries()`로 무효화. 미무효화 시 화면이 구버전 데이터를 보여줌.
- 보호된 라우트는 `ProtectedRoute`로 감싸야 함. 감싸지 않으면 미인증 사용자가 접근 가능.
- `api/index.js`의 `req()` 함수가 401 응답 시 localStorage 토큰 삭제 + `/login` 리다이렉트를 수행함. 개별 컴포넌트에서 401을 별도 처리하지 않아도 됨.

## 핵심 패턴

**API 호출**:
```js
import { api } from '../api';
const data = await api.getBooks({ status: '완독' });
```

**TanStack Query 데이터 요청**:
```js
const { data, isPending } = useQuery({
  queryKey: ['books', status, search],
  queryFn: () => api.getBooks({ status, search }),
});
```

**뮤테이션 후 캐시 무효화**:
```js
queryClient.invalidateQueries({ queryKey: ['books'] });
queryClient.invalidateQueries({ queryKey: ['stats'] });
```

**테마**: `document.documentElement.setAttribute('data-theme', 'light'|'dark')` + `localStorage('theme')`. CSS 변수가 data-theme에 따라 전환됨.

**모달**: overlay 클릭 시 닫힘. `onClick={(e) => e.target === e.currentTarget && onClose()}` 패턴.

## 파일 구조

```
client/src/
├── api/
│   └── index.js          ← REST 호출 함수 모음 (api.*)
├── contexts/
│   └── AuthContext.jsx   ← JWT 상태 (localStorage, 만료 체크)
├── hooks/
│   └── useDebounce.js    ← 검색 입력 디바운스 (300ms)
├── pages/
│   ├── Login.jsx         ← 이메일 입력 → 6자리 코드 입력 2단계 흐름
│   ├── BookList.jsx      ← 책 목록, 필터, 검색, 컬렉션 관리
│   ├── BookDetail.jsx    ← 책 상세, 인라인 편집, 문장 입력
│   ├── QuoteCollection.jsx ← 전체 문장, 책별 필터, 텍스트 검색
│   └── Stats.jsx         ← 통계 (SVG 차트: 연도별/월별 바, 도넛)
└── components/
    ├── Navbar.jsx          ← 네비게이션, 테마 토글, 캡처 버튼
    ├── ProtectedRoute.jsx  ← 비인증 접근 → /login 리다이렉트
    ├── BookCard.jsx        ← 책 카드 (목록)
    ├── QuoteCard.jsx       ← 문장 카드 (삭제, 복사)
    ├── StarRating.jsx      ← 별점 표시/입력
    ├── AddBookModal.jsx    ← 책 추가 모달
    ├── BookEditModal.jsx   ← 책 수정 모달
    ├── CollectionManagerModal.jsx ← 컬렉션 생성/삭제
    ├── AddToCollectionModal.jsx   ← 책을 컬렉션에 추가
    └── QuoteDetailModal.jsx       ← 문장 상세/수정 모달
```

## 테스트 안내

`playwright` 패키지가 설치되어 있으나 테스트 파일 없음. `client/snap4.cjs`는 일회성 스크린샷 스크립트(프로덕션 코드 아님). 테스트 추가 시 인증 흐름(2단계), 보호된 라우트 리다이렉트, 캐시 무효화 후 UI 갱신이 핵심 시나리오.
