const fs = require('fs');
const assert = require('assert/strict');
const { UIBuilder } = require('../../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const file = 'ui/WorldCharacterSelectGroup.ui';
const b = UIBuilder.read(file);
const root = '/ui/WorldCharacterSelectGroup/Panel';
const S = 'MOD.Core.SpriteGUIRendererComponent';
const T = 'MOD.Core.TextComponent';
const U = 'MOD.Core.UITransformComponent';
const resources = require('./resources.json');
const manifest = require('./manifest.json');
const assets = Object.fromEntries(manifest.assets.map(a => [a.key,a]));
const snapshot = b.listEntities().map(e=>({path:e.path,id:b.find(e.path).id,components:b.find(e.path).componentNames}));
const close = JSON.stringify(b.find(root+'/BtnClose'));
const slider = JSON.stringify(b.getComponent(root+'/CharScrollBar','MOD.Core.SliderComponent'));
const white={r:1,g:1,b:1,a:1};
const brown={r:0.22,g:0.09,b:0.025,a:1};
// Account sprites retain their original transparent pixels. Normalize only their renderer,
// leaving hit boxes, native text and child transforms independent of PNG padding.
function art(path,key,extra={}) {
  const a=assets[key], [l,t,r,d]=a.bounds, w=r-l,h=d-t;
  const rect=b.getComponent(root+'/'+path,U).RectSize;
  b.patchComponent(root+'/'+path,S,{
    ImageRUID:{DataId:resources[key]},Color:white,PreserveSprite:0,Type:0,Outline:false,
    LocalScale:{x:a.width/w,y:a.height/h},
    LocalPosition:{x:(a.width/2-(l+r)/2)*rect.x/w,y:((t+d)/2-a.height/2)*rect.y/h},
    ...extra
  });
}
function rect(path,pos,size,extra={}) { b.patch(root+'/'+path,{anchor:'middle-center',pivot:[0.5,0.5],pos,rect_size:size,...extra}); }
function label(path,max,min,padding={left:4,right:4,top:2,bottom:2}) {
  b.patchComponent(root+'/'+path,T,{BestFit:true,MinSize:min,MaxSize:max,FontSize:max,FontColor:{r:1,g:0.97,b:0.86,a:1},UseOutLine:true,OutlineColor:brown,OutlineWidth:1,Padding:padding,SizeFit:false});
}
rect('Bg',[0,0],[1400,900]); art('Bg','board');
rect('BtnConfirm',[-9.54,-360],[330,104]); art('BtnConfirm','confirm_button'); label('BtnConfirm',36,22,{left:28,right:28,top:12,bottom:12});
for(const [name,x,flip] of [['BtnWorldPrev',-270,false],['BtnWorldNext',270,true]]) {
  rect(name,[x,178],[90,90]); art(name,'arrow_button',{FlipX:flip});
  const sprite=b.getComponent(root+'/'+name,S);
  b.patchComponent(root+'/'+name,S,{LocalScale:{x:sprite.LocalScale.x*76/90,y:sprite.LocalScale.y*76/90}});
}
// Photos extend beneath the transparent-window frames; rims render above photo edges.
for(const [side,x,order] of [['Left',-345,6],['Right',345,8],['Center',0,10]]) {
  const center=side==='Center', frame='WorldImage'+side, photo=frame+'Photo';
  rect(frame,[x,300],center?[560,202]:[380,145],{display_order:order+1});
  b.patchComponent(root+'/'+frame,U,{UIScale:{x:1,y:1,z:1},Scale:{x:1,y:1,z:1}});
  art(frame,'world_frame');
  rect(photo,[x,300],center?[510,154.3077]:[344,109],{display_order:order});
  b.patchComponent(root+'/'+photo,U,{UIScale:{x:1,y:1,z:1},Scale:{x:1,y:1,z:1}});
  b.patchComponent(root+'/'+photo,S,{LocalScale:{x:center?528/510:360/344,y:center?174/154.3077:124/109}});
  if(center) b.patchComponent(root+'/'+photo+'/LockOverlay',S,{LocalScale:{x:528/510,y:174/154}});
  if(!center) for(let i=0;i<2;i++) rect(photo+'/PartBadge'+i,[-145+i*38,-34],[32,32]);
  for(let i=0;i<2;i++) {
    const badge=photo+'/PartBadge'+i;
    b.patchComponent(root+'/'+badge,S,{Color:{r:0.24,g:0.12,b:0.055,a:0.95},OutlineColor:{r:1,g:0.76,b:0.23,a:1}});
    b.patchComponent(root+'/'+badge+'/Bevel',S,{Color:{r:1,g:0.86,b:0.46,a:0.8}});
    if(!center) { rect(badge+'/Icon',[0,0],[24,24]); rect(badge+'/Bevel',[0,12],[24,2]); }
  }
  // Keep the original soft black dim behind the attack/HP labels.
  for(const [suffix,alpha] of [['StatBg',0.16],['StatBg/Core',0.34],['StatBg/Mid',0.2]]) b.patchComponent(root+'/'+photo+'/'+suffix,S,{Color:{r:0,g:0,b:0,a:alpha}});
}
rect('WorldNameText',[0,185],[420,70]); art('WorldNameText','world_name'); label('WorldNameText',34,20,{left:62,right:62,top:8,bottom:8});
for(let i=0;i<8;i++) {
  const slot='CharScrollArea/CharList/CharSlot_'+i;
  art(slot,'character_card');
  rect(slot+'/Name',[0,-57],[148,34]); label(slot+'/Name',22,14);
}
rect('CharDescPanel/Bg',[-57.49,0],[300,420]); art('CharDescPanel/Bg','description_panel');
rect('CharDescPanel/NameText',[-45,151],[210,44]); label('CharDescPanel/NameText',28,18);
rect('CharDescPanel/DescText',[-57,0],[228,242]); label('CharDescPanel/DescText',22,16,{left:4,right:4,top:4,bottom:4});
b.patchComponent(root+'/CharDescPanel/DescText',T,{Alignment:1});
art('UnlimitedModeBg','mode_bar'); art('UnlimitedModeBg/Checkbox','checkbox'); label('UnlimitedModeBg/Label',22,16);
// The SliderComponent (including existing gem handle RUID, size and behavior) stays byte-identical.
art('CharScrollBar','scroll_track');
assert.equal(JSON.stringify(b.find(root+'/BtnClose')),close,'X button changed');
assert.equal(JSON.stringify(b.getComponent(root+'/CharScrollBar','MOD.Core.SliderComponent')),slider,'Slider/handle changed');
assert.deepEqual(b.listEntities().map(e=>({path:e.path,id:b.find(e.path).id,components:b.find(e.path).componentNames})),snapshot,'UI structure/bindings changed');
assert.deepEqual(b.validate(),[]);
b.write(file);
for(const a of manifest.assets) { a.ruid=resources[a.key]; a.accountResourceName=a.key==='world_frame'?'start_popup_world_frame_clear_v2':'start_popup_'+a.key+'_v1'; }
fs.writeFileSync(__dirname+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('83 entities and component bindings preserved; X and entire SliderComponent unchanged.');
