// 조사(읽기 전용): 레이드 보상 목록 창의 색/글꼴 값 — 능력치 팝업을 같은 느낌으로 맞추려고
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.read('ui/RaidGroup.ui');
for (const p of ['RewardTable', 'RewardTableDim', 'RewardTable/Title', 'RewardTable/BtnClose', 'RewardTable/Head', 'RewardTable/Head/Grade', 'RewardTable/Row0/Bg', 'RewardTable/Row1/Bg', 'RewardTable/Row0/Cut', 'RewardTable/Row0/Grade']) {
  const e = b.find(p);
  if (!e) { console.log('missing', p); continue; }
  const out = {};
  for (const c of e.jsonString['@components']) {
    const t = c['@type'].replace('MOD.Core.', '');
    if (t === 'SpriteGUIRendererComponent') out.spr = { img: c.ImageRUID && c.ImageRUID.DataId, color: c.Color, type: c.Type, raycast: c.RaycastTarget, outline: c.Outline, outlineColor: c.OutlineColor };
    if (t === 'TextGUIRendererComponent') out.txt = { text: c.Text, key: c.IsLocalizationKey, font: c.Font, size: c.FontSize, color: c.FontColor, bold: c.FontStyle, outlineW: c.OutlineWidth, outlineC: c.OutlineColor, h: c.HorizontalAlignment };
    if (t === 'UITransformComponent') out.rt = { pos: c.anchoredPosition, size: c.RectSize, amin: c.AnchorsMin };
  }
  console.log(p, JSON.stringify(out));
}
