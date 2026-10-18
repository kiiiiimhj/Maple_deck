# 에피소드 5 제비 몬스터

사용자가 선택한 큰 눈·둥근 몸의 제비 시안을 사용한다. 기존 맵 몬스터를 참고해 테두리 굵기와 색을 맞췄다.

- 제작: Codex 내장 이미지 생성 도구. 최종 프롬프트: generation-prompt.txt
- 원화: chosen-design.png / 애니메이션 원본: animation-master.png
- 최종 게임 이미지: frames/ 24장, 96×96 RGBA, Point 필터, Clamp, pivot=(0.5,0.3).
- 비행 12장(0.065초), 피격 6장(0.025초), 사망 6장(0.125초).
- 원본 캐릭터를 연결된 영역 단위로 추출해 격자 밖으로 나온 날개·발을 보존했다. 가장자리 알파는 이진화하고 nearest 방식으로 축소했다.
- GameManager의 기존 pigeon 종과 24개 이미지 참조를 교체했다. 전투 설정·출현 구역·크기·전리품은 유지한다.
- MonsterAI가 공유 사전 로드와 단일 렌더러로 프레임을 재생한다. 피격 후 비행으로 돌아오고 사망은 마지막 프레임 뒤 숨긴다.
- 실제 메이커 ep5_map1에서 비행 12 / 피격 6 / 사망 6 프레임, 이미지 불일치 0, 재생 중 빈 프레임 0, 피격 복귀, 일반 스포너 혼합 출현을 확인했다. 검증 구간 신규 런타임 오류 0.

실제 맵 캡처: actual-native-roster.png / 검증 상세: actual-verification.json, native-spawn-verification.json
