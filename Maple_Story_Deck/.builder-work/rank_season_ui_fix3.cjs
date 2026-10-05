// 2026-10-06 유저 지적 "다야 표시 저렇게 하랬어?" — 잡템 퀘 말풍선(CollectBubbleLogic)처럼
// 숫자를 다이아 그림 오른쪽 아래 모서리에 크게 겹친다. 위치 비율은 말풍선과 동일:
//   글자 중심 = 그림 중심 + (그림 폭 × 0.55, -그림 높이 × 0.39), 글씨 흰색·검은 테두리 0.25·두께(FaceDilate) 0.36
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
const style = (size) => ({ FontSize: size, MaxSize: size, BestFit: false, OutlineWidth: 0.25, FaceDilate: 0.36,
  FontColor: { r: 1, g: 1, b: 1, a: 1 }, OutlineColor: { r: 0, g: 0, b: 0, a: 1 } });

function lay(cell, cx, cy, iw, ih, size) {
  place(`${cell}/Icon`, cx, cy, iw, ih);
  place(`${cell}/Amount`, Math.round(cx + iw * 0.55), Math.round(cy - ih * 0.39), 170, 40);
  b.patchComponent(`${cell}/Amount`, 'MOD.Core.TextGUIRendererComponent', style(size));
}
for (const row of [`${BD}/ListArea/RowTemplate`, `${BD}/MedalRow1`, `${BD}/MedalRow2`, `${BD}/MedalRow3`, `${BD}/MyRankRow`]) {
  lay(`${row}/Reward`, -25, 4, 62, 52, 30);
}
lay('RankPanel/SeasonClaim', -112, 6, 58, 48, 28);
try { b.write(P); } catch (e) { console.log('lint (기존 L013):', String(e.message).split('\n')[0]); }
