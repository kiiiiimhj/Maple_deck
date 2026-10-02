// 유물/스킬 강화 팝업의 조각 게이지(1/2)를 위로 2px(유저 지정 2026-10-02). 패널 가운데 정렬(x=0)은 그대로.
// 사용: node .builder-work/fragment_bar_up2.cjs          → 현재 값만 출력(dry run)
//       node .builder-work/fragment_bar_up2.cjs --write  → 실제로 쓴다(Maker stop 후)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const WRITE = process.argv.includes("--write");
const T = "MOD.Core.UITransformComponent";
const DY = 2;
for (const name of ["RelicUpgradeGroup", "SkillUpgradeGroup"]) {
  const file = `ui/${name}.ui`;
  const b = UIBuilder.read(file);
  const P = "Panel/FragmentBar";
  const t = b.getComponent(P, T);
  const txt = b.getComponent(P + "/Text", "MOD.Core.TextComponent");
  console.log(name, "bar pos", JSON.stringify(t.anchoredPosition), "anchor", JSON.stringify(t.AnchorsMin), "pivot", JSON.stringify(t.Pivot), "| text Alignment", txt && txt.Alignment);
  if (!WRITE) continue;
  const np = { x: t.anchoredPosition.x, y: t.anchoredPosition.y + DY };
  const half = { x: t.RectSize.x / 2, y: t.RectSize.y / 2 };
  b.patchComponent(P, T, {
    anchoredPosition: np,
    OffsetMin: { x: np.x - half.x, y: np.y - half.y },
    OffsetMax: { x: np.x + half.x, y: np.y + half.y },
  });
  b.write(file, { strict: false });
  console.log("  ->", JSON.stringify(UIBuilder.read(file).getComponent(P, T).anchoredPosition));
}
