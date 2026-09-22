const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

// 진단용: TapBtn을 빨갛게 보이게 한다. 보이면 스프라이트가 렌더되는 것이고(=레이캐스트 대상 존재),
// 안 보이면 빌더 기본 RUID(2860136c…)가 이 프로젝트에서 로드되지 않는 것이다(LEA-3015).
const UI_PATH = "ui/RaidGroup.ui";
const b = UIBuilder.load(UI_PATH);
b.patchComponent("RewardBox/TapBtn", "MOD.Core.SpriteGUIRendererComponent",
  { Color: { r: 1, g: 0, b: 0, a: 0.6 } });
b.write(UI_PATH);
console.log("tap probe on");
