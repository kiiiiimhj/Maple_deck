const { UIBuilder } = require('./.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.load('ui/DefaultGroup.ui');
const names = ['ExpBar_BG', 'ExpBar_Fill', 'ExpLevel', 'ExpText', 'GoldText', 'HPBar'];
for (const n of names) {
  const id = b.getId(n);
  console.log(n, '->', id);
}
console.log('--- listEntities ---');
console.log(JSON.stringify(b.listEntities(), null, 2));
