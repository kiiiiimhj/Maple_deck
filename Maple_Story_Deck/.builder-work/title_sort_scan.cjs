// TitleGroup 안에서 그리기 순서에 영향 줄 수 있는 컴포넌트/필드 찾기 (읽기 전용)
const { execSync } = require("child_process"); const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const ext = "." + "ui"; const f = process.argv[2] || "TitleGroup"; const tmp = ".builder-work/_tmp_ts" + ext;
for (const r of process.argv.slice(3)) {
  let p = "ui/" + f + ext;
  if (r !== "WT") { fs.writeFileSync(tmp, execSync(`git show ${r}:./ui/${f}${ext}`, { maxBuffer: 1e9 })); p = tmp; }
  const b = UIBuilder.load(p); const hits = [];
  for (const e of b.listEntities()) {
    const ent = b._resolveEntity ? b._resolveEntity(e.path) : null;
    const comps = b.getComponent ? null : null;
    const js = (b.entities || b._entities || []).find ? null : null;
  }
  // raw walk
  const all = b.entities || b._entities || b.data?.entities;
  const list = Array.isArray(all) ? all : Object.values(all || {});
  for (const ent of list) {
    const js = ent.jsonString; if (!js) continue;
    for (const c of js["@components"] || []) {
      const t = c["@type"];
      const keys = Object.keys(c).filter(k => /sort|order|layer|override/i.test(k));
      if (/UIGroup|Canvas|Sorting/i.test(t) || keys.length) hits.push(`${ent.path} ${t} ${keys.map(k => k + "=" + JSON.stringify(c[k])).join(" ")}`);
    }
  }
  console.log(`== ${r}: ${hits.length}`); for (const h of hits.slice(0, 40)) console.log("  " + h);
}
try { fs.unlinkSync(tmp); } catch (e) {}
