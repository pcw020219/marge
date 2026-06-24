# 0001 — SQLite에서 PostgreSQL로 전환

## 상황

초기 개발은 `better-sqlite3`(SQLite)으로 시작. 배포 환경(Railway)이 관리형 PostgreSQL을 지원하고, 다중 사용자 지원이 목표에 있음.

## 결정

SQLite를 버리고 Railway의 PostgreSQL로 전환.

## 검토한 대안

**SQLite 유지 (Railway Volume)**: Railway의 영구 볼륨에 SQLite 파일을 저장하는 방식. Railway 볼륨 설정이 추가로 필요하고, 멀티 인스턴스 확장 시 파일 동시 접근 문제가 생긴다. WAL 모드 파일(`.db-shm`, `.db-wal`)도 배포 디렉터리에 남음.

## 결과

- `better-sqlite3` 패키지 제거 → `pg` 패키지 도입.
- 모든 DB 쿼리가 동기에서 비동기(`async/await pool.query()`)로 전환됨.
- `server/scripts/import.js`가 SQLite 동기 API로 작성되어 전환 후 동작하지 않음 — 삭제 예정.
- DB 스키마 초기화가 서버 시작 시 `CREATE TABLE IF NOT EXISTS`로 자동 실행됨. 마이그레이션 파일 관리 없음.
