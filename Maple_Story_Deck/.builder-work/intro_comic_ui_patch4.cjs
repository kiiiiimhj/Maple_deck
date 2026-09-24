// 인트로 만화 4차(2026-09-24 대사 확정) — 배경 그림 위에서 읽히게 자막·안내를 흰 글씨 + 검은 테두리 + 옅은 그림자로.
// 마지막 컷 자막이 두 줄이라 자막을 살짝 올리고(-440), "화면을 터치하면 계속"은 맨 아래(-500)로 작게.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/IntroComicGroup.ui";
const b = UIBuilder.load(FILE);
const style = {
  FontColor: { r: 1, g: 1, b: 1, a: 1 },
  OutlineColor: { r: 0, g: 0, b: 0, a: 1 },
  OutlineWidth: 0.25,
  Underlay: true,
  UnderlayColor: { r: 0, g: 0, b: 0, a: 0.6 },
  UnderlayOffsetX: 1.5,
  UnderlayOffsetY: -1.5,
};
b.patchComponent("Screen/Subtitle", "MOD.Core.TextGUIRendererComponent", style);
b.patch("Screen/Subtitle", { pos: [0, -440], rect_size: [1500, 90] });
b.patchComponent("Screen/TapHint", "MOD.Core.TextGUIRendererComponent", Object.assign({ FontSize: 24 }, style));
b.patch("Screen/TapHint", { pos: [0, -500], rect_size: [800, 40] });
b.write(FILE);
