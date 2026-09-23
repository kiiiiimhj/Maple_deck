// 2026-09-23: 인벤 아바타 "능력치" 버튼 + 능력치 팝업 문구(ko/en/zh-tw/ja). 이미 있는 키는 건너뛴다
const fs = require('fs');
const P = 'RootDesk/MyDesk/Localization/GameText.csv';
const NOTE = 'RootDesk/MyDesk/UIEquippedGearPanel.mlua (능력치 팝업)';
const rows = [
  ['MLUA_UIEQUIPPEDGEARPANEL_010', '능력치', 'Stats', '能力值', 'ステータス'],
  ['MLUA_UIEQUIPPEDGEARPANEL_011', '장비 능력치', 'Gear Stats', '裝備能力值', '装備ステータス'],
  ['MLUA_UIEQUIPPEDGEARPANEL_012', '공격력', 'ATK', '攻擊力', '攻撃力'],
  ['MLUA_UIEQUIPPEDGEARPANEL_013', '최대 체력', 'Max HP', '最大HP', '最大HP'],
  ['MLUA_UIEQUIPPEDGEARPANEL_014', '공격력 증가', 'ATK Bonus', '攻擊力增加', '攻撃力アップ'],
  ['MLUA_UIEQUIPPEDGEARPANEL_015', '기본 공격 피해', 'Basic Attack DMG', '普通攻擊傷害', '通常攻撃ダメージ'],
  ['MLUA_UIEQUIPPEDGEARPANEL_016', '치명타 확률', 'Crit Rate', '爆擊機率', 'クリティカル率'],
  ['MLUA_UIEQUIPPEDGEARPANEL_017', '치명타 피해', 'Crit DMG', '爆擊傷害', 'クリティカルダメージ'],
  ['MLUA_UIEQUIPPEDGEARPANEL_018', '스킬 쿨타임 감소', 'Skill Cooldown', '技能冷卻減少', 'スキルクールタイム減少'],
  ['MLUA_UIEQUIPPEDGEARPANEL_019', '받는 피해 감소', 'DMG Reduction', '受到傷害減少', '被ダメージ減少'],
  ['MLUA_UIEQUIPPEDGEARPANEL_020', '엘리트·보스 피해', 'Elite/Boss DMG', '菁英·首領傷害', 'エリート・ボスダメージ'],
];
const cell = (v) => (/[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
let s = fs.readFileSync(P, 'utf8');
const eol = s.includes('\r\n') ? '\r\n' : '\n';
if (!s.endsWith(eol)) s += eol;
let added = 0;
for (const [key, ko, en, tw, ja] of rows) {
  if (s.includes(eol + key + ',')) { console.log('skip', key); continue; }
  s += [key, ko, NOTE, ko, en, tw, ja].map(cell).join(',') + eol;
  added++;
}
fs.writeFileSync(P, s, 'utf8');
console.log('added', added);
