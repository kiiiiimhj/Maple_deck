// 문자열 연결(`..`) → _LocalizationService:GetTextFormat(키, 인자...) 전환. 2026-09-22.
//   node .builder-work/localize_concat.cjs            드라이런
//   node .builder-work/localize_concat.cjs --apply    실제 저장(.mlua + GameText.csv)
//
// 왜 필요한가: `"대미지 : " .. n` 을 조각별로 번역하면 어순이 다른 언어에서 깨진다.
//   사슬 전체를 하나의 템플릿(`대미지 : {0}`)으로 묶고 인자를 {0},{1}...로 넘겨야 한다.
//
// 만들어지는 키: FMT_<파일명>_NNN. 기존 MLUA_/UI_ 네임스페이스와 겹치지 않게 분리한다.
//   같은 템플릿은 키 하나를 공유한다(중복 행 방지).
//
// 안전장치:
//   - 주석 / log() 제외
//   - **ClientOnly·Client 메서드 안에서만** 치환 (_LocalizationService는 ClientOnly)
//   - 사슬 경계 탐색은 **코드 구간에서만** (문자열 안의 괄호에 속지 않게)
//   - 인자에 `..`가 남아 있거나 빈 조각이 있으면 건너뜀
//   - 템플릿에 한국어가 없으면 건너뜀(번역 대상 아님)
const fs = require("fs");
const path = require("path");

const APPLY = process.argv.includes("--apply");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7);
const KO = /[가-힣]/;
const CSV = "RootDesk/MyDesk/Localization/GameText.csv";

// ── CSV ───────────────────────────────────────────────────────────────────
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
const csvHead = csvRows.shift();
const cKey = csvHead.indexOf("Key"), cSrc = csvHead.indexOf("Source"),
      cNote = csvHead.indexOf("Note"), cKo = csvHead.indexOf("ko");
const existingKeys = new Set(csvRows.map((r) => r[cKey]));
const tplToKey = new Map();          // 템플릿 → 키 (중복 방지)
const newRows = [];

// ── Lua 스캐너 ────────────────────────────────────────────────────────────
function analyze(src) {
  const n = src.length;
  const kind = new Uint8Array(n);
  const strs = [];
  let i = 0, line = 1;
  while (i < n) {
    const c = src[i];
    if (c === "\n") { line++; i++; continue; }
    if (c === "-" && src[i + 1] === "-") {
      let stop;
      if (src[i + 2] === "[" && src[i + 3] === "[") { const e = src.indexOf("]]", i + 4); stop = e === -1 ? n : e + 2; }
      else { let j = i; while (j < n && src[j] !== "\n") j++; stop = j; }
      for (let k = i; k < stop; k++) { kind[k] = 2; if (src[k] === "\n") line++; }
      i = stop; continue;
    }
    if (c === "[" && src[i + 1] === "[") {
      const e = src.indexOf("]]", i + 2); const stop = e === -1 ? n : e + 2;
      for (let k = i; k < stop; k++) { kind[k] = 1; if (src[k] === "\n") line++; }
      i = stop; continue;
    }
    if (c === '"' || c === "'") {
      const quote = c, start = i, startLine = line;
      let j = i + 1;
      while (j < n) { const d = src[j]; if (d === "\\") { j += 2; continue; } if (d === quote || d === "\n") break; j++; }
      const end = j + 1;
      for (let k = start; k < end && k < n; k++) kind[k] = 1;
      strs.push({ start, end, line: startLine, raw: src.slice(start, end) });
      i = end; continue;
    }
    i++;
  }
  return { kind, strs };
}

