// 번역 키 추가/갱신 — GameText.csv + Docs/Localization/translate_me.csv 둘 다 (2026-09-23)
//   node .builder-work/add_keys.cjs [--apply]
// 아래 KEYS에 [키, ko, en, zh-TW, ja, 위치메모]를 넣는다. 이미 있으면 값만 갱신.
const fs = require("fs");
const APPLY = process.argv.includes("--apply");
const KEYS = [
  ["UI_TITLEGROUP_039", "보스 레이드", "Boss Raid", "首領突襲", "ボスレイド", "ui/TitleGroup.ui RaidButton/RaidLabel"],
];

function parseCsv(s) { const r = []; let row = [], c = "", q = false; for (let i = 0; i < s.length; i++) { const ch = s[i]; if (q) { if (ch === '"') { if (s[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === ",") { row.push(c); c = ""; } else if (ch === "\r") { } else if (ch === "\n") { row.push(c); r.push(row); row = []; c = ""; } else c += ch; } if (c !== "" || row.length) { row.push(c); r.push(row); } return r; }
const cell = (v) => { const s = String(v ?? ""); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

for (const [file, kind] of [["RootDesk/MyDesk/Localization/GameText.csv", "game"], ["Docs/Localization/translate_me.csv", "tr"]]) {
  const raw = fs.readFileSync(file, "utf8"); const bom = raw.charCodeAt(0) === 0xfeff;
  const rows = parseCsv(raw.replace(/^﻿/, ""));
  const byKey = new Map(rows.map((r, i) => [r[0], i]));
  let added = 0, updated = 0;
  for (const [key, ko, en, zh, ja, note] of KEYS) {
    const row = kind === "game" ? [key, ko, note, ko, en, zh, ja] : [key, ko, note, en, zh, ja];
    if (byKey.has(key)) { rows[byKey.get(key)] = row; updated++; } else { rows.push(row); added++; }
  }
  if (APPLY) fs.writeFileSync(file, (bom ? "﻿" : "") + rows.filter((r) => r.length > 1 || r[0]).map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", "utf8");
  console.log(`${APPLY ? "기록" : "드라이런"} ${file}: 추가 ${added} / 갱신 ${updated}`);
}
