const { UIBuilder } = require('./.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const b = UIBuilder.load('ui/DefaultGroup.ui');

// Initial state: Exp=0 / ExpNeeded=100 -> ratio 0, fill should start empty
b.patchComponent('/ui/DefaultGroup/ExpBar_BG/ExpBar_Fill', 'MOD.Core.SpriteGUIRendererComponent', {
  FillAmount: 0,
});

b.write('ui/DefaultGroup.ui');
console.log('ExpBar_Fill initial FillAmount set to 0');
