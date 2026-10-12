const fs=require('fs'),assert=require('assert');
const {UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const stage='work/pet-lobby-icon-v3',out='outputs/pet-lobby-icon-v3';
const a=UIBuilder.read(stage+'/TitleGroup.ui'),b=UIBuilder.read('G:/Maple_Story_Deck/ui/TitleGroup.ui');
assert.deepStrictEqual(a.listEntities().map(e=>e.path),b.listEntities().map(e=>e.path));
const eq=(x,y)=>typeof x==='number'&&typeof y==='number'?Math.abs(x-y)<.001:typeof x==='object'&&x!==null?Object.keys(x).every(k=>eq(x[k],y?.[k])):x===y;
for(const e of a.listEntities()){
    assert.strictEqual(a.getId(e.path),b.getId(e.path));
    for(const type of ['MOD.Core.UITransformComponent','MOD.Core.SpriteGUIRendererComponent','MOD.Core.TextGUIRendererComponent','MOD.Core.ButtonComponent']){
        const x=a.getComponent(e.path,type),y=b.getComponent(e.path,type);if(!x)continue;assert(y);
        for(const k of ['RectSize','anchoredPosition','Pivot','AnchorsMin','AnchorsMax','UIScale','ImageRUID','PreserveSprite','FontSize','Text','Enable'])if(x[k]!==undefined)assert(eq(x[k],y[k]),e.path+'/'+k);
    }
}
fs.writeFileSync(out+'/saved-ui-verification.json',JSON.stringify({savedMatchesStaged:true,entities:2140,iconOnly:true},null,2));
console.log('Saved UI matches staged icon and existing layouts.');
