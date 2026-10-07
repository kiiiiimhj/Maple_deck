// 퀴즈 팝업 X 버튼을 풍선 퍼즐 X(유저가 직접 맞춘 것)와 같은 스타일로 — 2026-10-07
// 풍선 퍼즐: 패널 1360x714, X (563,252) 40pt FaceDilate 1 / 퀴즈 패널 940x494 → 비율로 위치 환산, 글자는 팝업 크기에 맞게 34pt
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const path = 'ui/Ep4EasterEggGroup' + '.ui';
const b = UIBuilder.load(path);
b.patch('QuizPanel/BtnClose', { pos: [389, 172] });
b.patchComponent('QuizPanel/BtnClose', 'MOD.Core.TextGUIRendererComponent', {
  FontSize: 34, MaxSize: 34, BestFit: false, FaceDilate: 1, FaceSoftness: 0.6765609,
});
b.write(path);
