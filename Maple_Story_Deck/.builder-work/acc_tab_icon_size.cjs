// 2026-09-23 유저 지정: 장신구 탭 아이콘 30x30 → 50x50 (인벤토리 + 합성 팝업), 위치(0,13)는 그대로
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const FILE = 'ui/EquipmentGroup.ui';
const PATHS = [
  'Inventory/Panel/InventoryPanel/TabHolder/Acc/Background/Icon',
  'Inventory/ComposePopup/Panel/RightPanel/TabHolder/Acc/Background/Icon',
];
const b = UIBuilder.load(FILE);
for (const p of PATHS) b.patch(p, { rect_size: [50, 50] });
b.write(FILE);
for (const e of b.listEntities().filter(e => PATHS.some(p => e.path.endsWith(p))))
  console.log(e.path.split('/ui/EquipmentGroup/')[1], JSON.stringify(e.pos), JSON.stringify(e.size));
