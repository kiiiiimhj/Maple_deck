# 뚠호 주사·먹이·수면 연결부 보수

주사의 세 표정(what/cry/love), 먹이(eat), 수면(sleep)을 포함해 실제 사용하는 13개 동작의 56개 프레임 참조를 점검했습니다. 각 원본 프레임의 같은 귀·모자·망토 연결부에 빠진 안쪽 천과 빈 픽셀만 보완했습니다. 기존 칠해진 픽셀, 원본 표정·귀·발·꼬리·효과, 재생 간격은 유지했습니다.

수정 방식은 기존 프레임별 SVG/픽셀 원본의 직접 보수이며, 이번에 전체 그림을 새로 생성하지 않았습니다. 원래 v6의 내장 image_gen 기록은 프로젝트의 이전 원본에 보존되어 있습니다.

- [이번 세 돌보기의 현재 수정본](previews/current-care-junctions.png)
- [먹이](previews/eat.gif) · [수면](previews/sleep.gif) · [주사 반응](previews/cry.gif)
- 실제 화면·돌보기 확인: `runtime/`
- 연결부 빈 픽셀 검사: `junction-audit-before.json`, `junction-audit-after.json`
- 프레임별 추가 픽셀: `junction-repair-proof.json`
- 최종 게임 연결: `final-manifest.json`

장비 가격·옵션·아이콘과 게임 로직은 유지했습니다. 같은 작업에서 추가한 교환소 i 안내는 별도 작업이며 기존 교환소 220개 UI 요소의 위치·크기·설정을 유지했습니다.
