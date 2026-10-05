// 번역 누락 전수조사 (2026-10-05, 읽기 전용).
//   node .builder-work/full_loc_audit.cjs [--verbose]
// ① 코드/.ui가 참조하는 키가 GameText.csv에 없음
// ② 참조 키의 ko/en/zh-tw/ja 빈칸, 또는 외국어 칸에 한글이 남음
// ③ .ui: 한글 텍스트가 키로 안 바뀜 / 키인데 IsLocalizationKey=false(화면에 키 노출)
// ④ .mlua: 주석·log·비교식 밖의 한글 리터럴 (화면에 그대로 나갈 수 있는 후보)
// ⑤ .map/.model: 한글 텍스트
const fs = require('fs');
const path = require('path');
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const VERBOSE = process.argv.includes('--verbose');
const HANGUL = /[가-힣]/;
const KEY_RE = /\b((?:MLUA|UI|FMT|ITEMNAME|MAP)_[A-Z0-9_]*[A-Z0-9])\b/g;
const KEY_ONLY = /^(?:MLUA|UI|FMT|ITEMNAME|MAP|ARENA|EP\d\w*)_[A-Z0-9_]+$/;

function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const csv = parseCsv(fs.readFileSync('RootDesk/MyDesk/Localization/GameText.csv', 'utf8').replace(/^﻿/, ''));
const head = csv[0];
const LANGS = ['ko', 'en', 'zh-tw', 'ja'];
const ci = Object.fromEntries(LANGS.map((l) => [l, head.indexOf(l)]));
const table = new Map();
const sourceToKey = new Map();
for (const r of csv.slice(1)) if (r[0]) { table.set(r[0], r); if (!sourceToKey.has(r[1])) sourceToKey.set(r[1], r[0]); }
console.log('CSV 헤더:', head.join('|'), '/ 행', table.size);

function walk(dir, ext, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, ext, out); else if (p.endsWith(ext)) out.push(p.split(path.sep).join('/'));
  }
  return out;
}

// ── 코드: 주석 제거(문자 단위) ──
function stripComments(src) {
  let out = ''; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') j++; j++; }
      out += src.slice(i, j + 1); i = j + 1; continue;
    }
    if (c === '-' && src[i + 1] === '-') {
      const m = src.slice(i).match(/^--\[(=*)\[/);
      if (m) { const end = src.indexOf(']' + m[1] + ']', i); const seg = src.slice(i, end < 0 ? src.length : end + m[1].length + 2); out += seg.replace(/[^\n]/g, ' '); i += seg.length; continue; }
      const nl = src.indexOf('\n', i); const seg = src.slice(i, nl < 0 ? src.length : nl); out += ' '.repeat(seg.length); i += seg.length; continue;
    }
    out += c; i++;
  }
  return out;
}

