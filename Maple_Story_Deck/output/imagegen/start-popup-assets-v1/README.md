게임 시작 팝업 개별 리소스 (2026-09-27)

적용 화면: [applied-preview.png](applied-preview.png)

각 부품을 독립적인 PNG로 생성하고 내 리소스에 개별 등록했습니다. 기존 83개 UI 엔티티/연결/문구 키/캐릭터/월드 사진을 보존했습니다. X 버튼과 SliderComponent 전체(손잡이 이미지·크기·동작)는 변경하지 않았습니다. 텍스트는 이미지와 분리되어 있으며 BestFit을 적용했습니다.

| 부품 | 내 리소스 이름 | RUID |
|---|---|---|
| 메인 배경판 | start_popup_board_v1 | 618a5a9958774101ba93f4357b034058 |
| 월드 사진 액자(안쪽 투명) | start_popup_world_frame_clear_v2 | de81ff0588cf4abc8dd04cf7e83d180f |
| 캐릭터 선택 칸 | start_popup_character_card_v1 | 821b6d38bff54e35be5b2c04f4ad731d |
| 캐릭터 설명창 | start_popup_description_panel_v1 | 762d2cc479354b108b32fe1ebeae8d65 |
| 월드 이름 받침 | start_popup_world_name_v1 | ca02485c97ba490fa252e70bf785d229 |
| 확인 버튼 | start_popup_confirm_button_v1 | b988cc0e3c8d4903bd10427dadd153fe |
| 이전/다음 화살표 버튼 | start_popup_arrow_button_v1 | c85f99f99b824140bba8f7258d7d47ef |
| 무제한 모드 배경 | start_popup_mode_bar_v1 | 83907cb2e4614fc2a3968539bd74e9ec |
| 빈 체크박스 | start_popup_checkbox_v1 | 6236911084c1406999a5ae49bd88b6bd |
| 스크롤 레일 | start_popup_scroll_track_v1 | 600a4020e8b1421ba7356465d71256d0 |

화살표 이미지는 좌우 반전으로 재사용합니다. 8개 캐릭터 칸은 동일한 카드 이미지를 재사용하고 선택 테두리를 런타임에서 표시합니다. 체크 표시는 기존 별도 이미지를 유지합니다.

생성 도구: 내장 image_gen. 원본 PNG, 생성 프롬프트는 [manifest.json](manifest.json), 월드 액자 투명화 수정 프롬프트는 [world-frame-refinement.json](world-frame-refinement.json)에 있습니다. PNG 픽셀을 외부 스크립트로 가공하지 않고 UI 렌더러에서 투명 여백과 배치를 맞췄습니다.

검증: Maker에서 월드 3종 전환, 캐릭터 선택/해금 안내/진행도, 체크 켜기·끄기, 기존 손잡이 왕복 드래그, 잠긴 확인 버튼 클릭, 기본 캐릭터 확인 활성화, X 닫기를 확인했습니다. 빌드 오류 0개, 팝업 관련 런타임 오류 0개입니다. 별도로 ep4_map1의 SpawnLocation_1/2 이름 오류(LEA-3021)가 클라이언트/서버 로그에 있으며 이번 UI 변경 범위 밖이라 수정하지 않았습니다. 실제 게임 입장은 실행하지 않았습니다. 상세 기록: [verification.json](verification.json).
