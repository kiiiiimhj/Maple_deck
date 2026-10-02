// UITransform Scale/UIScale의 z가 0인 엔티티 찾기 — 자식 붙일 때 엔진이 부모 스케일로 나눠 Infinity가 나는 원인 점검
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
for (const name of process.argv.slice(2)) {
  const b = UIBuilder.read(`ui/${name}.ui`);
  for (const e of b.entities) {
    const t = b.getComponent(e.jsonString.path, "MOD.Core.UITransformComponent");
    if (!t) continue;
    const bad = [];
    if (t.Scale && t.Scale.z === 0) bad.push("Scale=" + JSON.stringify(t.Scale));
    if (t.UIScale && t.UIScale.z === 0) bad.push("UIScale=" + JSON.stringify(t.UIScale));
    if (bad.length) console.log(name, e.jsonString.path.replace(/^\/ui\/[^/]+\//, ""), bad.join(" "));
  }
}
