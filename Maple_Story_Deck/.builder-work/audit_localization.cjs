// 로컬라이제이션(다국어) 현황 감사 (2026-09-22).
//   node .builder-work/audit_localization.cjs
//
// 보는 것:
//   1) .mlua 안에 그대로 박힌 한글 문자열 (주석 줄 제외 — 주석은 번역 대상이 아니다)
//   2) .ui 안 텍스트 컴포넌트의 한글 문자열 (UIBuilder로만 읽는다 — .ui 직접 읽기는 금지)
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const KO = /[가-힣]/;

// ── 1) .mlua ──────────────────────────────────────────────────────────────
let luaFiles = 0, luaStrings = 0;
const luaTop = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { walk(p); continue; }
    if (!f.name.endsWith(".mlua")) continue;
    const body = fs.readFileSync(p, "utf8")
      .split(/\r?\n/)
      .filter((l) => !/^\s*--/.test(l))   // 한 줄 주석 제외
      .join("\n");
    const hits = (body.match(/"[^"\n]*"/g) || []).filter((s) => KO.test(s));
    if (hits.length) { luaFiles++; luaStrings += hits.length; luaTop.push([hits.length, p.split(path.sep).join("/")]); }
  }
}
walk("RootDesk/MyDesk");
luaTop.sort((a, b) => b[0] - a[0]);

console.log(`[.mlua] 한글 문자열이 박힌 파일 ${luaFiles}개 / 문자열 ${luaStrings}개 (주석 제외)`);
for (const [n, p] of luaTop.slice(0, 10)) console.log(`    ${String(n).padStart(4)}  ${p}`);

// ── 2) .ui ────────────────────────────────────────────────────────────────
let uiFiles = 0, uiStrings = 0;
const uiTop = [];
for (const f of fs.readdirSync("ui").filter((x) => x.endsWith(".ui")).sort()) {
  let b;
  try { b = UIBuilder.load("ui/" + f); } catch (e) { continue; }
  let n = 0;
  for (const e of b.listEntities()) {
    for (const type of ["MOD.Core.TextGUIRendererComponent", "MOD.Core.TextComponent"]) {
      const c = b.getComponent(e.path, type);
      if (c && typeof c.Text === "string" && KO.test(c.Text)) n++;
    }
  }
  if (n) { uiFiles++; uiStrings += n; uiTop.push([n, f]); }
}
uiTop.sort((a, b) => b[0] - a[0]);
console.log(`\n[.ui] 한글 텍스트가 박힌 파일 ${uiFiles}개 / 텍스트 ${uiStrings}개`);
for (const [n, p] of uiTop) console.log(`    ${String(n).padStart(4)}  ${p}`);

console.log(`\n합계 번역 대상 후보: ${luaStrings + uiStrings}개`);
