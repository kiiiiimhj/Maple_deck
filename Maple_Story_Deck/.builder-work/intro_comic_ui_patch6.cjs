// 인트로 만화 6차(2026-09-24 유저 "글씨 좀 더 키워, 화면을 터치하세요도 너무 작아 안 보임")
// 컷 셋째 줄 아래(-395)부터 모바일 화면 바닥(≈-513)까지 쓸 수 있는 만큼 키운다
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/IntroComicGroup.ui";
const b = UIBuilder.load(FILE);
// 자막: 36 → 44 (긴 영어 문장은 BestFit이 28까지 줄인다)
b.patch("Screen/Subtitle", { pos: [0, -432], rect_size: [1500, 64] });
b.patchComponent("Screen/Subtitle", "MOD.Core.TextGUIRendererComponent", { FontSize: 44, MaxSize: 44, MinSize: 28, BestFit: true });
// 안내: 22 → 32, 띠도 같이
b.patch("Screen/TapHint", { pos: [0, -488], rect_size: [560, 46] });
b.patchComponent("Screen/TapHint", "MOD.Core.TextGUIRendererComponent", { FontSize: 32, FontStyle: 1 });
// 건너뛰기: 26 → 30
b.patchComponent("Screen/SkipBtn", "MOD.Core.TextGUIRendererComponent", { FontSize: 30 });
b.patch("Screen/SkipBtn", { rect_size: [200, 70] });
b.write(FILE);
