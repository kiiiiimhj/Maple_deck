const { UIBuilder } = require('G:/Maple_Story_Deck/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.load('ui/DefaultGroup.ui');

// 1. 공격버튼: pivot (0,0) → 화면 내부로 완전히 들어오게
b.patch('Button_Attack', { pivot: [0, 0] });

// 2. GoldPanel: PC 우상단 예약구역(~220px) 피해서 왼쪽으로
b.patch('GoldPanel', { pos: [-240, -20] });

// 3. GoldText: rect_size 지정
b.patch('GoldPanel/GoldText', { rect_size: [148, 36] });

// 4. HPText: rect_size 지정
b.patch('PlayerInfo/HPBar_BG/HPText', { rect_size: [200, 18] });

// 5. 카드 숫자 텍스트 rect_size 줄이기
for (let i = 1; i <= 5; i++) {
  b.patch('CardSlots/Card' + i + '/Num', { rect_size: [88, 40] });
}

// 6. 레벨업 카드 ? 텍스트 rect_size 줄이기
for (let i = 6; i <= 8; i++) {
  b.patch('LevelUpCards/Card' + i + '/Mark', { rect_size: [88, 40] });
}

// 7. 다시뽑기 버튼 높이 88 이상 (touch target)
b.patch('RerollBtn', { rect_size: [116, 88] });

b.write('ui/DefaultGroup.ui');
console.log('fix done');
