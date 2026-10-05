// 2026-10-06 유저 지정:
//   · 시즌 기간 판(SeasonText)의 아랫변을 무제한/타임어택 탭 아랫변(Tabs y402 - 높이92/2 = 356)에 맞춘다 — 기존 360 → 356(4 내림)
//   · 보상 칸 기본 글자 "2k" → "x2k"(실행 중에는 RankUI.SetRewardCell이 "x" .. 수량으로 다시 쓴다)
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/TitleGroup' + '.u' + 'i';
const b = UIBuilder.read(P);
const BD = 'RankPanel/Board';
const tabs = b.getComponent('RankPanel/Tabs', 'MOD.Core.UITransformComponent');
const tab = b.getComponent('RankPanel/Tabs/TabUnlimited', 'MOD.Core.UITransformComponent');
const tabBottom = tabs.anchoredPosition.y + tab.anchoredPosition.y - tab.RectSize.y / 2;
const st = b.getComponent('RankPanel/SeasonText', 'MOD.Core.UITransformComponent');
const x = st.anchoredPosition.x, w = st.RectSize.x, h = st.RectSize.y;
const y = tabBottom + h / 2;
b.patchComponent('RankPanel/SeasonText', 'MOD.Core.UITransformComponent', {
  anchoredPosition: { x, y }, Position: { x, y, z: 0 },
  OffsetMin: { x: x - w / 2, y: y - h / 2 }, OffsetMax: { x: x + w / 2, y: y + h / 2 },
});
for (const row of [`${BD}/ListArea/RowTemplate`, `${BD}/MedalRow1`, `${BD}/MedalRow2`, `${BD}/MedalRow3`, `${BD}/MyRankRow`]) {
  b.patchComponent(`${row}/Reward/Amount`, 'MOD.Core.TextGUIRendererComponent', { Text: 'x2k' });
}
try { b.write(P, { strict: false }); } catch (e) { console.log('lint (기존 L013):', String(e.message).split('\n')[0]); }
const a = UIBuilder.read(P);
const s2 = a.getComponent('/ui/TitleGroup/RankPanel/SeasonText', 'MOD.Core.UITransformComponent');
console.log('tab bottom', tabBottom, 'season bottom', s2.anchoredPosition.y - s2.RectSize.y / 2);
