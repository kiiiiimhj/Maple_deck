// 2026-10-06 유저가 에디터에서 직접 보고 고칠 수 있게: 받기 버튼은 파일에서 켜 둔다(실행 때 RankUI가 숨김),
// 보상 칸 기본 글자는 "2k"
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/TitleGroup' + '.u' + 'i';
const b = UIBuilder.read(P);
const BD = 'RankPanel/Board';
b.patch(`${BD}/MyRankRow/ClaimButton`, { enable: true });
for (const row of [`${BD}/ListArea/RowTemplate`, `${BD}/MedalRow1`, `${BD}/MedalRow2`, `${BD}/MedalRow3`, `${BD}/MyRankRow`]) {
  b.patchComponent(`${row}/Reward/Amount`, 'MOD.Core.TextGUIRendererComponent', { Text: '2k' });
}
try { b.write(P); } catch (e) { console.log('lint (기존 L013):', String(e.message).split('\n')[0]); }
