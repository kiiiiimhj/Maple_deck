// 인벤토리 열 때 딤이 2개로 보이는 문제 — 후보 전수 나열 (읽기 전용, 2026-09-22)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

for (const f of ["ui/EquipmentGroup.ui", "ui/InventoryGroup.ui"]) {
  console.log(`\n=== ${f} ===`);
  const b = UIBuilder.load(f);
  for (const e of b.listEntities()) {
    const s = b.getComponent(e.path, "MOD.Core.SpriteGUIRendererComponent");
    if (!s) continue;
    const c = s.Color || {};
    const a = c.a === undefined ? 1 : c.a;
    const dark = c.r <= 0.3 && c.g <= 0.3 && c.b <= 0.3;
    if (!(dark && a > 0.1 && a < 1.0)) continue;
    const t = b.getComponent(e.path, "MOD.Core.UITransformComponent");
    const raw = b.find(e.path).jsonString;
    const ruid = s.ImageRUID && s.ImageRUID.DataId ? s.ImageRUID.DataId : "(empty)";
    console.log(
      `${e.path}\n    size=${JSON.stringify(e.size)} align=${t.AlignmentOption}` +
        ` enable=${raw.enable} visible=${raw.visible} do=${raw.displayOrder}` +
        ` a=${a.toFixed(2)} ray=${s.RaycastTarget} ruid=${ruid}`
    );
  }
}
