// 뽑기 화면 번역 누락 점검 — 뽑기 화면이 쓰는 모든 로컬라이즈 키가 GameText.csv에 있고 언어 칸(locale_lib LANGS)이 채워졌는지 확인
// 대상: GachaUI.mlua의 GetText/GetTextFormat 키, GachaGroup.ui의 IsLocalizationKey 글씨,
//       확률표에 뜨는 스킬 이름(SkillInventory._skillDefs name 키)·유물 이름(RelicInventory._relicNames 키)
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

// CSV 파싱(따옴표 안 콤마/줄바꿈 처리)
const parseCsv = (text) => {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur.replace(/\r$/, "")); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
};
const csv = parseCsv(fs.readFileSync("RootDesk/MyDesk/Localization/GameText.csv", "utf8").replace(/^﻿/, ""));
const head = csv[0];
const col = (n) => head.indexOf(n);
const table = new Map(csv.slice(1).map((r) => [r[0], r]));
const LANGS = require("./locale_lib.cjs").LANGS;

const keys = new Map(); // key -> 출처
const add = (k, src) => { if (k && !keys.has(k)) keys.set(k, src); };

const gacha = fs.readFileSync("RootDesk/MyDesk/GachaUI.mlua", "utf8");
for (const m of gacha.matchAll(/GetText(?:Format)?\(\s*"([A-Z0-9_]+)"/g)) add(m[1], "GachaUI.mlua");

const skillInv = fs.readFileSync("RootDesk/MyDesk/SkillInventory.mlua", "utf8");
let si = 0;
for (const m of skillInv.matchAll(/name\s*=\s*"([A-Z0-9_]+)"/g)) add(m[1], `스킬 이름 #${si++}`);

const relicInv = fs.readFileSync("RootDesk/MyDesk/Relic/RelicInventory.mlua", "utf8");
const relicBlock = (relicInv.match(/_relicNames\s*=\s*\{([\s\S]*?)\}/) || [])[1] || "";
let ri = 0;
for (const m of relicBlock.matchAll(/"([A-Z0-9_]+)"/g)) add(m[1], `유물 이름 #${ri++}`);

const b = UIBuilder.read("ui/GachaGroup.ui");
for (const e of b.entities) {
  for (const c of e.jsonString["@components"] || []) {
    if ((c["@type"] === "MOD.Core.TextComponent" || c["@type"] === "MOD.Core.TextGUIRendererComponent") && c.IsLocalizationKey && c.Text)
      add(c.Text, "GachaGroup.ui " + e.jsonString.path.replace("/ui/GachaGroup/", ""));
  }
}

let problems = 0;
for (const [k, src] of keys) {
  const r = table.get(k);
  if (!r) { console.log("MISSING ROW", k, "|", src); problems++; continue; }
  const note = r[col("Note")] || "";
  if (note.startsWith("[LOG]")) continue; // 로그 전용 문구는 화면에 안 뜸
  const empty = LANGS.filter((l) => !(r[col(l)] || "").trim());
  if (empty.length) { console.log("EMPTY", empty.join("/"), k, JSON.stringify(r[col("ko")]), "|", src); problems++; }
}
console.log(`checked ${keys.size} keys (skills ${si}, relics ${ri}), problems ${problems}`);
