const { UIBuilder } = require('./.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const b = UIBuilder.load('ui/DefaultGroup.ui');

// For stretch anchors (0,0)-(1,1), the engine recomputes OffsetMin/OffsetMax from
// RectSize + Pivot + anchoredPosition at init time (NOT the stored Offset values).
// With Pivot=(0.5,0.5) and anchoredPosition=(0,0), RectSize must equal the parent's
// RectSize (ExpBar_BG: 1200x38) to produce Offset=0,0 -> rect spans the full parent.
b.patchComponent('/ui/DefaultGroup/ExpBar_BG/ExpBar_Fill', 'MOD.Core.UITransformComponent', {
  RectSize: { x: 1200, y: 38 },
  OffsetMin: { x: 0, y: 0 },
  OffsetMax: { x: 0, y: 0 },
  anchoredPosition: { x: 0, y: 0 },
});

b.write('ui/DefaultGroup.ui');
console.log('ExpBar_Fill RectSize set to 1200x38 (matches ExpBar_BG)');
