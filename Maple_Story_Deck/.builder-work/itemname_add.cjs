// 아이템 데이터표(ItemDataTable.csv) 이름 → 번역표 ITEMNAME_<Id> 키 추가 (2026-09-22)
//   node .builder-work/itemname_add.cjs [--apply]
// GameText.csv + Docs/Localization/translate_me.csv 둘 다(칸 순서는 각 헤더를 따른다, zh-cn은 자동).
// 이미 있는 키는 값만 갱신한다. 기존 장비 라인 번역(MLUA_WEAPONTIERDATALOGIC_xxx)과 표기를 맞췄다.
const fs = require("fs");
const APPLY = process.argv.includes("--apply");
// [Id, ko, en, zh-TW, ja]
const ITEMS = [
  [10001, "펜살리르 배틀헬름", "Pensalir Battle Helm", "潘薩利爾戰鬥頭盔", "ペンサリルバトルヘルム"],
  [30001, "펜살리르 배틀글러브", "Pensalir Battle Gloves", "潘薩利爾戰鬥手套", "ペンサリルバトルグローブ"],
  [40001, "펜살리르 배틀부츠", "Pensalir Battle Boots", "潘薩利爾戰鬥長靴", "ペンサリルバトルブーツ"],
  [50001, "펜살리르 배틀케이프", "Pensalir Battle Cape", "潘薩利爾戰鬥披風", "ペンサリルバトルケープ"],
  [20001, "펜살리르 배틀메일", "Pensalir Battle Mail", "潘薩利爾戰鬥鎧甲", "ペンサリルバトルメイル"],
  [80001, "마이스터 숄더", "Meister Shoulder", "麥斯特肩甲", "マイスターショルダー"],
  [60001, "파프니르 머시", "Fafnir Mercy", "法夫納慈悲", "ファフニールマーシー"],
  [70001, "노블 블레이드바인더", "Noble Bladebinder", "高貴縛刃", "ノーブルブレードバインダー"],
  [90001, "에스텔라 이어링", "Estella Earrings", "艾絲特拉耳環", "エステライヤリング"],
  [100001, "가디언 엔젤 펜던트", "Guardian Angel Pendant", "守護天使墜飾", "ガーディアンエンジェルペンダント"],
  [500001, "스태미나", "Stamina", "體力", "スタミナ"],
  [60002, "나무 스태프", "Wooden Staff", "木製法杖", "木の杖"],
  [60003, "워 보우", "War Bow", "戰鬥之弓", "ウォーボウ"],
  [60004, "양손검", "Two-Handed Sword", "雙手劍", "両手剣"],
  [60005, "삼각 자마다르", "Triangular Jamadhar", "三角拳刃", "三角ジャマダハル"],
  [20002, "드라카즈 제복", "Drakaz Uniform", "德拉卡茲制服", "ドラカズの制服"],
  [20003, "기사단 제복", "Knights' Uniform", "騎士團制服", "騎士団の制服"],
  [10002, "신문지 투구", "Newspaper Helmet", "報紙頭盔", "新聞紙のかぶと"],
  [30002, "노가다 목장갑", "Work Gloves", "工作手套", "軍手"],
  [50002, "허름한 망토", "Shabby Cape", "破舊的披風", "みすぼらしいマント"],
  [510001, "무기 강화 주문서", "Weapon Enhancement Scroll", "武器強化卷軸", "武器強化の書"],
  [510002, "갑옷 강화 주문서", "Armor Enhancement Scroll", "鎧甲強化卷軸", "鎧強化の書"],
  [510003, "모자 강화 주문서", "Hat Enhancement Scroll", "帽子強化卷軸", "帽子強化の書"],
  [510004, "장갑 강화 주문서", "Glove Enhancement Scroll", "手套強化卷軸", "手袋強化の書"],
  [510005, "망토 강화 주문서", "Cape Enhancement Scroll", "披風強化卷軸", "マント強化の書"],
  [110002, "무명의 은반지", "Nameless Silver Ring", "無名的銀戒指", "名もなき銀の指輪"],
  [510006, "반지 강화 주문서", "Ring Enhancement Scroll", "戒指強化卷軸", "指輪強化の書"],
];

const { parseCsv } = require("./locale_lib.cjs");

// 데이터표에 있는 Id가 전부 들어갔는지 확인
const ds = parseCsv(fs.readFileSync("RootDesk/MyDesk/Inventory/DataSet/ItemDataTable.csv", "utf8").replace(/^﻿/, ""));
const ids = ds.slice(1).filter((r) => r[0]).map((r) => parseInt(r[0], 10));
const mine = new Set(ITEMS.map((x) => x[0]));
const missing = ids.filter((id) => !mine.has(id));
if (missing.length) { console.log("⛔ 데이터표에 있는데 번역 목록에 없는 Id:", missing.join(",")); process.exit(1); }
console.log(`데이터표 Id ${ids.length}개 전부 대응`);

// 칸 순서는 각 파일 헤더에서 찾고, zh-cn은 zh-tw에서 자동 변환한다(locale_lib.cjs)
const L = require("./locale_lib.cjs");
const objs = ITEMS.map(([id, ko, en, tw, ja]) => ({ key: "ITEMNAME_" + id, note: "RootDesk/MyDesk/Inventory/DataSet/ItemDataTable.csv Id=" + id, ko, en, "zh-tw": tw, ja }));
for (const file of [L.GAME_CSV, L.TR_CSV]) {
  const r = L.addRows(file, objs, { update: true, apply: APPLY });
  console.log(`${APPLY ? "기록" : "드라이런"} ${file}: 추가 ${r.added} / 갱신 ${r.updated} (헤더 ${r.head.join("|")})`);
}
