// 옵션 팝업 토글 3개(배경음/효과음/스킬 선택)를 나무 액자 안쪽(가로 약 540)에 들어가게 줄인다 (2026-09-26 유저 요청)
// 원 130→100, 간격 220→150, 글자 원 32→26 / 이름 24→22. 엔티티는 patch만 해서 UUID(스크립트 바인딩)는 그대로다.
const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));

const UI = path.join(__dirname, "../ui/OptionGroup.ui");
const b = UIBuilder.load(UI);
const TEXT = "MOD.Core.TextGUIRendererComponent";

const toggles = [["BgmToggle", -150], ["SfxToggle", 0], ["SkillToggle", 150]];
for (const [name, x] of toggles) {
  const root = "OptionPanel/" + name;
  b.patch(root, { pos: [x, 130], rect_size: [160, 190] });
  b.patch(root + "/Circle", { pos: [0, 30], rect_size: [100, 100] });
  b.patch(root + "/Label", { pos: [0, -50], rect_size: [160, 36] });
  b.patchComponent(root + "/Circle", TEXT, { FontSize: 26 });
  b.patchComponent(root + "/Label", TEXT, { FontSize: 22 });
}

b.write(UI);
for (const e of b.listEntities()) {
  if (e.path.includes("Toggle")) console.log(e.path, JSON.stringify(e.pos), JSON.stringify(e.size));
}
