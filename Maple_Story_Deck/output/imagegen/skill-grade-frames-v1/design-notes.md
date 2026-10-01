# 스킬 등급별 테두리 적용

일반은 회색, 매직은 파란색, 레어는 노란색입니다. 목록 카드 113개와 스킬 상세창 모두 실제 스킬 등급에 맞춰 표시합니다. 필터와 목록 갱신 후에도 이 구분을 유지합니다. 기존 우드톤, 잎사귀·버섯 장식과 배치를 이어갑니다.

메이커 실행 검증: 전체 113개 등급 매핑, 세 등급 필터, 세 상세창 배경과 원래 아이콘, 상세창 닫기, 반복 목록 갱신, 캐릭터 필터와 스크롤을 확인했습니다. 빌드·실행 오류 0개입니다. UI 배치·아이콘·잠금 이미지·유물·하단 메뉴는 변경되지 않았습니다.

이미지 제작 방식: 내장 image_gen 편집. 회색·파란색 카드 및 상세창은 기존 노란색 프레임을 참조해 만들었으며 노란색은 기존 에셋을 사용합니다. 정확한 생성 프롬프트와 원본 경로는 generation-manifest.json, 적용 경로·리소스 ID는 applied-assets.json에 있습니다.

최종 이미지: card-normal.png / card-magic.png / card-rare.png (254×280), popup-normal.png / popup-magic.png / popup-rare.png (640×960). 실제 적용 화면은 applied-list-*.png 및 applied-popup-*.png, 비교 이미지는 grade-cards-preview.png 및 grade-popups-preview.png입니다.

프로젝트 보관 위치: G:/Maple_Story_Deck/output/imagegen/skill-grade-frames-v1
