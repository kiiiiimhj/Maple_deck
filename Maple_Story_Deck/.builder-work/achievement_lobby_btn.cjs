const {UIBuilder}=require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b=UIBuilder.load('ui/TitleGroup.ui');
const S='MOD.Core.SpriteGUIRendererComponent';
const clone=(o)=>JSON.parse(JSON.stringify(o));
// 인벤토리 버튼(EquipButton, 우측 -30,331) 바로 아래 — 왼쪽 출석(331)↔뽑기(155) 간격과 같게
b.button('AchievementButton','',{anchor:'middle-right',pos:[-30,155],rect_size:[156,156],image_ruid:'99420744f57e46f7bde06c3ebe037f61',sprite_type:0,bg_color:{r:1,g:1,b:1,a:1}});
b.sprite('AchievementButton/Overlay',{rect_size:[118,118],pos:[0,0],image_ruid:'a16af4de7b8c4a6db6bc2996b3c869f6',sprite_type:0,color:'#FFFFFF'});
b.patchComponent('AchievementButton/Overlay',S,{PreserveSprite:1});
// 레드닷은 출석 버튼 것과 똑같이(컴포넌트 복사)
b.sprite('AchievementButton/RedDot',{rect_size:[56,56],pos:[57,57],image_ruid:'fd3837ce4fc04bdd9677e408c2fa776c',sprite_type:0,color:'#FFFFFF'});
b.upsertComponent('AchievementButton/RedDot',S,clone(b.getComponent('AttendanceButton/RedDot',S)));
b.empty('AchievementButton/RedDot/Mark',{rect_size:[56,56],enable:false});
const src=b.find('AttendanceButton/RedDot/Mark');
for(const c of src.jsonString['@components']) if(c['@type']!=='MOD.Core.UITransformComponent') b.upsertComponent('AchievementButton/RedDot/Mark',c['@type'],clone(c));
b.patch('AchievementButton/RedDot',{enable:false});
b.write('ui/TitleGroup.ui',{strict:false,bind:{mlua:'RootDesk/MyDesk/Achievement/AchievementUI.mlua',props:{lobbyButton:'AchievementButton',lobbyRedDot:'AchievementButton/RedDot'}}});
