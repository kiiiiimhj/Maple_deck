const { UIBuilder } = require('./.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.load('ui/DefaultGroup.ui');
const e = b.find('/ui/DefaultGroup/ExpBar_BG/ExpBar_Fill');
console.log(JSON.stringify(e, null, 2));
