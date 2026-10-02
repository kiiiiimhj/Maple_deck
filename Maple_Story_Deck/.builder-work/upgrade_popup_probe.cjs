// 유물/스킬 강화 팝업 엔티티 트리(앵커·피벗·위치·크기) 출력 — 게이지 정렬 확인용
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const T = "MOD.Core.UITransformComponent";
for (const name of process.argv.slice(2)) {
  const b = UIBuilder.read(`ui/${name}.ui`);
  for (const e of b.entities) {
    const p = e.jsonString.path;
    const t = b.getComponent(p, T);
    if (!t) continue;
    const r = (v) => v ? `${+v.x.toFixed(1)},${+v.y.toFixed(1)}` : "-";
    const comps = (e.jsonString["@components"] || []).map((c) => c["@type"].split(".").pop().replace("Component", "")).filter((c) => c !== "UITransform").join("+");
    console.log(name.padEnd(18), p.replace(/^\/ui\/[^/]+\//, "").padEnd(44), "aMin", r(t.AnchorsMin), "aMax", r(t.AnchorsMax), "piv", r(t.Pivot), "pos", r(t.anchoredPosition), "size", r(t.RectSize), e.jsonString.enable === false ? "OFF" : "", comps);
  }
}
