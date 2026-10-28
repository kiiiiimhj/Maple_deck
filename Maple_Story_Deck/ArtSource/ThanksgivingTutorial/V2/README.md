# 도토리 교환소 안내 V2

현재 적용본입니다. 가로 카드형 V1과 긴 화살표 시안은 폐기했습니다.

- 펫하우스 첫 세 단계와 같은 지그재그 배치: 왼쪽 위 → 오른쪽 → 왼쪽 아래.
- 사냥 / 도토리 수집 / 교환 장면을 새로 그렸습니다. 칠면조 눈은 선명한 동공이 있는 삽화입니다.
- 텍스트는 이미지 밖의 실제 UI 텍스트이며 한국어·번체·영어·일본어·간체·스페인어를 지원합니다.
- 화살표는 기존 펫하우스 리소스 6643f10005754442948e6e60629b9359, 원래 크기 210 × 204.05661로 재사용합니다. 두 번째만 좌우 반전합니다. 길게 늘리지 않습니다. 끝점은 다음 그림의 실제 알파 윤곽 안쪽을 가리킵니다.
- 단계와 들어오는 화살표가 동시에 나타나며, 공통 Content만 화면에 맞춰 축소합니다.
- 실제 실행 화면: guide-ko.png. 다른 언어 화면도 별도 저장했습니다.
- 기존 상점 223개 노드의 속성을 보존했습니다. 펫하우스 화살표·위치·크기는 수정하지 않았습니다.
- 오류 0, 재화 10750 유지. 작은 화면 검사는 사용 가능한 캔버스 크기를 바꾼 모의 검사이며 실기기 전환 검사가 아닙니다.

## 생성 기록

Mode: built-in imagegen. 세 장 모두 생성 프롬프트·참조는 generation-jobs.json, 원본 경로·모드는 각 *-generation.json에 저장했습니다. 원본 PNG는 *-raw.png, 적용 크기로 정리한 PNG는 step1-hunt.png / step2-collect.png / step3-exchange.png입니다. 기존 화살표는 새로 생성하지 않았습니다.

Saved assets: C:/Users/려진/Documents/Codex/2026-10-27/g-maple-story-deck-x20/outputs/acorn-exchange-guide-v2
Project archive: G:/Maple_Story_Deck/ArtSource/ThanksgivingTutorial/V2

## 후속 수정

최신 파일을 UIBuilder로 읽고 Tutorial/Content 하위에서 필요한 노드만 수정하세요. 전체 UI나 예전 소스 스냅샷을 복원하지 마세요. Help 버튼 및 원래 상점의 배치와 구매 동작은 유지합니다. 장비 V8 및 실제 칠면조 몬스터 리소스는 이번 수정 대상이 아닙니다.

layout.json / registered.json이 현재 적용값이며 applied.json은 최초 V2 적용의 이력입니다. rejectedLongAsset은 폐기된 긴 화살표 이력입니다.
