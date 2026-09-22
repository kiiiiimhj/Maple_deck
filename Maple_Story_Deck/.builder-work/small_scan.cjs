// 잔여 한글 문자열 목록 (CardManager/GameManager 제외, 주석·log 줄 제외) — 2026-09-22
//   node .builder-work/small_scan.cjs [--all]
const fs = require("fs"), path = require("path");
const KO = /[가-힣]/; const out = [];
const ALL = process.argv.includes("--all");
function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { walk(p); continue; }
    if (!f.name.endsWith(".mlua")) continue;
    const rel = p.split(path.sep).join("/");
    if (!ALL && /CardManager\.mlua$|\/GameManager\.mlua$/.test(rel)) continue;
    const L = fs.readFileSync(p, "utf8").split(/\r?\n/);
    L.forEach((l, i) => {
      if (/^\s*--/.test(l)) return;
      const code = l.replace(/--[^"]*$/, "");
      if (/\blog(_warning|_error)?\s*\(/.test(code)) return;
      const hits = (code.match(/"[^"\n]*"/g) || []).filter((s) => KO.test(s));
      if (hits.length) out.push(rel.replace("RootDesk/MyDesk/", "") + ":" + (i + 1) + ": " + l.trim().slice(0, 170));
    });
  }
}
walk("RootDesk/MyDesk");
console.log(out.length); console.log(out.join("\n"));
