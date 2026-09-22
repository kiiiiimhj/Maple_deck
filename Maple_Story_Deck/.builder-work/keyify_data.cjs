// 데이터 파일의 한국어 문자열 → **키 문자열로 교체만** (GetText 안 감쌈). 2026-09-22.
//   node .builder-work/keyify_data.cjs <파일경로> [...] [--apply]
//
// 왜 GetText로 안 감싸나:
//   이 파일들의 문구는 @ExecSpace가 없거나 서버에서도 실행되는 자리(데이터 테이블 선언 등)에 있다.
//   `_LocalizationService`는 ClientOnly라 거기서 부르면 서버에서 nil이 된다(상점에서 실증).
//   → 표에는 **키만** 넣고, ClientOnly인 소비처(UI)에서 GetText로 푼다.
//
// 안전장치: 주석 제외(문자 단위 스캐너) / log() 제외 / `== "한국어"` 비교 제외 /
//          `..` 연결 제외 / 번역표에 없으면 건너뜀.
const fs = require("fs");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const FILES = args.filter((a) => !a.startsWith("--"));
// --linere=<정규식> : 그 정규식에 맞는 **줄**만 대상으로 한다.
//   CardManager처럼 2만 줄짜리 파일에서 특정 형태(프로퍼티 기본값 등)만 건드릴 때 쓴다.
const LINE_RE_ARG = (args.find((a) => a.startsWith("--linere=")) || "").slice(9);
const LINE_RE = LINE_RE_ARG ? new RegExp(LINE_RE_ARG) : null;
const KO = /[가-힣]/;

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
const rows = parseCsv(fs.readFileSync("RootDesk/MyDesk/Localization/GameText.csv", "utf8").replace(/^﻿/, ""));
const head = rows.shift();
const iKey = head.indexOf("Key"), iSrc = head.indexOf("Source");
const textToKey = new Map();
for (const r of rows) if (r[iKey] && !textToKey.has(r[iSrc])) textToKey.set(r[iSrc], r[iKey]);

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
      i = stop + 2; continue;
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

let grand = 0, skipConcat = 0, skipCmp = 0, skipNoKey = 0;
const noKeySamples = [];

for (const file of FILES) {
  if (!fs.existsSync(file)) { console.log(`  ⚠ 없음: ${file}`); continue; }
  const src = fs.readFileSync(file, "utf8");
  const lines = src.split(/\r?\n/);
  const edits = [];

  for (const s of scanLuaStrings(src)) {
    if (!KO.test(s.text)) continue;
    const lt = lines[s.line - 1] || "";
    if (/\blog(_warning|_error)?\s*\(/.test(lt)) continue;
    if (LINE_RE && !LINE_RE.test(lt)) continue;

    const before = src.slice(Math.max(0, s.start - 6), s.start);
    const after = src.slice(s.end, s.end + 6);
    if (/[=~]=\s*$/.test(before)) { skipCmp++; continue; }
    if (/\.\.\s*$/.test(before) || /^\s*\.\./.test(after)) { skipConcat++; continue; }

    const key = textToKey.get(s.text);
    if (!key) {
      skipNoKey++;
      if (noKeySamples.length < 10) noKeySamples.push(`${file}:${s.line} ${JSON.stringify(s.text).slice(0, 50)}`);
      continue;
    }
    edits.push({ start: s.start, end: s.end, key });
  }

  if (!edits.length) { console.log(`   0  ${file}`); continue; }

  // ⚠ 뒤에서부터 치환(오프셋 밀림 방지)
  let out = src;
  for (let i = edits.length - 1; i >= 0; i--) {
    out = out.slice(0, edits[i].start) + `"${edits[i].key}"` + out.slice(edits[i].end);
  }
  console.log(`  ${String(edits.length).padStart(4)}  ${file}`);
  grand += edits.length;
  if (APPLY) fs.writeFileSync(file, out, "utf8");
}

console.log(`\n=== ${APPLY ? "적용" : "드라이런"} ===  키로 교체 ${grand} / 연결 보류 ${skipConcat} / 비교 제외 ${skipCmp} / 표에 없음 ${skipNoKey}`);
for (const s of noKeySamples) console.log("  ⚠ " + s);
console.log("\n⚠ 이 파일들은 키만 들어갔다. **소비처(ClientOnly UI)에서 GetText로 풀어야** 화면에 글씨가 나온다.");
