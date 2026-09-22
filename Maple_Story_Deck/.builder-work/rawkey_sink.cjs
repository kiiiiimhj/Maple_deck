// 번역 키가 번역 없이 화면(.Text)에 들어가거나 이어붙여지는 곳 찾기 (읽기 전용, 2026-09-22)
//   node .builder-work/rawkey_sink.cjs
// 1) 키를 담는 "홀더" 수집: property string X = "KEY" / 표 필드 name = "KEY" / return "KEY" 하는 method / local x = "KEY"
// 2) 홀더가 쓰인 곳마다 번역 함수 안인지 검사 → 아니면 쓰임새로 분류
//    TEXT   : 같은 줄에 .Text = (번역 없이 화면에 들어감)          → 버그
//    CONCAT : 키 앞뒤로 .. 이어붙임(FMT_x| 인자 형태 제외)           → 버그(나중에 번역해도 못 찾음)
//    ARG    : 다른 함수 인자로 넘김(받는 쪽 확인 필요)
//    OTHER  : 대입/비교/반환 등
// 3) 함수 인자를 번역 없이 .Text에 넣는 method 목록(PARAM-SINK) — 키를 넘겨받으면 버그
const fs = require("fs"), path = require("path");
function walk(d, o) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p, o); else if (f.name.endsWith(".mlua")) o.push(p); } return o; }
const KEY = /"(?:MLUA|FMT|UI)_[A-Z0-9_]+/;
const LOCFN = /(?:GetText|GetTextFormat|Resolve|ResolveList|LocalizeWorldText|ApplyWorldText)$/;
const files = walk("RootDesk/MyDesk", []).map((f) => ({ f, rel: f.split(path.sep).join("/").replace("RootDesk/MyDesk/", ""), lines: fs.readFileSync(f, "utf8").split(/\r?\n/) }));
const code = (ln) => ln.replace(/--.*$/, "");

// ── 1) 홀더 ──
const props = new Set(), fields = new Set(), funcs = new Set();
for (const { lines } of files) {
  let method = null;
  for (const raw of lines) {
    const ln = code(raw);
    const mm = ln.match(/^\s*method\s+\w+\s+(\w+)\s*\(/); if (mm) method = mm[1];
    let m;
    if ((m = ln.match(/^\s*property\s+string\s+(\w+)\s*=\s*"(?:MLUA|FMT|UI)_/))) props.add(m[1]);
    for (const f of ln.matchAll(/(?:^|[{,\s])(\w+)\s*=\s*"(?:MLUA|FMT|UI)_/g)) if (!/^\s*(property|local)\b/.test(ln) && !/^\s*self\./.test(ln)) fields.add(f[1]);
    if (method && /\breturn\s+"(?:MLUA|FMT|UI)_/.test(ln)) funcs.add(method);
  }
}
// 표 원소로만 들어간 키(WeaponTier/Relic 목록 등)는 필드명이 없다 → 그 표를 돌려주는 getter는 수동 확인 목록에 넣는다
fields.delete("tabName"); // local 변수명 오탐 방지
console.log("holders: props", props.size, "fields", [...fields].join(","), "funcs", funcs.size);

// ── 2) 쓰임새 ──
function wrapped(ln, idx) {
  // idx 앞의 열린 괄호 스택을 따라가며 번역 함수 호출 안인지
  const stack = [];
  for (let i = 0; i < idx; i++) {
    if (ln[i] === '"') { const j = ln.indexOf('"', i + 1); if (j < 0 || j > idx) break; i = j; continue; }
    if (ln[i] === "(") { const name = (ln.slice(0, i).match(/[\w.:]+$/) || [""])[0]; stack.push(name); }
    else if (ln[i] === ")") stack.pop();
  }
  return stack.some((n) => LOCFN.test(n));
}
const out = { TEXT: [], CONCAT: [], ARG: [], OTHER: [] };
const pats = [];
if (props.size) pats.push(new RegExp(`(?:self|_\\w+)\\.(${[...props].join("|")})\\b(?!\\s*\\()`, "g"));
if (fields.size) pats.push(new RegExp(`\\.(${[...fields].join("|")})\\b(?!\\s*[=(])`, "g"));
if (funcs.size) pats.push(new RegExp(`[:.](${[...funcs].join("|")})\\s*\\(`, "g"));
for (const { rel, lines } of files) {
  lines.forEach((raw, i) => {
    const ln = code(raw); if (!ln.trim()) return;
    if (/^\s*(property|method)\b/.test(ln)) return;
    for (const re of pats) for (const m of ln.matchAll(re)) {
      if (wrapped(ln, m.index)) continue;
      const before = ln.slice(0, m.index), after = ln.slice(m.index + m[0].length);
      let kind = "OTHER";
      const concat = (/\.\.\s*$/.test(before) && !/"(?:FMT|MLUA)_[A-Z0-9_]*\|"\s*\.\.\s*$/.test(before) && !/\|"\s*\.\.\s*$/.test(before)) || /^[^,)]*?\)?\s*\.\.\s*(?!"\|)/.test(after.replace(/^\([^)]*\)/, ""));
      if (/\.Text\s*=/.test(before)) kind = "TEXT";
      else if (concat && !/\|"\s*\.\.\s*$/.test(before)) kind = "CONCAT";
      else if (/[:.]\w+\s*\([^()]*$/.test(before)) kind = "ARG";
      out[kind].push(`${rel}:${i + 1}  [${m[1]}]  ${raw.trim().slice(0, 150)}`);
    }
  });
}
for (const k of ["TEXT", "CONCAT", "ARG", "OTHER"]) { console.log(`\n=== ${k} (${out[k].length})`); for (const l of out[k].slice(0, k === "OTHER" ? 0 : 400)) console.log(l); }
fs.writeFileSync(".builder-work/_rawkey_sink.txt", Object.entries(out).map(([k, a]) => `=== ${k} (${a.length})\n` + a.join("\n")).join("\n\n"));

// ── 3) 인자를 번역 없이 .Text에 넣는 method ──
console.log("\n=== PARAM-SINK");
for (const { rel, lines } of files) {
  let params = [], mname = "";
  lines.forEach((raw, i) => {
    const ln = code(raw);
    const mm = ln.match(/^\s*method\s+\w+\s+(\w+)\s*\(([^)]*)\)/);
    if (mm) { mname = mm[1]; params = mm[2].split(",").map((p) => p.trim().split(/\s+/).pop()).filter(Boolean); return; }
    const t = ln.match(/\.Text\s*=\s*(.+)$/); if (!t) return;
    for (const p of params) {
      const re = new RegExp(`\\b${p}\\b`); const mt = t[1].match(re); if (!mt) continue;
      const idx = ln.indexOf(t[1]) + mt.index;
      if (wrapped(ln, idx)) continue;
      if (/tostring\s*\(\s*$/.test(ln.slice(0, idx))) continue;
      console.log(`${rel}:${i + 1}  ${mname}(${p})  ${raw.trim().slice(0, 130)}`);
    }
  });
}
