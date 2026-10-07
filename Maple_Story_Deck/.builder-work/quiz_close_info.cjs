const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const ref = UIBuilder.load('ui/Ep4BalloonPuzzleGroup' + '.ui');
const q = UIBuilder.load('ui/Ep4EasterEggGroup' + '.ui');
const show = (b, p) => {
  const tr = b.getComponent(p, 'MOD.Core.UITransformComponent');
  const t = b.getComponent(p, 'MOD.Core.TextGUIRendererComponent');
  console.log('==', p);
  console.log(' tr', JSON.stringify({ a0: tr.AnchorsMin, a1: tr.AnchorsMax, pos: tr.anchoredPosition, size: tr.RectSize, pivot: tr.Pivot }));
  if (t) { const c = { ...t }; delete c.Text; console.log(' text', JSON.stringify(c)); }
};
show(ref, 'Panel'); show(ref, 'Panel/Close');
show(q, 'QuizPanel'); show(q, 'QuizPanel/BtnClose');
for (const e of q.listEntities()) if (e.path.startsWith('/ui/Ep4EasterEggGroup/QuizPanel')) console.log(e.path, JSON.stringify(e.pos), JSON.stringify(e.size));
