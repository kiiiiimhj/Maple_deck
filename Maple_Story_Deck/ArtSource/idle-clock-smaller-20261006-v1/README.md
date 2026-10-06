# 방치보상 상단 시계 축소

기존 `auto_bg_2` 배경의 상단 중앙 시계·리본 장식만 약 65% 크기로 축소. 배경 PNG는 원본과 같은 1299×1211 크기이며, 상단 중앙 수정 영역 밖의 모든 픽셀을 그대로 보존했다.

팝업 크기, 모든 내용·버튼 좌표, 엔티티 ID, 스크립트와 보상 로직은 그대로 유지. UI의 `Panel/Board` 배경 리소스만 교체.

최종 이미지: `idle-board.png`. 원본: `original-board-full.png`. 검증: `pixel-verification.json`, `layout-verification.json`, `maker-save.json`.

제작 모드: 내장 imagegen으로 원본을 부분 편집. 출력의 상단 중앙 영역만 원본 배경에 통합하고 경계를 연결했다.

## 생성 프롬프트

Use case: precise-object-edit. Edit the attached exact production game popup background. ONLY change the central CLOCK ORNAMENT above the top frame: the gold pocket-watch, its red ribbons, gold orbit ring, tiny sparkle and green foliage cluster as ONE group. Reduce this entire clock ornament to 65 percent of its current width and height (35 percent smaller), keep it centered at the same horizontal center and attached to the same top central wood/gold frame edge. Its bottommost red/gold point should still touch the existing top frame; shrinking must bring the top of the watch down toward the frame, not leave it floating. The current source canvas is 1299 by 1211, the original central decoration occupies approximately x415-889/y213-460, its new bounds should be approximately x497-805/y299-460. Preserve the source canvas and transparent margins. Repair only the small original-clock area revealed by shrinking: transparent sky above the frame, seamless original straight wooden top rail/gold line where exposed. DO NOT change any other pixels or objects: keep main rectangular panel, exact wood-grain texture, four chunky corner gold braces, border thickness, side red diamond gems, bottom-center red diamond and gold leaves, every side sparkle, all corner green foliage, original silhouette and geometry exactly unchanged. No text, no characters, no buttons, no additional ornament. Same crisp glossy 2D MapleStory cartoon UI artwork. Transparent background, full original panel remains visible and same size. A small local edit, no redesign.
