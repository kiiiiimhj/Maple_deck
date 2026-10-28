const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const {MakerSession}=require('./maker-session.cjs');
const m=new MakerSession(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const d=path.resolve('outputs/acorn-exchange-guide-v2');
const ui='G:/Maple_Story_Deck/ui/ThanksgivingGroup.ui';
const mlua='G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/ThanksgivingUI.mlua';
const pet='G:/Maple_Story_Deck/ui/PetHouseGroup.ui';
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
(async()=>{
 await m.request('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'Codex-short-guide-arrows',version:'2'}});
 m.p.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 await m.call('maker_stop');
 let edit=false;for(let i=0;i<16;i++){await sleep(500);if((await m.call('maker_refresh_workspace')).status==='ok'){edit=true;break}}
 if(!edit)throw Error('Maker still in Play');
 const b=UIBuilder.read(ui),before=new Map(b.listEntities().map(e=>[e.path,JSON.stringify(b.find(e.path))]));
 const petHash=hash(pet),l=JSON.parse(fs.readFileSync(d+'/layout.json','utf8')),r=JSON.parse(fs.readFileSync(d+'/registered.json','utf8'));
 const U='MOD.Core.UITransformComponent',S='MOD.Core.SpriteGUIRendererComponent';
 const original='G:/Maple_Story_Deck/ArtSource/pet-tutorial/assets/connector-arrow-v3.png';
 const ref=UIBuilder.read(pet),refU=ref.getComponent('Tutorial/Content/Arrow1',U);
 const w=refU.RectSize.x,h=refU.RectSize.y;
 // Existing pet-house/Raid connector, same aspect and size. Tip is the bottom point of its painted alpha contour.
 const nativeTip=[1083,1046],sourceSize=[1272,1236];
 const tip=[(nativeTip[0]-sourceSize[0]/2)*w/sourceSize[0],(sourceSize[1]/2-nativeTip[1])*h/sourceSize[1]];
 fs.copyFileSync(original,d+'/connector-arrow-reference.png');
 const sharp=require('C:/Users/려진/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
 for(let i=0;i<2;i++){
  const a=l.routes[i],flip=i===1,local=[flip?-tip[0]:tip[0],tip[1]];
  a.rejectedLongAsset={file:a.file,w:a.w,h:a.h,ruid:r[a.id].ruid};
  Object.assign(a,{file:d+'/arrow'+(i+1)+'-short-preview.png',w,h,flipX:flip,rotation:0,position:[a.tip.x-local[0],a.tip.y-local[1]],tipLocal:local,source:original,sourceRuid:'6643f10005754442948e6e60629b9359',nativeTip,sourceSize});
  let im=sharp(original).resize(Math.round(w),Math.round(h));if(flip)im=im.flop();await im.png().toFile(a.file);
  r[a.id]={name:a.id,file:original,w,h,ruid:a.sourceRuid,reused:true,flipX:flip};
  const p='Overlay/Tutorial/Content/Arrow'+(i+1);
  b.patch(p,{pos:a.position,rect_size:[w,h]});
  b.patchComponent(p,S,{ImageRUID:{DataId:a.sourceRuid},FlipX:flip,FlipY:false,Color:{r:1,g:1,b:1,a:1},Type:0,PreserveSprite:0});
  b.patchComponent(p,U,{ZRotation:0,Rotation:{x:0,y:0,z:0},QuaternionRotation:{x:0,y:0,z:0,w:1}});
 }
 const changed=b.listEntities().filter(e=>before.get(e.path)!==JSON.stringify(b.find(e.path))).map(e=>e.path);
 if(changed.length!==2||changed.some(p=>!/Tutorial\/Content\/Arrow[12]$/.test(p)))throw Error('Arrow scope exceeded');
 const source=fs.readFileSync(mlua,'utf8'),rx=/property table AcornGuideArrows = \{[^\r\n]+\}/g;
 if([...source.matchAll(rx)].length!==1)throw Error('Ambiguous arrow declaration');
 const patched=source.replace(rx,'property table AcornGuideArrows = {"6643f10005754442948e6e60629b9359","6643f10005754442948e6e60629b9359"}');
 const backup=path.resolve('work/backups/guide-short-arrows-'+Date.now());fs.mkdirSync(backup,{recursive:true});
 UIBuilder.read(ui).write(backup+'/ThanksgivingGroup.ui',{lint:false});fs.writeFileSync(backup+'/ThanksgivingUI.mlua',source);
 if(fs.readFileSync(mlua,'utf8')!==source)throw Error('Concurrent source edit; reload required');
 b.write(ui,{lint:true,strict:true});fs.writeFileSync(mlua,patched);
 fs.writeFileSync(d+'/layout.json',JSON.stringify(l,null,2));fs.writeFileSync(d+'/registered.json',JSON.stringify(r,null,2));
 if(hash(pet)!==petHash)throw Error('Pet House changed externally during run');
 fs.writeFileSync(d+'/short-arrow-scope.json',JSON.stringify({backup,changed,protectedNodes:before.size-changed.length,petHouseHash:petHash,petHouseUntouched:true,sourceChange:'AcornGuideArrows only',size:[w,h]},null,2));
 if((await m.call('maker_refresh_workspace')).status!=='ok')throw Error('Refresh failed');await sleep(3000);
 await m.call('maker_clear_logs');await m.call('maker_play');
 console.log({changed,size:[w,h],petHouseUntouched:true});
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>m.close());
