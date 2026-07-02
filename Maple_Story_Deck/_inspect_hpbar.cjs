const { UIBuilder } = require('./.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.load('ui/DefaultGroup.ui');
const entity = b.find('HPBar');
console.log(JSON.stringify(entity, null, 2));
