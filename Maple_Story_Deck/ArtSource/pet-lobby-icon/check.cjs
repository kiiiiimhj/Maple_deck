const fs=require('fs'),assert=require('assert');
const {UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const stage='work/pet-lobby-icon',out='outputs/pet-lobby-icon';
const a=UIBuilder.read(stage+'/TitleGroup.ui.before'),b=UIBuilder.read(stage+'/TitleGroup.ui');
assert.deepStrictEqual(a.listEntities().map(e=>e.path),b.listEntities().map(e=>e.path));
const icon='/ui/TitleGroup/PetHouseButton/Icon';
const asset=JSON.parse(fs.readFileSync(out+'/applied-assets.json','utf8'))['pet-house-paw'];
let preserved=0;
for(const e of a.listEntities()){
    const x=structuredClone(a.find(e.path).jsonString),y=structuredClone(b.find(e.path).jsonString);
    if(e.path!==icon){assert.deepStrictEqual(x,y,e.path);preserved++;}
    else {
        const oldT=a.getComponent(e.path,'MOD.Core.UITransformComponent'),newT=b.getComponent(e.path,'MOD.Core.UITransformComponent');
        const oldR=a.getComponent(e.path,'MOD.Core.SpriteGUIRendererComponent'),newR=b.getComponent(e.path,'MOD.Core.SpriteGUIRendererComponent');
        assert.strictEqual(newR.ImageRUID.DataId,asset.ruid);assert.strictEqual(newT.RectSize.x,104);assert.strictEqual(newT.RectSize.y,104);assert.strictEqual(newT.anchoredPosition.x,0);assert.strictEqual(newT.anchoredPosition.y,19);
        for(const k of ['Pivot','AnchorsMin','AnchorsMax','UIScale','QuaternionRotation','Scale','Enable','ActivePlatform'])assert.deepStrictEqual(newT[k],oldT[k],k);
        const r=structuredClone(newR);r.ImageRUID=oldR.ImageRUID;r.PreserveSprite=oldR.PreserveSprite;assert.deepStrictEqual(r,oldR);
        assert.strictEqual(a.getId(e.path),b.getId(e.path));
    }
}
const label=b.getComponent('/ui/TitleGroup/PetHouseButton/Label','MOD.Core.UITransformComponent');
const gap=(19-104/2)-(label.anchoredPosition.y+label.RectSize.y/2);assert(gap>=2);
fs.writeFileSync(out+'/layout-verification.json',JSON.stringify({unchangedEntities:preserved,modifiedEntities:1,iconSquare:true,labelGapPixels:gap,buttonFrameAndClickAreaUnchanged:true},null,2));
console.log('Verified only the pet icon changes; '+preserved+' entities preserved.');
