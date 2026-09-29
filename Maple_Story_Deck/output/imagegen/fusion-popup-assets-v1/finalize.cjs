const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {UIBuilder}=require('../../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b=UIBuilder.read('ui/OptionGroup.ui'),before=UIBuilder.read(path.join(__dirname,'before.ui'));
const resources=JSON.parse(fs.readFileSync(path.join(__dirname,'resources.json'),'utf8'));
const receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'verification.json'),'utf8'));
const nativeValues=v=>JSON.parse(JSON.stringify(v,(_k,x)=>typeof x==='number'?Math.fround(x):x));
const prefix='/ui/OptionGroup/FusionPanel';
for(const e of before.listEntities()){
 const old=before.find(e.path),now=b.find(e.path);assert.equal(now.id,old.id);
 if(!e.path.startsWith(prefix+'/')||e.path===prefix+'/BtnClose')assert.deepEqual(nativeValues(now),nativeValues(old));
 if(/\/Row\d+\/(Slot\d+|Result)$/.test(e.path))assert.deepEqual(nativeValues(now),nativeValues(old));
}
assert.equal(b.listEntities().length,135);
assert.equal(b.getComponent('FusionPanel/Bg','MOD.Core.SpriteGUIRendererComponent').ImageRUID.DataId,resources.board.ruid);
assert.equal(b.getComponent('FusionPanel/Pager/Next','MOD.Core.SpriteGUIRendererComponent').ImageRUID.DataId,resources.page_button.ruid);
assert.equal(b.getComponent('FusionPanel/Pager','MOD.Core.UITransformComponent').anchoredPosition.y,-284);
assert.equal(b.validate().filter(x=>x.severity==='error').length,0);
const mlua=fs.readFileSync('RootDesk/MyDesk/OptionUI.mlua','utf8');
for(const [prop,p] of [['btnFusionPrev','Prev'],['btnFusionNext','Next'],['fusionPageText','Page']]){
 assert(mlua.includes(prop+' = "'+b.getId('FusionPanel/Pager/'+p)+'"'));
}
assert(!mlua.includes('fusionVerify'));
for(const p of ['board.png','page_button.png','design-preview.png'])assert(fs.statSync(path.join(__dirname,p)).size>0);
fs.copyFileSync(receipt.screenshot,path.join(__dirname,'applied-preview.png'));
receipt.persistedAfterMakerStop=true;
fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',entities:135,persisted:true,screenshot:'applied-preview.png',files:fs.readdirSync(__dirname)}));
