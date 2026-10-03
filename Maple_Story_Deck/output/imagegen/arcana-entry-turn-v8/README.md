# 아르카나 입장 연출 v8

첫 번째 캐릭터(아르카나, 인덱스 0)에만 적용한 실험 연출입니다.

- 원본 정면 → 45° → 옆모습 → 135° → 뒷모습.
- 뒷모습이 눈높이를 향해 확대되며 연속적으로 투명해집니다.
- 위아래 시야가 열리고, 좁아진 카메라 줌이 기존 PC/모바일 줌으로 돌아옵니다.
- 연출은 2.06초이며, 시야 전환까지 끝난 뒤 기존 전투 대기 콜백을 완료합니다.
- 다른 캐릭터는 기존 v7 연출을 사용합니다.
- 캐릭터 외곽 테두리와 단풍잎 효과는 사용하지 않습니다.

이미지는 내장 image_gen 도구로 원본 avatar_1.png를 참고해 생성했습니다. 프롬프트는 prompt.txt, 생성 원본은 turnaround-sheet.png, 정렬한 프레임은 quarter-front.png / side.png / quarter-back.png / back.png 입니다. 등록된 리소스 정보는 applied-assets.json에 있습니다.

실제 메이커 렌더러에서 시간을 고정해 캡처한 프레임을 ingame-preview.gif로 연결했습니다. 이는 포즈와 화면 전환을 확인하기 위한 미리보기이며, 실행 성능 측정 영상은 아닙니다. 실제 시작 버튼 경로의 검증 로그는 actual-start-logs.json, 검증 결과는 verification.json에 있습니다.

되돌릴 때는 메이커를 정지한 후 before/GameEntryFxUI.mlua를 원래 스크립트 위치에 복원하고, UIBuilder.read('before-ui-snapshot.json').write('G:/Maple_Story_Deck/ui/GameEntryFxGroup.ui')로 UI를 복원한 뒤 새로고침하면 됩니다.
