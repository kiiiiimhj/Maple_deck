const fs=require('fs'),assert=require('assert');
const {UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const stage='work/pet-lobby-icon-v3',out='outputs/pet-lobby-icon-v3';
const asset=JSON.parse(fs.readFileSync(out+'/applied-assets.json','utf8'))['pet-house-paw'];
const b=UIBuilder.read(stage+'/TitleGroup.ui.before'),a=UIBuilder.read(stage+'/TitleGroup.ui.before');
const p='PetHouseButton/Icon',l='PetHouseButton/Label',oldRUID='f32b1ba470b0445cbe8ca474b900dad3';
assert.strictEqual(b.getComponent(p,'MOD.Core.SpriteGUIRendererComponent').ImageRUID.DataId,oldRUID);
b.patchComponent(p,'MOD.Core.SpriteGUIRendererComponent',{ImageRUID:{DataId:asset.ruid}});
b.patch(p,{rect_size:[134,134],pos:[0,0]});
b.patch(l,{pos:[0,-93]});
b.write(stage+'/TitleGroup.ui',{strict:false});
let s=fs.readFileSync(stage+'/PetHouseUI.mlua.before','utf8').replace(/\r\n/g,'\n');
for(const [old,newText] of [['icon.UITransformComponent.RectSize = Vector2(104,104)','icon.UITransformComponent.RectSize = Vector2(134,134)'],['icon.UITransformComponent.anchoredPosition = Vector2(0,19)','icon.UITransformComponent.anchoredPosition = Vector2(0,0)'],['icon.SpriteGUIRendererComponent.ImageRUID = DataRef("'+oldRUID+'")','icon.SpriteGUIRendererComponent.ImageRUID = DataRef("'+asset.ruid+'")']]){assert.strictEqual(s.split(old).length,2);s=s.replace(old,newText);}
fs.writeFileSync(stage+'/PetHouseUI.mlua',s);
assert.deepStrictEqual(a.listEntities().map(e=>e.path),b.listEntities().map(e=>e.path));
let preserved=0;
for(const e of a.listEntities())if(!['/ui/TitleGroup/PetHouseButton/Icon','/ui/TitleGroup/PetHouseButton/Label'].includes(e.path)){assert.deepStrictEqual(a.find(e.path).jsonString,b.find(e.path).jsonString);preserved++;}
const label=b.getComponent(l,'MOD.Core.UITransformComponent');
const gap=-67-(label.anchoredPosition.y+label.RectSize.y/2);assert(gap===9);
fs.writeFileSync(out+'/layout-verification.json',JSON.stringify({unchangedEntities:preserved,modifiedEntities:2,iconSizePixels:134,buttonSizePixels:156,iconSizeIncrease:134/104-1,labelGapPixels:gap,buttonFrameAndClickAreaUnchanged:true},null,2));
const plan=JSON.parse(fs.readFileSync(stage+'/plan.json','utf8'));plan.steps[0].status='completed';plan.steps[1].status='in_progress';fs.writeFileSync(stage+'/plan.json',JSON.stringify(plan,null,2));
console.log('Staged side-view icon at 134px; pet caption moved below the circular frame.');
