// 2026-09-23: 장비창에 목걸이 칸 추가(자쿰 레이드 보상 목걸이 = GearCategory Pendant).
// 2열×3행(90px 칸, 100px 간격)에 4번째 줄을 붙인다 — 망토 칸 아래(왼쪽 열). 칸 묶음(EquipInfoGrid) 높이를
// 290 → 390으로 늘린다(가운데 기준이라 위아래로 50씩 늘고, 위쪽 앵커인 칸들은 50 위로 올라가 전체가 가운데에 남는다).
// 반지 칸("Pants" 엔티티)을 그대로 복제하고 빈 칸 아이콘만 목걸이 픽토그램(Type_Necklace)으로 바꾼다.
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const FILE = 'ui/EquipmentGroup.ui';
const GRID = 'Inventory/Panel/EquipPanel/EquipInfoGrid';
const NECK_ICON = 'f32d6dcdcdd44a98b579d06f8e3e99e9';
const b = UIBuilder.load(FILE);
if (b.find(GRID + '/Necklace')) throw new Error('Necklace slot already exists — do not re-create');
const clone = (o) => JSON.parse(JSON.stringify(o));
const comps = (p) => clone(b.find(GRID + p).jsonString['@components']);
function copyEntity(src, dst, mutate) {
  b.empty(GRID + dst, {});
  const list = comps(src);
  if (mutate) mutate(list);
  for (const c of list) b.upsertComponent(GRID + dst, c['@type'], c);
}
const X = 45, Y = -345;
copyEntity('/Pants', '/Necklace', (l) => {
  const t = l.find((c) => c['@type'] === 'MOD.Core.UITransformComponent');
  const dx = X - t.anchoredPosition.x, dy = Y - t.anchoredPosition.y;
  t.anchoredPosition = { x: X, y: Y };
  t.Position = { x: t.Position.x + dx, y: t.Position.y + dy, z: t.Position.z || 0 };
  t.OffsetMin = { x: t.OffsetMin.x + dx, y: t.OffsetMin.y + dy };
  t.OffsetMax = { x: t.OffsetMax.x + dx, y: t.OffsetMax.y + dy };
});
copyEntity('/Pants/Icon', '/Necklace/Icon', (l) => {
  l.find((c) => c['@type'] === 'MOD.Core.SpriteGUIRendererComponent').ImageRUID = { DataId: NECK_ICON };
});
b.patch(GRID, { rect_size: [200, 390] });
b.write(FILE);
for (const e of b.listEntities().filter((e) => e.path.includes('EquipInfoGrid') && e.depth <= 5))
  console.log(e.path.split('EquipPanel/')[1], JSON.stringify(e.pos), JSON.stringify(e.size));
