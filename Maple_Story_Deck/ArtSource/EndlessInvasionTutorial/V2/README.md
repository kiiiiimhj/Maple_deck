# 침식 튜토리얼 V2 — 리본돼지·짧은 화살표

사용자가 제공한 원본 리본돼지 모양으로 3번 그림을 수정했습니다.
낮은 둥근 몸통, 처진 눈과 굵은 눈썹, 낮은 코, 작은 발굽, 등 위 리본을 기존 일러스트 그림체로 그렸습니다.
화살표는 길이를 약 절반으로 줄이고 몸통을 두껍게 바꿨습니다.
기존 그림 1·2는 V1 리소스를 그대로 사용합니다. 그림 3·화살표 2종은 아래 새 RUID로 사용합니다.

| 파일명 | RUID |
|---|---|
| InvasionTutorial_Step1_Begin | `14ace51fa62d4572ab8bc578114839b0` |
| InvasionTutorial_Step2_NextWave | `34ff4f9102bf487fa36e18f3da6721e6` |
| InvasionTutorial_Step3_RibbonPig_V2 | `63473c3f64cb4b99b45ff47106fa3600` |
| InvasionTutorial_Arrow1_Short_DownRight_V2 | `9686bc7e1ff145cc9396daeba4799f86` |
| InvasionTutorial_Arrow2_Short_DownLeft_V2 | `a2100d124aa3419baf5e60a640ce882d` |

## 배치

기존 최신 도토리 튜토리얼 배치의 이미지 위치는 그대로이며, 짧아진 화살표는 다음 그림 가까이 배치합니다.
콘텐츠 1520×1040, 원점 중앙, X 오른쪽+, Y 위쪽+, 피벗(0.5,0.5), 회전0°, FlipX/FlipY=false입니다.

| 파일 | 중심 좌표 | 표시 크기 |
|---|---|---|
| InvasionTutorial_Step1_Begin.png | [-380, 276] | 430×250 |
| InvasionTutorial_Step2_NextWave.png | [378, 27] | 430×250 |
| InvasionTutorial_Step3_RibbonPig_V2.png | [-380, -208] | 430×250 |
| InvasionTutorial_Arrow1_Short_DownRight_V2.png | [86.5, 123] | 155×124 |
| InvasionTutorial_Arrow2_Short_DownLeft_V2.png | [-94, -126.5] | 148×121 |

화살표는 방향을 PNG에 반영했습니다. 추가 회전이나 반전을 하지 않습니다.
그림·설명 영역과 화살표 픽셀이 겹치지 않음을 검사했습니다.
기존 코드를 수정하지 않아 게임 UI 적용은 하지 않았습니다. PNG·SVG·배치 시안·좌표·RUID만 제공합니다.
작업 전후 코드·UI·맵·모델 471개 파일의 해시가 모두 같습니다.

raw/step3.png는 내장 image_gen 수정 원본이며 prompts.json에 최종 프롬프트가 있습니다.
assets/는 등록 PNG 및 화살표 SVG, tutorial-layout-preview.png는 배치 시안입니다.
