// 키워드 삼킴 버그로 잘못 생성된 FMT_ 3행의 템플릿을 바로잡는다. 2026-09-22.
//   node .builder-work/fix_fmt_rows.cjs --apply
//
// 원인: 연결 사슬의 오른쪽 확장이 `end` 키워드를 넘어가서, 마지막 문자열 리터럴이
//   템플릿에 접히지 않고 인자 {N}이 돼버렸다(코드도 `... "%" end)` 로 깨짐).
//   코드는 손으로 고쳤고, 여기서 표의 템플릿을 맞춘다.
const fs = require("fs");
const APPLY = process.argv.includes("--apply");
const CSV = "RootDesk/MyDesk/Localization/GameText.csv";

const FIX = {
  FMT_CARDMANAGER_034: "{0}  |  출혈 {1}%/틱 (3초)",
  FMT_GACHAUI_002: "획득한 {0}!",
  FMT_IDLEREWARDUI_002: "{0} · 진행 보너스 +{1}%",
};

function parseCsv(s) {
  const r = []; let row = [], c = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === '"') { if (s[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(c); c = ""; }
    else if (ch === "\r") { /* skip */ }
    else if (ch === "\n") { row.push(c); r.push(row); row = []; c = ""; }
    else c += ch;
  }
  if (c !== "" || row.length) { row.push(c); r.push(row); }
  return r;
}
function cell(v) {
  const s = String(v == null ? "" : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const rows = parseCsv(fs.readFileSync(CSV, "utf8").replace(/^﻿/, ""));
const head = rows.shift();
const iK = head.indexOf("Key"), iS = head.indexOf("Source"), iKo = head.indexOf("ko");
let n = 0;
for (const r of rows) {
  if (FIX[r[iK]]) {
    console.log(`  ${r[iK]}\n    before: ${JSON.stringify(r[iS])}\n    after : ${JSON.stringify(FIX[r[iK]])}`);
    r[iS] = FIX[r[iK]];
    r[iKo] = FIX[r[iK]];
    n++;
  }
}
console.log(`\n고친 행: ${n}`);
if (APPLY) {
  fs.writeFileSync(CSV, [head].concat(rows).map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", "utf8");
  console.log("→ 저장");
} else console.log("(드라이런)");
