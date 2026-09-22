// 직접 번역한 .builder-work/tr/out_*.tsv 를 검수 후 Docs/Localization/translate_me.csv 에 합친다 (2026-09-22).
//   node .builder-work/tr_merge.cjs            → 검수만
//   node .builder-work/tr_merge.cjs --apply    → 검수 통과 시 CSV에 기록
const fs = require("fs");
const APPLY = process.argv.includes("--apply");
const CSV = "Docs/Localization/translate_me.csv";

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
function cell(v) { const s = String(v == null ? "" : v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }

const rows = parseCsv(fs.readFileSync(CSV, "utf8").replace(/^﻿/, ""));
const head = rows.shift();
const iK = 0, iKo = 1, iEn = head.indexOf("en"), iZh = head.indexOf("zh-TW"), iJa = head.indexOf("ja");

const tr = new Map(); const dup = [];
for (const f of fs.readdirSync(".builder-work/tr").filter((x) => /^out_\d+\.tsv$/.test(x)).sort()) {
  for (const line of fs.readFileSync(".builder-work/tr/" + f, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const p = line.split("\t");
    if (p.length !== 4) { dup.push(`${f}: 칸 수 ${p.length} → ${line.slice(0, 60)}`); continue; }
    if (tr.has(p[0])) dup.push(`${f}: 키 중복 ${p[0]}`);
    tr.set(p[0], p.slice(1).map((s) => s.replace(/⏎/g, "\n")));
  }
}

const issues = {}; const add = (k, m) => (issues[k] = issues[k] || []).push(m);
for (const d of dup) add("형식 오류/중복", d);
const KO = /[가-힣ㄱ-ㅎㅏ-ㅣ]/, KANA = /[぀-ヿ]/, HAN = /[一-鿿]/;
// 자리표시자: {0} {P} {C} %s %d %02d %% — 개수와 **등장 순서**까지 비교(%s는 순서가 곧 인자 순서)
const phSet = (s) => (s.match(/\{[0-9A-Z]+\}/g) || []).sort().join(",");
const pctSeq = (s) => (s.match(/%(?:0?\d+)?[sd%]/g) || []).join(",");
const tags = (s) => (s.match(/<\/?[a-zA-Z][^>]*>/g) || []).sort().join("");
const nl = (s) => (s.match(/\n/g) || []).length;
// 로마자 음역 흔적(한국어 받침/모음 조합) — 영어 단어에 드물게 나오는 조합만
const ROMA = /\b[a-z]*(eo|eu[^mrs]|yeo|hoe|jj|ssd|ss[aeiou]|gy[eo]|seup|hapnida|haessda|iss[^u]|eoyo|yeyo|nida|bateu|eopsi|haji|doe|jeo[^u])[a-z]*\b/;

const used = new Set();
for (const r of rows) {
  const key = r[iK], ko = r[iKo];
  const t = tr.get(key);
  if (!t) { add("번역 누락", key); continue; }
  used.add(key);
  const [en, zh, ja] = t;
  for (const [l, s] of [["en", en], ["zh-TW", zh], ["ja", ja]]) {
    if (!s.trim()) add(`${l} 빈칸`, key);
    if (phSet(s) !== phSet(ko)) add(`${l} {n} 자리표시자 불일치`, `${key}: ko[${phSet(ko)}] ${l}[${phSet(s)}]`);
    if (pctSeq(s) !== pctSeq(ko)) add(`${l} %s/%d 순서 불일치`, `${key}: ko[${pctSeq(ko)}] ${l}[${pctSeq(s)}]`);
    if (tags(s) !== tags(ko)) add(`${l} 태그 불일치`, key);
    if (nl(s) !== nl(ko)) add(`${l} 줄바꿈 수 불일치`, `${key}: ko ${nl(ko)} / ${l} ${nl(s)}`);
    if (KO.test(s)) add(`${l}에 한글 남음`, `${key}: ${s.slice(0, 40)}`);
    if (s !== s.trim()) add(`${l} 앞뒤 공백`, key);
  }
  if (ROMA.test(en)) add("en 로마자 음역 의심", `${key}: ${en.slice(0, 60)}`);
  if (KANA.test(en) || HAN.test(en)) add("en에 한자/가나", key);
  if (KANA.test(zh)) add("zh-TW에 가나", `${key}: ${zh.slice(0, 40)}`);
  if (/[a-z]{3,}/.test(zh.replace(/\{[^}]*\}|%\w|Lv|Ver|DPS|BGM|EP|HP/g, ""))) add("zh-TW에 영문 소문자 단어", `${key}: ${zh.slice(0, 50)}`);
  if (/[a-z]{3,}/.test(ja.replace(/\{[^}]*\}|%\w|Lv|Ver|DPS|BGM|EP|HP|OK/g, ""))) add("ja에 영문 소문자 단어", `${key}: ${ja.slice(0, 50)}`);
  if (!KANA.test(ja) && !HAN.test(ja) && /[A-Za-z]/.test(ja.replace(/\{[^}]*\}|%\w/g, "")) && !/^(BGM|OK|EP\d|Lv|DPS)/.test(ja)) add("ja가 일본어 문자 없음", `${key}: ${ja}`);
}
for (const k of tr.keys()) if (!used.has(k)) add("CSV에 없는 키(오타?)", k);

// 일관성: 같은 한국어 원문이면 같은 번역이어야 한다
const byKo = new Map();
for (const r of rows) { const t = tr.get(r[iK]); if (!t) continue; const k = r[iKo]; if (!byKo.has(k)) byKo.set(k, []); byKo.get(k).push([r[iK], t]); }
for (const [ko, list] of byKo) {
  if (list.length < 2) continue;
  for (let li = 0; li < 3; li++) {
    const vals = new Set(list.map((x) => x[1][li]));
    if (vals.size > 1) add(`같은 원문 다른 번역(${["en", "zh-TW", "ja"][li]})`, `"${ko.slice(0, 20)}" → ${[...vals].map((v) => JSON.stringify(v.slice(0, 30))).join(" / ")}`);
  }
}

console.log(`번역 ${tr.size}행 / CSV ${rows.length}행`);
const kinds = Object.keys(issues);
if (!kinds.length) console.log("✅ 검수 이상 없음");
for (const k of kinds) { console.log(`\n■ ${k}: ${issues[k].length}건`); for (const m of issues[k].slice(0, 40)) console.log("   " + m); }

const blocking = kinds.filter((k) => /누락|형식|자리표시자|순서|태그|한글|빈칸|CSV에 없는/.test(k));
if (APPLY) {
  if (blocking.length) { console.log("\n⛔ 차단 항목이 있어 기록하지 않았다: " + blocking.join(", ")); process.exit(1); }
  for (const r of rows) { const t = tr.get(r[iK]); if (t) { r[iEn] = t[0]; r[iZh] = t[1]; r[iJa] = t[2]; } }
  fs.writeFileSync(CSV, "﻿" + [head].concat(rows).map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", "utf8");
  console.log(`\n✍ ${CSV} 기록 완료 (BOM 포함)`);
}
