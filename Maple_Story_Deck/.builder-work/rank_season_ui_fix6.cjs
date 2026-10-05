// 2026-10-06 유저가 에디터에서 고친 값을 나머지에 똑같이 적용:
//   MedalRow1/Reward/Icon (-25,2) 56x46 → 모든 줄(RowTemplate·MedalRow2·3·MyRankRow) 같은 값
//   MyRankRow/ClaimButton 150x55(유저 값 유지) → 안쪽 Label을 버튼 안에 들어가게 140x48
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/TitleGroup' + '.u' + 'i';
const b = UIBuilder.read(P);
const BD = 'RankPanel/Board';
const src = b.getComponent(`${BD}/MedalRow1/Reward/Icon`, 'MOD.Core.UITransformComponent');
const pick = (t) => ({ anchoredPosition: t.anchoredPosition, RectSize: t.RectSize, OffsetMin: t.OffsetMin, OffsetMax: t.OffsetMax });
for (const row of [`${BD}/ListArea/RowTemplate`, `${BD}/MedalRow2`, `${BD}/MedalRow3`, `${BD}/MyRankRow`]) {
  b.patchComponent(`${row}/Reward/Icon`, 'MOD.Core.UITransformComponent', pick(src));
}
b.patchComponent(`${BD}/MyRankRow/ClaimButton/Label`, 'MOD.Core.UITransformComponent', {
  anchoredPosition: { x: 0, y: 0 }, RectSize: { x: 140, y: 48 }, OffsetMin: { x: -70, y: -24 }, OffsetMax: { x: 70, y: 24 },
});
try { b.write(P); } catch (e) { console.log('lint (기존 L013):', String(e.message).split('\n')[0]); }
const a = UIBuilder.read(P);
for (const row of ['ListArea/RowTemplate', 'MedalRow1', 'MedalRow2', 'MedalRow3', 'MyRankRow']) {
  const t = a.getComponent(`/ui/TitleGroup/${BD}/${row}/Reward/Icon`, 'MOD.Core.UITransformComponent');
  console.log(row.padEnd(22), JSON.stringify(t.anchoredPosition), JSON.stringify(t.RectSize));
}
const my = a.getComponent(`/ui/TitleGroup/${BD}/MyRankRow`, 'MOD.Core.UITransformComponent');
const cb = a.getComponent(`/ui/TitleGroup/${BD}/MyRankRow/ClaimButton`, 'MOD.Core.UITransformComponent');
console.log('MyRankRow', JSON.stringify(my.RectSize), 'ClaimButton', JSON.stringify(cb.RectSize));
