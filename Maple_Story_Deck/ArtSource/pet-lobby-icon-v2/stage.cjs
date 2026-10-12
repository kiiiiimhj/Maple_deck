const fs=require('fs'),assert=require('assert');
const {UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const stage='work/pet-lobby-icon-v2',out='outputs/pet-lobby-icon-v2';
const asset=JSON.parse(fs.readFileSync(out+'/applied-assets.json','utf8'))['pet-house-paw'];
const b=UIBuilder.read(stage+'/TitleGroup.ui.before');
const p='PetHouseButton/Icon',oldRUID='9c00086f822540d5bacfe376c4c9c738';
assert.strictEqual(b.getComponent(p,'MOD.Core.SpriteGUIRendererComponent').ImageRUID.DataId,oldRUID);
b.patchComponent(p,'MOD.Core.SpriteGUIRendererComponent',{ImageRUID:{DataId:asset.ruid}});
b.write(stage+'/TitleGroup.ui',{strict:false});
let s=fs.readFileSync(stage+'/PetHouseUI.mlua.before','utf8').replace(/\r\n/g,'\n');
const old='icon.SpriteGUIRendererComponent.ImageRUID = DataRef("'+oldRUID+'")';
assert.strictEqual(s.split(old).length,2);
s=s.replace(old,'icon.SpriteGUIRendererComponent.ImageRUID = DataRef("'+asset.ruid+'")');
fs.writeFileSync(stage+'/PetHouseUI.mlua',s);
const a=UIBuilder.read(stage+'/TitleGroup.ui.before');
assert.deepStrictEqual(a.listEntities(),b.listEntities());
let preserved=0;
for(const e of a.listEntities()){
    if(e.path!=='/ui/TitleGroup/PetHouseButton/Icon'){assert.deepStrictEqual(a.find(e.path).jsonString,b.find(e.path).jsonString);preserved++;}
    else {
        assert.deepStrictEqual(a.getComponent(e.path,'MOD.Core.UITransformComponent'),b.getComponent(e.path,'MOD.Core.UITransformComponent'));
        const x=structuredClone(b.getComponent(e.path,'MOD.Core.SpriteGUIRendererComponent'));x.ImageRUID=a.getComponent(e.path,'MOD.Core.SpriteGUIRendererComponent').ImageRUID;
        assert.deepStrictEqual(x,a.getComponent(e.path,'MOD.Core.SpriteGUIRendererComponent'));
    }
}
fs.writeFileSync(out+'/layout-verification.json',JSON.stringify({unchangedEntities:preserved,modifiedEntities:1,onlyIconResourceChanged:true},null,2));
const plan=JSON.parse(fs.readFileSync(stage+'/plan.json','utf8'));plan.steps[0].status='completed';plan.steps[1].status='in_progress';fs.writeFileSync(stage+'/plan.json',JSON.stringify(plan,null,2));
console.log('Staged centered front-view icon; only the icon resource changes.');
