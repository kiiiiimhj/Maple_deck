// Approved Options popup art only. All entities, native controls, keys, and handlers retained.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {UIBuilder}=require('../../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const m=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8'));
const resources=JSON.parse(fs.readFileSync(path.join(__dirname,'resources.json'),'utf8'));
const before=UIBuilder.read(path.join(__dirname,'before.ui'));
const b=UIBuilder.read('ui/OptionGroup.ui');
const prefix='/ui/OptionGroup/OptionPanel';
const sprite='MOD.Core.SpriteGUIRendererComponent',text='MOD.Core.TextGUIRendererComponent';
const cream={r:1,g:0.953,b:0.82,a:1},brown={r:0.22,g:0.105,b:0.035,a:1};
function fitSprite(p,key,w,h){
 const a=m.assets.find(x=>x.key===key),tr=b.getComponent(p,'MOD.Core.UITransformComponent');
 const [x0,y0,x1,y1]=a.bounds,scaleX=w/(x1-x0),scaleY=h/(y1-y0);
 b.patchComponent(p,sprite,{ImageRUID:{DataId:resources[key].ruid},Type:0,PreserveSprite:0,Color:{r:1,g:1,b:1,a:1},
  LocalScale:{x:a.width*scaleX/tr.RectSize.x,y:a.height*scaleY/tr.RectSize.y},
  LocalPosition:{x:-(0.5*(x0+x1)-a.width/2)*scaleX,y:(0.5*(y0+y1)-a.height/2)*scaleY}});
}
function styleText(p,max,min,padding){
 b.patchComponent(p,text,{FontColor:cream,FontStyle:1,FontSize:max,BestFit:true,MinSize:min,MaxSize:max,SizeFit:false,
  OutlineColor:brown,OutlineWidth:0.15,Overflow:2,Padding:padding??{left:0,right:0,top:0,bottom:0}});
}
b.patch('OptionPanel/Bg',{rect_size:[560,840]});
fitSprite('OptionPanel/Bg','board',530,780);
styleText('OptionPanel/Title',44,22);
for(const group of ['BgmToggle','SfxToggle','SkillToggle']){
 fitSprite('OptionPanel/'+group+'/Circle','toggle',104,104);
 styleText('OptionPanel/'+group+'/Circle',26,13,{left:13,right:13,top:12,bottom:12});
 styleText('OptionPanel/'+group+'/Label',22,13,{left:3,right:3,top:0,bottom:0});
}
for(const name of ['BtnFusion','BtnTutorial','BtnQuit']){
 fitSprite('OptionPanel/'+name,'action_button',300,86);
 styleText('OptionPanel/'+name,34,18,{left:22,right:22,top:18,bottom:18});
}
// Contract checks: preserve topology, click behavior, localization and all unrelated panels.
const entries=before.listEntities();assert.equal(b.listEntities().length,entries.length);
for(const e of entries){
 const old=before.find(e.path),now=b.find(e.path);assert.equal(now.id,old.id,e.path+' UUID changed');
 if(!e.path.startsWith(prefix+'/')||e.path===prefix+'/BtnClose')assert.deepEqual(now,old,e.path+' outside skin scope');
 assert.deepEqual(b.getComponent(e.path,'MOD.Core.ButtonComponent'),before.getComponent(e.path,'MOD.Core.ButtonComponent'),e.path+' button behavior changed');
 const oldText=before.getComponent(e.path,text),newText=b.getComponent(e.path,text);
 if(oldText){assert.equal(newText.Text,oldText.Text,e.path+' localization text changed');assert.equal(newText.IsLocalizationKey,oldText.IsLocalizationKey,e.path+' localization flag changed');}
 if(e.path!==prefix+'/Bg')assert.deepEqual(b.getComponent(e.path,'MOD.Core.UITransformComponent'),before.getComponent(e.path,'MOD.Core.UITransformComponent'),e.path+' control placement changed');
}
assert.equal(b.validate().filter(x=>x.severity==='error').length,0);
b.write('ui/OptionGroup.ui');
const reread=UIBuilder.read('ui/OptionGroup.ui');assert.equal(reread.listEntities().length,131);
const receipt={entities:131,assetCount:3,unchangedClose:true,unchangedControls:true,unchangedLocalizationKeys:true,unchangedOtherPanels:true,
 scriptHash:crypto.createHash('sha256').update(fs.readFileSync('RootDesk/MyDesk/OptionUI.mlua')).digest('hex'),
 targets:m.assets.map(a=>({key:a.key,...resources[a.key]}))};
fs.writeFileSync(path.join(__dirname,'authoring-verification.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
