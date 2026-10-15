const fs=require('fs'),crypto=require('crypto'),{UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const stage='work/ttung-gear',file='G:/Maple_Story_Deck/ui/EquipmentGroup.ui',b=UIBuilder.read(file),a=JSON.parse(fs.readFileSync('outputs/ttung-gear/applied-assets.json','utf8')),S='MOD.Core.SpriteGUIRendererComponent',X='MOD.Core.TextGUIRendererComponent',B='MOD.Core.ButtonComponent',root='Inventory/Panel/EquipPanel/PetGearSlots';
function text(path,word,pos,rect,font){b.text(path,word,{pos,rect_size:rect,size:font,color:'#FFF0D1',outline:true,outline_color:'#24150C',outline_width:.055,bestfit:true,min_size:12,max_size:font});b.patchComponent(path,X,{Font:'Maple',HorizontalAlignment:2,VerticalAlignment:512,Padding:{left:0,right:0,top:0,bottom:0}});b.patch(path,{enable:true});}
for(const [i,slot]of ['Cap','Coat','Necklace'].entries()){
 const path=root+'/'+slot,kind=['hat','coat','neck'][i];b.patch(path,{pos:[0,150-i*126],rect_size:[90,90]});
 b.addComponent(path,B,UIBuilder._buttonComponent({transition:0}));b.patchComponent(path,S,{RaycastTarget:true,Type:0,PreserveSprite:0});
 b.patch(path+'/Icon',{pos:[0,7],rect_size:[68,64]});b.patchComponent(path+'/Icon',S,{ImageRUID:{DataId:a[kind+'-icon'].ruid},RaycastTarget:false,Type:0,PreserveSprite:0,LocalScale:{x:1,y:1},LocalPosition:{x:0,y:0}});
 text(path+'/Label',['별빛 베레모','산책 조끼','하트 목걸이'][i],[0,-34],[88,20],14);
 text(path+'/Stat',['크리티컬 대미지 +10%','공격력 +5%','크리티컬 확률 +5%'][i],[0,-59],[192,24],16);
 text(path+'/Mark','장착 중',[0,33],[78,18],14);b.patchComponent(path+'/Mark',X,{FontColor:{r:.55,g:1,b:.32,a:1}});b.patch(path+'/Mark',{enable:false});
}
text(root+'/Hint','장비를 눌러 장착·해제',[0,-205],[196,25],14);
b.button(root+'/TestGear','',{pos:[0,-246],rect_size:[152,42],image_ruid:'e2553674fb1c44a1836b7b56ce27f2b4',sprite_type:0});b.removeComponent(root+'/TestGear',X);text(root+'/TestGear/Label','장비 시험',[0,0],[138,28],18);b.patch(root+'/TestGear',{enable:false});
b.write(stage+'/EquipmentGroup.ui');
const src=JSON.parse(fs.readFileSync(stage+'/sources.json','utf8'));src.EquipmentGroup={path:file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};fs.copyFileSync(file,stage+'/EquipmentGroup.before.ui');fs.writeFileSync(stage+'/sources.json',JSON.stringify(src,null,2));
const saved=UIBuilder.read(stage+'/EquipmentGroup.ui');for(const slot of ['Cap','Coat','Necklace'])if(!saved.hasComponent(root+'/'+slot,B))throw Error('Missing gear button '+slot);
console.log('Existing three pet inventory slots reused; click controls, bonus labels and Maker-only test control added.');
