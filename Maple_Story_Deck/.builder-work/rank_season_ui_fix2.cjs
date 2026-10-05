// 2026-10-06 시즌 보상 받기 버튼 정리 — 위쪽 "지난 시즌 N위"(RankLabel)가 코인 배지에 가려서 지우고,
// 버튼 글자 자체를 "N위 보상 받기"로 쓴다(RankUI.RefreshClaim). 다이아+수량은 버튼 안쪽으로 조금 당긴다
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/TitleGroup' + '.u' + 'i';
const b = UIBuilder.read(P);
function place(path, x, y, w, h) {
  b.patchComponent(path, 'MOD.Core.UITransformComponent', {
    anchoredPosition: { x, y }, RectSize: { x: w, y: h },
    OffsetMin: { x: x - w / 2, y: y - h / 2 }, OffsetMax: { x: x + w / 2, y: y + h / 2 },
  });
}
if (b.find('RankPanel/SeasonClaim/RankLabel')) b.remove('RankPanel/SeasonClaim/RankLabel');
place('RankPanel/SeasonClaim/Icon', -95, 8, 54, 45);
place('RankPanel/SeasonClaim/Amount', -95, -18, 120, 34);
place('RankPanel/SeasonClaim/Label', 50, 0, 190, 70);
try { b.write(P); } catch (e) { console.log('lint (기존 L013):', String(e.message).split('\n')[0]); }
