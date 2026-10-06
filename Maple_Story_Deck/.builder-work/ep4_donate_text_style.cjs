// 2026-10-06 유저 지정: 에피4 기부 이스터에그 팝업(Ep4EasterEggGroup/DonatePanel)
//   · 버튼(예/아니오/닫기) 글자: 흰색 + 검은 테두리(레이드 버튼과 같은 두께 0.2), FaceDilate 살짝 올림(0.15 → 0.22)
//   · 나머지 글자(제목/질문/진행도/골드/안내): FaceDilate 살짝 올림(0.16 → 0.23)
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/Ep4EasterEggGroup' + '.ui';
const b = UIBuilder.read(P);
const TG = 'MOD.Core.TextGUIRendererComponent';
for (const n of ['BtnYes', 'BtnNo', 'BtnClose']) {
  b.patchComponent(`DonatePanel/${n}`, TG, {
    FontColor: { r: 1, g: 1, b: 1, a: 1 },
    OutlineColor: { r: 0, g: 0, b: 0, a: 1 },
    OutlineWidth: 0.2,
    FaceDilate: 0.22,
  });
}
for (const n of ['Title', 'Question', 'Progress', 'Gold', 'Rule']) {
  b.patchComponent(`DonatePanel/${n}`, TG, { FaceDilate: 0.23 });
}
try { b.write(P, { strict: false }); } catch (e) { console.log('lint:', String(e.message).split('\n')[0]); }
const a = UIBuilder.read(P);
for (const n of ['BtnYes', 'BtnNo', 'BtnClose', 'Title', 'Question', 'Progress', 'Gold', 'Rule']) {
  const t = a.getComponent(`/ui/Ep4EasterEggGroup/DonatePanel/${n}`, TG);
  console.log(n.padEnd(9), JSON.stringify(t.FontColor), 'outline', t.OutlineWidth, 'dilate', t.FaceDilate);
}
