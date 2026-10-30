# 침식 튜토리얼 화살표 V3

사용자가 직접 잘라 보여준 배치 느낌을 참고해 화살표를 같은 중앙 세로축(x=0)에 맞췄습니다.
짧고 도톰한 금색 스타일을 유지하며 끝부분의 곡률과 화살촉 방향을 조정했습니다.
아래쪽 화살표의 마지막 접선은 리본돼지 몸통 쪽을 향합니다. 배치 시안과 같이 회전 없이 사용합니다.
그림 3장은 V2 PNG를 바이트 단위로 그대로 복사했으며 RUID도 재사용합니다.

| 파일 | RUID |
|---|---|
| InvasionTutorial_Step1_Begin | `14ace51fa62d4572ab8bc578114839b0` |
| InvasionTutorial_Step2_NextWave | `34ff4f9102bf487fa36e18f3da6721e6` |
| InvasionTutorial_Step3_RibbonPig_V2 | `63473c3f64cb4b99b45ff47106fa3600` |
| InvasionTutorial_Arrow1_Aligned_DownRight_V3 | `79945f79f1a94c599c6617beae8d3f25` |
| InvasionTutorial_Arrow2_Aligned_ToPig_V3 | `eac66b5973974f49b4703d220b4809c6` |

## 배치

좌표계: 콘텐츠1520×1040, 원점 중앙, X 오른쪽+, Y 위쪽+, 피벗(0.5,0.5), 회전0°, FlipX/FlipY=false.

| 화살표 | 중심 | 표시 크기 | 화살촉 위치 |
|---|---|---|---|
| InvasionTutorial_Arrow1_Aligned_DownRight_V3.png | [0, 162.5] | [214, 115] | [100, 127] |
| InvasionTutorial_Arrow2_Aligned_ToPig_V3.png | [0, -125] | [210, 156] | [-98, -176] |

layout.json에 그림·캡션 위치와 화살표 크기·곡선·끝점·RUID가 있습니다.
화살표 끝에서 진행 방향을 연장한 선이 다음 그림 영역에 들어가는지 검사했습니다.
화살표 불투명 픽셀과 그림·캡션 영역의 겹침은 0개입니다.
기존 코드·UI·맵·모델 471개 파일은 작업 전후 동일합니다.
메이커 내 리소스 등록만 수행했으며 게임 UI에 직접 적용하지 않았습니다.
PNG는 투명 배경이고 SVG 원본도 포함합니다. 이번 수정에는 이미지 재생성을 사용하지 않고 기존 벡터를 편집했습니다.
