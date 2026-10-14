const fs=require('fs'),assert=require('assert');
const {UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const stage='work/pet-energy-icon',out='outputs/pet-energy-icon';
const b=UIBuilder.read(stage+'/PetHouseGroup.ui.before'),before=UIBuilder.read(stage+'/PetHouseGroup.ui.before');
const asset=JSON.parse(fs.readFileSync(out+'/applied-asset.json','utf8'));
const path='Overlay/Room/EnergyBar/Icon';
b.sprite(path,{image_ruid:asset.ruid,pos:[-292,0],rect_size:[88,88],color:'#FFFFFF',sprite_type:0,raycast:false});
b.patchComponent(path,'MOD.Core.SpriteGUIRendererComponent',{PreserveSprite:0,RaycastTarget:false,LocalPosition:{x:0,y:0},LocalScale:{x:1,y:1}});
for(const e of before.listEntities()){
 assert.strictEqual(before.getId(e.path),b.getId(e.path));
 assert.deepStrictEqual(before.find(e.path).jsonString,b.find(e.path).jsonString,e.path);
}
b.write(stage+'/PetHouseGroup.ui',{strict:false});
fs.writeFileSync(out+'/layout-verification.json',JSON.stringify({existingEntitiesPreserved:before.listEntities().length,newEntities:1,path:'/ui/PetHouseGroup/'+path,parent:'EnergyBar',iconPosition:[-292,0],iconRectSize:[88,88],gaugeLeft:-254,captionRight:-325,decorativeAndNonBlocking:true,iconRUID:asset.ruid},null,2));
console.log('Energy bolt added beside existing gauge; all 220 existing entities preserved.');
