# 캐릭터 입장 연출 v7

입장 전용 UI에서 캐릭터의 Outline을 껐다. 금빛 Echo와 단풍잎·파티클·Flash 엔티티를 제거하고, 관련 배열·텍스처 선로딩·프레임 갱신 코드도 제거했다.

선택 캐릭터의 확대와 알파 감소, 카메라의 5.5% 접근 및 원래 시야 복원을 유지한다. 단풍 잔광 대기가 없어졌으므로 총 시간을 1.36초에서 1.16초로 줄였다. 연출 종료 후 전투를 시작하는 기존 대기 흐름을 유지한다.

수정 파일: `RootDesk/MyDesk/UI/GameEntryFxUI.mlua`, `ui/GameEntryFxGroup.ui`. mLua와 UIBuilder 스냅샷을 `before/`, `before-ui-snapshot.json`에 보관했다. 최종 UI에는 그룹·Effect·Shade·Silhouette 4개 엔티티가 있다.

Maker의 실제 캐릭터 선택 확인 버튼 경로에서 테두리 비활성, 입장 UI 내 단풍과 Echo 부재, 연출 중 전투 대기 및 종료 후 카메라 복원을 검증한다. `ingame-preview.gif`는 실제 인게임 배경 위 제작용 렌더러의 모양 확인 자료다.
