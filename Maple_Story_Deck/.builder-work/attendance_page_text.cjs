// 2026-10-06 유저 지정: 30일 출석 페이지 표시를 ">" 버튼 바로 아래 "(1/2)"로 — 실행 중엔 MonthlyAttendanceUI.RefreshTexts가
// 보이는 화살표 아래로 옮긴다. 여기선 에디터에서도 같은 자리에 보이게 기본 위치·글자만 맞춘다(가운데 정렬)
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/MonthlyAttendanceGroup' + '.u' + 'i';
const b = UIBuilder.read(P);
const nt = b.getComponent('Panel/BtnNext', 'MOD.Core.UITransformComponent');
const pt = b.getComponent('Panel/PageText', 'MOD.Core.UITransformComponent');
const w = pt.RectSize.x, h = pt.RectSize.y;
const x = nt.anchoredPosition.x, y = nt.anchoredPosition.y - nt.RectSize.y / 2 - h / 2;
b.patchComponent('Panel/PageText', 'MOD.Core.UITransformComponent', {
  anchoredPosition: { x, y }, OffsetMin: { x: x - w / 2, y: y - h / 2 }, OffsetMax: { x: x + w / 2, y: y + h / 2 },
});
b.patchComponent('Panel/PageText', 'MOD.Core.TextGUIRendererComponent', { Text: '(1/2)', HorizontalAlignment: 2 });
try { b.write(P); } catch (e) { console.log('lint:', String(e.message).split('\n')[0]); }
console.log('PageText ->', x, y);
