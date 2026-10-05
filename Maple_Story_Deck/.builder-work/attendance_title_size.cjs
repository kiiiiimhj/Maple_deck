// 2026-10-06 유저 "출석 체크"로 이름 변경 + 간판 글씨 키우기(한국어는 유저가 이미지로 교체 예정).
// 가장 긴 번역 "Daily Check-In"(영어) 기준으로 칸 460x130(500은 영어가 오른쪽 별에 닿음), 베스트핏 최대 80(이전 60)
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/MonthlyAttendanceGroup' + '.u' + 'i';
const b = UIBuilder.read(P);
const path = 'Panel/Board/LocaleTitle';
const t = b.getComponent(path, 'MOD.Core.UITransformComponent');
const x = t.anchoredPosition.x, y = t.anchoredPosition.y, w = 460, h = 130;
b.patchComponent(path, 'MOD.Core.UITransformComponent', {
  RectSize: { x: w, y: h }, OffsetMin: { x: x - w / 2, y: y - h / 2 }, OffsetMax: { x: x + w / 2, y: y + h / 2 },
});
b.patchComponent(path, 'MOD.Core.TextGUIRendererComponent', { BestFit: true, FontSize: 80, MaxSize: 80, MinSize: 40 });
try { b.write(P); } catch (e) { console.log('lint:', String(e.message).split('\n')[0]); }
