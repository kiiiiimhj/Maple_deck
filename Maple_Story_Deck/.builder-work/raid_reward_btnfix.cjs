const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

// addComponent로 붙인 ButtonComponent는 @type/Enable만 들어가서 Colors/ImageRUIDs가 비어 있다.
// 이미 동작 중인 DpsWindow/ToggleBtn의 값을 그대로 복사해 맞춘다.
const UI_PATH = "ui/RaidGroup.ui";
const b = UIBuilder.load(UI_PATH);

const ref = b.getComponent("DpsWindow/ToggleBtn", "MOD.Core.ButtonComponent");
const patch = { Colors: ref.Colors, ImageRUIDs: ref.ImageRUIDs, OverrideSorting: ref.OverrideSorting };

for (const p of ["RewardBox/TapBtn", "RewardTable/BtnClose"]) {
  b.patchComponent(p, "MOD.Core.ButtonComponent", patch);
}

b.write(UI_PATH);
console.log("patched button components");
