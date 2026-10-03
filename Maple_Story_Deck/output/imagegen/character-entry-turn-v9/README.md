# 전체 캐릭터 입장 연출 v9

실피드, 레이온, 쉐이드, 린을 기존 아르카나의 입장 연출에 연결했습니다. 현재 등록된 캐릭터 5명 모두 정면 → 옆모습 → 뒷모습 → 화면으로 확대되며 투명해짐 → 좁은 시야가 펼쳐짐의 같은 순서를 사용합니다. 시야 전환이 끝난 뒤 기존 전투 대기 콜백이 완료됩니다.

각 캐릭터는 원래 정면 리소스를 사용하고, 해당 캐릭터 전용 회전 이미지 4장을 선택합니다. 포즈마다 원본 비율을 유지하여 무기와 망토가 잘리지 않도록 했습니다. 아르카나의 승인된 이미지·연출 타이밍·UI 구성은 유지했습니다. 미등록 슬롯은 기존 안전한 반환 경로를 사용합니다.

내장 image_gen 도구로 원본 캐릭터 PNG를 참고해 생성했습니다. 프롬프트는 sylph-prompt.txt / leion-prompt.txt / shade-prompt.txt / rin-prompt.txt에 있습니다. 각 캐릭터 폴더에 생성 원본 turnaround-sheet.png, 정렬 미리보기 aligned-turnaround.png, 적용 프레임 quarter-front.png / side.png / quarter-back.png / back.png가 있습니다. 리소스 등록 정보는 applied-assets.json에 저장했습니다.

all-characters-preview.gif는 실제 메이커 렌더러의 고정 시간 캡처를 연결한 비교 미리보기입니다. 왼쪽 위 실피드, 오른쪽 위 레이온, 왼쪽 아래 쉐이드, 오른쪽 아래 린 순서입니다. 각 캐릭터 폴더에는 개별 ingame-preview.gif도 있습니다. 재생 속도 측정은 별도의 실제 OnUpdate 실행에서 수행했고 frame-profile.json에 기록했습니다.

캐릭터 해금 상태나 영구 저장 데이터는 수정하지 않았습니다. 아직 잠긴 캐릭터는 프레젠테이션만 별도로 검증하며, 실제 선택·입장 조건은 기존 규칙을 그대로 사용합니다. 검증 로그는 actual-start-logs.json / all-character-runtime-logs.json, 최종 결과는 verification.json에 있습니다.

되돌리려면 메이커를 정지하고 before/GameEntryFxUI.mlua를 G:/Maple_Story_Deck/RootDesk/MyDesk/UI/GameEntryFxUI.mlua에 복원한 다음 메이커를 새로고침하면 됩니다. 이 작업에서 UI 파일은 변경하지 않았습니다.
