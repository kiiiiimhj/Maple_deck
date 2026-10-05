// 2026-10-06 유저 "기간 칸 밑선을 탭이랑 맞춰" — 탭 아랫선 y=356(402-92/2), 기간 칸 아랫선 360(402-84/2) → 기간 칸을 4 내림(y 402→398)
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/TitleGroup' + '.u' + 'i';
const b = UIBuilder.read(P);
const path = 'RankPanel/SeasonText';
const t = b.getComponent(path, 'MOD.Core.UITransformComponent');
const tabs = b.getComponent('RankPanel/Tabs', 'MOD.Core.UITransformComponent');
const tab = b.getComponent('RankPanel/Tabs/TabUnlimited', 'MOD.Core.UITransformComponent');
const tabBottom = tabs.anchoredPosition.y + tab.anchoredPosition.y - tab.RectSize.y / 2;
const y = tabBottom + t.RectSize.y / 2;
const x = t.anchoredPosition.x, w = t.RectSize.x, h = t.RectSize.y;
b.patchComponent(path, 'MOD.Core.UITransformComponent', {
  anchoredPosition: { x, y }, OffsetMin: { x: x - w / 2, y: y - h / 2 }, OffsetMax: { x: x + w / 2, y: y + h / 2 },
});
try { b.write(P); } catch (e) { console.log('lint (기존 L013):', String(e.message).split('\n')[0]); }
console.log('tab bottom', tabBottom, '-> season y', y, 'bottom', y - h / 2);
