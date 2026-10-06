// 번역표(GameText.csv / translate_me.csv) 공용 도구 (2026-10-06).
//   칸 순서를 스크립트에 박지 말고 **헤더에서 찾는다** — 언어 칸이 늘어나도 안 깨지게.
//   간체(zh-cn)는 사람이 따로 쓰지 않고 대만어(zh-tw)를 OpenCC(대만→본토 어휘)로 변환해 채운다.
//
//   const L = require("./locale_lib.cjs");
//   L.LANGS                     // 게임 언어 칸 전부 ["ko","en","zh-tw","zh-cn","ja"]
//   L.TRANSLATED                // 사람이 번역하는 칸 ["en","zh-tw","ja"] (zh-cn은 자동)
//   L.toZhCn("新手獵人")         // "新手猎人"
//   L.makeRow(head, { key, source, note, ko, en, "zh-tw": tw, ja })  // 헤더 순서대로 배열
//   L.addRows(path, rowObjs, { update })   // 키 없으면 추가, update면 있는 행도 덮어씀
const fs = require("fs");
const OpenCC = require("./vendor/opencc-js/t2cn.js");

const GAME_CSV = "RootDesk/MyDesk/Localization/GameText.csv";
const TR_CSV = "Docs/Localization/translate_me.csv";
const LANGS = ["ko", "en", "zh-tw", "zh-cn", "ja"];
const TRANSLATED = ["en", "zh-tw", "ja"];
// 사람이 쓰지 않고 다른 칸에서 만들어지는 칸: 대상 칸 → 원본 칸
const DERIVED = { "zh-cn": "zh-tw" };

const twToCn = OpenCC.Converter({ from: "twp", to: "cn" });
const toZhCn = (s) => (s ? twToCn(s) : "");

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
const cell = (v) => { const s = String(v ?? ""); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

function readCsv(path) {
  const raw = fs.readFileSync(path, "utf8");
  const bom = raw.charCodeAt(0) === 0xfeff;
  const rows = parseCsv(bom ? raw.slice(1) : raw).filter((r) => r.length > 1 || r[0]);
  return { head: rows[0], rows: rows.slice(1), bom };
}
function writeCsv(path, head, rows, bom) {
  fs.writeFileSync(path, (bom ? "﻿" : "") + [head].concat(rows).map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", "utf8");
}

// 헤더 이름 → 값. GameText(Key,Source,Note,ko,…)와 translate_me(Key,한국어원문,위치(Note),…) 둘 다 받는다.
function makeRow(head, o) {
  const v = { ...o };
  for (const [dst, src] of Object.entries(DERIVED)) if (v[dst] == null && v[src] != null) v[dst] = toZhCn(v[src]);
  return head.map((h) => {
    if (h === "Key") return v.key;
    if (h === "Source" || h === "한국어원문") return v.source ?? v.ko;
    if (h === "Note" || h === "위치(Note)") return v.note ?? "";
    return v[h] ?? "";
  });
}

// 이미 있는 행에서 zh-tw가 바뀌었으면 zh-cn도 다시 만든다(행 배열을 직접 고친 뒤 호출).
function syncDerived(head, row) {
  for (const [dst, src] of Object.entries(DERIVED)) {
    const di = head.indexOf(dst), si = head.indexOf(src);
    if (di >= 0 && si >= 0) row[di] = toZhCn(row[si]);
  }
  return row;
}

// rowObjs: [{ key, source?, note, ko, en, "zh-tw", ja }]
function addRows(path, rowObjs, { update = false, apply = true } = {}) {
  const { head, rows, bom } = readCsv(path);
  const byKey = new Map(rows.map((r, i) => [r[0], i]));
  let added = 0, updated = 0, skipped = 0;
  for (const o of rowObjs) {
    const row = makeRow(head, o);
    if (byKey.has(o.key)) {
      if (update) { rows[byKey.get(o.key)] = row; updated++; } else skipped++;
    } else { byKey.set(o.key, rows.length); rows.push(row); added++; }
  }
  if (apply) writeCsv(path, head, rows, bom);
  return { added, updated, skipped, head };
}

module.exports = { GAME_CSV, TR_CSV, LANGS, TRANSLATED, DERIVED, toZhCn, parseCsv, cell, readCsv, writeCsv, makeRow, syncDerived, addRows };
