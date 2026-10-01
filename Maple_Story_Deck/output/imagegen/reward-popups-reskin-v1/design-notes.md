# 보상 버튼·캐릭터 해금 팝업 적용

방치 받기(대기/요청 중 회색), 인벤토리 부족 확인, 레이드 받기·시즌 종료 보상·부활, 콜로세움 다시하기, 캐릭터 해금창을 적용했습니다. 캐릭터 창은 기존 스킬·유물 창의 배경과 설명 패널·네모 X 버튼, 승인된 아바타 배경을 사용합니다.

메이커 빌드 및 최종 실행 오류 0건. 원래 엔티티 194개와 버튼 연결을 유지했습니다. 보상 지급·해금·부활·재도전은 검증 과정에서 실행하지 않았습니다. 전투 창·단상·몬스터·획득 연출 좌표는 그대로 유지합니다. 휴대폰 실기기 검증은 하지 않았습니다.

새 안내창 이미지: `dialog-frame.png` (760×520, 9-slice). 등록 정보: `applied-assets.json`. 원본: `generated-dialog-frame.png`. 게임 프로젝트에도 `G:/Maple_Story_Deck/output/imagegen/reward-popups-reskin-v1`에 저장했습니다.

이미지 생성 방식: 내장 image_gen. 나머지 버튼과 캐릭터 배경은 이전에 승인한 에셋을 재사용했습니다.

최종 프롬프트:

Use case: stylized-concept. Asset type: production game UI dialog background. Input image 1 is a STYLE REFERENCE ONLY: match its polished 2D cartoon painting, crisp dark brown outlines, glossy lime green leaves, orange mushrooms with pale cream stems, warm medium wood grain, thin bright gold bevel. Generate ONE blank horizontal rounded rectangular wooden dialog panel, aspect ratio 760:520. Large clean uninterrupted medium-dark warm wood center, narrow gold inner trim and dark brown outer edge. Small cluster of green leaves confined to the upper-left corner; very small orange mushroom and green leaves confined to bottom-right corner, occupying at most 14% of width and 18% of height. No bottom-left decoration. All decorations remain entirely inside the rectangular asset silhouette so a 9-slice can preserve corner details. Straight borders with smooth subtle highlights, no excessive ornaments. Front-facing flat UI view. Actual transparent background outside the panel, no drop shadow extending outside. The panel fills nearly the entire canvas. NO text, letters, symbols, buttons, characters, crystals, clock, ribbon, realistic moss or extra nested panels. Keep the majority of center unobstructed for live dynamic text and buttons.
