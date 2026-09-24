// 장비 상자 툴팁 크기 보정(2026-09-24) — 둘째 줄 "(수령 즉시 장비창에 등록됩니다.)"가 말풍선 양끝에 닿아 괄호가 잘려 보였다 → 말풍선·글자칸을 넓힌다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
for (const file of ["ui/EpisodeRewardGroup.ui", "ui/LevelRewardGroup.ui"]) {
  const b = UIBuilder.load(file);
  b.patch("Panel/GearBoxTooltip", { rect_size: [540, 170] });
  b.patch("Panel/GearBoxTooltip/Label", { pos: [0, 10], rect_size: [460, 100] });
  b.patchComponent("Panel/GearBoxTooltip/Label", "MOD.Core.TextGUIRendererComponent", { MaxSize: 26 });
  b.write(file, { strict: false });
}
