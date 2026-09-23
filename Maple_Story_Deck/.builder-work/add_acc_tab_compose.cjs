// 2026-09-23: 장신구 탭 아이콘을 유저 지정 RUID로 교체 + 합성 팝업에도 장신구 탭 추가(기타 탭 복제, 방어구 오른쪽 x=540 / 기타는 x=640)
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const FILE = 'ui/EquipmentGroup.ui';
const ACC_ICON = '2953509cd0ff43b9a0eb31abb5646853'; // 유저 지정 장신구 탭 아이콘
const INV = 'Inventory/Panel/InventoryPanel/TabHolder';
const CMP = 'Inventory/ComposePopup/Panel/RightPanel/TabHolder';
const b = UIBuilder.load(FILE);
const clone = (o) => JSON.parse(JSON.stringify(o));
const SPR = 'MOD.Core.SpriteGUIRendererComponent';
const UIT = 'MOD.Core.UITransformComponent';

// 1) 인벤토리 장신구 탭 아이콘 교체
b.patchComponent(INV + '/Acc/Background/Icon', SPR, { ImageRUID: { DataId: ACC_ICON } });

// 2) 합성 팝업 장신구 탭
if (b.find(CMP + '/Acc')) throw new Error('compose Acc already exists — do not re-create');
const comps = (p) => clone(b.find(CMP + p).jsonString['@components']);
function copyEntity(src, dst, mutate) {
  b.empty(CMP + dst, {});
  const list = comps(src);
  if (mutate) mutate(list);
  for (const c of list) b.upsertComponent(CMP + dst, c['@type'], c);
}
const etcT = comps('/Etc').find(c => c['@type'] === UIT);
const baseX = etcT.anchoredPosition.x; // 기타 탭 원래 자리(= 방어구 오른쪽)
copyEntity('/Etc', '/Acc', (l) => {
  const t = l.find(c => c['@type'] === UIT);
  t.anchoredPosition.x = baseX; t.Position.x = baseX;
  t.OffsetMin.x = baseX - 50; t.OffsetMax.x = baseX + 50;
});
copyEntity('/Etc/Background', '/Acc/Background');
copyEntity('/Etc/Background/Icon', '/Acc/Background/Icon', (l) => {
  l.find(c => c['@type'] === SPR).ImageRUID = { DataId: ACC_ICON };
});
copyEntity('/Etc/Background/UIText', '/Acc/Background/UIText', (l) => {
  l.find(c => c['@type'] === 'MOD.Core.TextComponent').Text = '장신구';
});
b.patch(CMP + '/Acc', { display_order: 3 });
b.patch(CMP + '/Etc', { display_order: 4 });
const nx = baseX + 100;
b.patchComponent(CMP + '/Etc', UIT, {
  anchoredPosition: { x: nx, y: etcT.anchoredPosition.y },
  Position: { x: nx, y: etcT.Position.y, z: 0 },
  OffsetMin: { x: nx - 50, y: etcT.OffsetMin.y },
  OffsetMax: { x: nx + 50, y: etcT.OffsetMax.y },
});
b.write(FILE);
for (const e of b.listEntities().filter(e => /TabHolder\/(Acc|Etc|Armor)(\/Background\/Icon)?$/.test(e.path)))
  console.log(e.path.split('/ui/EquipmentGroup/')[1], JSON.stringify(e.pos));
console.log('inv icon', b.getComponent(INV + '/Acc/Background/Icon', SPR).ImageRUID.DataId);
console.log('cmp icon', b.getComponent(CMP + '/Acc/Background/Icon', SPR).ImageRUID.DataId);
