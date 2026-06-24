# Marge (여백)

개인 독서 기록 웹앱. 책 상태 관리(읽고 싶음/읽는 중/완독), 인상 깊은 문장 수집, 컬렉션 정리, 통계 조회 기능을 제공한다. 이메일 OTP 인증으로 여러 사용자가 각자의 서재를 독립적으로 관리할 수 있다.

---

## 프로젝트 구조

```
marge/
├── CLAUDE.md                          ← 이 파일
├── AGENTS.md                          ← 동일 내용
├── docs/
│   ├── architecture.md                ← 컴포넌트 토폴로지, 요청 흐름
│   ├── business-rules.md              ← 도메인 규칙 (상태 전환, 인생책, 컬렉션)
│   ├── security.md                    ← 인증 흐름, 인가 모델, 자격증명
│   ├── standards.md                   ← 규칙 (데이터 격리, API 형식, 모듈 경계)
│   ├── engineering-notes.md           ← 개발 참고 (토큰 형식, 주의사항, 캐시 키)
│   ├── operations.md                  ← 설치, 개발 서버, 배포
│   ├── contracts.md                   ← API 엔드포인트 상세 (입출력, 오류)
│   └── tracking/
│       ├── status.md                  ← 완료 vs 미구현 현황
│       ├── decisions/
│       │   ├── index.md               ← 결정 목록
│       │   ├── 0001-postgresql-over-sqlite.md
│       │   ├── 0002-email-otp-auth.md
│       │   └── 0003-vercel-railway-split.md
│       └── findings.md                ← 미해결 문제 (F-2)
├── server/
│   └── AGENTS.md                      ← 서버 범위, 불변 규칙, 패턴
└── client/
    └── AGENTS.md                      ← 클라이언트 범위, 불변 규칙, 패턴
```

---

## 핵심 규칙 (반드시 지켜야 하는 것)

1. **데이터 격리**: 모든 DB 쿼리(`books`, `quotes`, `collections`)에 `WHERE user_id = req.userId` 조건 필수. 이 조건 없이 데이터를 반환하면 타 사용자 데이터 노출.

2. **인증 미들웨어**: `/api/auth/*` 외 모든 API 라우트에 `requireAuth` 미들웨어 적용. 새 라우트 추가 시 적용 여부를 명시적으로 결정.

3. **인생책 제약**: `is_favorite = 1`은 `status = '완독'`인 책에만 가능. 완독이 아닌 상태로 전환 시 자동 해제.

4. **컬렉션 제약**: 완독(`status = '완독'`)한 책만 컬렉션에 추가 가능. 서버에서 비완독 책 추가 시 400 반환, 클라이언트 `BookCard`는 완독 책에만 "컬렉션에 추가" 버튼 표시.

5. **오류 응답 형식**: 항상 `{ error: "한국어 메시지" }` 형태. 형식 불일치 시 클라이언트 파싱 오류.

---

## 작업 전 확인

**기본**: `docs/standards.md` → `docs/engineering-notes.md` → 관련 모듈 AGENTS.md 순서로 읽기.

**인증/보안 관련 작업 전**: `docs/security.md` + `server/middleware/auth.js` 확인. 데이터 격리 규칙(위 핵심 규칙 1)이 지켜지는지 반드시 검토.

**DB 스키마 관련 작업 전**: `docs/engineering-notes.md`의 PostgreSQL 전환 이후 주의사항 확인. `server/db.js`의 `CREATE TABLE IF NOT EXISTS` 패턴 사용 중 — 컬럼 추가/변경은 별도 ALTER 쿼리 필요.

**컬렉션 로직 전**: `docs/business-rules.md`의 컬렉션 규칙 확인.

**API 추가/변경 전**: `docs/contracts.md` 확인 후 변경된 계약을 함께 업데이트.

---

## 문제 처리

**즉시 사용자에게 보고**:
- `user_id` 없이 다른 사용자 데이터에 접근 가능한 경우
- JWT 검증 우회 가능성 발견
- 프로덕션 자격증명 추가 노출

**`docs/tracking/findings.md`에 기록**:
- 미구현 기능, API 오류, 보안 개선 사항, 그 외 모든 미해결 문제