const used = new Map(); // key -> where
const dynPrefixes = new Map();
const luaHits = []; // [file, line, text, kind]
const engHits = [];
for (const f of walk('RootDesk/MyDesk', '.mlua')) {
  const raw = fs.readFileSync(f, 'utf8');
  const code = stripComments(raw);
  for (const m of code.matchAll(KEY_RE)) if (!used.has(m[1])) used.set(m[1], f);
  // 번역 함수에 직접 넘긴 키(접두사 무관)
  for (const m of code.matchAll(/(?:GetText|GetTextFormat|Resolve|ResolveFormat)\s*\(\s*"([A-Za-z0-9_]+)"/g))
    if (/^[A-Z][A-Z0-9_]*[A-Z0-9]$/.test(m[1]) && !used.has(m[1])) used.set(m[1], f);
  // 표에 있는 키와 똑같은 문자열 리터럴(데이터 테이블에 키만 넣는 패턴)
  for (const m of code.matchAll(/"([A-Z][A-Z0-9_]+)"/g)) if (table.has(m[1]) && !used.has(m[1])) used.set(m[1], f);
  // 하드코딩 영어/기호가 아닌 단어 문구를 화면에 직접 쓰는 줄
  code.split('\n').forEach((ln, idx) => {
    if (/\b(log|log_warning|log_error|print)\s*\(/.test(ln)) return;
    const m = ln.match(/(\.Text\s*=|ShowMessage\s*\(|ShowToast\s*\()\s*(.*)$/);
    if (!m) return;
    for (const s of m[2].matchAll(/"([^"\n]*)"/g)) {
      const v = s[1];
      if (!/[A-Za-z]{2,}/.test(v) || KEY_ONLY.test(v) || table.has(v) || /^[A-Z0-9_]+\|?$/.test(v)) continue;
      if (/^(Lv\.?|MAX|ON|OFF|x|X|HP|MP|DPS|EXP|VS|NEW|GM)$/.test(v.trim())) continue;
      engHits.push(`${f}:${idx + 1}  ${ln.trim().slice(0, 140)}`);
    }
  });
  for (const m of code.matchAll(/"((?:MLUA|UI|FMT|ITEMNAME)_[A-Z0-9_]*_)"\s*\.\./g)) dynPrefixes.set(m[1], f);
  const lines = code.split('\n');
  lines.forEach((ln, idx) => {
    if (!HANGUL.test(ln)) return;
    if (/\b(log|log_warning|log_error|print)\s*\(/.test(ln)) return;
    for (const m of ln.matchAll(/"([^"\n]*)"|'([^'\n]*)'/g)) {
      const s = m[1] ?? m[2];
      if (!HANGUL.test(s)) continue;
      const before = ln.slice(0, m.index);
      const after = ln.slice(m.index + m[0].length);
      let kind = 'literal';
      if (/(==|~=)\s*$/.test(before) || /^\s*(==|~=)/.test(after)) kind = 'compare';
      else if (/\[\s*$/.test(before) && /^\s*\]/.test(after)) kind = 'tablekey';
      else if (/(find|match|gsub|gmatch)\s*\(\s*[^,]*,?\s*$/.test(before)) kind = 'pattern';
      luaHits.push([f, idx + 1, s, kind, ln.trim().slice(0, 150)]);
    }
  });
}

// ── .ui ──
const uiRaw = [], uiFlag = [], uiFlagOnNonKey = [];
const log0 = console.log; console.log = () => {};
for (const f of walk('ui', '.ui')) {
  let b; try { b = UIBuilder.read(f); } catch (e) { continue; }
  for (const e of b.listEntities()) {
    const ent = b.find(e.path);
    for (const c of (ent && ent.jsonString && ent.jsonString['@components']) || []) {
      if (typeof c.Text !== 'string' || c.Text === '') continue;
      const t = c['@type'] || '';
      if (c.IsLocalizationKey) {
        if (!used.has(c.Text)) used.set(c.Text, f + ' ' + e.path);
        if (!KEY_ONLY.test(c.Text)) uiFlagOnNonKey.push(`${f} ${e.path} = ${JSON.stringify(c.Text)}`);
      } else if (HANGUL.test(c.Text)) uiRaw.push(`${f} ${e.path} [${t.replace('MOD.Core.', '')}] = ${JSON.stringify(c.Text.slice(0, 60))}`);
      else if (KEY_ONLY.test(c.Text)) uiFlag.push(`${f} ${e.path} = ${c.Text}`);
    }
  }
}
console.log = log0;

// ── .map / .model ──
const mapHits = [];
for (const f of [...walk('map', '.map'), ...walk('RootDesk/MyDesk', '.model')]) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/"(Text|PlaceHolder|Placeholder|Name)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
    if (m[1] === 'Name') continue;
    if (HANGUL.test(m[2])) mapHits.push(`${f} ${m[1]} = ${JSON.stringify(m[2].slice(0, 60))}`);
  }
}

// ── 결과 ──
const missing = [], partial = [], hangulLeft = [], sameAsKo = [];
for (const [k, where] of used) {
  const r = table.get(k);
  if (!r) { missing.push(`${k}  <- ${where}`); continue; }
  const empty = LANGS.filter((l) => ci[l] < 0 || !(r[ci[l]] || '').trim());
  if (empty.length) partial.push(`${k} 빈칸[${empty.join(',')}] ko=${JSON.stringify((r[ci.ko] || '').slice(0, 40))}  <- ${where}`);
  for (const l of ['en', 'zh-tw', 'ja']) {
    const v = r[ci[l]] || '';
    if (l !== 'ja' && HANGUL.test(v)) hangulLeft.push(`${k} [${l}] ${JSON.stringify(v.slice(0, 50))}`);
    else if (l === 'ja' && HANGUL.test(v)) hangulLeft.push(`${k} [ja] ${JSON.stringify(v.slice(0, 50))}`);
    if (v && v === r[ci.ko] && HANGUL.test(v)) sameAsKo.push(`${k} [${l}]`);
  }
}
const dynMissing = [];
for (const [p, f] of dynPrefixes) if (![...table.keys()].some((k) => k.startsWith(p))) dynMissing.push(`${p}* <- ${f}`);

function section(title, arr, limit = 400) {
  console.log(`\n${title}: ${arr.length}`);
  arr.slice(0, VERBOSE ? 1e9 : limit).forEach((x) => console.log('  ' + x));
}
console.log('참조 키', used.size);
section('① 표에 없는 키', missing);
section('① 동적 접두사인데 표에 없음', dynMissing);
section('② 번역 빈칸', partial);
section('② 외국어 칸에 한글 남음', [...new Set(hangulLeft)]);
section('③ .ui 한글 직접 입력(키 아님)', uiRaw);
section('③ .ui 키인데 IsLocalizationKey=false', uiFlag);
section('③ .ui IsLocalizationKey=true인데 키 형식 아님', uiFlagOnNonKey);
section('⑤ .map/.model 한글 텍스트', mapHits);
section('⑥ .mlua 영어 문구 직접 표시 후보', engHits);

const kinds = {};
for (const h of luaHits) kinds[h[3]] = (kinds[h[3]] || 0) + 1;
console.log('\n④ .mlua 한글 리터럴 (주석·log 제외):', luaHits.length, JSON.stringify(kinds));
const perFile = {};
for (const h of luaHits.filter((h) => h[3] === 'literal')) perFile[h[0]] = (perFile[h[0]] || 0) + 1;
Object.entries(perFile).sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log(`  ${String(n).padStart(5)}  ${f}`));
fs.writeFileSync('.builder-work/full_loc_audit_lua.json', JSON.stringify(luaHits, null, 1));
