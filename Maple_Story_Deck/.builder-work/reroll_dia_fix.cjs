// 다시뽑기 버튼 다이아: 크기 31→25, 빨간 막대 세로 중앙 + 숫자 왼쪽에 붙게(유저 스샷 기준, 2026-09-20)
// 이 RUID는 보이는 중심이 칸 중심보다 오른쪽 위(크기×(0.25,0.21))로 밀려 있어 그만큼 보정한 값
const {UIBuilder}=require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b=UIBuilder.load('ui/DefaultGroup.ui');
// 2026-09-20 유저 지정: 위로 8, 오른쪽으로 5 (-47.3,-28 → -42.3,-20)
b.patch('BtnReroll/CostText/DiaIcon',{pos:[-42.3,-20],rect_size:[25,25]});
b.write('ui/DefaultGroup.ui',{strict:false});
const t=UIBuilder.load('ui/DefaultGroup.ui').getComponent('BtnReroll/CostText/DiaIcon','MOD.Core.UITransformComponent');
console.log('DiaIcon',JSON.stringify(t.anchoredPosition),JSON.stringify(t.RectSize));
