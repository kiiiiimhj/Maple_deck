const { UIBuilder } = require('G:/Maple_Story_Deck/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.load('ui/DefaultGroup.ui');

// 카드 색상: 배경과 확실히 구분되는 진한 보라/남색 + 완전 불투명
const CARD_COLOR = { r: 0.15, g: 0.12, b: 0.38, a: 1.0 };
const NUM_COLOR = '#AAAACC';

// 카드 1~5
for (let i = 1; i <= 5; i++) {
  b.patchComponent('CardSlots/Card' + i, 'MOD.Core.SpriteGUIRendererComponent', { Color: CARD_COLOR });
  b.patch('CardSlots/Card' + i + '/Num', { color: NUM_COLOR });
}

// 카드 6~8
for (const n of ['6','7','8']) {
  b.patchComponent('Card' + n, 'MOD.Core.SpriteGUIRendererComponent', { Color: CARD_COLOR });
  b.patch('Card' + n + '/Num', { color: NUM_COLOR });
}

b.write('ui/DefaultGroup.ui');
console.log('card color patched');
