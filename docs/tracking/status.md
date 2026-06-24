# 현황

## 완료

| 기능 | 상태 |
|------|------|
| 이메일 OTP 인증 (발송 · 검증 · JWT 발급) | 구현됨, 테스트 없음 |
| 책 CRUD (목록 · 상세 · 추가 · 수정 · 삭제) | 구현됨, 테스트 없음 |
| 문장 CRUD | 구현됨, 테스트 없음 |
| 컬렉션 CRUD + 책-컬렉션 연결 | 구현됨, 완독 제약 미구현 |
| 통계 (상태별 · 연도별 · 월별 · 분야별 · 평균 별점 · 총 문장 수) | 구현됨, 테스트 없음 |
| 라이트 / 다크 테마 (localStorage 유지) | 구현됨 |
| 화면 캡처 기능 (html2canvas) | 구현됨 |
| Vercel(프론트) + Railway(백엔드+DB) 배포 구성 | 완료 |
| PostgreSQL 전환 (SQLite에서 마이그레이션) | 완료 |

## 미구현

아래 항목은 scope로 확인된 기능이지만 아직 구현되지 않음 (우선순위 순):

1. **컬렉션 완독 제약**: 완독 책만 컬렉션에 추가 가능해야 함. 현재 API에 상태 체크 없음. (`server/routes/collections.js`, findings F-1)
2. **CORS 도메인 제한**: 배포 도메인만 허용하도록 `cors({ origin: [...] })` 설정. (findings F-3)
3. **인증 코드 발송 횟수 제한**: `/api/auth/send`에 IP 기반 rate limiting 추가. (findings F-4)
4. **import 스크립트 삭제**: `server/scripts/import.js` 제거. (findings F-5)

## 알려진 문제

docs/tracking/findings.md 참조.
