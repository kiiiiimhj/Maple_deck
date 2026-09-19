const {UIBuilder}=require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b=new UIBuilder('AchievementGroup',23,false);
const T='MOD.Core.TextGUIRendererComponent', S='MOD.Core.SpriteGUIRendererComponent';
const BROWN={r:0.29,g:0.165,b:0.055,a:1}, BROWN2={r:0.48,g:0.32,b:0.19,a:1};
const maple=(p,extra={})=>b.patchComponent(p,T,Object.assign({Font:'Maple'},extra));
// 딤 + 패널
b.sprite('Dimmer',{anchor:'stretch',rect_size:[1920,1080],image_ruid:'4fea64a3307cda641809ad8be0d4890b',sprite_type:0,color:{r:0,g:0,b:0,a:0.65},raycast:true});
b.panel('Panel',{rect_size:[1100,910],alpha:0});
b.sprite('Panel/Board',{rect_size:[1100,910],image_ruid:'2575a3bd187b49478d6acf954c4dc73b',sprite_type:0,color:'#FFFFFF',raycast:true});
b.button('Panel/BtnClose','',{rect_size:[90,94],pos:[520,300],image_ruid:'84bf090442a841899f5274ad5f7725dd',sprite_type:0,bg_color:{r:1,g:1,b:1,a:1}});
b.text('Panel/CountText','달성 0 / 50',{size:28,bold:true,rect_size:[400,40],pos:[0,215]});
maple('Panel/CountText',{FontColor:BROWN});
// 목록
b.empty('Panel/List',{rect_size:[800,430],pos:[0,-25]});
b.gridView('Panel/List/Grid',{total_count:0,cell_size:[740,96],fixed_count:1,fixed_type:0,spacing:[0,8],use_scroll:true,scroll_bar_visible:2,rect_size:[750,430],pos:[-20,0]});
b.addComponent('Panel/List/Grid','MOD.Core.MaskComponent',{'@type':'MOD.Core.MaskComponent',Padding:{left:0,right:0,top:0,bottom:0},Shape:0,Softness:{x:0,y:0},Enable:true});
// 행 템플릿
const R='Panel/List/Grid/RowTemplate';
b.empty(R,{rect_size:[740,96],enable:false});
b.sprite(R+'/Bg',{anchor:'stretch',rect_size:[740,96],color:{r:1,g:1,b:1,a:0.35}});
b.sprite(R+'/Box',{rect_size:[52,52],pos:[-330,0],color:{r:1,g:0.98,b:0.92,a:1}});
b.patchComponent(R+'/Box',S,{Outline:true,OutlineColor:BROWN,OutlineWidth:3});
b.sprite(R+'/Box/Check',{rect_size:[64,58],pos:[6,6],image_ruid:'3af55bc08a57461cbb77c44266cc41c1',sprite_type:0,color:'#FFFFFF'});
b.text(R+'/NameText','업적 이름',{size:28,bold:true,alignment:3,rect_size:[400,38],pos:[-90,17]});
maple(R+'/NameText',{FontColor:BROWN});
b.text(R+'/DescText','업적 조건',{size:21,alignment:3,rect_size:[400,30],pos:[-90,-20]});
maple(R+'/DescText',{FontColor:BROWN2});
b.empty(R+'/Reward',{rect_size:[110,40],pos:[165,17]});
b.sprite(R+'/Reward/Icon',{rect_size:[38,38],pos:[-25,0],image_ruid:'81462aeb825b4660991cef05651271cf',sprite_type:0,color:'#FFFFFF'});
b.patchComponent(R+'/Reward/Icon',S,{PreserveSprite:1});
b.text(R+'/Reward/Amount','x10',{size:26,bold:true,alignment:3,rect_size:[60,36],pos:[25,0]});
maple(R+'/Reward/Amount',{FontColor:BROWN});
b.text(R+'/ProgressText','0 / 100',{size:21,bold:true,rect_size:[190,30],pos:[165,-20]});
maple(R+'/ProgressText',{FontColor:BROWN});
b.button(R+'/BtnClaim','받기',{rect_size:[130,64],pos:[300,0],font_size:30,image_ruid:'988c6f89fbb543f9afd92e1ac5808cec',sprite_type:0,bg_color:{r:1,g:1,b:1,a:1},color:'#4A2A0E'});
maple(R+'/BtnClaim',{FontStyle:1});
b.text(R+'/DoneText','완료',{size:28,bold:true,rect_size:[130,40],pos:[300,0]});
maple(R+'/DoneText',{FontColor:{r:0.5,g:0.42,b:0.35,a:1}});
// 스크롤바(UIGridScrollBar — 형제 "Grid"를 찾는다). 기본 스타일: 흰 채움/핸들 0.7/주황 테두리 2
b.sprite('Panel/List/ScrollBar',{rect_size:[30,430],pos:[385,0],image_ruid:'4fea64a3307cda641809ad8be0d4890b',sprite_type:0,color:{r:0.15,g:0.2,b:0.35,a:0.6},raycast:true});
b.patchComponent('Panel/List/ScrollBar',S,{Outline:true,OutlineColor:{r:1,g:0.65,b:0.15,a:1},OutlineWidth:2});
b.addComponent('Panel/List/ScrollBar','MOD.Core.SliderComponent',{'@type':'MOD.Core.SliderComponent',Direction:3,FillRectColor:{r:1,g:1,b:1,a:1},FillRectImageRUID:{DataId:''},FillRectPadding:{left:10,right:10,top:10,bottom:10},HandleAreaPadding:{left:0,right:0,top:25,bottom:25},HandleColor:{r:1,g:1,b:1,a:0.7},HandleImageRUID:{DataId:'11d05d4e8436410e925590878af2e9a3'},HandleSize:{x:60,y:50},IgnoreMapLayerCheck:false,MaxValue:1,MinValue:0,OrderInLayer:0,OverrideSorting:false,SortingLayer:'UI',UseHandle:true,UseIntegerValue:false,Value:0,Enable:true});
b.addComponent('Panel/List/ScrollBar','script.UIGridScrollBar');
// 모두 받기
b.button('Panel/BtnClaimAll','모두 받기',{rect_size:[260,90],pos:[0,-300],font_size:36,image_ruid:'988c6f89fbb543f9afd92e1ac5808cec',sprite_type:0,bg_color:{r:1,g:1,b:1,a:1},color:'#4A2A0E'});
maple('Panel/BtnClaimAll',{FontStyle:1});
b.write('ui/AchievementGroup.ui',{bind:{mlua:'RootDesk/MyDesk/Achievement/AchievementUI.mlua',props:{
 popupGroup:'/ui/AchievementGroup', btnClose:'Panel/BtnClose', btnClaimAll:'Panel/BtnClaimAll',
 listGrid:'Panel/List/Grid', rowTemplate:R, countText:'Panel/CountText'}}});
