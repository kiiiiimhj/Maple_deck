const { UIBuilder } = require('./.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const b = UIBuilder.load('ui/DefaultGroup.ui');

// ExpBar_Fill has stretch anchors (0,0)-(1,1) but OffsetMin={550,-31}/OffsetMax={-550,31}
// which collapses the rect to a centered 100x100 box instead of spanning the
// parent (ExpBar_BG, 1200x38). Zero out the offsets so it spans the full parent rect.
b.patchComponent('/ui/DefaultGroup/ExpBar_BG/ExpBar_Fill', 'MOD.Core.UITransformComponent', {
  OffsetMin: { x: 0, y: 0 },
  OffsetMax: { x: 0, y: 0 },
});

b.write('ui/DefaultGroup.ui');
console.log('ExpBar_Fill OffsetMin/Max set to 0,0 (now spans ExpBar_BG full rect)');
