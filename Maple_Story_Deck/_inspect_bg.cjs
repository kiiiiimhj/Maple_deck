const { UIBuilder } = require('./.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.load('ui/DefaultGroup.ui');
for (const p of ['/ui/DefaultGroup/ExpBar_BG', '/ui/DefaultGroup/ExpBar_BG/ExpLevel', '/ui/DefaultGroup/ExpBar_BG/ExpText']) {
  const e = b.find(p);
  console.log('=== ' + p + ' ===');
  console.log('displayOrder:', e.jsonString.displayOrder);
  const comps = e.jsonString['@components'];
  for (const c of comps) {
    if (c['@type'].includes('SpriteGUIRenderer')) {
      console.log('  Sprite: SortingLayer=' + c.SortingLayer + ' OrderInLayer=' + c.OrderInLayer + ' Color=' + JSON.stringify(c.Color) + ' FillAmount=' + c.FillAmount + ' RectSize check via UITransform below');
    }
  }
  const t = comps.find(c => c['@type'].includes('UITransform'));
  console.log('  RectSize:', JSON.stringify(t.RectSize), 'Anchors:', JSON.stringify(t.AnchorsMin), JSON.stringify(t.AnchorsMax), 'anchoredPosition:', JSON.stringify(t.anchoredPosition));
}
