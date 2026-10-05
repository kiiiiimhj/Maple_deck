// 2026-10-05 에피1 map18 직업 O/X 퀴즈 문제 3개(정답: Q1 O / Q2 X / Q3 O — Map18JobQuizLogic.Answers)
//   node .builder-work/map18_quiz_keys.cjs
const fs = require('fs');
const P = 'RootDesk/MyDesk/Localization/GameText.csv';
const note = 'RootDesk/MyDesk/Puzzle/Map18JobQuizLogic.mlua';
const rows = [
  ['MAP18_QUIZ_Q1', '모험가 전사 직업에는 히어로, 팔라딘, 다크나이트가 있다.',
    'The Explorer Warrior jobs include Hero, Paladin, and Dark Knight.',
    '冒險家劍士的職業有英雄、聖騎士和黑騎士。',
    '冒険家の戦士職にはヒーロー、パラディン、ダークナイトがある。'],
  ['MAP18_QUIZ_Q2', '궁수는 아대를 끼고 표창을 던져서 싸운다.',
    'Bowmen fight by wearing claws and throwing stars.',
    '弓箭手戴著拳套投擲飛鏢戰鬥。',
    '弓使いはクローを装備して手裏剣を投げて戦う。'],
  ['MAP18_QUIZ_Q3', '시그너스 기사단의 윈드브레이커는 활을 쓰는 궁수 직업이다.',
    'The Cygnus Knights\' Wind Archer is an archer job that uses a bow.',
    '皇家騎士團的破風使者是使用弓的弓箭手職業。',
    'シグナス騎士団のウィンドシューターは弓を使う弓使い職である。'],
];
const cell = (v) => (/[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
let text = fs.readFileSync(P, 'utf8');
const existing = new Set(text.split(/\r\n/).map((l) => l.replace(/^﻿/, '').split(',')[0]));
if (!text.endsWith('\r\n')) text += '\r\n';
let added = 0;
for (const [key, ko, en, zh, ja] of rows) {
  if (existing.has(key)) { console.log('skip', key); continue; }
  text += [key, ko, note, ko, en, zh, ja].map(cell).join(',') + '\r\n';
  added++;
}
fs.writeFileSync(P, text, 'utf8');
console.log('added', added);
