# 종료 확인 팝업 적용

승인된 `../quit-confirm-consistency-preview-v1.png`를 바탕으로 배경과 실제 UI 문구/버튼을 분리해 적용했다.

- 적용 대상: `ui/OptionGroup.ui`의 `ConfirmPanel` 하위 5개 요소.
- 새 배경: `board.png`, 내 리소스 `quit_confirm_board_v1`, RUID `963aa0aa0cbd418197e0696715357ff9`.
- 예/아니오 버튼: 옵션창의 `option_popup_action_button_v1` 재사용, RUID `5f3b12df85724f2ab7b48e26610f42f5`.
- 제작 도구: built-in imagegen. 최종 생성 프롬프트와 원본 경로는 `manifest.json`에 기록했다. 원본 PNG를 가공 없이 복사했고 투명 여백은 스프라이트 표시 배율/위치로 맞췄다.
- 네 문구 모두 기존 로컬라이징 키 유지, 크림색/갈색 외곽선 및 BestFit 적용. 제목 최대 36, 설명/버튼 최대 30.
- 131개 엔티티, UUID, 모든 컨트롤 위치/크기, 버튼 이벤트, 다른 패널, ConfirmDimmer, OptionUI.mlua 유지.
- 실제 적용 화면: `applied-preview.png`.
- 검증: Maker 종료창 열기, 뒤쪽 X 클릭 차단, 아니오로 옵션 복귀, 옵션 X 닫기 통과. 빌드 오류 0, 기존 빌드 경고 36. 종료 실행(예 클릭)은 호출하지 않았다.
- `before.ui`는 이번 종료창 변경 직전의 백업으로, 이미 승인된 옵션창 디자인이 포함되어 있다.
- `apply-skin.cjs`는 UIBuilder로 적용하고 범위 보존을 검사한다. `finalize.cjs`는 플레이 종료 후 저장 상태를 확인한다.
