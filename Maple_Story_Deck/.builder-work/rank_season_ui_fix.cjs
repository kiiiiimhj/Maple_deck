// 2026-10-06 시즌 보상 다이아 아이콘 위치 보정 — PreserveSprite=1(AspectOnly)은 스프라이트 피벗 기준이라
// 다이아(피벗이 그림 밖)가 위로 뜬다 → None + 원본 비율(24:20) 크기로. 숫자 글씨는 24→27
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/TitleGroup' + '.u' + 'i';
const b = UIBuilder.read(P);
const BD = 'RankPanel/Board';
function place(path, x, y, w, h) {
  b.patchComponent(path, 'MOD.Core.UITransformComponent', {
    anchoredPosition: { x, y }, RectSize: { x: w, y: h },
    OffsetMin: { x: x - w / 2, y: y - h / 2 }, OffsetMax: { x: x + w / 2, y: y + h / 2 },
  });
}
const rows = [`${BD}/ListArea/RowTemplate`, `${BD}/MedalRow1`, `${BD}/MedalRow2`, `${BD}/MedalRow3`, `${BD}/MyRankRow`];
for (const row of rows) {
  b.patchComponent(`${row}/Reward/Icon`, 'MOD.Core.SpriteGUIRendererComponent', { PreserveSprite: 0 });
  place(`${row}/Reward/Icon`, 0, 8, 50, 42);
  place(`${row}/Reward/Amount`, 0, -16, 160, 34);
  b.patchComponent(`${row}/Reward/Amount`, 'MOD.Core.TextGUIRendererComponent', { FontSize: 27, MaxSize: 27 });
}
b.patchComponent('RankPanel/SeasonClaim/Icon', 'MOD.Core.SpriteGUIRendererComponent', { PreserveSprite: 0 });
place('RankPanel/SeasonClaim/Icon', -105, 8, 54, 45);
place('RankPanel/SeasonClaim/Amount', -105, -18, 130, 34);
b.patchComponent('RankPanel/SeasonClaim/Amount', 'MOD.Core.TextGUIRendererComponent', { FontSize: 26, MaxSize: 26 });
try { b.write(P); } catch (e) { console.log('lint (기존 L013):', String(e.message).split('\n')[0]); }
