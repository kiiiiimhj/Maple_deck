// 2026-09-23 출시 전 번역 점검(이번 업데이트분).
// ① 코드/.ui가 참조하는 번역 키가 GameText.csv에 있고 ko/en/zh-tw/ja가 모두 채워졌는지(전체)
// ② 마지막 커밋 이후 추가된 .mlua 줄에서 키로 안 바뀐 한글 문자열(주석·log 제외)
// ③ 이번에 수정한 .ui에서 IsLocalizationKey가 아닌 한글 텍스트
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const csv = parseCsv(fs.readFileSync('RootDesk/MyDesk/Localization/GameText.csv', 'utf8').replace(/^﻿/, ''));
const head = csv[0];
const col = (n) => head.indexOf(n);
const table = new Map();
for (const r of csv.slice(1)) if (r[0]) table.set(r[0], r);
const LANGS = ['ko', 'en', 'zh-tw', 'ja'];
console.log('columns:', head.join('|'), ' rows:', table.size);

// ① 참조 키 수집
const KEY_RE = /\b((?:MLUA|UI|FMT|ITEMNAME)_[A-Z0-9_]+)\b/g;
const used = new Map();
function walk(dir, ext, out) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, ext, out); else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}
for (const f of walk('RootDesk/MyDesk', '.mlua', [])) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(KEY_RE)) if (!used.has(m[1])) used.set(m[1], f);
}
const uiFiles = walk('ui', '.ui', []);
for (const f of uiFiles) {
  const b = UIBuilder.read(f);
  for (const e of b.listEntities()) {
    for (const c of b.find(e.path).jsonString['@components'] || []) {
      if (c.IsLocalizationKey && typeof c.Text === 'string' && !used.has(c.Text)) used.set(c.Text, f + ' ' + e.path);
    }
  }
}
// 코드에서 숫자 뒤를 붙여 동적으로 만드는 키 접두사(예: "MLUA_X_" .. n)는 오탐이 되니 끝이 _인 것은 제외
const missing = [], partial = [];
for (const [k, where] of used) {
  if (k.endsWith('_')) continue;
  const r = table.get(k);
  if (!r) { missing.push(k + '  <- ' + where); continue; }
  const empty = LANGS.filter((l) => col(l) < 0 || !(r[col(l)] || '').trim());
  if (empty.length) partial.push(k + ' 빈칸[' + empty.join(',') + ']  <- ' + where);
}
console.log('\n① 참조 키', used.size, '개 / 표에 없음', missing.length, '/ 번역 빈칸', partial.length);
missing.forEach((x) => console.log('  없음 ', x));
partial.forEach((x) => console.log('  빈칸 ', x));

// ② 이번 커밋 이후 추가된 .mlua 줄의 한글 리터럴
const HANGUL = /[가-힣]/;
const diff = execSync('git diff HEAD -U0 -- "RootDesk/MyDesk/*.mlua" "RootDesk/MyDesk/**/*.mlua"', { encoding: 'utf8', maxBuffer: 64 << 20 });
let file = '';
const hits = [];
for (const line of diff.split('\n')) {
  if (line.startsWith('+++ ')) { file = line.slice(6); continue; }
  if (!line.startsWith('+') || line.startsWith('+++')) continue;
  const code = line.slice(1);
  const noComment = code.replace(/--.*$/, '');
  if (!HANGUL.test(noComment)) continue;
  if (/\blog(_warning|_error)?\s*\(/.test(noComment)) continue;
  const strs = [...noComment.matchAll(/"([^"]*)"/g)].map((m) => m[1]).filter((s) => HANGUL.test(s));
  if (strs.length) hits.push(file + ': ' + code.trim().slice(0, 160));
}
console.log('\n② 새 .mlua 줄의 한글 문자열', hits.length);
hits.forEach((x) => console.log('  ', x));

// ③ 이번에 수정한 .ui의 비키 한글 텍스트
const changedUi = execSync('git status --porcelain -- ui', { encoding: 'utf8' }).split('\n').map((l) => l.slice(3).trim().replace(/^Maple_Story_Deck\//, '')).filter((p) => p.endsWith('.ui'));
console.log('\n③ 수정된 .ui', changedUi.join(', '));
for (const f of changedUi) {
  const b = UIBuilder.read(f);
  for (const e of b.listEntities()) {
    for (const c of b.find(e.path).jsonString['@components'] || []) {
      if (typeof c.Text === 'string' && HANGUL.test(c.Text) && !c.IsLocalizationKey) console.log('  ', f, e.path, JSON.stringify(c.Text));
    }
  }
}
