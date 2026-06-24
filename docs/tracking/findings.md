# 미해결 문제

## F-2: server/.env가 git에 추적됨 (미해결)

- **증상**: `git ls-files server/.env`가 파일을 반환함. `server/.gitignore`에 `.env`가 있지만 이미 커밋된 파일은 추적 해제되지 않음.
- **영향**: git 히스토리에 `DATABASE_URL`(Railway PostgreSQL 접속 정보), `JWT_SECRET`, `RESEND_API_KEY`가 포함되어 있음.
- **지금 해결 못하는 이유**: 자격증명 교체 여부를 먼저 결정해야 함.
- **해결 방향**: `git rm --cached server/.env` 실행 후 커밋. 이후 Railway에서 PostgreSQL 비밀번호 재설정, Resend에서 API 키 재발급, JWT_SECRET 새 값으로 교체.
