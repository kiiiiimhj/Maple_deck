const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

// 제목이 700폭이라 BestFit으로 늘어나 우측 닫기 버튼(x=332, 64폭 → 300~364)과 겹쳤다(실측).
// 560폭으로 줄이면 -280~280이라 닫기 버튼에 닿지 않는다.
const UI_PATH = "ui/RaidGroup.ui";
const b = UIBuilder.load(UI_PATH);
b.patch("RewardTable/Title", { rect_size: [560, 44] });
b.write(UI_PATH);
console.log("title narrowed");
