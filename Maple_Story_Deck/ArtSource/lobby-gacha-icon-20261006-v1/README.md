# 로비 뽑기 아이콘 — 2026-10-06

Built-in ImageGen으로 기존 카드 3장 아이콘을 주변 로비 일러스트와 어울리도록 다시 그렸습니다. 더 높은 해상도, 입체적인 금빛 카드 테두리, 세로로 더 풍성한 카드 부채 모양으로 표현했습니다.

- gacha-cards.png: 적용 이미지, 512×512 투명 캔버스.
- generated-source/gacha-cards.png: 생성 원본.
- button-preview.png: 기존 원형 프레임 안 배치 미리보기.
- applied-assets.json: 등록 리소스 ID.
- before/: 기존 UI 스냅샷.
- layout-verification.json, build-logs.json, maker-save.json: 확인 및 저장 기록.

기존 아이콘 UI 132×132, 중앙 위치, 클릭 영역, 버튼 테두리, 보상 연출의 연결은 유지합니다. 플레이 확인은 사용자가 진행합니다.

## 제작 요청

Use case: precise-object-edit / style-transfer. Create ONE polished replacement icon for a MapleStory-themed game's lobby GACHA button. Reference 1 is the current small three-card fan icon, keep its meaning: three collectible magical cards fanned out. Reference 2 is the actual lobby, match the hand-painted cartoon quality, volume, warm gold, clean outlines of its trophy/calendar/chest/menu icons. No UI frame or circular badge: ONLY the standalone three-card cluster on a truly transparent background. Composition compact and nearly square, overall width/height about 1.06:1, so it fills a 132x132 icon slot rather than being a thin horizontal strip. Three thick magical cards, left slightly tilted outward with deep sapphire blue face, middle/back amethyst purple, front right crimson red; all with warm gold beveled edges and rich dark-brown outline. Front crimson card tallest and most legible, big gold five-point MAPLE LEAF emblem on its face, side card has simple starburst emblem; clean minimal corner accents. Soft sculpted highlights and underside shadows suggest tactile volume like the neighboring lobby illustrations. A few tiny golden sparkles close to the cards; no sprawling halo or cloud. Bold clear silhouettes readable at 96-132px, substantial card surfaces, avoid tiny busy filigree. Card fan extends vertically to use the square slot, but keep small transparent safety margins around all edges. Beautiful MapleStory casual fantasy cartoon game menu icon, smooth clean painting, not pixel art, not photorealistic metal. No letters, no text, no numbers, no currencies, no additional character, no mushrooms, no border or button background. Do not reproduce any surrounding UI or screenshot, only the redesigned card fan icon.

