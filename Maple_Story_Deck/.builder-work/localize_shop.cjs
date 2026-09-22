// 상점 상품표의 표시 문구를 로컬라이제이션 키로 교체 (2026-09-22).
//   node .builder-work/localize_shop.cjs [--apply]
//
// 구조 결정:
//   ShopPurchaseLogic:GetProducts()는 @ExecSpace가 없어서 **서버에서도 호출된다**
//   (ProcessPurchase / GetStarterProductId). `_LocalizationService`는 ClientOnly라
//   여기서 GetText를 부르면 서버에서 nil이 된다.
//   → 표에는 **키만** 넣고, ClientOnly인 ShopUI:ApplyProducts()에서 푼다.
//
// 대상 필드: name / desc / price / badge. "+8%" 처럼 한글이 없는 값은 건드리지 않는다.
const fs = require("fs");

const APPLY = process.argv.includes("--apply");
const KO = /[가-힣]/;
const SRC = "RootDesk/MyDesk/UI/ShopPurchaseLogic.mlua";

function parseCsv(src) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const rows = parseCsv(fs.readFileSync("RootDesk/MyDesk/Localization/GameText.csv", "utf8").replace(/^﻿/, ""));
const head = rows.shift();
const iKey = head.indexOf("Key"), iSrc = head.indexOf("Source");
const textToKey = new Map();
for (const r of rows) if (r[iKey] && !textToKey.has(r[iSrc])) textToKey.set(r[iSrc], r[iKey]);

let src = fs.readFileSync(SRC, "utf8");
const misses = [];
let hits = 0;

// `name = "..."` / `desc = "..."` / `price = "..."` / `badge = "..."` 형태만 바꾼다.
src = src.replace(/\b(name|desc|price|badge)(\s*=\s*)"((?:[^"\\]|\\.)*)"/g, (whole, field, eq, body) => {
  if (!KO.test(body)) return whole;                       // "+8%" 등은 그대로
  // .mlua 소스의 `\n`(역슬래시+n 두 글자)은 CSV에선 실제 개행이다 — 맞춰서 조회한다.
  const lookup = body.replace(/\\n/g, "\n");
  const key = textToKey.get(lookup);
  if (!key) { misses.push(field + " = " + JSON.stringify(body)); return whole; }
  hits++;
  console.log(`  ${field.padEnd(5)} ${JSON.stringify(body).slice(0, 44).padEnd(46)} → ${key}`);
  return `${field}${eq}"${key}"`;
});

console.log(`\n교체 ${hits}개 / 키 못 찾음 ${misses.length}개`);
for (const m of misses) console.log("  ⚠ " + m);

if (APPLY && misses.length === 0) {
  fs.writeFileSync(SRC, src, "utf8");
  console.log("→ " + SRC + " 저장");
} else if (APPLY) {
  console.log("⚠ 못 찾은 키가 있어 저장하지 않았다 — 먼저 해결할 것");
  process.exitCode = 1;
} else {
  console.log("(드라이런 — 저장하지 않음)");
}
