// GameText.csv의 en 컬럼을 채운다 — **검증용 표본**. 2026-09-22.
//   node .builder-work/fill_en_sample.cjs [--apply]
//
// 목적: 지금까지 키로 바꿔놓은 1,649개가 "실제 번역이 들어왔을 때" 제대로 도는지 눈으로 확인.
// 범위: 로비를 한 바퀴 돌 때 눈에 들어오는 UI 문구 위주. 스킬명 전체는 대상이 아니다.
// ⚠ 이미 en이 채워진 행은 건드리지 않는다(사람이 넣은 번역을 덮어쓰지 않기 위해).
const fs = require("fs");
const APPLY = process.argv.includes("--apply");
const CSV = "RootDesk/MyDesk/Localization/GameText.csv";

const EN = {
  // ── 로비 / 타이틀 ──
  UI_TITLEGROUP_001: "Start Game",
  UI_TITLEGROUP_006: "No records yet",
  UI_TITLEGROUP_007: "Name",
  UI_TITLEGROUP_008: "Rank",
  UI_TITLEGROUP_009: "Score",
  UI_TITLEGROUP_010: "My Rank",
  UI_TITLEGROUP_011: "Ranking (Coming Soon)",
  UI_TITLEGROUP_012: "Time Attack",
  UI_TITLEGROUP_013: "Endless",
  UI_TITLEGROUP_014: "Ranking",
  UI_TITLEGROUP_015: "Relics (Coming Soon)",
  UI_TITLEGROUP_016: "Damage Skin",
  UI_TITLEGROUP_017: "Shop",
  UI_TITLEGROUP_018: "Character ▼",
  UI_TITLEGROUP_019: "Grade ▼",
  UI_TITLEGROUP_038: "Battle",

  // ── 게임오버 / 이어하기 ──
  UI_GAMEOVERGROUP_002: "Purchased",
  UI_GAMEOVERGROUP_003: "Diamond Shop",
  UI_GAMEOVERGROUP_005: "Retry",
  UI_GAMEOVERGROUP_006: "Score Earned",
  MLUA_GAMEOVERUI_002: "Continue",

  // ── 공용 팝업 ──
  UI_EQUIPMENTGROUP_023: "OK",
  MLUA_UIUSEPOPUP_004: "Cancel",

  // ── 인벤토리 / 장비 ──
  MLUA_INVENTORYEXPANDLOGIC_002: "Inventory",
  UI_EQUIPMENTGROUP_007: "All",
  MLUA_EPISODEREWARDLOGIC_003: "Armor",
  MLUA_EPISODEREWARDLOGIC_004: "Weapon",
  MLUA_INVENTORYEXPANDLOGIC_001: "Etc",
  MLUA_UIINVENTORY_001: "Sell",
  MLUA_UICOMPOSEPOPUP_001: "(Max Grade)",

  // ── 업적 ──
  UI_ACHIEVEMENTGROUP_001: "Claim All",
  MLUA_ACHIEVEMENTUI_001: "Achievements",
  MLUA_ACHIEVEMENTLOGIC_001: "Novice Hunter",
  MLUA_ACHIEVEMENTLOGIC_002: "Defeat 1,000 monsters",
  MLUA_ACHIEVEMENTLOGIC_003: "Skilled Hunter",
  MLUA_ACHIEVEMENTLOGIC_004: "Defeat 10,000 monsters",
  MLUA_ACHIEVEMENTLOGIC_005: "Legendary Hunter",
  MLUA_ACHIEVEMENTLOGIC_006: "Defeat 100,000 monsters",
  MLUA_ACHIEVEMENTLOGIC_007: "Elite Hunter",
  MLUA_ACHIEVEMENTLOGIC_008: "Defeat 10 elite monsters",
  MLUA_ACHIEVEMENTLOGIC_009: "Elite Slayer",
  MLUA_ACHIEVEMENTLOGIC_010: "Defeat 100 elite monsters",
  MLUA_ACHIEVEMENTLOGIC_011: "First Boss Kill",

  // ── 상점 ──
  MLUA_SHOPPURCHASELOGIC_001: "Starter Package",
  MLUA_SHOPPURCHASELOGIC_004: "One-Time Only",
  MLUA_SHOPPURCHASELOGIC_005: "300 Diamonds",
  MLUA_SHOPPURCHASELOGIC_007: "600 Diamonds",
  MLUA_SHOPPURCHASELOGIC_009: "1,300 Diamonds",
  MLUA_SHOPPURCHASELOGIC_010: "Includes 100 bonus",
  MLUA_SHOPPURCHASELOGIC_012: "2,800 Diamonds",
  MLUA_SHOPPURCHASELOGIC_013: "Includes 300 bonus",
  MLUA_SHOPPURCHASELOGIC_015: "6,500 Diamonds",
  MLUA_SHOPPURCHASELOGIC_016: "Includes 1,100 bonus",
  MLUA_SHOPPURCHASELOGIC_018: "8,500 Diamonds",
  MLUA_SHOPPURCHASELOGIC_019: "Includes 1,700 bonus",
  MLUA_SHOPUI_001: "Equipped",
  MLUA_SHOPUI_002: "Owned",

  // ── 뽑기 / 등급 ──
  MLUA_GACHAUI_003: "Skill",
  MLUA_GACHAUI_004: "Relic",
  MLUA_GACHAUI_010: "Rare",
  MLUA_GACHAUI_011: "Magic",
  MLUA_GACHAUI_012: "Common",

  // ── 캐릭터 이름 ──
  MLUA_WORLDCHARACTERSELECTUI_001: "Arcana",
  MLUA_EP2MAP2ARENALOGIC_006: "Leion",
  MLUA_CHARACTERUNLOCKLOGIC_001: "Shade",
  MLUA_CHARACTERUNLOCKLOGIC_003: "Rin",
  MLUA_MAP21RELICEASTEREGG_001: "Sylph",

  // ── 유물 ──
  MLUA_RELICINVENTORY_001: "Cygnus's Handkerchief",
  MLUA_RELICINVENTORY_002: "Everlasting Snow Flower",
  MLUA_RELICINVENTORY_003: "Simon's Chair",
  MLUA_RELICINVENTORY_004: "Rune",
  MLUA_RELICINVENTORY_005: "Sealed Orb",
  MLUA_RELICINVENTORY_006: "Jar of Wisdom",
  MLUA_RELICINVENTORY_007: "Stone of Eos",
  MLUA_RELICINVENTORY_008: "Golden Card",
  MLUA_RELICINVENTORY_009: "Holy Grail",
  MLUA_RELICINVENTORY_010: "Magic Stone of Power",
  MLUA_RELICINVENTORY_011: "Shuriken",
  MLUA_RELICINVENTORY_012: "Old Piano",
  MLUA_RELICINVENTORY_013: "Munin",
  MLUA_RELICINVENTORY_014: "Amethyst",
  MLUA_RELICINVENTORY_015: "Asteroid",
  MLUA_RELICINVENTORY_016: "Panda Scarecrow",
  MLUA_RELICINVENTORY_017: "Lucky Pouch",
  MLUA_RELICINVENTORY_018: "Black Shield",

  // ── 스킬(대표 몇 개만 — 슬롯 라벨 확인용) ──
  MLUA_CARDMANAGER_001: "Basic Attack",
  MLUA_CARDREGISTRY_001: "Combo Attack",
  MLUA_SKILLINVENTORY_002: "Arrow Illusion",

  // ── 옵션 튜토리얼 ──
  MLUA_OPTIONUI_001: "[ Combat is automatic ]",
  MLUA_OPTIONUI_002: "Your character attacks monsters on its own.",
  MLUA_OPTIONUI_003: "Tap a monster on screen to target it first.",

  // ── 기타 자주 보이는 것 ──
  MLUA_RANKUI_001: "No Record",
  MLUA_LEVELREWARDUI_001: "All rewards claimed!",
  MLUA_EPISODEREWARDUI_001: "All Claimed",
  MLUA_UIEQUIPPOPUP_001: "No description registered for this item yet.",
  MLUA_SHADOWSHOPUI_001: "Elixir Potion",
  UI_RELICUPGRADEGROUP_004: "Upgrade",
  MLUA_GAMEOVERUI_001: "pts",
  MLUA_ATTENDANCEUI_001: "Done",
  UI_DEFAULTGROUP_004: "Card Name",
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
const iKey = head.indexOf("Key"), iEn = head.indexOf("en");
if (iEn < 0) { console.error("en 컬럼이 없다"); process.exit(1); }

let filled = 0, skipped = 0;
const unknown = [];
const seen = new Set();
for (const r of rows) {
  const k = r[iKey];
  if (!k || !(k in EN)) continue;
  seen.add(k);
  if (r[iEn] && r[iEn] !== "") { skipped++; continue; }   // 이미 채워진 건 보존
  r[iEn] = EN[k];
  filled++;
}
for (const k of Object.keys(EN)) if (!seen.has(k)) unknown.push(k);

console.log(`en 채움 ${filled}개 / 이미 있어서 건너뜀 ${skipped}개 / 번역표에 없는 키 ${unknown.length}개`);
for (const k of unknown) console.log("  ⚠ 없는 키: " + k);

if (APPLY) {
  const out = [head.map(cell).join(",")].concat(rows.map((r) => r.map(cell).join(",")));
  fs.writeFileSync(CSV, out.join("\r\n") + "\r\n", "utf8");
  console.log("→ " + CSV + " 저장 (BOM 없음 유지)");
} else {
  console.log("(드라이런 — 저장 안 함)");
}
