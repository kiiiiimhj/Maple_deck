const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {UIBuilder}=require('../../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const m=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8'));
const resources=JSON.parse(fs.readFileSync(path.join(__dirname,'resources.json'),'utf8'));
const before=UIBuilder.read(path.join(__dirname,'before.ui')),b=UIBuilder.read('ui/OptionGroup.ui');
const prefix='/ui/OptionGroup/FusionPanel',sprite='MOD.Core.SpriteGUIRendererComponent',text='MOD.Core.TextGUIRendererComponent',transform='MOD.Core.UITransformComponent';
const cream={r:1,g:0.953,b:0.82,a:1},brown={r:0.22,g:0.105,b:0.035,a:1};
// Maker serializes native floats at float32 precision after play/stop.
function nativeValues(v){return JSON.parse(JSON.stringify(v,(_k,x)=>typeof x==='number'?Math.fround(x):x));}
function sameNative(a,z,message){assert.deepEqual(nativeValues(a),nativeValues(z),message);}
function fitSprite(p,key,w,h){
 const a=m.assets.find(x=>x.key===key),tr=b.getComponent(p,transform);
 const [x0,y0,x1,y1]=a.bounds,sx=w/(x1-x0),sy=h/(y1-y0);
 b.patchComponent(p,sprite,{ImageRUID:{DataId:resources[key].ruid},Type:0,PreserveSprite:0,Color:{r:1,g:1,b:1,a:1},
  LocalScale:{x:a.width*sx/tr.RectSize.x,y:a.height*sy/tr.RectSize.y},
  LocalPosition:{x:-(0.5*(x0+x1)-a.width/2)*sx,y:(0.5*(y0+y1)-a.height/2)*sy}});
}
function styleText(p,max,min,padding={left:0,right:0,top:0,bottom:0}){
 b.patchComponent(p,text,{Font:'Maple',FontColor:cream,FontStyle:1,FontSize:max,BestFit:true,MinSize:min,MaxSize:max,SizeFit:false,
  OutlineColor:brown,OutlineWidth:0.15,Overflow:2,Padding:padding});
}
fitSprite('FusionPanel/Bg','board',1120,720);
b.patch('FusionPanel/Title',{rect_size:[850,56]});
styleText('FusionPanel/Title',42,22);
for(let i=1;i<=7;i++){
 styleText('FusionPanel/Row'+i+'/Name',23,12);
 styleText('FusionPanel/Row'+i+'/Equals',30,20);
 for(let j=1;j<=3;j++)styleText('FusionPanel/Row'+i+'/Plus'+j,28,18);
}
if(!b.find('FusionPanel/Pager'))b.empty('FusionPanel/Pager',{pos:[0,-300],rect_size:[320,88]});
b.patch('FusionPanel/Pager',{pos:[0,-284],display_order:100});
for(const [name,x,label] of [['Prev',-112,'<'],['Next',112,'>']]){
 const p='FusionPanel/Pager/'+name;
 if(!b.find(p))b.button(p,label,{pos:[x,0],rect_size:[88,88],font_size:48,image_ruid:resources.page_button.ruid,sprite_type:0});
 fitSprite(p,'page_button',60,60);
 styleText(p,38,24,{left:15,right:15,top:12,bottom:12});
 b.patchComponent(p,text,{IsRichText:false});
}
if(!b.find('FusionPanel/Pager/Page'))b.text('FusionPanel/Pager/Page','1',{pos:[0,0],rect_size:[116,64],size:36,bestfit:true});
styleText('FusionPanel/Pager/Page',36,20);
// Keep the entire previous layout except the deliberately widened title.
for(const e of before.listEntities()){
 const old=before.find(e.path),now=b.find(e.path);assert.equal(now.id,old.id);
 if(!e.path.startsWith(prefix+'/')||e.path===prefix+'/BtnClose')sameNative(now,old,e.path+' outside scope');
 sameNative(b.getComponent(e.path,'MOD.Core.ButtonComponent'),before.getComponent(e.path,'MOD.Core.ButtonComponent'),e.path+' button changed');
 if(e.path!==prefix+'/Title')sameNative(b.getComponent(e.path,transform),before.getComponent(e.path,transform),e.path+' layout changed');
 const a=before.getComponent(e.path,text),z=b.getComponent(e.path,text);
 if(a){assert.equal(z.Text,a.Text);assert.equal(z.IsLocalizationKey,a.IsLocalizationKey);}
 // Keep existing skill icon sprites and their visibility flags exactly as authored.
 if(/\/Row\d+\/(Slot\d+|Result)$/.test(e.path))sameNative(now,old);
}
assert.equal(b.validate().filter(x=>x.severity==='error').length,0);
b.write('ui/OptionGroup.ui',{bind:{mlua:'RootDesk/MyDesk/OptionUI.mlua',props:{btnFusionPrev:'FusionPanel/Pager/Prev',btnFusionNext:'FusionPanel/Pager/Next',fusionPageText:'FusionPanel/Pager/Page'}}});
const after=UIBuilder.read('ui/OptionGroup.ui');assert.equal(after.listEntities().length,135);
const receipt={entities:135,originalEntitiesPreserved:131,newPagerEntities:4,originalRowsPreserved:7,unchangedClose:true,unchangedIcons:true,unchangedLocalizationKeys:true,unchangedOtherPanels:true,resources,
 bindings:{prev:after.getId('FusionPanel/Pager/Prev'),next:after.getId('FusionPanel/Pager/Next'),page:after.getId('FusionPanel/Pager/Page')}};
fs.writeFileSync(path.join(__dirname,'authoring-verification.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
