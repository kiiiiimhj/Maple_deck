// 번역 키 추가/갱신 — GameText.csv + Docs/Localization/translate_me.csv 둘 다 (2026-09-23)
//   node .builder-work/add_keys.cjs [--apply]
// 아래 KEYS에 [키, ko, en, zh-tw, ja, 위치메모]를 넣는다. 이미 있으면 값만 갱신.
// 칸 순서는 각 파일 헤더에서 찾는다. zh-cn(간체)은 zh-tw에서 자동 변환(locale_lib.cjs).
const L = require("./locale_lib.cjs");
const APPLY = process.argv.includes("--apply");
const KEYS = [
  ["UI_TITLEGROUP_039", "보스 레이드", "Boss Raid", "首領突襲", "ボスレイド", "ui/TitleGroup.ui RaidButton/RaidLabel"],
];

const objs = KEYS.map(([key, ko, en, tw, ja, note]) => ({ key, note, ko, en, "zh-tw": tw, ja }));
for (const file of [L.GAME_CSV, L.TR_CSV]) {
  const r = L.addRows(file, objs, { update: true, apply: APPLY });
  console.log(`${APPLY ? "기록" : "드라이런"} ${file}: 추가 ${r.added} / 갱신 ${r.updated}`);
}
