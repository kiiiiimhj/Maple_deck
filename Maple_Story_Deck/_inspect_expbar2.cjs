const { UIBuilder } = require('./.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.load('ui/DefaultGroup.ui');
const paths = [
  '/ui/DefaultGroup/ExpBar_BG',
  '/ui/DefaultGroup/ExpBar_BG/ExpBar_Fill',
  '/ui/DefaultGroup/ExpBar_BG/ExpLevel',
  '/ui/DefaultGroup/ExpBar_BG/ExpText',
  '/ui/DefaultGroup/GoldText',
];
for (const p of paths) {
  const e = b.find(p);
  console.log('=== ' + p + ' ===');
  console.log(JSON.stringify(e, null, 2));
}
