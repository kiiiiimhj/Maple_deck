// 2026-09-23: 자쿰 레이드 / 목걸이 라인 번역 행을 GameText.csv에 추가(ko/en/zh-tw/ja).
// 컬럼: Key,Source,Note,ko,en,zh-tw,ja — 기존 줄바꿈(CRLF)·BOM 유지, 이미 있는 키는 건너뛴다
const fs = require('fs');
const P = 'RootDesk/MyDesk/Localization/GameText.csv';
const WT = 'RootDesk/MyDesk/Inventory/Core/Logic/WeaponTierDataLogic.mlua';
const rows = [
  // 목걸이 등급별 이름(노멀→레전더리)
  ['MLUA_WEAPONTIERDATALOGIC_165', WT, '무명의 은 펜던트', 'Nameless Silver Pendant', '無名的銀墜飾', '名もなき銀のペンダント'],
  ['MLUA_WEAPONTIERDATALOGIC_166', WT, '푸른 구슬 목걸이', 'Azure Orb Necklace', '蔚藍寶珠項鍊', '蒼玉のネックレス'],
  ['MLUA_WEAPONTIERDATALOGIC_167', WT, '황금 로켓', 'Golden Locket', '黃金墜盒', '黄金のロケット'],
  ['MLUA_WEAPONTIERDATALOGIC_168', WT, '무지개 심장', 'Rainbow Heart', '彩虹之心', '虹の心臓'],
  ['MLUA_WEAPONTIERDATALOGIC_169', WT, '밤의 자수정', 'Amethyst of Night', '暗夜紫晶', '夜のアメジスト'],
  ['MLUA_WEAPONTIERDATALOGIC_170', WT, '화염룡의 심장', 'Heart of the Flame Dragon', '炎龍之心', '炎竜の心臓'],
  // 목걸이 등급별 설명
  ['MLUA_WEAPONTIERDATALOGIC_171', WT, '누군가의 목에 걸려 있다 버려진 평범한 펜던트.', 'An ordinary pendant someone once wore, then threw away.', '曾掛在某人頸上、後來被丟棄的普通墜飾。', '誰かの首に掛けられ、やがて捨てられた平凡なペンダント。'],
  ['MLUA_WEAPONTIERDATALOGIC_172', WT, '구슬 속에서 잔잔한 물결이 일렁인다.', 'Gentle ripples sway inside the orb.', '寶珠之中泛著平靜的漣漪。', '玉の中で静かな波が揺れている。'],
  ['MLUA_WEAPONTIERDATALOGIC_173', WT, '열어 보면 누군가의 오래된 초상이 들어 있다.', "Open it, and an old portrait of someone looks back.", '打開一看，裡面是某人的舊肖像。', '開けると、誰かの古い肖像が入っている。'],
  ['MLUA_WEAPONTIERDATALOGIC_174', WT, '빛을 받을 때마다 다른 색으로 두근거린다.', 'It throbs in a different color with every glint of light.', '每當沐浴光芒，便以不同的顏色悸動。', '光を受けるたびに違う色で脈打つ。'],
  ['MLUA_WEAPONTIERDATALOGIC_175', WT, '달이 없는 밤에만 은은하게 빛난다.', 'It glows softly only on moonless nights.', '只在無月之夜散發幽微的光芒。', '月のない夜にだけ、ほのかに光る。'],
  ['MLUA_WEAPONTIERDATALOGIC_176', WT, '아직도 식지 않은 열기가 손끝을 데운다.', 'Its heat has never cooled, and it still warms your fingertips.', '至今未散的熱度溫暖著指尖。', 'いまだ冷めない熱が指先を温める。'],
  // 아이템 이름(ItemStruct.GetItemName이 ITEMNAME_<Id>로 찾는다)
  ['ITEMNAME_100002', 'RootDesk/MyDesk/Inventory/DataSet/ItemDataTable.csv Id=100002', '무명의 은 펜던트', 'Nameless Silver Pendant', '無名的銀墜飾', '名もなき銀のペンダント'],
  ['ITEMNAME_510007', 'RootDesk/MyDesk/Inventory/DataSet/ItemDataTable.csv Id=510007', '목걸이 강화 주문서', 'Necklace Enhancement Scroll', '項鍊強化卷軸', 'ネックレス強化の書'],
  // 자쿰 레이드 수령 알림(RaidLogic.NotifyClaimResult)
  ['FMT_RAIDLOGIC_003', 'RootDesk/MyDesk/Raid/RaidLogic.mlua NotifyClaimResult', '주간 레이드 {0} 등급 보상 + 목걸이 강화 주문서 {1}장을 받았어요!', 'You received the Weekly Raid Grade {0} reward + {1} Necklace Enhancement Scroll(s)!', '已獲得每週突襲 {0} 等級獎勵 + 項鍊強化卷軸 {1}張！', '週間レイド{0}等級報酬 + ネックレス強化の書{1}枚を受け取りました！'],
  ['FMT_RAIDLOGIC_004', 'RootDesk/MyDesk/Raid/RaidLogic.mlua NotifyClaimResult', '주간 레이드 {0} 등급 보상 + 다이아 {1} + 목걸이 강화 주문서 {2}장을 받았어요!', 'You received the Weekly Raid Grade {0} reward + {1} Diamonds + {2} Necklace Enhancement Scroll(s)!', '已獲得每週突襲 {0} 等級獎勵 + 鑽石 {1} + 項鍊強化卷軸 {2}張！', '週間レイド{0}等級報酬 + ダイヤ{1} + ネックレス強化の書{2}枚を受け取りました！'],
  // 레이드 보상표 헤더(자쿰일 때 "반지" 대신)
  ['MLUA_RAIDUI_005', 'RootDesk/MyDesk/Raid/RaidUI.mlua (보상표 헤더, 자쿰)', '목걸이', 'Necklace', '項鍊', 'ネックレス'],
];
const cell = (v) => (/[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
let s = fs.readFileSync(P, 'utf8');
const eol = s.includes('\r\n') ? '\r\n' : '\n';
if (!s.endsWith(eol)) s += eol;
let added = 0;
for (const [key, note, ko, en, tw, ja] of rows) {
  if (s.includes(eol + key + ',')) { console.log('skip', key); continue; }
  s += [key, ko, note, ko, en, tw, ja].map(cell).join(',') + eol;
  added++;
}
fs.writeFileSync(P, s, 'utf8');
console.log('added', added);
