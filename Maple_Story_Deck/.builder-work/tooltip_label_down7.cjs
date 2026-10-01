// 말풍선 툴팁(823c09…) 글씨가 위에 붙어 보여서 7px 내린다(유저 지정 2026-10-01).
// 에피소드 보상·레벨 보상 장비 상자 툴팁 + 인벤 주문서(장비 강화 주문서 등) 이름 툴팁. 위치만 바꾼다(patch).
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const T = "MOD.Core.UITransformComponent";
const DY = -7;
const targets = [
  ["ui/EpisodeRewardGroup.ui", "Panel/GearBoxTooltip/Label"],
  ["ui/LevelRewardGroup.ui", "Panel/GearBoxTooltip/Label"],
  ["ui/EquipmentGroup.ui", "Inventory/Panel/ItemNameTooltip/Label"],
];
for (const [file, path] of targets) {
  const b = UIBuilder.read(file);
  const p = b.getComponent(path, T).anchoredPosition;
  b.patch(path, { pos: [p.x, p.y + DY] });
  b.write(file, { strict: false });
  const after = UIBuilder.read(file).getComponent(path, T).anchoredPosition;
  console.log(file, path, `y ${p.y} -> ${after.y}`);
}
