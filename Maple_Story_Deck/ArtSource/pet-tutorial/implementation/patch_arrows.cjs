const fs=require('fs'),assert=require('assert'),crypto=require('crypto');
const {UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const stage='work/pet-tutorial',out='outputs/pet-tutorial';
const ui='G:/Maple_Story_Deck/ui/PetHouseGroup.ui',code='G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetHouseUI.mlua';
const b=UIBuilder.read(ui),original=UIBuilder.read(ui);const asset=JSON.parse(fs.readFileSync(out+'/applied-assets.json','utf8')).arrow;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.writeFileSync(stage+'/arrow-update-base.json',JSON.stringify({[ui]:hash(ui),[code]:hash(code)},null,2));
const positions=[[0,270],[0,55],[0,-165]],allowed=new Set();
for(let i=1;i<=3;i++){
 const path='Tutorial/Content/Arrow'+i;allowed.add('/ui/PetHouseGroup/'+path);
 b.patch(path,{pos:positions[i-1],rect_size:[210,210*asset.size[1]/asset.size[0]]});
 b.patchComponent(path,'MOD.Core.SpriteGUIRendererComponent',{ImageRUID:{DataId:asset.ruid},FlipX:i===2});
}
b.write(stage+'/PetHouseGroup.ui',{strict:false});
for(const e of original.listEntities()){
 assert.strictEqual(original.getId(e.path),b.getId(e.path));
 if(!allowed.has(e.path))assert.deepStrictEqual(original.find(e.path).jsonString,b.find(e.path).jsonString,e.path);
}
const text=fs.readFileSync(code,'utf8');assert(text.includes('table.insert(resources,"b580a80ebbc8436f9645c7e362ded435")'));
fs.writeFileSync(stage+'/PetHouseUI.mlua',text.replace('table.insert(resources,"b580a80ebbc8436f9645c7e362ded435")','table.insert(resources,"'+asset.ruid+'")'));
const report=JSON.parse(fs.readFileSync(out+'/layout-verification.json','utf8'));report.connectorArrowRUID=asset.ruid;report.connectorPositions=positions;report.connectorRectSize=[210,210*asset.size[1]/asset.size[0]];report.middleConnectorMirrored=true;report.arrowUpdateOtherEntitiesPreserved=original.listEntities().length-3;fs.writeFileSync(out+'/layout-verification.json',JSON.stringify(report,null,2));
console.log('Three connectors changed; all other entities and every entity ID preserved.');
