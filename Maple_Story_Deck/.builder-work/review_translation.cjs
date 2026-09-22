// 번역 CSV 검수 (2026-09-22) — 가져오기(import) 전에 문제를 찾는다. 파일은 수정하지 않는다.
//   node .builder-work/review_translation.cjs [파일=Docs/Localization/translate_me.csv]
const fs = require("fs");
const FILE = process.argv[2] || "Docs/Localization/translate_me.csv";
const GAME = "RootDesk/MyDesk/Localization/GameText.csv";

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

const rows = parseCsv(fs.readFileSync(FILE, "utf8").replace(/^﻿/, ""));
const head = rows.shift();
console.log("헤더:", head.join(" | "), "/ 행", rows.length);
const iK = head.indexOf("Key"), iKo = head.findIndex((h) => /한국어|Source/.test(h));
const LANGS = ["en", "zh-TW", "ja"].map((l) => [l, head.indexOf(l)]);
for (const [l, i] of LANGS) if (i < 0) console.log(`  ⚠ 컬럼 없음: ${l}`);

const game = parseCsv(fs.readFileSync(GAME, "utf8").replace(/^﻿/, ""));
const gHead = game.shift();
const gKeys = new Map(game.map((r) => [r[gHead.indexOf("Key")], r]));
const gSrc = gHead.indexOf("Source");

const issues = {};
function add(kind, msg) { (issues[kind] = issues[kind] || []).push(msg); }
const KO = /[가-힣]/;
const HAN = /[一-鿿]/, KANA = /[぀-ヿ]/;
const ph = (s) => (s.match(/\{\d+\}/g) || []).sort().join(",");
const tags = (s) => (s.match(/<\/?[a-zA-Z][^>]*>/g) || []).map((t) => t.replace(/=.*>/, ">")).sort().join("");
const nl = (s) => (s.match(/\n/g) || []).length;

const fill = {}; const seen = new Set();
for (const r of rows) {
  const key = r[iK], ko = r[iKo] || "";
  if (!key) { add("빈 Key 행", JSON.stringify(r).slice(0, 80)); continue; }
  if (seen.has(key)) add("Key 중복", key); seen.add(key);
  if (!gKeys.has(key)) add("번역표에 없는 Key(가져오기 시 무시됨)", key);
  else if ((gKeys.get(key)[gSrc] || "") !== ko) add("한국어 원문이 번역표와 다름(원문 칸 수정?)", `${key}: "${ko.slice(0, 30)}" ≠ "${(gKeys.get(key)[gSrc] || "").slice(0, 30)}"`);
  for (const [l, i] of LANGS) {
    if (i < 0) continue;
    const t = r[i] || "";
    if (!t.trim()) { add(`${l} 비어 있음`, key + "  " + ko.slice(0, 40).replace(/\n/g, "⏎")); continue; }
    fill[l] = (fill[l] || 0) + 1;
    if (ph(t) !== ph(ko)) add(`${l} 자리표시자 {n} 불일치`, `${key}: ko=[${ph(ko)}] ${l}=[${ph(t)}]  "${t.slice(0, 50).replace(/\n/g, "⏎")}"`);
    if (tags(t) !== tags(ko)) add(`${l} 태그(<color> 등) 불일치`, `${key}: "${t.slice(0, 60).replace(/\n/g, "⏎")}"`);
    if (KO.test(t)) add(`${l}에 한글이 남음`, `${key}: "${t.slice(0, 50).replace(/\n/g, "⏎")}"`);
    if (t !== t.trim()) add(`${l} 앞뒤 공백`, `${key}: "${t.slice(0, 40)}"`);
    if (nl(t) !== nl(ko)) add(`${l} 줄바꿈 수 다름(ko ${nl(ko)} / ${l} ${nl(t)})`, `${key}: "${t.slice(0, 50).replace(/\n/g, "⏎")}"`);
    if (l === "en" && (HAN.test(t) || KANA.test(t))) add("en에 한자/가나", `${key}: "${t.slice(0, 40)}"`);
    if (l === "ja" && !KANA.test(t) && !HAN.test(t) && /[a-z]{3}/i.test(t) && t.length > 6) add("ja가 영어로 보임", `${key}: "${t.slice(0, 40)}"`);
    if (l === "zh-TW" && KANA.test(t)) add("zh-TW에 가나(일본어 섞임?)", `${key}: "${t.slice(0, 40)}"`);
    if (l === "zh-TW" && !HAN.test(t) && /[a-z]{3}/i.test(t) && t.length > 6) add("zh-TW가 영어로 보임", `${key}: "${t.slice(0, 40)}"`);
    const ratio = t.length / Math.max(1, ko.length);
    if (l === "en" && ko.length >= 4 && ratio > 3.2) add("en이 원문보다 3배 이상 김(UI 넘침 후보)", `${key}: ko ${ko.length}자 → en ${t.length}자  "${t.slice(0, 50)}"`);
  }
}
console.log("채워진 칸:", LANGS.map(([l]) => `${l} ${fill[l] || 0}/${rows.length}`).join("  "));
for (const [k, list] of Object.entries(issues)) {
  console.log(`\n■ ${k}: ${list.length}건`);
  for (const m of list.slice(0, 12)) console.log("   " + m);
  if (list.length > 12) console.log(`   … 외 ${list.length - 12}건`);
}
