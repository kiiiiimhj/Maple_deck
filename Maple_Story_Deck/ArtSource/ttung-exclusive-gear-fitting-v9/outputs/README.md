# 뚱땅 전용 장비 자세 전체 수정 (v9)

이번 수정은 모자·옷·목걸이를 입힌 모습을 모든 동작에서 다시 맞춘 작업입니다. 모자 챙의 끊김, 큰 빈 고리처럼 보이는 옷의 테두리, 목걸이 위치를 대상으로 했습니다.

원본 뚱땅 몸 76개 이미지와 기존 능력치는 변경하지 않았습니다. 게임은 원본 몸 위에 모자·옷·목걸이 세 이미지를 각각 표시하며 각 슬롯을 따로 장착·해제합니다. 조합 미리보기와 원화 가이드에 있는 통합 그림은 게임의 몸 이미지로 사용하지 않습니다.

서기·먹기·잠자기·탐색 가이드와 점프의 10개 몸 자세를 포함해 총 14개의 입힌 모습을 새로 그렸습니다. 귀 위치에 모자를 맞추고, 목걸이는 실제 목/가슴 위치로 옮겼습니다. 옷은 원본 앞발을 가리지 않도록 정리했으며, 점프 옷을 세로로 늘이는 방법은 사용하지 않았습니다. 수면 중 목걸이는 갈색 끈만 보입니다. 옷 레이어에는 목걸이의 보석과 금색 핀이 포함되지 않습니다.

## 실제 적용 화면

- [기본 자세 이전/수정 비교](actual-before-after.png)
- [행동별 실제 메이커 화면](actual-care-poses.png)
- [실제 장착 버튼 여덟 조합](actual-eight-combinations.png)
- [첫 U 점프 스킬](gear-cast-1-phase-1.png)
- [재사용 U 점프 스킬](gear-cast-2-phase-1.png)

## 확인 범위

메이커의 실제 장착 버튼, 먹기·씻기·주사·잠자기·산책 버튼을 사용했습니다. 발견·탐색·기쁨은 기존 화면 표시 경로를 직접 호출해 자세를 멈추고 촬영했습니다. 원본 76프레임에서 좌우 총 608개 표시 샘플을 확인하고, U 스킬의 첫 사용과 재사용을 확인했습니다. 검사 중 불투명도 변화, 잘못된 장비 선택, 위치·크기·반전 오류는 관측되지 않았습니다.

기능 검사는 외형의 적합성 판단과 별개입니다. 실제 화면과 확대된 전체 프레임에서 옷의 앞발 구멍, 모자 챙, 목걸이 및 수면 모습을 검토했습니다. 사용자가 추가로 지적하는 시각적 문제는 이 화면과 원화를 기준으로 수정합니다.

## 제작 도구와 프롬프트

기본 제공 ImageGen 도구로 가이드 원화를 제작했고, 가이드에서 장비만 분리·맞춤·색상 정리해 사용했습니다.

- [crouching-prompt](crouching-prompt.txt)
- [feeding-prompt](feeding-prompt.txt)
- [jump-67-prompt](jump-67-prompt.txt)
- [jump-68-prompt](jump-68-prompt.txt)
- [jump-70-prompt](jump-70-prompt.txt)
- [jump-71-prompt](jump-71-prompt.txt)
- [jump-72-prompt](jump-72-prompt.txt)
- [jump-74-prompt](jump-74-prompt.txt)
- [jump-75-prompt](jump-75-prompt.txt)
- [jump-76-prompt](jump-76-prompt.txt)
- [jumping-prompt](jumping-prompt.txt)
- [sleeping-prompt](sleeping-prompt.txt)
- [sniffing-prompt](sniffing-prompt.txt)
- [standing-prompt](standing-prompt.txt)

`*-guide.png`는 입힌 모양을 그린 원화 가이드입니다. `*-master.png` 및 `*-fit9-*.png`는 분리된 장비 이미지입니다. `overlay-map.json`은 원본 몸 프레임과 독립 장비의 연결입니다.
