// 베놈 스피어(241) 2차 문구(유저 정정 2026-10-04) — "표창" 표현 없이
// 칸 순서는 헤더에서 찾고, zh-cn은 zh-tw에서 자동 변환한다(locale_lib.cjs). 있는 키는 덮어쓴다.
const L = require('./locale_lib.cjs');
const lp = 'RootDesk/MyDesk/Localization/GameText.csv';
const S = 'RootDesk/MyDesk/Card/CardManager.mlua';
const R = 'RootDesk/MyDesk/Card/CardRegistry.mlua';
const rows = [];
function set(key, note, ko, en, tw, ja) { rows.push({ key, note, ko, en, 'zh-tw': tw, ja }); }
set('MLUA_CARDREGISTRY_120', R, '조합,중독대상,속박', 'Fusion,Poisoned Targets,Root', '組合,中毒目標,束縛', '組み合わせ,毒対象,拘束');
set('MLUA_CARDMANAGER_607', S, '해금! (대미지 200, 중독된 적 전부, 속박 2초, 1초 뒤 추가타 30%)', 'Unlocked! (Damage 200, all poisoned enemies, Root 2s, follow-up 30% after 1s)', '解鎖！(傷害 200，所有中毒的敵人，束縛 2秒，1秒後追擊 30%)', '解放！(ダメージ 200、毒状態の敵全員、拘束 2秒、1秒後に追撃 30%)');
set('MLUA_CARDMANAGER_608', S, '피해량 +20, 속박 +1초, 추가타 +10%', 'Damage +20, Root +1s, Follow-up +10%', '傷害 +20，束縛 +1秒，追擊 +10%', 'ダメージ +20、拘束 +1秒、追撃 +10%');
set('MLUA_CARDMANAGER_609', S, '피해량 +20, 추가타 +10%', 'Damage +20, Follow-up +10%', '傷害 +20，追擊 +10%', 'ダメージ +20、追撃 +10%');
set('FMT_CARDMANAGER_123', S, '중독된 적 전부  |  속박 {0}초  |  1초 뒤 추가타 {1}%', 'All poisoned enemies  |  Root {0}s  |  Follow-up {1}% after 1s', '所有中毒的敵人  |  束縛 {0}秒  |  1秒後追擊 {1}%', '毒状態の敵全員  |  拘束 {0}秒  |  1秒後に追撃 {1}%');
const r = L.addRows(lp, rows, { update: true });
console.log('text OK', r);
