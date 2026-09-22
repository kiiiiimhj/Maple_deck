// 소수 파일 잔량(약 100개) 키화 — 2026-09-22.
//   node .builder-work/localize_small.cjs [--apply]
//
// LINES: 지정한 줄의 한국어 문자열 리터럴을 전부 키 문자열로 바꾼다(GetText로 감싸지 않음).
//        → 소비처(토스트/배너/UI)가 _LocText:Resolve로 푼다. 번역표에 같은 원문이 있으면 그 키를 재사용.
// FMTS : 포맷 템플릿의 키만 만들어 출력한다(코드 수정은 손으로 — 사슬 경계가 제각각이라).
const fs = require("fs");
const APPLY = process.argv.includes("--apply");
const KO = /[가-힣]/;
const CSV = "RootDesk/MyDesk/Localization/GameText.csv";
const D = "RootDesk/MyDesk/";

let LINES = {
  "Ep2Map1ChestEasterEggLogic.mlua": [19],
  "Ep2Map2ArenaLogic.mlua": [154, 186, 508, 555, 559, 569],
  "Ep2Map2SkillChestLogic.mlua": [24, 26],
  "Ep3Map3PunkoEasterEggLogic.mlua": [119],
  "Ep3Map4Ester1PortalLogic.mlua": [56, 58, 60],
  "Ep3Map4PunkoEasterEggLogic.mlua": [94],
  "EpisodeReward/EpisodeRewardLogic.mlua": [215, 216],
  "IdleReward/IdleRewardLogic.mlua": [128, 129, 130],
  "Inventory/CharacterUnlockLogic.mlua": [184, 196],
  "Inventory/Core/Enums/GearGradeEnum.mlua": [69, 70, 71, 72, 73, 74],
  "Inventory/Core/Logic/InventoryExpandLogic.mlua": [111, 112, 113, 114],
  "Inventory/Core/PkgPlayerInventory.mlua": [1035, 1039, 1043, 1047, 1050],
  "Item/BuffPotionLogic.mlua": [116, 120, 124],
  "Map/MapManager.mlua": [1316, 1318, 1320],
  "MapTaxiLogic.mlua": [31],
  "MonsterSpawner.mlua": [1262, 1655, 2408],
  "PlayerLevel/LevelRewardLogic.mlua": [100, 101, 102, 103, 194, 195],
  "Puzzle/Ep1Zone2ManoLogic.mlua": [23],
  "Puzzle/Ep2Map2StatuePuzzleLogic.mlua": [21, 22],
  "Puzzle/Ep2Map4CentaurLogic.mlua": [69],
  "Puzzle/Ep2Map4PiecePuzzleLogic.mlua": [162],
  "Puzzle/Ep2MiniBeanEasterEggLogic.mlua": [124],
  "Puzzle/Ep3Map1InvitationEasterEggLogic.mlua": [37],
  "Puzzle/Ep3Map1MushroomLogic.mlua": [35],
  "Puzzle/Ep3Map2BonusBossLogic.mlua": [63, 64],
  "Puzzle/Ep3Map2LostRudolphLogic.mlua": [19, 20, 21],
  "Puzzle/Map21RelicEasterEgg.mlua": [115],
  "Puzzle/Map23ErdasEasterEggLogic.mlua": [29, 123, 124, 126, 152],
  "Puzzle/NinjaStatuePuzzleLogic.mlua": [79],
  "Raid/RaidTutorialUI.mlua": [70],
  "UI/CharacterUnlockUI.mlua": [52],
  "UI/DamageSkinLogic.mlua": [40, 42, 44, 46, 48, 50, 52, 54, 161],
  "UI/DpsMeterUI.mlua": [35, 36],
  "UI/ShadowShopUI.mlua": [39, 40, 54],
  "UI/TutorialGuideUI.mlua": [33, 69, 71, 75, 81],
  "Zone21AlienEasterEggLogic.mlua": [48],
};

let FMTS = [
  ["Ep2Map2ArenaLogic.mlua", "다시하기 (-{0})"],
  ["Attendance/AttendanceLogic.mlua", "{0}개"],
  ["EpisodeReward/EpisodeRewardLogic.mlua", "EP{0} {1}분 생존!"],
  ["EpisodeReward/EpisodeRewardLogic.mlua", "{0} {1}분 생존 시 열림"],
  ["PlayerLevel/LevelRewardLogic.mlua", "{0} 무기"],
  ["PlayerLevel/LevelRewardLogic.mlua", "{0} 장비"],
  ["PlayerLevel/LevelRewardLogic.mlua", "레벨 {0} 보상"],
  ["Puzzle/Map23ErdasEasterEggLogic.mlua", "{0} 에르다스가 소환되었다."],
  ["Puzzle/Map24TreasureChestLogic.mlua", "유물 뽑기권 {0}장 획득!"],
  ["Puzzle/Ep2Map4GalleryPortalTrigger.mlua", "{0}가 부족합니다 ({1}/{2})"],
  ["Relic/RelicUpgradeUI.mlua", "{0} {1}{2}\n다음 레벨: {3}{2}"],
];