function expandChain(src, kind, start, end) {
  let lo = start, hi = end;
  for (;;) {
    let p = lo - 1;
    while (p >= 0 && kind[p] === 0 && /\s/.test(src[p])) p--;
    if (p >= 1 && kind[p] === 0 && src[p] === "." && src[p - 1] === ".") {
      let q = p - 2, depth = 0;
      while (q >= 0) {
        const c = src[q];
        if (kind[q] !== 0) { q--; continue; }
        if (c === ")" || c === "]") depth++;
        else if (c === "(" || c === "[") { if (depth === 0) break; depth--; }
        else if (depth === 0 && (c === "," || c === "=" || c === "\n" || c === ";")) break;
        q--;
      }
      lo = q + 1;
      while (lo < start && /\s/.test(src[lo])) lo++;
      continue;
    }
    break;
  }
  for (;;) {
    let p = hi;
    while (p < src.length && kind[p] === 0 && /\s/.test(src[p])) p++;
    if (kind[p] === 0 && src[p] === "." && src[p + 1] === ".") {
      let q = p + 2, depth = 0;
      while (q < src.length) {
        const c = src[q];
        if (kind[q] !== 0) { q++; continue; }
        if (c === "(" || c === "[") depth++;
        else if (c === ")" || c === "]") { if (depth === 0) break; depth--; }
        else if (depth === 0 && (c === "," || c === "\n" || c === ";")) break;
        // ⚠ 키워드에서도 멈춰야 한다. 안 그러면 `... .. "%" end` 의 `end`까지 삼켜서
        //   `GetTextFormat(..., "%" end)` 같은 문법 오류가 난다(실측 3건).
        else if (depth === 0 && /[\sA-Za-z]/.test(c) && /^\s+(end|then|else|elseif|do|and|or)\b/.test(src.slice(q))) break;
        q++;
      }
      hi = q;
      while (hi > p && /\s/.test(src[hi - 1])) hi--;
      continue;
    }
    break;
  }
  // 경계 정리 — **start에서 왼쪽으로** 걸어가며 깊이를 센다.
  // ⚠ 앞에서 오른쪽으로 훑으면 `math.floor(x * 100)` 안쪽 괄호까지 경계로 잡아
  //   `) * 100) .. "%..."` 처럼 표현식 한복판에서 잘린다(실측 167건).
  //   짝이 안 맞는 여는 괄호(= 사슬 바깥에서 열린 것)에서만 자른다.
  const KW = /^(then|return|do|else|elseif|and|or|not)$/;
  let depth = 0, cutAbs = -1;
  for (let p = start - 1; p >= lo; p--) {
    if (kind[p] !== 0) continue;
    const c = src[p];
    if (c === ")" || c === "]") { depth++; continue; }
    if (c === "(" || c === "[") {
      if (depth === 0) { cutAbs = p + 1; break; }   // 짝 없는 여는 괄호 = 바깥 경계
      depth--; continue;
    }
    if (depth !== 0) continue;
    if (c === "=" || c === ",") { cutAbs = p + 1; break; }
    if (/[A-Za-z]/.test(c) && !/[A-Za-z0-9_]/.test(src[p + 1] || " ")) {
      let q = p; while (q >= lo && /[A-Za-z]/.test(src[q])) q--;
      if (KW.test(src.slice(q + 1, p + 1))) { cutAbs = p + 1; break; }
      p = q + 1;
    }
  }
  if (cutAbs > lo) { lo = cutAbs; while (lo < start && /\s/.test(src[lo])) lo++; }
  return { lo, hi };
}

function buildTemplate(src, kind, lo, hi) {
  const parts = [];
  let depth = 0, seg = lo;
  for (let i = lo; i < hi; i++) {
    if (kind[i] !== 0) continue;
    const c = src[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (depth === 0 && c === "." && src[i + 1] === ".") {
      parts.push(src.slice(seg, i).trim()); i++; seg = i + 1;
    }
  }
  parts.push(src.slice(seg, hi).trim());

  let tpl = "", args = [], argN = 0;
  for (const p of parts) {
    if (p === "") return null;
    const m = p.match(/^"((?:[^"\\]|\\.)*)"$/) || p.match(/^'((?:[^'\\]|\\.)*)'$/);
    if (m) {
      tpl += m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\'/g, "'");
    } else {
      if (p.includes("..")) return null;     // 쪼개기 실패
      tpl += "{" + argN + "}"; args.push(p); argN++;
    }
  }
  if (args.length === 0) return null;
  return { tpl, args };
}

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
  return (lineNo) => { let hit = null; for (const d of decls) { if (d.line <= lineNo) hit = d; else break; } return hit ? hit.exec : "TOPLEVEL"; };
}
const CLIENT = new Set(["ClientOnly", "Client"]);

