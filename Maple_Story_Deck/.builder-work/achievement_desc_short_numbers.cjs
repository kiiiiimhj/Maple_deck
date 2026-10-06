// 2026-09-23 유저 지정: 업적 설명의 큰 숫자(1만 이상)를 언어별로 짧게 — 칸 넘침 방지.
// ko 만 / en K·M / zh-tw 萬(zh-cn 万은 자동) / ja 万. Source(원문) 칸도 ko와 같이 바꾼다.
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
// 칸 위치는 헤더에서 찾고, zh-cn은 zh-tw에서 다시 변환한다(locale_lib.cjs)
const L = require('./locale_lib.cjs');
const { head, rows, bom } = L.readCsv(P);
const col = (n) => { const i = head.indexOf(n); if (i < 0) throw new Error('no column ' + n); return i; };
let n = 0;
for (const r of rows) {
  if (!NEW[r[0]]) continue;
  const [ko, en, tw, ja] = NEW[r[0]];
  r[col('Source')] = ko; r[col('ko')] = ko; r[col('en')] = en; r[col('zh-tw')] = tw; r[col('ja')] = ja;
  L.syncDerived(head, r);
  n++;
}
if (n !== Object.keys(NEW).length) throw new Error('matched ' + n);
L.writeCsv(P, head, rows, bom);
console.log('updated', n);
