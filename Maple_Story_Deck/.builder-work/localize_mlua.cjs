// .mlua 표시 문구 → _LocalizationService:GetText(키) 일괄 치환 (2026-09-22).
//   node .builder-work/localize_mlua.cjs              드라이런
//   node .builder-work/localize_mlua.cjs --apply      실제 저장
//   node .builder-work/localize_mlua.cjs --only=OptionUI   특정 파일만
//
// 안전장치 (이 순서로 걸러낸다):
//  1) 주석 제외 — 문자 단위 Lua 스캐너. 정규식으로 자르면 "체력 -- 감소"가 잘려나간다.
//  2) log()/log_warning()/log_error() 줄 제외 — 개발용이라 번역 대상 아님.
//  3) **비교 구문 제외** — `== "한국어"` / `~= "한국어"`. 전체 코드에 1건뿐이지만(CharacterUnlockUI
//     의 `characterName == "실피드"`) 바꾸면 로직이 깨진다.
//  4) **문자열 연결 제외** — 앞뒤에 `..`가 붙은 문구는 GetTextFormat + {0} 자리표시자가 필요해서
//     기계적 치환이 불가능하다. 따로 세서 보고만 한다.
//  5) **ClientOnly/Client 안에서만 치환** — `_LocalizationService`는 ClientOnly라 서버에서 부르면 nil.
//     ExecSpace를 못 읽은 위치는 건드리지 않는다.
//  6) 번역표(GameText.csv)에 원문이 없으면 건너뛴다.
const fs = require("fs");

const APPLY = process.argv.includes("--apply");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7);
// --all : RootDesk/MyDesk 전체를 훑는다. 안전장치(ClientOnly 한정 등)는 그대로 적용되므로
//         자동으로 안전한 것만 걸러진다. 나머지는 파일별 수작업 대상으로 보고된다.
const ALL = process.argv.includes("--all");

// 데이터 테이블이 아닌 "순수 UI" 파일들부터. 구조 변경 없이 바로 된다.
const TARGETS = [
  "RootDesk/MyDesk/UI/WorldCharacterSelectUI.mlua",
  "RootDesk/MyDesk/OptionUI.mlua",
  "RootDesk/MyDesk/IdleReward/IdleRewardUI.mlua",
  "RootDesk/MyDesk/GachaUI.mlua",
  "RootDesk/MyDesk/EpisodeReward/EpisodeRewardUI.mlua",
  "RootDesk/MyDesk/Inventory/UI/UIComposePopup.mlua",
  "RootDesk/MyDesk/Inventory/UI/UIInventory.mlua",
  "RootDesk/MyDesk/PlayerLevel/LevelRewardUI.mlua",
  "RootDesk/MyDesk/UI/ShopUI.mlua",
];

const KO = /[가-힣]/;

// ── 번역표 ────────────────────────────────────────────────────────────────
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

// ── Lua 스캐너: 문자열의 시작/끝 오프셋까지 돌려준다 ──────────────────────
function scanLuaStrings(src) {
  const out = [];
  let i = 0, line = 1;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === "\n") { line++; i++; continue; }
    if (c === "-" && src[i + 1] === "-") {
      if (src[i + 2] === "[" && src[i + 3] === "[") {
        const end = src.indexOf("]]", i + 4);
        const stop = end === -1 ? n : end + 2;
        for (let k = i; k < stop; k++) if (src[k] === "\n") line++;
        i = stop; continue;
      }
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "[" && src[i + 1] === "[") {
      const end = src.indexOf("]]", i + 2);
      const stop = end === -1 ? n : end;
      for (let k = i; k < stop; k++) if (src[k] === "\n") line++;
      i = stop + 2; continue;   // 긴 문자열은 대상에서 제외(드묾 + 치환 위험)
    }
    if (c === '"' || c === "'") {
      const quote = c;
      const startLine = line, start = i;
      let j = i + 1, buf = "";
      while (j < n) {
        const d = src[j];
        if (d === "\\") { buf += src[j + 1] === "n" ? "\n" : src[j + 1]; j += 2; continue; }
        if (d === quote || d === "\n") break;
        buf += d; j++;
      }
      out.push({ text: buf, line: startLine, start, end: j + 1 });
      i = j + 1; continue;
    }
    i++;
  }
  return out;
}

