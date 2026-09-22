const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

// 글씨 좌측 정렬(유저 지정 2026-09-23). TextGUIRendererComponent.HorizontalAlignment = Left(1).
// text(alignment:) 헬퍼(0~8 인덱스)가 아니라 컴포넌트 enum을 직접 써야 한다.
const UI_PATH = "ui/RaidGroup.ui";
const LEFT = 1;
const b = UIBuilder.load(UI_PATH);

const left = (p) => b.patchComponent(p, "MOD.Core.TextGUIRendererComponent", { HorizontalAlignment: LEFT });

// 이번 주 보상 패널
left("RewardBox/Title");
left("RewardBox/NextText");
// 제목/다음등급 안내는 가운데 정렬 기준으로 x가 0이었다 — 좌측 정렬이면 왼쪽 여백만 주면 된다
b.patch("RewardBox/Title", { pos: [10, -12], rect_size: [240, 30] });
b.patch("RewardBox/NextText", { pos: [10, -198], rect_size: [240, 30] });

// 등급표 — 헤더 + 7줄 × 4칸
const COLS = ["Grade", "Cut", "Ring", "Scroll"];
left("RewardTable/Title");
b.patch("RewardTable/Title", { pos: [-90, -22], rect_size: [500, 44] });
for (const c of COLS) left("RewardTable/Head/" + c);
for (let i = 0; i < 7; i++) {
  for (const c of COLS) left("RewardTable/Row" + i + "/" + c);
}

b.write(UI_PATH);
console.log("left-aligned");
