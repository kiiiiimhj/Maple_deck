const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

// 좌측 정렬 + Overflow(0)라 글자가 칸 밖으로 넘친다 — 헤더 "Grade"가 "Boss HP"에 붙어
// "GradeBoss HP"로 읽혔다(실측). 열 시작점 간격을 넓힌다.
const UI_PATH = "ui/RaidGroup.ui";
const b = UIBuilder.load(UI_PATH);

const COLS = [
  { name: "Grade", x: -310, w: 100 },
  { name: "Cut", x: -175, w: 150 },
  { name: "Ring", x: -10, w: 170 },
  { name: "Dia", x: 150, w: 150 },
  { name: "Scroll", x: 290, w: 130 },
];

for (const c of COLS) {
  b.patch("RewardTable/Head/" + c.name, { pos: [c.x, 0], rect_size: [c.w, 34] });
  for (let i = 0; i < 7; i++) {
    b.patch("RewardTable/Row" + i + "/" + c.name, { pos: [c.x, 0], rect_size: [c.w, 40] });
  }
}

b.write(UI_PATH);
console.log("columns respaced");
