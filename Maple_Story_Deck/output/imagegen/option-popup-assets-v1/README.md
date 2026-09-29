# 옵션 팝업 아트 v1

승인 시안: ../option-popup-consistency-preview-v1.png

적용: ui/OptionGroup.ui의 OptionPanel만 변경. 금테 없는 갈색 나무/초록 버튼.

- board.png: 장식이 포함된 무문자 배경. 옵션 제목, 버튼, X는 포함하지 않음.
- toggle.png: 설정 원형 버튼 공용 이미지. ON/OFF/한 번/두 번은 기존 텍스트와 로직 사용.
- action_button.png: 조합/게임 방법/게임 종료 공용 버튼 이미지. 글자는 기존 로컬라이징 키 사용.
- applied-preview.png: Maker에서 실제 적용 화면.
- resources.json: 내 리소스에 등록한 이름, RUID, 버전.
- manifest.json: 내장 image_gen 사용 프롬프트, 원본 경로, PNG 크기와 투명 영역.
- before.ui: UIBuilder로 저장한 적용 전 백업.
- apply-skin.cjs: UIBuilder 적용 스크립트. 새 PNG의 투명 여백은 Sprite LocalScale/LocalPosition으로 맞춤.
- authoring-verification.json / verification.json: 구조 보존 및 실제 마우스 동작 확인 결과.

131개 엔티티, UUID, 모든 ButtonComponent, 옵션 컨트롤 위치, 로컬라이징 키, X 전체, 다른 하위 팝업은 유지. 옵션 제목/라벨/버튼 텍스트에 BestFit와 크림색/갈색 외곽선 적용. OptionUI.mlua는 수정하지 않음.

검증: 빌드 오류 0. 설정 3종 전환 후 복원, 조합 및 게임 방법 열기/복귀, 게임 종료 확인창 열기/취소, X 닫기. 기존 ep4_map1 SpawnLocation 이름 오류와 빌드 경고 36건은 이번 아트 변경과 무관하며 그대로임.
