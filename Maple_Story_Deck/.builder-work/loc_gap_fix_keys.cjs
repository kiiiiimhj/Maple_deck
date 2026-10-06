// 2026-10-05 번역 전수조사에서 나온 누락 4건용 키 추가 (CRLF·BOM 유지, 이미 있는 키는 건너뜀)
//   node .builder-work/loc_gap_fix_keys.cjs
const P = 'RootDesk/MyDesk/Localization/GameText.csv';
const rows = [
  // Key, Source, Note, ko, en, zh-tw, ja
  ['FMT_GAMEOVERUI_002', '{0}점', 'RootDesk/MyDesk/UI/GameOverUI.mlua SetSlotScore', '{0}점', '{0} pts', '{0}分', '{0}点'],
  ['UI_GAMEOVERGROUP_010', '1등', '/ui/GameOverGroup/GameOverBack/GameOverPanel/ScoreBox/TopDps/Rank1/RankLabel', '1등', '1st', '第1名', '1位'],
  ['UI_GAMEOVERGROUP_011', '2등', '/ui/GameOverGroup/GameOverBack/GameOverPanel/ScoreBox/TopDps/Rank2/RankLabel', '2등', '2nd', '第2名', '2位'],
  ['UI_GAMEOVERGROUP_012', '3등', '/ui/GameOverGroup/GameOverBack/GameOverPanel/ScoreBox/TopDps/Rank3/RankLabel', '3등', '3rd', '第3名', '3位'],
  ...Array.from({ length: 10 }, (_, i) => {
    const n = i + 1;
    return [`MAP_EP2MAP3_${String(n).padStart(3, '0')}`, `존${n}`, `map/ep2_map3.map /maps/ep2_map3/ZoneLabel${n}`, `존${n}`, `Zone ${n}`, `區域${n}`, `ゾーン${n}`];
  }),
  ['MAP_EP2MAP2ESTERMAP1_001', '다시하기\n(무료)', 'map/ep2_map2_estermap_1.map /maps/ep2_map2_estermap_1/GalleryRetryButton/Label', '다시하기\n(무료)', 'Retry\n(Free)', '重試\n(免費)', 'リトライ\n(無料)'],
];
// 칸 순서는 헤더에서 찾고, zh-cn은 zh-tw에서 자동 변환한다(locale_lib.cjs)
const r = require('./locale_lib.cjs').addRows(P, rows.map(([key, source, note, ko, en, tw, ja]) => ({ key, source, note, ko, en, 'zh-tw': tw, ja })));
console.log('added', r.added, 'skip', r.skipped);
