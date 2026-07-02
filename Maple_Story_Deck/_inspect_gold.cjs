const { UIBuilder } = require('./.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.load('ui/DefaultGroup.ui');
const e = b.find('/ui/DefaultGroup/GoldText');
console.log('id:', e.id);
const comps = e.jsonString['@components'];
for (const c of comps) {
  if (c['@type'].includes('Text')) {
    console.log('Text:', JSON.stringify(c.Text), 'FontColor:', JSON.stringify(c.FontColor));
  }
}
