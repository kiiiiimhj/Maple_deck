// 2026-10-05 번역 누락 4건 중 .ui / .map 정적 텍스트를 키로 전환
//   node .builder-work/loc_gap_fix_apply.cjs
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const { MapBuilder } = require('../.claude/skills/msw-general/scripts/map/msw_map_builder.cjs');

// ── GameOverGroup 순위 라벨 1등/2등/3등 ──
const uiPath = 'ui/GameOverGroup.ui';
const ui = UIBuilder.read(uiPath);
for (let i = 1; i <= 3; i++) {
  const p = `GameOverBack/GameOverPanel/ScoreBox/TopDps/Rank${i}/RankLabel`;
  ui.patchComponent(p, 'MOD.Core.TextGUIRendererComponent', { Text: `UI_GAMEOVERGROUP_0${9 + i}`, IsLocalizationKey: true });
  console.log(uiPath, p, '->', ui.getComponent(p, 'MOD.Core.TextGUIRendererComponent').Text);
}
ui.write(uiPath);

// ── ep2_map3 존1~존10 ──
const m3Path = 'map/ep2_map3.map';
const m3 = MapBuilder.read(m3Path);
for (let n = 1; n <= 10; n++) {
  m3.patchComponent(`ZoneLabel${n}`, 'MOD.Core.TextRendererComponent', { Text: `MAP_EP2MAP3_${String(n).padStart(3, '0')}`, IsLocalizationKey: true });
}
m3.write(m3Path);
console.log(m3Path, 'ZoneLabel1 ->', m3.component('ZoneLabel1', 'MOD.Core.TextRendererComponent').Text);

// ── ep2_map2_estermap_1 다시하기(무료) ──
const emPath = 'map/ep2_map2_estermap_1.map';
const em = MapBuilder.read(emPath);
em.patchComponent('GalleryRetryButton/Label', 'MOD.Core.TextRendererComponent', { Text: 'MAP_EP2MAP2ESTERMAP1_001', IsLocalizationKey: true });
em.write(emPath);
console.log(emPath, 'Label ->', em.component('GalleryRetryButton/Label', 'MOD.Core.TextRendererComponent').Text);
