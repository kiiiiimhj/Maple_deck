// 업적 팝업 레이아웃 보정 — 배경판 상단은 트로피+리본 장식이라 실제 목록 칸은 양피지 부분(y +121 ~ -335)만 쓴다.
// load 후 patch만 한다(새 UIBuilder로 다시 만들면 UUID가 바뀌어 바인딩이 깨진다)
const {UIBuilder}=require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b=UIBuilder.load('ui/AchievementGroup.ui');
const T='MOD.Core.TextGUIRendererComponent', G='MOD.Core.GridViewComponent';
const R='Panel/List/Grid/RowTemplate';
b.patch('Panel/BtnClose',{pos:[470,150]});
// 리본 위 제목 겸 달성 개수
b.patch('Panel/CountText',{pos:[0,168],rect_size:[500,50]});
b.patchComponent('Panel/CountText',T,{FontSize:34,FontColor:{r:1,g:1,b:1,a:1},OutlineWidth:0.25,OutlineColor:{r:0.45,g:0.12,b:0.08,a:1}});
// 목록: 양피지 안쪽 y +112 ~ -245
b.patch('Panel/List',{pos:[0,-66],rect_size:[800,357]});
b.patch('Panel/List/Grid',{pos:[-18,0],rect_size:[736,357]});
b.patchComponent('Panel/List/Grid',G,{CellSize:{x:730,y:86},Spacing:{x:0,y:6}});
b.patch('Panel/List/ScrollBar',{pos:[372,0],rect_size:[28,357]});
b.patch(R,{rect_size:[730,86]});
b.patch(R+'/Bg',{rect_size:[730,86]});
b.patch(R+'/Box',{pos:[-318,0],rect_size:[48,48]});
b.patch(R+'/Box/Check',{pos:[6,6],rect_size:[58,52]});
b.patch(R+'/NameText',{pos:[-72,15]});
b.patchComponent(R+'/NameText',T,{FontSize:26});
b.patch(R+'/DescText',{pos:[-72,-19]});
b.patchComponent(R+'/DescText',T,{FontSize:20});
b.patch(R+'/Reward',{pos:[160,15]});
// 다이아 RUID는 보이는 중심이 칸 중심보다 오른쪽 위로 밀려 있다(RewardFlyUI.GetPivotFix 참고) — 왼쪽 아래로 보정
b.patch(R+'/Reward/Icon',{pos:[-52,-26],rect_size:[34,34]});
b.patch(R+'/ProgressText',{pos:[160,-19]});
b.patchComponent(R+'/ProgressText',T,{FontSize:20});
b.patch(R+'/BtnClaim',{pos:[295,0],rect_size:[120,58]});
b.patchComponent(R+'/BtnClaim',T,{FontSize:28});
b.patch(R+'/DoneText',{pos:[295,0]});
b.patch('Panel/BtnClaimAll',{pos:[0,-295],rect_size:[240,70]});
b.patchComponent('Panel/BtnClaimAll',T,{FontSize:32});
b.write('ui/AchievementGroup.ui');
