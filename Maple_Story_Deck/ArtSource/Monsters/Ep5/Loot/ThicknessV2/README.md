# 누렁이 목줄·깨비 부적 두께 보강 (2026-10-20)

현재 슬롯 크기/비율 유지 작업에 맞춰 그림 자체를 다시 그렸다. 가죽 목줄의 띠와 앞면을 넓히고, 부적은 접힌 종이의 넓은 면과 가장자리를 표현했다. 부적의 기존 파란 투사체 꼬리는 정적 잡템에서 제거했다.

- 누렁이 목줄: 실제 등록 PNG 28×21, 기존 28×17. 갈색 가죽·금색 버클/고리 유지.
- 깨비 부적: 실제 등록 PNG 25×28, 기존 25×11. 노란 종이·붉은 문양 유지.
- Point 필터, 중앙 피벗, 완전 투명/불투명 알파. 원본 비율을 유지한 균일 축소와 투명 여백 제거만 수행.
- PlayerInventory의 해당 아이콘 RUID 두 곳만 변경했다. GameManager/InventoryUI 크기 설정의 파일 해시가 그대로임을 확인했다.
- 실제 메이커에서 두 리소스 로드, 드롭 연출, 수집, 가방 표시를 확인했다. 도토리와 옹기 조각을 함께 표시해 비교했다. 테스트 수량을 복구하고 원래 맵 편집 모드로 돌아갔다.
- 빌드 오류 0, 검증 중 새 실행 오류 0.

내장 image_gen 편집 모드로 재제작했다. 전체 최종 프롬프트는 generation-prompts.json, 실제 화면은 actual-inventory.png 및 actual-drop.png, 검증 기록은 runtime-verification.json에 있다.

활성 원화/적용 파일:
- ../masters/nureongi_collar.png
- ../icons/nureongi_collar.png (32px 편집용 캔버스)
- ../icons-trimmed/nureongi_collar.png (실제 등록)
- ../../Map3/Loot/masters/talisman-loot.png
- ../../Map3/Loot/talisman-loot.png (32px 편집용 캔버스)
- ../../Map3/Loot/trimmed/talisman-loot.png (실제 등록)
