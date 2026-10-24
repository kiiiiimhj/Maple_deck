// 도감·업적 스크롤바 손잡이 알파 0.7 → 1(다른 화면 스크롤바와 동일) — 2026-10-22 유저 지정
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
for (const [file, path] of [["ui/AchievementGroup.ui", "Panel/List/ScrollBar"], ["ui/MonsterBookGroup.ui", "Panel/Inner/ScrollBar"]]) {
  const b = UIBuilder.load(file);
  b.patchComponent(path, "MOD.Core.SliderComponent", { HandleColor: { r: 1, g: 1, b: 1, a: 1 } });
  b.write(file, { strict: false });
}