// ── ExecSpace 맵 ──────────────────────────────────────────────────────────
function buildExecMap(lines) {
  const decls = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(?:@ExecSpace\("(\w+)"\)\s*)?(?:method|handler)\s+[\w<>,\s]*?(\w+)\s*\(/);
    if (!m) continue;
    let exec = m[1] || null;
    if (!exec) {
      for (let k = i - 1; k >= 0 && k >= i - 4; k--) {
        const t = lines[k].trim();
        if (t === "") continue;
        const e = t.match(/^@ExecSpace\("(\w+)"\)$/);
        if (e) { exec = e[1]; break; }
        if (!t.startsWith("@")) break;
      }
    }
    decls.push({ line: i + 1, exec: exec || "UNSPEC" });
  }
  return (lineNo) => {
    let hit = null;
    for (const d of decls) { if (d.line <= lineNo) hit = d; else break; }
    return hit ? hit.exec : "TOPLEVEL";
  };
}

const CLIENT = new Set(["ClientOnly", "Client"]);
const total = { done: 0, concat: 0, cmp: 0, noKey: 0, nonClient: 0 };
const skipped = { concat: [], noKey: [] };
const nonClientByFile = new Map();

function listAllMlua(dir, out) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + "/" + f.name;
    if (f.isDirectory()) { listAllMlua(p, out); continue; }
    if (f.name.endsWith(".mlua")) out.push(p);
  }
  return out;
}
const FILES = ALL ? listAllMlua("RootDesk/MyDesk", []) : TARGETS;

for (const file of FILES) {
  if (ONLY && !file.includes(ONLY)) continue;
  if (!fs.existsSync(file)) { console.log(`  ⚠ 없음: ${file}`); continue; }

  const src = fs.readFileSync(file, "utf8");
  const lines = src.split(/\r?\n/);
  const execAt = buildExecMap(lines);
  const edits = [];

  for (const s of scanLuaStrings(src)) {
    if (!KO.test(s.text)) continue;
    const lt = lines[s.line - 1] || "";
    if (/\blog(_warning|_error)?\s*\(/.test(lt)) continue;

    // 이미 치환된 것
    if (/GetText\s*\(\s*$/.test(src.slice(Math.max(0, s.start - 30), s.start))) continue;

    // 비교 구문
    const before = src.slice(Math.max(0, s.start - 6), s.start);
    const after = src.slice(s.end, s.end + 6);
    if (/[=~]=\s*$/.test(before)) { total.cmp++; continue; }

    // 문자열 연결 — GetTextFormat 필요, 기계적 치환 불가
    if (/\.\.\s*$/.test(before) || /^\s*\.\./.test(after)) {
      total.concat++;
      if (skipped.concat.length < 30) skipped.concat.push(`${file}:${s.line}  ${lt.trim().slice(0, 100)}`);
      continue;
    }

    const exec = execAt(s.line);
    if (!CLIENT.has(exec)) {
      total.nonClient++;
      nonClientByFile.set(file, (nonClientByFile.get(file) || 0) + 1);
      continue;
    }

    const key = textToKey.get(s.text);
    if (!key) {
      total.noKey++;
      if (skipped.noKey.length < 20) skipped.noKey.push(`${file}:${s.line}  ${JSON.stringify(s.text).slice(0, 60)}`);
      continue;
    }

    edits.push({ start: s.start, end: s.end, key, was: s.text, line: s.line });
  }

  if (!edits.length) { if (!ALL) console.log(`   0  ${file}`); continue; }

  // ⚠ 뒤에서부터 치환해야 앞쪽 오프셋이 안 밀린다
  let out = src;
  for (let i = edits.length - 1; i >= 0; i--) {
    const e = edits[i];
    out = out.slice(0, e.start) + `_LocalizationService:GetText("${e.key}")` + out.slice(e.end);
  }

  console.log(`  ${String(edits.length).padStart(3)}  ${file}`);
  total.done += edits.length;
  if (APPLY) fs.writeFileSync(file, out, "utf8");
}

console.log(`\n=== ${APPLY ? "적용 완료" : "드라이런(저장 안 함)"} ===
치환               : ${total.done}
연결(..) — 보류    : ${total.concat}   GetTextFormat 필요
비교(==) — 제외    : ${total.cmp}
클라 아님 — 제외   : ${total.nonClient}
번역표에 없음      : ${total.noKey}`);

if (skipped.concat.length) {
  console.log("\n-- 연결형(나중에 GetTextFormat) 샘플 --");
  for (const s of skipped.concat.slice(0, 15)) console.log("  " + s);
}
if (skipped.noKey.length) {
  console.log("\n-- 번역표에 없는 문구 --");
  for (const s of skipped.noKey) console.log("  " + s);
}
if (nonClientByFile.size) {
  console.log("\n-- ClientOnly가 아니라 건드리지 않은 곳 (파일별, 수작업 대상) --");
  const rows = [...nonClientByFile].sort((a, b) => b[1] - a[1]);
  for (const [f, n] of rows.slice(0, 25)) console.log(`  ${String(n).padStart(4)}  ${f}`);
  if (rows.length > 25) console.log(`  ... 외 ${rows.length - 25}개 파일`);
}
