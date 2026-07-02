const { UIBuilder } = require('G:/Maple_Story_Deck/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.load('ui/DefaultGroup.ui');

// 기존 요소 모두 제거 (Chat, Attack 버튼 제외)
b.remove('ExpBar_BG');
b.remove('GoldPanel');
b.remove('PlayerInfo');
b.remove('CardSlots');
b.remove('LevelUpCards');
b.remove('RerollBtn');

// 공격버튼: 좌하단, 90px 여백, 190x190
b.patch('Button_Attack', { pos: [20, 90], rect_size: [190, 190] });

// ════════════════════════════════════════
//  경험치 바 (상단 중앙)
// ════════════════════════════════════════
b.sprite('ExpBar_BG', { anchor: 'top-center', pos: [-30, -20], rect_size: [1200, 38] });
b.patchComponent('ExpBar_BG', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 0.1, g: 0.1, b: 0.1, a: 0.85 } });
b.sprite('ExpBar_BG/ExpBar_Fill', { anchor: 'stretch', pos: [0, 0], sprite_type: 3, fill_method: 0 });
b.patchComponent('ExpBar_BG/ExpBar_Fill', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 0.2, g: 0.65, b: 1.0, a: 1.0 } });
b.text('ExpBar_BG/ExpLevel', 'Lv.1', { anchor: 'middle-left', pos: [10, 0], rect_size: [70, 32], size: 15, color: '#FFFFFF', bold: true });
b.text('ExpBar_BG/ExpText', '0 / 100', { anchor: 'middle-right', pos: [-10, 0], rect_size: [120, 30], size: 13, color: '#DDDDDD' });

// ════════════════════════════════════════
//  골드: 코인 아이콘 + 수량 텍스트 (상단 우측, PC 예약구역 피하여 배치)
//  코인: pos.x=-318 → 우측에서 318px = right edge at 642
//  텍스트: pos.x=-220 → right edge at 740 (예약구역 경계)
// ════════════════════════════════════════
b.sprite('GoldCoin', {
  anchor: 'top-right', pos: [-318, -16], rect_size: [36, 36],
  image_ruid: '02a489cccff24a139a6c3582a5871f58'
});
b.text('GoldText', ': 0', { anchor: 'top-right', pos: [-220, -20], rect_size: [90, 28], size: 22, color: '#FFD700', bold: true });

// ════════════════════════════════════════
//  플레이어 정보 (좌측, 공격버튼 위)
//  id 텍스트 + HP 슬라이더 (MSW 내장 슬라이더 = "ui있는거")
// ════════════════════════════════════════
b.text('PlayerName', 'Player', {
  anchor: 'bottom-left', pos: [20, 300], rect_size: [200, 28],
  size: 16, color: '#FFFFFF', bold: true
});
b.slider('HPBar', {
  min_val: 0, max_val: 100, value: 100,
  use_handle: false,
  anchor: 'bottom-left', pos: [20, 265], rect_size: [200, 28]
});

// ════════════════════════════════════════
//  카드 슬롯 1~5 (하단 중앙)
//  와이어프레임: 5장이 중앙에 가로 배치, 공격버튼 오른쪽부터
// ════════════════════════════════════════
const CW = 130, CH = 165, CG = 14;
const TOTAL_CARD_W = 5 * CW + 4 * CG; // 706
const SLOTS_W = TOTAL_CARD_W + 20;     // 726

b.panel('CardSlots', { anchor: 'bottom-center', pos: [0, 90], rect_size: [SLOTS_W, CH + 20] });
for (let i = 1; i <= 5; i++) {
  const xOff = (i - 3) * (CW + CG);
  b.sprite('CardSlots/Card' + i, { anchor: 'middle-center', pos: [xOff, 0], rect_size: [CW, CH] });
  b.patchComponent('CardSlots/Card' + i, 'MOD.Core.SpriteGUIRendererComponent', {
    Color: { r: 0.13, g: 0.13, b: 0.23, a: 0.92 }
  });
  b.text('CardSlots/Card' + i + '/Num', '' + i, {
    anchor: 'middle-center', pos: [0, 0], rect_size: [90, 40], size: 28, color: '#555577'
  });
}

// ════════════════════════════════════════
//  카드 6~8 (우측, 하단 정렬 → 위로 스택)
//  와이어프레임: 카드8이 카드5와 같은 높이, 카드6은 위쪽
//  bottom-right anchor, auto-pivot (1,0) 사용
// ════════════════════════════════════════
const RC_MARGIN = 90;  // 하단 여백 (카드1~5와 동일)
const RC_GAP    = 10;  // 카드6~8 사이 간격

// 카드 8: 하단 기준 (카드1~5 하단과 동일)
b.sprite('Card8', { anchor: 'bottom-right', pos: [-20, RC_MARGIN], rect_size: [CW, CH] });
b.patchComponent('Card8', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 0.13, g: 0.13, b: 0.23, a: 0.92 } });
b.text('Card8/Num', '8', { anchor: 'middle-center', pos: [0, 0], rect_size: [90, 40], size: 28, color: '#555577' });

// 카드 7: 카드8 위
const c7y = RC_MARGIN + CH + RC_GAP;
b.sprite('Card7', { anchor: 'bottom-right', pos: [-20, c7y], rect_size: [CW, CH] });
b.patchComponent('Card7', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 0.13, g: 0.13, b: 0.23, a: 0.92 } });
b.text('Card7/Num', '7', { anchor: 'middle-center', pos: [0, 0], rect_size: [90, 40], size: 28, color: '#555577' });

// 카드 6: 카드7 위
const c6y = c7y + CH + RC_GAP;
b.sprite('Card6', { anchor: 'bottom-right', pos: [-20, c6y], rect_size: [CW, CH] });
b.patchComponent('Card6', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 0.13, g: 0.13, b: 0.23, a: 0.92 } });
b.text('Card6/Num', '6', { anchor: 'middle-center', pos: [0, 0], rect_size: [90, 40], size: 28, color: '#555577' });

b.write('ui/DefaultGroup.ui');
console.log('rebuild done');
