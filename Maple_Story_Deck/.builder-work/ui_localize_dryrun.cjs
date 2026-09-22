// .ui 한국어 텍스트 → 로컬라이제이션 키 변환 [드라이런] (2026-09-22).
//   node .builder-work/ui_localize_dryrun.cjs
//
// 아무것도 쓰지 않는다. 무엇이 바뀔지만 센다.
//
// 매칭 기준은 Note(출처 경로)가 아니라 **Source(원문 텍스트)** 다.
//   export_locale_csv.cjs가 텍스트 단위로 dedupe 하면서 sources를 최대 5개만 남겼기 때문에
//   Note로 역추적하면 6번째 이후 출처가 누락된다. 원문 → 키 맵이 유일하게 정확하다.
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const KO = /[가-힣]/;
const CSV = "RootDesk/MyDesk/Localization/GameText.csv";
const TEXT_TYPES = ["MOD.Core.TextGUIRendererComponent", "MOD.Core.TextComponent"];

// ── CSV 파서 (따옴표/개행 포함 셀 처리) ───────────────────────────────────
function parseCsv(src) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const raw = fs.readFileSync(CSV, "utf8").replace(/^﻿/, "");
const rows = parseCsv(raw);
const header = rows.shift();
const iKey = header.indexOf("Key"), iSrc = header.indexOf("Source");

const textToKey = new Map();
for (const r of rows) {
  if (!r[iKey]) continue;
  if (!textToKey.has(r[iSrc])) textToKey.set(r[iSrc], r[iKey]);
}
console.log(`번역표: ${textToKey.size}개 원문 → 키`);

// ── .ui 훑기 ──────────────────────────────────────────────────────────────
const stat = { gui: 0, legacy: 0, already: 0, noKey: 0 };
const noKeySamples = [], legacySamples = [], perFile = new Map();

for (const f of fs.readdirSync("ui").filter((x) => x.endsWith(".ui")).sort()) {
  let b;
  try { b = UIBuilder.load("ui/" + f); } catch (e) { console.log(`  ⚠ load 실패: ${f} — ${e.message}`); continue; }
  for (const e of b.listEntities()) {
    for (const type of TEXT_TYPES) {
      const c = b.getComponent(e.path, type);
      if (!c || typeof c.Text !== "string") continue;
      if (c.IsLocalizationKey === true) { stat.already++; continue; }
      if (!KO.test(c.Text)) continue;

      const key = textToKey.get(c.Text);
      if (!key) {
        stat.noKey++;
        if (noKeySamples.length < 15) noKeySamples.push(`${f} :: ${e.path} :: ${JSON.stringify(c.Text)}`);
        continue;
      }
      if (type === "MOD.Core.TextComponent") {
        stat.legacy++;
        if (legacySamples.length < 15) legacySamples.push(`${f} :: ${e.path} :: ${JSON.stringify(c.Text)}`);
        continue;
      }
      stat.gui++;
      perFile.set(f, (perFile.get(f) || 0) + 1);
    }
  }
}

console.log("\n=== 드라이런 결과 ===");
console.log(`변환 대상 (TextGUIRendererComponent) : ${stat.gui}`);
console.log(`구형 TextComponent (보류)            : ${stat.legacy}`);
console.log(`이미 키로 바뀐 것                    : ${stat.already}`);
console.log(`번역표에 없는 한국어 (미추출/신규)   : ${stat.noKey}`);

console.log("\n-- 파일별 변환 대상 --");
for (const [f, n] of [...perFile].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${f}`);

if (legacySamples.length) {
  console.log("\n-- 구형 TextComponent 샘플 (IsLocalizationKey 동작 미검증) --");
  for (const s of legacySamples) console.log("  " + s);
}
if (noKeySamples.length) {
  console.log("\n-- 번역표에 없는 문구 샘플 --");
  for (const s of noKeySamples) console.log("  " + s);
}
