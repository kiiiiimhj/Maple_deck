// TimePanel/TimeIcon 색 보정 (2026-09-21).
// add_run_timer_hud.cjs에서 sprite()에 color를 안 넘겨서 빌더 기본 스킨(26,26,26,60 어두운 반투명)이
// 그대로 들어갔고, 그래서 시계 아이콘이 화면에서 거의 안 보였다. KillPanel/KillIcon과 같은
// 흰색 불투명(1,1,1,1)으로 맞춘다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI_PATH = "ui/DefaultGroup.ui";
const b = UIBuilder.load(UI_PATH);

b.patchComponent("TimePanel/TimeIcon", "MOD.Core.SpriteGUIRendererComponent", {
  Color: { r: 1, g: 1, b: 1, a: 1 },
});

b.write(UI_PATH, { strict: false });
console.log("TimeIcon color -> white opaque");
