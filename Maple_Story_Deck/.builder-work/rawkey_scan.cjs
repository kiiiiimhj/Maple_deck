// 번역 함수(GetText/GetTextFormat/Resolve 등) 밖에 저장된 키 문자열 목록 (읽기 전용)
const fs = require("fs"), path = require("path");
function walk(d, o) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p, o); else if (f.name.endsWith(".mlua")) o.push(p); } return o; }
const LOC = /(GetText|GetTextFormat|Resolve|ResolveList|LocalizeWorldText|ApplyWorldText)\s*\(\s*$/;
const byFile = {};
for (const file of walk("RootDesk/MyDesk", [])) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((ln, i) => {
    if (/^\s*--/.test(ln)) return;
    for (const m of ln.matchAll(/"((?:MLUA|FMT|UI)_[A-Z0-9_]+)(\|[^"]*)?"/g)) {
      const before = ln.slice(0, m.index);
      if (LOC.test(before)) continue;
      (byFile[file] = byFile[file] || []).push(`${i + 1}: ${ln.trim().slice(0, 140)}`);
    }
  });
}
let total = 0;
for (const [f, arr] of Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)) { total += arr.length; console.log(`${arr.length}\t${f.split(path.sep).join("/").replace("RootDesk/MyDesk/", "")}`); }
console.log("total", total);
fs.writeFileSync(".builder-work/_rawkeys.txt", Object.entries(byFile).map(([f, a]) => "## " + f + "\n" + a.join("\n")).join("\n\n"));
