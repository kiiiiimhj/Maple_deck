// 첫 플레이 에임 튜토리얼 — 실제 몬스터 대신 화면 중앙의 "가짜" 초록 달팽이로 시연(유저 지정 2026-09-20).
// 딤 위에 큰 달팽이 1마리 → 손가락 → 누르면 에임 표식 + 썬더볼트 + 다이 연출. 전부 평소엔 꺼져 있다.
// 크기/RUID는 TutorialGuideUI가 런타임에 다시 맞추므로 여기 값은 에디터 미리보기용 초기값이다.
const {UIBuilder}=require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b=UIBuilder.load('ui/DefaultGroup.ui');
const S='MOD.Core.SpriteGUIRendererComponent';
const K=6; // 달팽이 확대 배율(원본 40x28)
b.empty('TutorialAimStage',{rect_size:[1920,1080],pos:[0,0],enable:false});
b.button('TutorialAimStage/Mob','',{rect_size:[40*K,28*K],pos:[0,-40],image_ruid:'2db94405cf0445f5be2b60a02c21dda5',sprite_type:0,bg_color:{r:1,g:1,b:1,a:1}});
b.sprite('TutorialAimStage/Mark',{rect_size:[71,71],pos:[0,-40],image_ruid:'47ea73beb91641cf99c982e95f7fb0d9',sprite_type:0,color:'#FFFFFF',enable:false});
b.sprite('TutorialAimStage/Bolt',{rect_size:[143*2,213*2],pos:[0,-40],pivot:[0.5,0.15],image_ruid:'33fc60d9910448a2b36035277b28c354',sprite_type:0,color:'#FFFFFF',enable:false});
for(const p of ['TutorialAimStage/Mark','TutorialAimStage/Bolt']) b.patchComponent(p,S,{RaycastTarget:false});
b.write('ui/DefaultGroup.ui',{strict:false,bind:{mlua:'RootDesk/MyDesk/UI/TutorialGuideUI.mlua',props:{
  aimStage:'TutorialAimStage', aimMob:'TutorialAimStage/Mob', aimMark:'TutorialAimStage/Mark', aimBolt:'TutorialAimStage/Bolt'}}});
