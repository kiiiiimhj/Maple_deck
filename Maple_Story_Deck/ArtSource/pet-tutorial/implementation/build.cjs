const fs=require('fs'),assert=require('assert');
const {UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const stage='work/pet-tutorial',out='outputs/pet-tutorial';
const b=UIBuilder.read(stage+'/PetHouseGroup.ui.before'),old=UIBuilder.read(stage+'/PetHouseGroup.ui.before');
const ref=JSON.parse(fs.readFileSync(stage+'/ui-inspection.json','utf8'));
const assets=JSON.parse(fs.readFileSync(out+'/applied-assets.json','utf8'));
const X='MOD.Core.TextGUIRendererComponent',S='MOD.Core.SpriteGUIRendererComponent',T='MOD.Core.UITransformComponent',B='MOD.Core.ButtonComponent',C='MOD.Core.CanvasGroupComponent';
const raidHelp=ref.RaidGroup.entities[0].data['@components'];
const raidDim=ref.TitleGroup.entities.find(e=>e.path.endsWith('/RaidTutorial/Dim')).data['@components'];
const component=(rows,type)=>rows.find(c=>c['@type']===type);
function text(path,value,pos,size,font=30,color='#FFF2D9'){
 b.text(path,value,{pos,rect_size:size,size:font,color,outline:true,outline_color:'#160E07',outline_width:.075,face_dilate:.06,bestfit:true,min_size:20,max_size:font});
 b.patchComponent(path,X,{Font:'Maple',HorizontalAlignment:2,VerticalAlignment:512,Padding:{left:0,right:0,top:0,bottom:0}});
}
function sprite(path,ruid,pos,size){b.sprite(path,{image_ruid:ruid,pos,rect_size:size,color:'#FFFFFF',sprite_type:0,raycast:false});b.patchComponent(path,S,{PreserveSprite:0,LocalPosition:{x:0,y:0},LocalScale:{x:1,y:1},RaycastTarget:false});}
const help='Overlay/BtnTutorial';
b.button(help,'',{pos:[-752,345],rect_size:[64,64],image_ruid:'78d254b94ee54616ab1d6038e131ec8a',sprite_type:0,bg_color:'#FFFFFF'});b.removeComponent(help,X);
b.patchComponent(help,S,component(raidHelp,S));b.patchComponent(help,B,component(raidHelp,B));
b.empty('Tutorial',{anchor:'stretch',rect_size:[1920,1080],enable:false});
b.button('Tutorial/Dim','',{anchor:'stretch',rect_size:[1920,1080],image_ruid:'4fea64a3307cda641809ad8be0d4890b',sprite_type:0,bg_color:'#FFFFFF'});b.removeComponent('Tutorial/Dim',X);
b.patchComponent('Tutorial/Dim',S,component(raidDim,S));b.patchComponent('Tutorial/Dim',B,{...component(raidDim,B),Enable:true,Transition:0});
const content='Tutorial/Content';b.empty(content,{rect_size:[1520,1040]});b.addComponent(content,C,{GroupAlpha:1,Interactable:false,BlocksRaycasts:false});
text(content+'/Title','펫 하우스 가이드',[0,480],[600,48],35);
text(content+'/Hint','화면을 누르면 닫혀요',[0,-495],[680,38],24,'#DDD7CD');
const positions=[[-380,240],[380,140],[-380,-190],[380,-290]],keys=['care','rewards','stones','adventure'];
const labels=['펫을 돌보고\n성장시켜 보세요!','친밀도를 높여\n다양한 보상을 받아 보세요!','모험에서 높은 점수를 기록해\n성장석을 모아 보세요!','강해진 펫과 함께\n더 높은 점수에 도전하세요!'];
for(let i=0;i<4;i++){
 const p=content+'/Step'+(i+1);b.empty(p,{pos:positions[i],rect_size:[620,410],enable:false});b.addComponent(p,C,{GroupAlpha:0,Interactable:false,BlocksRaycasts:false});
 const a=assets[keys[i]],size=[430,430*a.size[1]/a.size[0]];sprite(p+'/Img',a.ruid,[0,80],size);
 text(p+'/Label',labels[i],[0,-115],[640,94],30);
 if(i===1)sprite(p+'/Img/ActualScroll','52df3f22bb014921a232021a48a1279b',[114,-26],[68,68]);
}
for(let i=1;i<=3;i++){
 const p=content+'/Arrow'+i;const pos=i===1?[0,300]:i===2?[0,15]:[0,-250];sprite(p,'730ae8fdc5724aa4859531b8e3968096',pos,[191,115]);
 b.patch(p,{enable:false});b.patchComponent(p,S,{FlipX:i===2});b.addComponent(p,C,{GroupAlpha:0,Interactable:false,BlocksRaycasts:false});
}
b.write(stage+'/PetHouseGroup.ui',{strict:false});
b.injectBindings(stage+'/PetHouseUI.mlua',{TutorialHelp:help,TutorialRoot:'Tutorial',TutorialContent:content});
for(const e of old.listEntities()){assert.strictEqual(old.getId(e.path),b.getId(e.path));assert.deepStrictEqual(old.find(e.path).jsonString,b.find(e.path).jsonString,e.path);}
const report={existingEntitiesPreserved:old.listEntities().length,newEntities:b.listEntities().length-old.listEntities().length,stepCount:4,arrowCount:3,sequence:7,nativeRaidHelpRUID:'78d254b94ee54616ab1d6038e131ec8a',actualScrollRUID:b.getComponent(content+'/Step2/Img/ActualScroll',S).ImageRUID.DataId,contentSize:[1520,1040],allAddedWithinCurrentUIGroup:true};
fs.writeFileSync(out+'/layout-verification.json',JSON.stringify(report,null,2));
const plan=JSON.parse(fs.readFileSync(stage+'/plan.json','utf8'));plan.steps[1].status='completed';plan.steps[2].status='in_progress';fs.writeFileSync(stage+'/plan.json',JSON.stringify(plan,null,2));
console.log('Four-step arrow tutorial and native raid help button built; existing pet layout preserved.');
