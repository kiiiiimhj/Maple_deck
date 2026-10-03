# 캐릭터 입장 연출 시도

선택한 캐릭터의 기존 정면 이미지를 어두운 실루엣으로 사용합니다. 빠르게 확대하여 화면에 다가온 뒤 금빛 잔상과 단풍잎이 퍼지며 사라집니다. 연출 길이는 0.64초입니다.

로비의 게임 시작 경로에서만 실행합니다. 기존 로딩과 서버 시작 시간은 유지합니다. 새 UI는 화면 중심과 높이를 기준으로 배치하고, 터치·클릭을 가로채지 않습니다.

## 연출만 끄기

메이커에서 `GameEntryFxUI`의 `PresentationEnabled`를 `false`로 바꾸면 됩니다. 다시 `true`로 바꾸면 켜집니다.

## 변경 파일

- `RootDesk/MyDesk/UI/GameEntryFxUI.mlua`: 새 입장 연출
- `ui/GameEntryFxGroup.ui`: 새 연출 전용 UI
- `RootDesk/MyDesk/LoadingUI.mlua`: 로비 시작 연출 예약
- `RootDesk/MyDesk/UI/TitleUI.mlua`: 선택 캐릭터 번호 전달

변경 전 기존 스크립트는 이 폴더의 `before`에 보관했습니다. 이후 수정이 생겼다면 백업 전체를 덮어쓰지 말고 입장 연출 연결 부분만 되돌리세요.
