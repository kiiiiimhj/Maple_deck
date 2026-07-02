const { UIBuilder } = require('./.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const DEFAULT_SPRITE_RUID = '4fea64a3307cda641809ad8be0d4890b';

const b = UIBuilder.load('ui/DefaultGroup.ui');

// Background: dark track
b.patchComponent('HPBar', 'MOD.Core.SpriteGUIRendererComponent', {
  Color: { r: 0.15, g: 0.15, b: 0.15, a: 0.85 },
});

// Fill rect: green bar that shrinks with Value
b.patchComponent('HPBar', 'MOD.Core.SliderComponent', {
  FillRectImageRUID: { DataId: DEFAULT_SPRITE_RUID },
  FillRectColor: { r: 0.2, g: 0.85, b: 0.3, a: 1.0 },
  FillRectPadding: { left: 2, right: 2, top: 2, bottom: 2 },
});

b.write('ui/DefaultGroup.ui');
console.log('HPBar fill visuals patched');
