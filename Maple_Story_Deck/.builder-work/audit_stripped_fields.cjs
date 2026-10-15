// .ui 컴포넌트 필드가 통째로 빠진 곳 찾기 (2026-10-14).
// 10/12 커밋에서 상세보기 버튼들의 Text/ImageRUID/Color 등이 빠져 엔진 기본값("Text", 흰 기본 스프라이트)으로 보였다.
//   node .builder-work/audit_stripped_fields.cjs <기준커밋> [--fix]
// 기준 커밋에 있던 필드가 지금 파일에 없으면 보고하고, --fix면 그 필드만 기준 값으로 되살린다(있는 값은 안 건드림).
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const base = process.argv[2];
const fix = process.argv.includes("--fix");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "uistrip-"));
const changed = cp.execSync(`git diff --name-only ${base} -- ./ui`).toString().split("\n")
  .filter((f) => f.endsWith(".ui")).map((f) => "ui/" + path.basename(f));

for (const file of changed) {
  if (!fs.existsSync(file)) continue;
  let oldBuf;
  try { oldBuf = cp.execSync(`git show ${base}:./${file}`, { maxBuffer: 1 << 28 }); } catch (e) { continue; }
  const oldPath = path.join(tmp, path.basename(file));
  fs.writeFileSync(oldPath, oldBuf);
  const a = UIBuilder.load(oldPath);
  const c = UIBuilder.load(file);
  const hits = [];
  for (const e of a.listEntities()) {
    const fc = c.find(e.path);
    if (!fc) continue;
    for (const ca of a.find(e.path).jsonString["@components"]) {
      const cc = fc.jsonString["@components"].find((x) => x["@type"] === ca["@type"]);
      if (!cc) continue;
      const miss = Object.keys(ca).filter((k) => cc[k] === undefined);
      if (!miss.length) continue;
      hits.push(`${e.path} ${ca["@type"].replace("MOD.Core.", "")} -${miss.length}`);
      if (fix) {
        const restore = {};
        for (const k of miss) restore[k] = ca[k];
        c.patchComponent(e.path, ca["@type"], restore);
      }
    }
  }
  if (!hits.length) continue;
  console.log(`== ${file} (${hits.length})`);
  for (const h of hits) console.log("   " + h);
  if (fix) c.write(file, { strict: false });
}
fs.rmSync(tmp, { recursive: true, force: true });
