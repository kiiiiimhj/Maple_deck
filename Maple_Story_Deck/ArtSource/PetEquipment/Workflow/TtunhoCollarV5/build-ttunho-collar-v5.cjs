const fs=require('fs'),path=require('path'),crypto=require('crypto');
const sharp=require('C:/Users/려진/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir=path.resolve('outputs/ttunho-collar-v5'),meta=JSON.parse(fs.readFileSync(dir+'/runtime-originals.json','utf8')),clips=JSON.parse(fs.readFileSync(dir+'/clips.json','utf8'));
const layout={left:-96,top:-128,tileW:192,tileH:176,columns:8,rows:8,density:2},codes=[0,1,3,4,9,10,12,13];
const frames=[],parts={},assets={},indices={},sheets={},world={},fits={};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function inside(x,y,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>y)!=(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])yes=!yes;return yes}
async function register(input,name){const data=await sharp(input).png().toBuffer(),key=name+'-'+hash(data).slice(0,12),file=dir+'/packed/'+key+'.png';fs.writeFileSync(file,data);assets[key]={name:key,file:file.replace(/\\/g,'/'),sha256:hash(data)};return key}
(async()=>{
for(const p of ['fitted-parts','complete','packed','previews','runtime'])fs.mkdirSync(dir+'/'+p,{recursive:true});
for(const p of ['hat','coat','neck','coat-fitted-front'])parts[p]=await sharp(dir+'/parts/'+p+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(const p of ['hat-back','coat-back','hat-roll','coat-roll']){
 const source=fs.existsSync(dir+'/parts/'+p+'.png')?dir+'/parts/'+p+'.png':'outputs/ttunho-equipment-fit-v2/parts/'+p+'.png';
 const m=await sharp(source).metadata();parts[p]=await sharp(source).resize(m.width*2,m.height*2,{kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
}
for(const[name,uid]of Object.entries(clips.motions))if(!['gift','inject'].includes(name))for(const[i,f]of meta.clips[uid].entries())frames.push({name,i,...f,...meta.sprites[f.ruid]});
const head=[[0,0],[24,0],[24,9],[29,12],[31,16],[30,21],[27,25],[23,28],[10,28],[3,25],[0,20]],ear=[[23,1],[27,1],[30,4],[30,8],[28,10],[25,10],[22,7]];
for(const[fIndex,f]of frames.entries()){
 indices[f.ruid]=fIndex;const px=Math.round(f.px*f.w),py=Math.round((1-f.py)*f.h),bodyX=-px,bodyY=-py;
 let hx=-24,hy=-33;
 if(['stand1','move'].includes(f.name)&&f.i%2===1)hy=-32;
 if(['rest','sit'].includes(f.name))hy=-32;
 if(f.name==='sleep'||f.name==='hungry')hy=-28;
 if(f.name==='eat')hy=f.i===0?-32:-31;
 if(f.name==='cry')hy=f.i===0?-33:-32;
 if(f.name==='love')hy=[-33,-31,-33,-32,-33][f.i];
 const back=f.name==='hang',roll=f.name==='roll',low=['sleep','hungry','eat'].includes(f.name),seated=['stand1','rest','sit','cry'].includes(f.name),moving=f.name==='move';
 const anchors={hat:[hx*2+14,hy*2-9],coat:[hx*2+47,hy*2-2],neck:[hx*2+19,hy*2+50]};
 const fitted={};
 for(const slot of ['coat','neck','hat']){
  if(slot==='neck'&&(low||back||roll))continue;
  let src=slot==='coat'&&!back&&!roll?parts['coat-fitted-front']:parts[slot],x=anchors[slot][0],y=anchors[slot][1];
  if(back){src=parts[slot+'-back'];[x,y]=slot==='hat'?[-16,-104]:[-24,-94]}
  if(roll){src=parts[slot+'-roll'];x=-40;y=f.i===0?-80:-72;if(f.i===1){const r=await sharp(src.data,{raw:src.info}).rotate(180).raw().toBuffer({resolveWithObject:true});src=r}}
  // All ordinary masks retain the reference's actual cloth silhouette and
  // sloping gold hem. No torso fill or synthetic straight hem is generated.
  let data=Buffer.from(src.data),w=src.info.width,h=src.info.height;
  if(slot==='coat'&&!back&&!roll&&seated){
   // Keep the already fitted cheek seam intact. The rear drape folds by up
   // to two native pixels in seated poses; never squash the front border.
   const folded=Buffer.alloc(data.length);for(let xx=0;xx<w;xx++){
    const scale=1-.08*Math.max(0,Math.min(1,(xx-18)/20));
    for(let yy=0;yy<h;yy++){const sy=Math.floor(yy/scale);if(sy<h)data.copy(folded,(yy*w+xx)*4,(sy*w+xx)*4,(sy*w+xx+1)*4)}
   }data=folded;
  }
  if(!back&&!roll)for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
   const nx=(x+xx+.5)/2-hx,ny=(y+yy+.5)/2-hy,i=(yy*w+xx)*4;
   if((slot==='hat'||slot==='coat')&&inside(nx,ny,ear))data[i+3]=0;
  }
  if(slot==='neck'&&moving){
   // The chain stays attached to the frame's bobbing chest. Only its lower
   // pendant swings, by half a native pixel, through the four-step cycle.
   const swing=[0,1,0,-1][f.i],wide=w+2,b=Buffer.alloc(wide*h*4);
   for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
    const dx=1+Math.round(swing*Math.max(0,yy-3)/(h-4));data.copy(b,(yy*wide+xx+dx)*4,(yy*w+xx)*4,(yy*w+xx+1)*4);
   }data=b;w=wide;x--;
  }
  const file=dir+'/fitted-parts/'+f.ruid+'-'+slot+'.png';await sharp(data,{raw:{width:w,height:h,channels:4}}).png().toFile(file);
  // Coordinates and part sizes are stored in native units; half-pixels are
  // exact pixels in the density=2 source, never interpolated at pack time.
  fitted[slot]={file:path.relative(dir,file).replace(/\\/g,'/'),x:x/2,y:y/2,w:w/2,h:h/2};
 }
 fits[f.ruid]={motion:f.name,frame:f.i+1,head:[hx,hy],parts:fitted,body:{x:bodyX,y:bodyY,w:f.w,h:f.h}};
 const base=await sharp(dir+'/native-originals/'+f.ruid+'.png').resize(f.w*2,f.h*2,{kernel:'nearest'}).png().toBuffer();
 for(const code of codes){const layers=[{input:base,left:bodyX*2-layout.left,top:bodyY*2-layout.top}];
  for(const[slot,radix]of [['coat',3],['neck',9],['hat',1]])if(Math.floor(code/radix)%3>0&&fitted[slot]){const p=fitted[slot];layers.push({input:dir+'/'+p.file,left:p.x*2-layout.left,top:p.y*2-layout.top})}
  const canvas=await sharp({create:{width:layout.tileW,height:layout.tileH,channels:4,background:'#00000000'}}).composite(layers).png().toBuffer();fs.writeFileSync(dir+'/complete/'+f.ruid+'-'+code+'.png',canvas);
 }
}
for(const code of codes){const layers=frames.map((f,i)=>({input:dir+'/complete/'+f.ruid+'-'+code+'.png',left:i%8*layout.tileW,top:Math.floor(i/8)*layout.tileH}));sheets[code]=await register(await sharp({create:{width:layout.tileW*8,height:layout.tileH*8,channels:4,background:'#00000000'}}).composite(layers).png().toBuffer(),'ttunho-reference-motion-'+code)}
for(const f of frames.filter(f=>['stand','sit'].includes(f.name))){world[f.ruid]={};for(const code of codes)world[f.ruid][code]=await register(fs.readFileSync(dir+'/complete/'+f.ruid+'-'+code+'.png'),'ttunho-reference-world-'+f.name+'-'+f.i+'-'+code)}
const icons={};for(const slot of ['hat','coat','neck']){const p=parts[slot],scale=slot==='coat'?1:slot==='neck'?2:1;const im=await sharp(p.data,{raw:p.info}).resize(p.info.width*scale,p.info.height*scale,{kernel:'nearest'}).png().toBuffer();icons[slot]=await register(await sharp({create:{width:64,height:64,channels:4,background:'#00000000'}}).composite([{input:im,left:Math.floor((64-p.info.width*scale)/2),top:Math.floor((64-p.info.height*scale)/2)}]).png().toBuffer(),'ttunho-reference-icon-'+slot)}
fs.writeFileSync(dir+'/fitting.json',JSON.stringify({layout,frames,fits,codes,indices,sheets,world,icons,assets,partPixelDensity:2},null,2));
let previews=[],naked=[];for(const[i,f]of frames.entries()){
 for(const[code,arr]of [[13,previews],[0,naked]]){
  const crop=await sharp(dir+'/complete/'+f.ruid+'-'+code+'.png').extract({left:38,top:36,width:116,height:98}).resize(348,294,{kernel:'nearest'}).png().toBuffer();arr.push({input:crop,left:i%8*348,top:Math.floor(i/8)*324});arr.push({input:Buffer.from(`<svg width="348" height="30"><text x="174" y="23" text-anchor="middle" font-size="20" fill="#4a2916">${f.name} ${f.i+1}</text></svg>`),left:i%8*348,top:Math.floor(i/8)*324+294});
 }
}
for(const[n,p]of [['all-equipped',previews],['all-native',naked]])await sharp({create:{width:2784,height:2592,channels:4,background:'#eee2c8'}}).composite(p).png().toFile(dir+'/previews/'+n+'.png');
for(const name of Object.keys(clips.motions).filter(n=>!['gift','inject'].includes(n))){const a=frames.filter(f=>f.name===name),buffers=[],delay=[];for(const f of a){buffers.push(await sharp(dir+'/complete/'+f.ruid+'-13.png').extract({left:38,top:36,width:116,height:98}).flatten({background:'#e6dcc2'}).resize(348,294,{kernel:'nearest'}).ensureAlpha().raw().toBuffer());delay.push(Math.round((f.delay||.15)*1000))}await sharp(Buffer.concat(buffers),{raw:{width:348,height:294*a.length,channels:4,pageHeight:294}}).gif({delay,loop:0}).toFile(dir+'/previews/'+name+'.gif')}
console.log({frames:frames.length,assets:Object.keys(assets).length,partPixelDensity:2});
})();

