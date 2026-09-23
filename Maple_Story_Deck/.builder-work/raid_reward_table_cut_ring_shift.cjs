// 2026-09-23 유저 지정: 레이드 "등급별 보상" 표 — 보스 체력(Cut)·반지(Ring) 열이 등급 열에 다닥다닥 붙어 있어 오른쪽으로 민다.
// 다이아(Dia, 75~225)·주문서(Scroll) 열은 그대로 두고 겹치지 않게 폭만 조금 줄인다(글자는 왼쪽 정렬이라 시작점이 오른쪽으로 감)
//   Cut : 가운데 -175 폭150 (-250~-100) → 가운데 -150 폭130 (-215~-85)   시작점 +35
//   Ring: 가운데  -10 폭170 ( -95~  75) → 가운데    5 폭140 ( -65~ 75)   시작점 +30
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const FILE = 'ui/RaidGroup.ui';
const COLS = { Cut: { x: -150, w: 130 }, Ring: { x: 5, w: 140 } };
const b = UIBuilder.load(FILE);
for (const [name, c] of Object.entries(COLS)) {
  b.patch('RewardTable/Head/' + name, { pos: [c.x, 0], rect_size: [c.w, 34] });
  for (let i = 0; i < 7; i++) b.patch('RewardTable/Row' + i + '/' + name, { pos: [c.x, 0], rect_size: [c.w, 40] });
}
b.write(FILE);
for (const e of b.listEntities().filter(e => /RewardTable\/(Head|Row0)\/(Grade|Cut|Ring|Dia|Scroll)$/.test(e.path)))
  console.log(e.path.split('RewardTable/')[1], JSON.stringify(e.pos), JSON.stringify(e.size));
