# 0003 — Vercel(프론트) + Railway(백엔드) 분리 배포

## 상황

프론트엔드는 정적 SPA, 백엔드는 Node.js 서버 + PostgreSQL. 각각 최적화된 플랫폼이 다름.

## 결정

Vercel에 React SPA(정적 빌드), Railway에 Express 서버 + PostgreSQL.

## 검토한 대안

**Railway 단일 배포 (FE+BE)**: 서버가 `client/dist/`를 직접 서빙하는 방식. 배포 설정은 단순해지지만, 정적 파일 CDN 혜택이 없고 Railway 요금 구조상 트래픽 비용이 불리할 수 있음.

**Vercel 단독 (Serverless + DB)**: Vercel 서버리스 함수로 API를 서빙할 수 있지만, `server/index.js`가 Express 앱이라 서버리스 전환 공수가 큼. `api/index.js`에 진입점은 있으나 현재 미활용.

## 결과

- 프론트엔드 빌드 시 `VITE_API_URL`에 Railway URL을 번들에 포함해야 함. URL 변경 시 클라이언트를 재빌드해야 함.
- 개발 중에는 Vite 프록시(`/api → localhost:3002`)로 CORS 없이 동작.
- 프로덕션에서는 다른 오리진 간 호출이므로 CORS 설정 필요 — 현재 전체 허용 상태 (findings F-3).
