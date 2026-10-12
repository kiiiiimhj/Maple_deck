const fs=require('fs'),assert=require('assert');
const {UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const a=UIBuilder.read('work/pet-tutorial/PetHouseGroup.ui'),b=UIBuilder.read('G:/Maple_Story_Deck/ui/PetHouseGroup.ui');
assert.deepStrictEqual(a.listEntities().map(e=>e.path),b.listEntities().map(e=>e.path));
const eq=(x,y)=>typeof x==='number'&&typeof y==='number'?Math.abs(x-y)<.001:typeof x==='object'&&x!==null?Object.keys(x).every(k=>eq(x[k],y?.[k])):x===y;
for(const e of a.listEntities()){
 assert.strictEqual(a.getId(e.path),b.getId(e.path));
 for(const type of ['MOD.Core.UITransformComponent','MOD.Core.SpriteGUIRendererComponent','MOD.Core.TextGUIRendererComponent','MOD.Core.ButtonComponent','MOD.Core.CanvasGroupComponent']){
  const x=a.getComponent(e.path,type),y=b.getComponent(e.path,type);if(!x)continue;assert(y);
  for(const k of ['RectSize','anchoredPosition','Pivot','AnchorsMin','AnchorsMax','UIScale','ImageRUID','PreserveSprite','FontSize','Text','Enable','GroupAlpha','Interactable','BlocksRaycasts','RaycastTarget'])if(x[k]!==undefined && !(k==='RaycastTarget' && type==='MOD.Core.TextGUIRendererComponent'))assert(eq(x[k],y[k]),e.path+'/'+k);
 }
}
fs.writeFileSync('outputs/pet-tutorial/saved-ui-verification.json',JSON.stringify({savedMatchesStaged:true,entities:b.listEntities().length},null,2));
console.log('Saved guide layout, image bindings and input blocking match staged UI.');
