# Mem0 Book

## 소개
기술서를 점진적으로 입력(TOC → 본문)하고, Mem0 스타일의 메모리 파이프라인(추출 → 업데이트 → 검색)으로 장기 학습/활용을 지원하는 웹 앱을 만드는 프로젝트입니다.

## 핵심 아이디어
- **Reader + Q&A**: 읽으면서 질문하고 근거(출처)를 확인
- **Memory Inspector**: 시스템이 기억한 지식 단위를 투명하게 확인/수정
- **Artifact Library**: 체크리스트, 결정 규칙 등 실전 산출물 생성
- **Concept Graph**: 개념 간 관계를 그래프로 탐색

## 문서
- `docs/mvp_plan.md`: 현재 MVP 설계 문서
- `docs/app_design.md`, `docs/app_plan.md`, `docs/web_design.md`: 상세 기획 자료

## 현재 상태
- 초기 문서/설계 단계
- 구현은 아직 시작하지 않았습니다

## 환경 설정
- Redis는 외부 서버를 사용하므로 `REDIS_URL`을 설정해야 합니다.
- 예시 형식: `redis://:PASSWORD@leeyusung.fyi:6379/0`
- 비밀번호 같은 민감 정보는 `.env`에만 넣고 커밋하지 마세요.

## 기여
- 기여 가이드는 `AGENTS.md`를 참고하세요.
