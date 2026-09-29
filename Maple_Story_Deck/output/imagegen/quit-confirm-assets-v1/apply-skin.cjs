// Approved quit-confirmation skin; preserve existing topology, controls and localization.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {UIBuilder}=require('../../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const m=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8'));
const options=JSON.parse(fs.readFileSync(path.join(__dirname,'../option-popup-assets-v1/manifest.json'),'utf8'));
const resources=JSON.parse(fs.readFileSync(path.join(__dirname,'resources.json'),'utf8'));
const before=UIBuilder.read(path.join(__dirname,'before.ui'));
const b=UIBuilder.read('ui/OptionGroup.ui');
const prefix='/ui/OptionGroup/ConfirmPanel/';
const sprite='MOD.Core.SpriteGUIRendererComponent',text='MOD.Core.TextGUIRendererComponent',transform='MOD.Core.UITransformComponent';
const cream={r:1,g:0.953,b:0.82,a:1},brown={r:0.22,g:0.105,b:0.035,a:1};
function fitSprite(p,key,w,h){
 const a=(key==='board'?m:options).assets.find(x=>x.key===key),tr=b.getComponent(p,transform);
 const [x0,y0,x1,y1]=a.bounds,scaleX=w/(x1-x0),scaleY=h/(y1-y0);
 b.patchComponent(p,sprite,{ImageRUID:{DataId:resources[key].ruid},Type:0,PreserveSprite:0,Color:{r:1,g:1,b:1,a:1},
  LocalScale:{x:a.width*scaleX/tr.RectSize.x,y:a.height*scaleY/tr.RectSize.y},
  LocalPosition:{x:-(0.5*(x0+x1)-a.width/2)*scaleX,y:(0.5*(y0+y1)-a.height/2)*scaleY}});
}
function styleText(p,max,min,padding){
 b.patchComponent(p,text,{FontColor:cream,FontStyle:1,FontSize:max,BestFit:true,MinSize:min,MaxSize:max,SizeFit:false,
  OutlineColor:brown,OutlineWidth:0.15,Overflow:2,Padding:padding});
}
fitSprite('ConfirmPanel/Bg','board',600,382);
styleText('ConfirmPanel/Message',36,18,{left:10,right:10,top:5,bottom:5});
styleText('ConfirmPanel/SubMessage',30,16,{left:10,right:10,top:3,bottom:3});
for(const name of ['BtnYes','BtnNo']){
 fitSprite('ConfirmPanel/'+name,'action_button',240,80);
 styleText('ConfirmPanel/'+name,30,16,{left:18,right:18,top:15,bottom:15});
}
// Guard existing button wiring, sibling panels, entity IDs, labels and hitboxes.
const entries=before.listEntities();assert.equal(b.listEntities().length,entries.length);
for(const e of entries){
 const old=before.find(e.path),now=b.find(e.path);assert.equal(now.id,old.id,e.path+' UUID changed');
 if(!e.path.startsWith(prefix))assert.deepEqual(now,old,e.path+' outside skin scope');
 assert.deepEqual(b.getComponent(e.path,'MOD.Core.ButtonComponent'),before.getComponent(e.path,'MOD.Core.ButtonComponent'),e.path+' click behavior changed');
 assert.deepEqual(b.getComponent(e.path,transform),before.getComponent(e.path,transform),e.path+' layout changed');
 const oldText=before.getComponent(e.path,text),newText=b.getComponent(e.path,text);
 if(oldText){assert.equal(newText.Text,oldText.Text,e.path+' text changed');assert.equal(newText.IsLocalizationKey,oldText.IsLocalizationKey,e.path+' localization flag changed');}
}
assert.equal(b.validate().filter(x=>x.severity==='error').length,0);
b.write('ui/OptionGroup.ui');
const reread=UIBuilder.read('ui/OptionGroup.ui');
assert.equal(reread.listEntities().length,131);
for(const p of ['Message','SubMessage','BtnYes','BtnNo'])assert.equal(reread.getComponent('ConfirmPanel/'+p,text).BestFit,true);
const receipt={entities:131,newAssetCount:1,reusedAssetCount:1,unchangedLayout:true,unchangedButtonComponents:true,unchangedLocalizationKeys:true,unchangedOtherPanels:true,
 scriptHash:crypto.createHash('sha256').update(fs.readFileSync('RootDesk/MyDesk/OptionUI.mlua')).digest('hex'),resources};
fs.writeFileSync(path.join(__dirname,'authoring-verification.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
