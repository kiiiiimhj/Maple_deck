# 잡템 19종 화질 복구 (2026-10-20)

기존 생성 원화를 24~32픽셀로 축소한 뒤 64픽셀 가방/72픽셀 드롭에서 확대해 선과 색이 손실됐다. 모든 직접 제작 잡템 19종을 원화에서 다시 추출했다.

- 기존 PNG를 확대하지 않았다. 원화에서 한 번만 축소하며, 중간 32픽셀 파일을 거치지 않는다.
- PNG 캔버스는 기존의 가로·세로를 각각 4배(최대변 100~128픽셀)로 저장한다. UI/드롭에서의 캔버스 비율과 차지하는 면적은 그대로 유지한다.
- 색상 양자화와 알파 이진화를 제거하고, premultiplied-alpha Lanczos 축소로 선·색·투명 가장자리를 보존한다. 게임 리소스는 Point/Clamp, 중앙 피벗을 사용한다.
- 옹기 조각도 원본 투사체 시트의 첫 번째 비행 칸에서 고해상도로 다시 추출했다. 기존 64/32픽셀 프레임을 확대하지 않았다.
- PlayerInventory 아이콘 참조 19곳만 교체했다. 이름·가격·드롭 설정·획득 순서·환전 코드는 그대로다. GameManager와 InventoryUI 파일 해시가 바뀌지 않았음을 확인했다.
- 실제 메이커에서 19종의 리소스 크기/피벗, 드롭 표시·수집, 가방 표시를 전부 확인했다. 가방 최대변은 모두 기존 64픽셀이며 비율도 일치했다. 테스트 아이템 수량은 복구하고 원래 편집 모드로 돌아갔다.
- 빌드 오류 0, 검증 중 새 실행 오류 0.

현재 파일은 icons/, 원화는 masters/, 모든 활성 경로/리소스 목록은 quality-profile.json에 있다. 실제 화면은 actual-inventory.png 및 actual-drop-1/2.png. 이전/수정 비교는 quality-comparison.png. 검증 기록은 runtime-verification.json과 export-verification.json.

이 변경은 기존 built-in image_gen 원화의 재추출이다. 새 디자인 생성/변형은 하지 않았다. 다음 교체에서도 원화에서 바로 내보내고, 32픽셀로 줄인 파일을 적용 원본으로 쓰지 않는다. 옛 원화 제작 프롬프트는 상위 Loot, Map3, Map4/Loot의 generation-prompts.json 및 ThicknessV2/generation-prompts.json에 남아 있다. ThicknessV2 기록은 화질 복구 이전의 이력이며 현재 적용본은 이 QualityV3이다.
