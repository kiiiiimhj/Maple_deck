const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const UI_PATH = "ui/LoadingGroup.ui";
const b = UIBuilder.load(UI_PATH);

// 레이드 액자 안쪽 창 위쪽(실측: 창 상단이 UI y ≈ +278)에 들어오게 내린다.
// y=290이면 액자 상단 바에 글자가 가려졌다(2026-09-23 실측).
b.patch("Screen/RaidTitle", { pos: [0, 175] });

b.write(UI_PATH);
console.log("RaidTitle moved to y=175");
