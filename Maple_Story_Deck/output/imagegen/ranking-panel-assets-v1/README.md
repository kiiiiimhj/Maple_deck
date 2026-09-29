# 랭킹 전체화면 탭 적용본

**현재 상태: 사용자 요청으로 랭킹 화면을 변경 전 상태로 원복했다.** 아래 이미지·리소스·검증 기록은 원복 전 디자인의 보관본이며 현재 게임에 적용되어 있지 않다. `restore-verification.json`에 복구 기록이 있다.

실제 적용 화면: [applied-preview.png](./applied-preview.png)

저장 폴더: `G:\Maple_Story_Deck\output\imagegen\ranking-panel-assets-v1`

전체화면 나무 배경 위에 왼쪽 제목·할아버지 구획과 오른쪽 순위표를 각각 배치했다. 왼쪽 구획은 작은 책·두루마리·나뭇잎이 들어간 별도 PNG이고, 제목과 할아버지는 기존 엔티티로 분리되어 있다. 1920×1080 기준 내용의 좌우 여백은 300/320px이다.

| 파일 | 내 리소스 이름 | RUID |
|---|---|---|
| background.png | ranking_fullscreen_background_v1 | b2baca550195431884e6a650fc722281 |
| sidebar.png | ranking_wizard_sidebar_v1 | 39caeb67f14a49a09ccd8c9c52f36a45 |
| tab_button.png | option_popup_action_button_v1 (기존 업로드 재사용) | 5f3b12df85724f2ab7b48e26610f42f5 |

`내 리소스`에서 `ranking_`를 검색하면 새 배경 두 개를 찾을 수 있다. 업로드 완료 후 계정 메타데이터와 리소스 목록에서 확인했다. `ranking_panel_board_v1`은 이전 팝업 초안이며 게임에 적용하지 않았다. `board.png`, `popup-draft-preview.png`도 같은 미사용 초안이다. `design-preview.png`는 전체화면 시안이고, 왼쪽 구획 추가까지 반영한 최종 모습은 `applied-preview.png`다.

수정된 게임 파일은 `ui/TitleGroup.ui`의 RankPanel 하위 배치·색·이미지와 `RootDesk/MyDesk/UI/RankUI.mlua`의 선택/비선택 탭 색 두 줄이다. 기존 1,659개 엔티티의 ID를 유지했고, 랭킹 밖 1,611개 엔티티와 랭킹의 24개 텍스트/로컬라이징 설정을 보존했다. 제목·탭·행 텍스트에는 BestFit을 적용했다. 기존 초록 보석 스크롤 손잡이와 SliderComponent 전체를 그대로 유지했다.

Maker에서 실제 탭 클릭, 무제한/타임어택 전환, 100명 클라이언트 임시 목록, 100위까지 손잡이 드래그, 목록 드래그와 손잡이 동기화, 내 순위 고정, 빈 목록, 로비 이동 후 재진입을 확인했다. 긴 한글/영문 이름은 말줄임되고 큰 점수도 칸 안에 표시된다. 임시 목록은 저장하지 않고 서버 조회로 실제 목록을 복구했다.

최종 새 플레이 세션은 빌드 오류 0, 런타임 오류/경고 0이다. 기존 빌드 경고 36개는 유지된다. 전체 로비 UI의 기존 스크롤 콘텐츠에 대한 정적 off-canvas 오류 1,103개는 변경 전과 동일하며, 랭킹 영역의 정적 검사 결과는 0건이다. 모바일 실기기 테스트는 수행하지 않았다. 4:3 화면은 기준 캔버스 너비에 대한 정적 계산으로 좌우 60/80px 공간을 확인했다.

검증 기록: `verification.json`, `authoring-verification.json`, `persistence-verification.json`.

제작: 내장 image_gen 도구. 생성 프롬프트는 `prompts.json`, 파일 정보는 `manifest.json`, 리소스 정보는 `resources.json`에 기록했다. 생성 PNG는 원본 바이트 그대로 복사했고, 투명 여백은 UI 렌더러의 크기/위치로 맞췄다. 재적용 스크립트는 `apply-skin.cjs`이며 Maker 편집 모드에서 실행 직후 Workspace Refresh가 필요하다.
