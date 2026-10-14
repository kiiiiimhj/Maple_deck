const fs=require('fs'),assert=require('assert');
const {UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const a=UIBuilder.read('work/pet-energy-icon/PetHouseGroup.ui'),b=UIBuilder.read('G:/Maple_Story_Deck/ui/PetHouseGroup.ui'),old=UIBuilder.read('work/pet-energy-icon/PetHouseGroup.ui.before');
assert.strictEqual(b.listEntities().length,old.listEntities().length+1);
for(const e of old.listEntities())assert.strictEqual(old.getId(e.path),b.getId(e.path));
const p='Overlay/Room/EnergyBar/Icon',S='MOD.Core.SpriteGUIRendererComponent',T='MOD.Core.UITransformComponent';
assert.strictEqual(a.getId(p),b.getId(p));const t=b.getComponent(p,T),s=b.getComponent(p,S);assert(t.anchoredPosition.x===-292&&t.anchoredPosition.y===0&&t.RectSize.x===88&&t.RectSize.y===88);assert.strictEqual(s.ImageRUID.DataId,'31e5d39c5475442d87ea4cec5019efa7');assert.strictEqual(s.RaycastTarget,false);
for(const q of ['Overlay/Room/EnergyBar','Overlay/Room/EnergyBar/Fill','Overlay/Room/EnergyCaption','Overlay/Room/Energy']){
 for(const type of [T,S]){const x=old.getComponent(q,type),y=b.getComponent(q,type);if(!x)continue;for(const k of ['RectSize','anchoredPosition','ImageRUID','Color'])if(x[k])assert.deepStrictEqual(x[k],y[k],q+'/'+k);}
}
fs.writeFileSync('outputs/pet-energy-icon/saved-ui-verification.json',JSON.stringify({savedMatchesStaged:true,existingEntityIDsPreserved:old.listEntities().length,entities:b.listEntities().length,existingEnergyRowUnchanged:true},null,2));
console.log('Saved icon layout verified; existing energy row and entity IDs preserved.');
