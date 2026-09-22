// UI 그룹 GroupOrder/GroupType 커밋별 비교 (읽기 전용)
const { execSync } = require("child_process"); const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const ext = "." + "ui"; const tmp = ".builder-work/_tmp_grp" + ext;
const revs = process.argv.slice(2);
const files = fs.readdirSync("ui").filter(f => f.endsWith(ext));
for (const f of files) {
  const row = [f.padEnd(30)];
  for (const r of revs) {
    try {
      let p = "ui/" + f;
      if (r !== "WT") { fs.writeFileSync(tmp, execSync(`git show ${r}:./ui/${f}`, { maxBuffer: 1e9 })); p = tmp; }
      const b = UIBuilder.load(p); const root = b.listEntities()[0].path;
      const c = b.getComponent(root, "MOD.Core.UIGroupComponent") || {};
      row.push(`${r}:${c.GroupOrder}/${c.GroupType}`);
    } catch (e) { row.push(r + ":-"); }
  }
  console.log(row.join("  "));
}
try { fs.unlinkSync(tmp); } catch (e) {}