// --spec=<json> : { LINES: {파일: [줄...]}, FMTS: [[파일, 템플릿]...] } 로 목록을 갈아끼운다(2차 작업용)
const SPEC = (process.argv.find((a) => a.startsWith('--spec=')) || '').slice(7);
if (SPEC) { const j = JSON.parse(fs.readFileSync(SPEC, 'utf8')); LINES = j.LINES || {}; FMTS = j.FMTS || []; }

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
const csvRows = parseCsv(fs.readFileSync(CSV, "utf8").replace(/^﻿/, ""));
const head = csvRows.shift();
const cKey = head.indexOf("Key"), cSrc = head.indexOf("Source"), cNote = head.indexOf("Note"), cKo = head.indexOf("ko");
const existingKeys = new Set(csvRows.map((r) => r[cKey]));
const textToKey = new Map();
for (const r of csvRows) if (r[cKey] && !textToKey.has(r[cSrc])) textToKey.set(r[cSrc], r[cKey]);
const newRows = [];
let reused = 0;

function slugOf(file) { return file.split("/").pop().replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9]/g, "").toUpperCase(); }
function keyFor(prefix, file, text, note) {
  if (textToKey.has(text)) { reused++; return textToKey.get(text); }
  const slug = slugOf(file);
  let n = 1, k;
  do { k = `${prefix}_${slug}_${String(n).padStart(3, "0")}`; n++; } while (existingKeys.has(k));
  existingKeys.add(k); textToKey.set(text, k);
  const row = new Array(head.length).fill("");
  row[cKey] = k; row[cSrc] = text; row[cNote] = note; row[cKo] = text;
  newRows.push(row);
  return k;
}

// 한 줄 안의 문자열 리터럴 스캔(주석 이후는 제외)
function literalsInLine(line) {
  const out = []; let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c === "-" && line[i + 1] === "-") break;
    if (c === '"') {
      let j = i + 1, buf = "";
      while (j < line.length && line[j] !== '"') {
        if (line[j] === "\\") { buf += line[j + 1] === "n" ? "\n" : line[j + 1]; j += 2; continue; }
        buf += line[j]; j++;
      }
      out.push({ s: i, e: j + 1, text: buf });
      i = j + 1; continue;
    }
    i++;
  }
  return out;
}

let total = 0;
for (const [file, lines] of Object.entries(LINES)) {
  const p = D + file;
  const src = fs.readFileSync(p, "utf8");
  const eol = src.includes("\r\n") ? "\r\n" : "\n";
  const L = src.split(/\r?\n/);
  let n = 0;
  for (const ln of lines) {
    const line = L[ln - 1];
    const lits = literalsInLine(line).filter((x) => KO.test(x.text));
    if (!lits.length) { console.log(`  ⚠ 한글 없음 ${file}:${ln}: ${line.trim().slice(0, 60)}`); continue; }
    let out = line;
    for (let k = lits.length - 1; k >= 0; k--) {
      const key = keyFor("MLUA", file, lits[k].text, `${p}:${ln}`);
      out = out.slice(0, lits[k].s) + `"${key}"` + out.slice(lits[k].e);
      n++;
    }
    L[ln - 1] = out;
    if (!APPLY) console.log(`    ${file}:${ln}  ${out.trim().slice(0, 110)}`);
  }
  total += n;
  if (APPLY) fs.writeFileSync(p, L.join(eol), "utf8");
}

console.log("\n[FMT 키]");
for (const [file, tpl] of FMTS) console.log(`  ${keyFor("FMT", file, tpl, D + file)}  ←  ${JSON.stringify(tpl)}  (${file})`);

console.log(`\n=== ${APPLY ? "적용" : "드라이런"} === 문자열 ${total}개 / 새 키 ${newRows.length}개 / 기존 키 재사용 ${reused}회`);
if (APPLY && newRows.length) {
  const all = [head].concat(csvRows, newRows);
  fs.writeFileSync(CSV, "﻿".repeat(0) + all.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", "utf8");
}
