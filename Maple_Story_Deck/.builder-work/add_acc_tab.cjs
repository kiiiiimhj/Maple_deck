// 인벤토리 장신구 탭 추가(2026-09-23): 기타 탭을 복제해 방어구 오른쪽(x=540)에 두고, 기타 탭은 x=640으로 민다
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const FILE = 'ui/EquipmentGroup.ui';
const base = 'Inventory/Panel/InventoryPanel/TabHolder';
const RING_ICON = '0abf98bb5e4f49bb8fb3b3cf84929812'; // 무명의 은반지 아이콘(메이플 아이템 스프라이트)
const b = UIBuilder.load(FILE);
if (b.find(base + '/Acc')) throw new Error('Acc already exists — do not re-create');
const clone = (o) => JSON.parse(JSON.stringify(o));
const comps = (p) => clone(b.find(base + p).jsonString['@components']);
function copyEntity(src, dst, mutate) {
  b.empty(base + dst, {});
  const list = comps(src);
  if (mutate) mutate(list);
  for (const c of list) b.upsertComponent(base + dst, c['@type'], c);
}
function setX(list, x) {
  const t = list.find(c => c['@type'] === 'MOD.Core.UITransformComponent');
  t.anchoredPosition.x = x; t.Position.x = x;
  t.OffsetMin.x = x - 50; t.OffsetMax.x = x + 50;
}
const etcT = comps('/Etc').find(c => c['@type'] === 'MOD.Core.UITransformComponent');
copyEntity('/Etc', '/Acc', (l) => setX(l, 540));
copyEntity('/Etc/Background', '/Acc/Background');
copyEntity('/Etc/Background/Icon', '/Acc/Background/Icon', (l) => {
  l.find(c => c['@type'] === 'MOD.Core.SpriteGUIRendererComponent').ImageRUID = { DataId: RING_ICON };
});
copyEntity('/Etc/Background/UIText', '/Acc/Background/UIText', (l) => {
  l.find(c => c['@type'] === 'MOD.Core.TextComponent').Text = '장신구';
});
b.patch(base + '/Acc', { display_order: 3 });
b.patch(base + '/Etc', { display_order: 4 });
b.patchComponent(base + '/Etc', 'MOD.Core.UITransformComponent', {
  anchoredPosition: { x: 640, y: etcT.anchoredPosition.y },
  Position: { x: 640, y: etcT.Position.y, z: 0 },
  OffsetMin: { x: 590, y: etcT.OffsetMin.y },
  OffsetMax: { x: 690, y: etcT.OffsetMax.y },
});
b.write(FILE);
for (const e of b.listEntities().filter(e => e.path.includes('InventoryPanel/TabHolder/')))
  console.log(e.path.split('TabHolder/')[1], JSON.stringify(e.pos), JSON.stringify(e.size), e.kind);