// ── 변환 ──────────────────────────────────────────────────────────────────
const perFile = new Map();
const stat = { done: 0, nonClient: 0, unparsable: 0, noKo: 0 };
const skipSamples = [];

function keyFor(fileBase, tpl) {
  if (tplToKey.has(tpl)) return tplToKey.get(tpl);
  const slug = fileBase.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  let n = 1, k;
  do { k = `FMT_${slug}_${String(n).padStart(3, "0")}`; n++; } while (existingKeys.has(k));
  existingKeys.add(k);
  tplToKey.set(tpl, k);
  return k;
}

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { walk(p); continue; }
    if (!f.name.endsWith(".mlua")) continue;
    const rel = p.split(path.sep).join("/");
    if (ONLY && !rel.includes(ONLY)) continue;

    const src = fs.readFileSync(p, "utf8");
    const { kind, strs } = analyze(src);
    const lines = src.split(/\r?\n/);
    const execAt = buildExecMap(lines);
    const edits = [];
    const seenLo = new Set();

    for (const s of strs) {
      const body = s.raw.slice(1, -1);
      if (!KO.test(body)) continue;
      const lt = lines[s.line - 1] || "";
      if (/\blog(_warning|_error)?\s*\(/.test(lt)) continue;

      const { lo, hi } = expandChain(src, kind, s.start, s.end);
      if (hi - lo === s.end - s.start) continue;    // 연결 아님 — 다른 스크립트 담당
      if (seenLo.has(lo)) continue;
      seenLo.add(lo);

      const built = buildTemplate(src, kind, lo, hi);
      if (built === null) {
        stat.unparsable++;
        if (skipSamples.length < 12) skipSamples.push(`[쪼개기실패] ${rel}:${s.line}  ${src.slice(lo, hi).replace(/\s+/g, " ").slice(0, 90)}`);
        continue;
      }
      if (!KO.test(built.tpl)) { stat.noKo++; continue; }

      const exec = execAt(s.line);
      if (!CLIENT.has(exec)) {
        stat.nonClient++;
        if (skipSamples.length < 12) skipSamples.push(`[${exec}] ${rel}:${s.line}  ${src.slice(lo, hi).replace(/\s+/g, " ").slice(0, 90)}`);
        continue;
      }

      const key = keyFor(f.name, built.tpl);
      if (!newRows.some((r) => r[cKey] === key)) {
        const row = new Array(csvHead.length).fill("");
        row[cKey] = key; row[cSrc] = built.tpl; row[cNote] = `${rel}:${s.line}`; row[cKo] = built.tpl;
        newRows.push(row);
      }
      edits.push({ lo, hi, key, args: built.args });
      stat.done++;
    }

    if (!edits.length) continue;
    edits.sort((a, b) => a.lo - b.lo);
    let out = src;
    for (let i = edits.length - 1; i >= 0; i--) {
      const e = edits[i];
      const call = `_LocalizationService:GetTextFormat("${e.key}", ${e.args.join(", ")})`;
      out = out.slice(0, e.lo) + call + out.slice(e.hi);
    }
    perFile.set(rel, edits.length);
    if (APPLY) fs.writeFileSync(p, out, "utf8");
  }
}
walk("RootDesk/MyDesk");

console.log(`=== ${APPLY ? "적용 완료" : "드라이런(저장 안 함)"} ===
GetTextFormat 전환 : ${stat.done}   (새 키 ${newRows.length}개)
ClientOnly 아님    : ${stat.nonClient}
쪼개기 실패        : ${stat.unparsable}
템플릿에 한국어 없음: ${stat.noKo}`);

console.log("\n-- 파일별 --");
for (const [f, n] of [...perFile].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${f}`);

if (skipSamples.length) {
  console.log("\n-- 건너뛴 것 샘플 --");
  for (const s of skipSamples) console.log("  " + s);
}

if (APPLY && newRows.length) {
  const all = [csvHead].concat(csvRows, newRows);
  fs.writeFileSync(CSV, all.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", "utf8");
  console.log(`\n→ ${CSV} 에 ${newRows.length}행 추가 (총 ${csvRows.length + newRows.length}행)`);
}
