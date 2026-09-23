// 2026-09-24 유저 리포트(모바일): 첫 플레이 튜토리얼 에임 단계에서 가짜 달팽이가 딤 뒤에 깔려 어둡게 보임.
// .ui 형제 순서가 AimStage(102) < TutorialDim(104)인데, 런타임 SetSiblingIndex로 순서를 올리는 게
// 기기에서 안 먹었다(feedback_ui_setsiblingindex_not_render_order). 빌더엔 형제 순서 변경 API가 없고
// 지웠다 다시 만들면 Maker 임포트가 깨지므로 → **딤을 AimStage 자신의 배경 스프라이트로** 넣는다.
// 부모는 자식보다 먼저 그려지므로 달팽이/표식/번개는 항상 이 딤 위에 온다. 에임 단계에선 TutorialDim을 끈다(코드).
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const F = 'ui/DefaultGroup.ui';
const b = UIBuilder.load(F);
const dimSprite = JSON.parse(JSON.stringify(b.getComponent('TutorialDim', 'MOD.Core.SpriteGUIRendererComponent')));
console.log('TutorialDim sprite', JSON.stringify({ img: dimSprite.ImageRUID, color: dimSprite.Color, type: dimSprite.Type }));
console.log('AimStage comps', b.find('TutorialAimStage').jsonString['@components'].map((c) => c['@type']).join(','));
dimSprite.RaycastTarget = true; // 에임 단계는 달팽이 말고 아무것도 못 누르게(달팽이는 자식이라 위에서 먼저 받는다)
b.upsertComponent('TutorialAimStage', 'MOD.Core.SpriteGUIRendererComponent', dimSprite);
b.write(F);
console.log('AimStage comps after', b.find('TutorialAimStage').jsonString['@components'].map((c) => c['@type']).join(','));
const t = b.getComponent('TutorialAimStage', 'MOD.Core.UITransformComponent');
console.log('AimStage rect', JSON.stringify({ amin: t.AnchorsMin, amax: t.AnchorsMax, size: t.RectSize, pos: t.anchoredPosition }));
