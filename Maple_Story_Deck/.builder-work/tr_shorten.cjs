// UI 넘침 대응 — 번역문 줄이기 (2026-09-22). GameText.csv + Docs/Localization/translate_me.csv 둘 다 같은 값으로 고친다.
//   node .builder-work/tr_shorten.cjs [--apply]
const fs = require("fs");
const APPLY = process.argv.includes("--apply");
// [키, 언어, 새 문구]  (⏎ = 줄바꿈)
const EDITS = [
  ["UI_RAIDGROUP_002", "en", "Character DPS"],
  ["UI_RAIDGROUP_002", "ja", "キャラ火力(毎秒)"],
  ["UI_EQUIPMENTGROUP_013", "ja", "一括Lvアップ"],
  ["UI_EQUIPMENTGROUP_014", "ja", "Lvアップ"],
  ["UI_TITLEGROUP_012", "ja", "タイムアタック"],
  ["UI_TITLEGROUP_013", "ja", "無制限"],
  ["UI_EQUIPMENTGROUP_004", "en", "Upgrade Chance"],
  ["UI_WORLDCHARACTERSELECTGROUP_005", "en", "Survive 10 min in the Village of Beginnings to unlock"],
  ["FMT_EPISODEREWARDLOGIC_002", "en", "Survive {1} min in {0} to unlock"],
  ["UI_EQUIPMENTGROUP_011", "en", "Really synthesize?"],
  ["UI_OPTIONGROUP_001", "en", "Quit the game?"],
  ["UI_IDLEREWARDGROUP_001", "ja", "装備欄がいっぱいです！"],
  ["UI_RUNSTARTCONFIRMGROUP_002", "ja", "武器欄がいっぱいです！"],
  ["FMT_RUNSTARTCONFIRMUI_001", "ja", "{0}欄がいっぱいです！"],
  ["UI_EQUIPMENTGROUP_010", "en", "Higher-grade gear will be consumed.⏎This can't be undone."],
  ["MLUA_SHOPPURCHASELOGIC_001", "ja", "スターターパック"],
  ["MLUA_SHOPPURCHASELOGIC_004", "en", "Limit 1"],
  ["FMT_EPISODEREWARDUI_003", "ja", "EP{0}の1プレイで{1}分生存すると受取可(全モード)"],
  ["MLUA_UIEQUIPPEDGEARPANEL_003", "ja", "キャッシュ"],
  ["MLUA_UIEQUIPPEDGEARPANEL_004", "en", "View Gear"],
  ["MLUA_GACHAUI_018", "ja", "地域の規定により有料ガチャはご利用いただけません"],
  ["MLUA_SHADOWSHOPUI_001", "ja", "エリクサー"],
  ["UI_TITLEGROUP_004", "en", "Characters may die if you're offline⏎for 24 hours. Be careful!"],
  ["MLUA_EPISODEREWARDUI_001", "en", "Claimed"],
  ["MLUA_EPISODEREWARDUI_001", "ja", "受取済み"],
  ["MLUA_EP2MAP2ARENALOGIC_001", "ja", "戦闘開始！勝ちそうなモンスターを選ぼう！"],
  ["UI_GACHAGROUP_004", "en", "Rates are rounded per the Game Industry Promotion Act,⏎so the total may not be exactly 100%."],
];

function parseCsv(s) { const r = []; let row = [], c = "", q = false; for (let i = 0; i < s.length; i++) { const ch = s[i]; if (q) { if (ch === '"') { if (s[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === ",") { row.push(c); c = ""; } else if (ch === "\r") { } else if (ch === "\n") { row.push(c); r.push(row); row = []; c = ""; } else c += ch; } if (c !== "" || row.length) { row.push(c); r.push(row); } return r; }
const cell = (v) => { const s = String(v ?? ""); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const ph = (s) => (s.match(/\{\d+\}/g) || []).sort().join(",");
const nl = (s) => (s.match(/\n/g) || []).length;

for (const [file, bom] of [["RootDesk/MyDesk/Localization/GameText.csv", false], ["Docs/Localization/translate_me.csv", true]]) {
  const raw = fs.readFileSync(file, "utf8"); const hadBom = raw.charCodeAt(0) === 0xfeff;
  const rows = parseCsv(raw.replace(/^﻿/, "")); const head = rows[0];
  const iKo = head.findIndex((h) => h === "ko" || h === "한국어원문");
  const byKey = new Map(rows.slice(1).map((r) => [r[0], r]));
  let n = 0;
  for (const [key, lang, text0] of EDITS) {
    const r = byKey.get(key); const li = head.indexOf(lang);
    if (!r || li < 0) { console.log(`  ⚠ ${file}: ${key}/${lang} 없음`); continue; }
    const text = text0.replace(/⏎/g, "\n");
    if (ph(text) !== ph(r[iKo]) || nl(text) !== nl(r[iKo])) { console.log(`  ⛔ ${key}/${lang}: 자리표시자/줄바꿈이 원문과 다름 — 건너뜀`); continue; }
    if (!APPLY) console.log(`  ${key} ${lang}: "${r[li].replace(/\n/g, "⏎")}" → "${text0}"`);
    r[li] = text; n++;
  }
  if (APPLY) fs.writeFileSync(file, (hadBom || bom ? "﻿" : "") + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", "utf8");
  console.log(`${APPLY ? "기록" : "드라이런"} ${file}: ${n}칸`);
  if (!APPLY) break; // 드라이런은 한 번만 보여준다
}
