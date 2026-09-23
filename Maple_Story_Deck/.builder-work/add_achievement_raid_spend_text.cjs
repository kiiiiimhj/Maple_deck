// 2026-09-23: 레이드 업적 5 + 재화 사용 업적 5 번역 행(MLUA_ACHIEVEMENTLOGIC_101~120)을 GameText.csv에 추가.
// 컬럼: Key,Source,Note,ko,en,zh-tw,ja — 기존 줄바꿈(CRLF)·BOM 유지, 이미 있는 키는 건너뛴다
const fs = require('fs');
const P = 'RootDesk/MyDesk/Localization/GameText.csv';
const NOTE = 'RootDesk/MyDesk/Achievement/AchievementLogic.mlua';
const rows = [
  ['101', '보스 레이드 도전', 'Raid Challenger', '突襲挑戰者', 'レイド挑戦者'],
  ['102', '보스 레이드 1회 입장', 'Enter the Boss Raid once', '進入首領突襲1次', 'ボスレイドに1回入場'],
  ['103', '첫 레이드 보상', 'First Raid Reward', '首次突襲獎勵', '初めてのレイド報酬'],
  ['104', '레이드 주간 보상 1회 수령', 'Claim the weekly Raid reward once', '領取突襲每週獎勵1次', 'レイド週間報酬を1回受け取る'],
  ['105', '레이드 단골', 'Raid Regular', '突襲常客', 'レイドの常連'],
  ['106', '레이드 주간 보상 4회 수령', 'Claim the weekly Raid reward 4 times', '領取突襲每週獎勵4次', 'レイド週間報酬を4回受け取る'],
  ['107', '레이드 정예', 'Raid Elite', '突襲精英', 'レイドの精鋭'],
  ['108', '레이드 C등급 이상 달성', 'Reach Raid grade C or higher', '突襲達成C等級以上', 'レイドでCランク以上を達成'],
  ['109', '레이드 정복자', 'Raid Conqueror', '突襲征服者', 'レイド征服者'],
  ['110', '레이드 S등급 달성', 'Reach Raid grade S', '突襲達成S等級', 'レイドでSランクを達成'],
  ['111', '다이아 소비자', 'Diamond Spender', '鑽石消費者', 'ダイヤ消費者'],
  ['112', '다이아 누적 1,000개 사용', 'Spend a total of 1,000 Diamonds', '累計使用1,000鑽石', 'ダイヤを累計1,000個使用'],
  ['113', '다이아 큰손', 'Diamond Big Spender', '鑽石大戶', 'ダイヤの大口'],
  ['114', '다이아 누적 5,000개 사용', 'Spend a total of 5,000 Diamonds', '累計使用5,000鑽石', 'ダイヤを累計5,000個使用'],
  ['115', '다이아 재벌', 'Diamond Magnate', '鑽石財閥', 'ダイヤ財閥'],
  ['116', '다이아 누적 20,000개 사용', 'Spend a total of 20,000 Diamonds', '累計使用20,000鑽石', 'ダイヤを累計20,000個使用'],
  ['117', '씀씀이 좋은 모험가', 'Generous Adventurer', '出手大方的冒險家', '気前のいい冒険者'],
  ['118', '골드 누적 100,000 사용', 'Spend a total of 100,000 Gold', '累計使用100,000金幣', 'ゴールドを累計100,000使用'],
  ['119', '골드 큰손', 'Gold Big Spender', '金幣大戶', 'ゴールドの大口'],
  ['120', '골드 누적 1,000,000 사용', 'Spend a total of 1,000,000 Gold', '累計使用1,000,000金幣', 'ゴールドを累計1,000,000使用'],
];
const cell = (v) => (/[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
let s = fs.readFileSync(P, 'utf8');
const eol = s.includes('\r\n') ? '\r\n' : '\n';
if (!s.endsWith(eol)) s += eol;
let added = 0;
for (const [n, ko, en, tw, ja] of rows) {
  const key = 'MLUA_ACHIEVEMENTLOGIC_' + n;
  if (s.includes(eol + key + ',')) { console.log('skip', key); continue; }
  s += [key, ko, NOTE, ko, en, tw, ja].map(cell).join(',') + eol;
  added++;
}
fs.writeFileSync(P, s, 'utf8');
console.log('added', added);
