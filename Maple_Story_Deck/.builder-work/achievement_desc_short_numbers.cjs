// 2026-09-23 유저 지정: 업적 설명의 큰 숫자(1만 이상)를 언어별로 짧게 — 칸 넘침 방지.
// ko 만 / en K·M / zh-tw 萬 / ja 万. Source(원문) 칸도 ko와 같이 바꾼다. 컬럼: Key,Source,Note,ko,en,zh-tw,ja
const fs = require('fs');
const P = 'RootDesk/MyDesk/Localization/GameText.csv';
const NEW = {
  MLUA_ACHIEVEMENTLOGIC_004: ['몬스터 1만 마리 처치', 'Defeat 10K monsters', '擊敗1萬隻怪物', 'モンスターを1万体討伐'],
  MLUA_ACHIEVEMENTLOGIC_006: ['몬스터 10만 마리 처치', 'Defeat 100K monsters', '擊敗10萬隻怪物', 'モンスターを10万体討伐'],
  MLUA_ACHIEVEMENTLOGIC_074: ['게임 중 골드 누적 1만 획득', 'Earn a total of 10K Gold in games', '遊戲中累計獲得1萬金幣', 'ゲーム中にゴールドを累計1万獲得'],
  MLUA_ACHIEVEMENTLOGIC_076: ['게임 중 골드 누적 10만 획득', 'Earn a total of 100K Gold in games', '遊戲中累計獲得10萬金幣', 'ゲーム中にゴールドを累計10万獲得'],
  MLUA_ACHIEVEMENTLOGIC_116: ['다이아 누적 2만 개 사용', 'Spend a total of 20K Diamonds', '累計使用2萬鑽石', 'ダイヤを累計2万個使用'],
  MLUA_ACHIEVEMENTLOGIC_118: ['골드 누적 10만 사용', 'Spend a total of 100K Gold', '累計使用10萬金幣', 'ゴールドを累計10万使用'],
  MLUA_ACHIEVEMENTLOGIC_120: ['골드 누적 100만 사용', 'Spend a total of 1M Gold', '累計使用100萬金幣', 'ゴールドを累計100万使用'],
};
function parse(l) {
  const o = []; let c = '', q = false;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (q) { if (ch === '"' && l[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch;
  }
  o.push(c); return o;
}
const cell = (v) => (/[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
const s = fs.readFileSync(P, 'utf8');
const eol = s.includes('\r\n') ? '\r\n' : '\n';
const lines = s.split(eol);
let n = 0;
for (let i = 0; i < lines.length; i++) {
  const key = lines[i].split(',')[0].replace(/^﻿/, '');
  if (!NEW[key]) continue;
  const r = parse(lines[i]);
  const [ko, en, tw, ja] = NEW[key];
  r[1] = ko; r[3] = ko; r[4] = en; r[5] = tw; r[6] = ja;
  lines[i] = r.map(cell).join(',');
  n++;
}
if (n !== Object.keys(NEW).length) throw new Error('matched ' + n);
fs.writeFileSync(P, lines.join(eol), 'utf8');
console.log('updated', n);
