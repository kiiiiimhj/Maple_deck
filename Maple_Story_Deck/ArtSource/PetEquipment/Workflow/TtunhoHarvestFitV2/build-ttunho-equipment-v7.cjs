const fs=require('fs'),path=require('path'),crypto=require('crypto');
const sharp=require('C:/Users/려진/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir=path.resolve('outputs/ttunho-equipment-fit-v2'),meta=JSON.parse(fs.readFileSync(dir+'/runtime-originals.json','utf8')),clips=JSON.parse(fs.readFileSync(dir+'/clips.json','utf8'));
const layout={left:-96,top:-128,tileW:192,tileH:176,columns:8,rows:8},codes=[0,1,3,4,9,10,12,13];
const frames=[],parts={},assets={},indices={},sheets={},world={},fits={};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function inside(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes}
async function register(input,name){const data=await sharp(input).png().toBuffer();const key=name+'-'+hash(data).slice(0,12),file=dir+'/packed/'+key+'.png';fs.writeFileSync(file,data);assets[key]={name:key,file:file.replace(/\\/g,'/'),sha256:hash(data)};return key}
(async()=>{
 for(const p of ['fitted-parts','complete','packed','previews'])fs.mkdirSync(dir+'/'+p,{recursive:true});
 const partNames=['hat','hat-back','neck','coat','coat-back','coat-sleep','hat-roll','coat-roll'];for(const p of partNames)parts[p]=await sharp(dir+'/parts/'+p+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(const[name,uid]of Object.entries(clips.motions))if(!['gift','inject'].includes(name))for(const[i,f]of meta.clips[uid].entries())frames.push({name,i,...f,...meta.sprites[f.ruid]});
 const stand=await sharp(dir+'/native-originals/'+frames[0].ruid+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 // Locate the original moving ear as an attachment landmark. This never
 // derives clothing masks from body colours or paints any source anatomy.
 function earMatch(data,w,h){let best={score:Infinity,x:22,y:0};for(let y=0;y<h-10;y++)for(let x=0;x<w-7;x++){
  let score=0;for(let dy=0;dy<10;dy++)for(let dx=0;dx<7;dx++){const a=((dy)*51+22+dx)*4,b=((y+dy)*w+x+dx)*4;score+=Math.abs(stand.data[a+3]-data[b+3])*2;for(let c=0;c<3;c++)score+=Math.abs(stand.data[a+c]-data[b+c])*(stand.data[a+3]/255)}
  if(score<best.score)best={score,x,y};}return best}
 const headPoly=[[0,0],[23,0],[23,10],[28,12],[31,16],[30,22],[27,26],[22,29],[10,29],[3,26],[0,20]];
 const earPoly=[[25,3],[28,3],[30,5],[31,8],[29,11],[26,11],[23,9],[23,5]].map(([x,y])=>[x*52/51,y*36/33-3]);
 async function shorten(src,remove){const keep=[];for(let y=0;y<src.info.height;y++)if(!remove.includes(y))keep.push(src.data.subarray(y*src.info.width*4,(y+1)*src.info.width*4));return {data:Buffer.concat(keep),info:{...src.info,height:keep.length}}}
 parts['coat-low']=await shorten(parts.coat,[10,12,14,16]);
 parts['coat-bob']=await shorten(parts.coat,[12]);
 parts['neck-bob']=parts.neck;
 for(const[fIndex,f]of frames.entries()){
  indices[f.ruid]=fIndex;const original=await sharp(dir+'/native-originals/'+f.ruid+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const px=Math.round(f.px*f.w),py=Math.round((1-f.py)*f.h),bodyX=-px,bodyY=-py;
  if(bodyX*2-layout.left<2||bodyY*2-layout.top<2||(bodyX+f.w)*2-layout.left>layout.tileW-2||(bodyY+f.h)*2-layout.top>layout.tileH-2)throw Error('Original frame canvas would be clipped: '+f.ruid);
  const match=earMatch(original.data,f.w,f.h);let hx=-24,hy=-33;
  // These are original-body landmarks in pivot space, not positions inferred
  // from changing expressions, FX, or the overall padded sprite bounds.
  if(['stand1','move'].includes(f.name)&&f.i%2===1)hy=-32;
  if(['rest','sit'].includes(f.name))hy=-32;
  if(f.name==='sleep')hy=-28;
  if(f.name==='hungry')hy=-28;
  if(f.name==='eat')hy=f.i===0?-32:-31;
  if(f.name==='cry')hy=f.i===0?-33:-32;
  if(f.name==='love')hy=[-33,-31,-33,-32,-33][f.i];
  if(f.name==='dung')hy=f.i<5?-33:-33;
  if(f.name==='roll'||f.name==='hang'){hx=0;hy=0}
  const back=f.name==='hang',roll=f.name==='roll',sleep=['sleep','hungry','eat'].includes(f.name);
  const bob=["stand1","move"].includes(f.name)&&f.i%2===1;
  const anchors={hat:back?[-8,-52]:[hx+9,hy],coat:back?[-12,-47]:[hx+25,hy+5],neck:[hx+10,hy+24]};
  if(sleep)anchors.coat=[hx+25,hy+5];
  const chosen={hat:back?'hat-back':'hat',coat:back?'coat-back':sleep?'coat-low':bob?'coat-bob':'coat',neck:bob?'neck-bob':'neck'};
  const fitted={};
  for(const slot of ['coat','neck','hat']){
   if(roll){if(slot==='neck')continue;const rp=parts[slot+'-roll'];let image=sharp(rp.data,{raw:rp.info});if(f.i===1)image=image.rotate(180);const file=dir+'/fitted-parts/'+f.ruid+'-'+slot+'.png';await image.png().toFile(file);fitted[slot]={file:path.relative(dir,file).replace(/\\/g,'/'),x:-20,y:f.i===0?-40:-36,w:40,h:40};continue;}
   if(slot==='neck'&&(sleep||back))continue;
   const src=parts[chosen[slot]],data=Buffer.from(src.data),[x,y]=anchors[slot];
   if(!back){for(let yy=0;yy<src.info.height;yy++)for(let xx=0;xx<src.info.width;xx++){
    const nx=x+xx-hx,ny=y+yy-hy,i=(yy*src.info.width+xx)*4;
    if(slot==='hat'&&inside(nx+.5,ny+.5,earPoly))data[i+3]=0;
    if(slot==='coat'&&(inside(nx+.5,ny+.5,headPoly)||inside(nx+.5,ny+.5,earPoly)||y+yy>=-3))data[i+3]=0;
    if(slot==='neck'&&ny<25)data[i+3]=0;
   }}
   let output=data,info=src.info,ox=x,oy=y;
   if(slot==='coat'&&!back){
    // Each original body frame supplies the actual curved torso silhouette.
    // The generated garment is sewn onto that traced region; it is not a
    // rectangular patch placed beside the pet. Preserve the source ink rim,
    // native tail, head and every moving paw in their original frames.
    const buffer=Buffer.alloc(f.w*f.h*4),profile=[26,26,26,26,26,25,25,25,25,25,25,27,29,30,30,31,31,31,31,31,31,31,30,30,29,28,27,25,23,22];
    const torso=[[24,1],[31,1],[37,7],[44,14],[46,22],[42,29],[33,31],[26,28],[27,24],[30,19],[29,13],[24,10]].map(([x,y])=>[x*52/51,y*36/33-3]);
    const tail=(f.name==='angry'||f.name==='dung')?[[34,-3],[44,-3],[49,4],[49,11],[43,12],[40,7],[35,6]]:[[41,12],[46,13],[53,16],[53,21],[43,21],[40,17]];
    const tailContour=tail.map(([x,y])=>[x*52/51,y*36/33-3]);
    const tex=parts.coat;
    for(let yy=0;yy<f.h;yy++)for(let xx=0;xx<f.w;xx++){
     const wx=xx-px,wy=yy-py,nx=wx-hx,ny=wy-hy,i=(yy*f.w+xx)*4;
     if(ny<0||ny>=30||nx<(profile[Math.min(profile.length-1,Math.max(0,Math.floor((ny+3)*33/36)))]||31)*52/51||!inside(nx+.5,ny+.5,torso)||inside(nx+.5,ny+.5,earPoly)||inside(nx+.5,ny+.5,tailContour)||wy>=-3||original.data[i+3]<235)continue;
     let rim=false;for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const ax=xx+dx,ay=yy+dy;if(ax<0||ay<0||ax>=f.w||ay>=f.h||original.data[(ay*f.w+ax)*4+3]<100)rim=true}if(rim)continue;
     // Sample the generated cloth panel in torso coordinates. A plain green
     // interior of that same painted panel backs the curved collar opening,
     // so original orange fur cannot show through on the covered back.
     const tx=Math.max(0,Math.min(tex.info.width-1,Math.round((nx-24)/22*(tex.info.width-1)))),ty=Math.max(0,Math.min(tex.info.height-1,Math.round((ny-2)/28*(tex.info.height-1))));let j=(ty*tex.info.width+tx)*4;
     if(ny>18)j=(16*tex.info.width+Math.max(7,Math.min(17,Math.round((nx-25)*.7+7))))*4;
     if(tex.data[j+3]===0)j=(16*tex.info.width+14)*4;
     tex.data.copy(buffer,i,j,j+3);buffer[i+3]=255;
     // The hand-fitted visible collar/hem remains over the generated cloth
     // backing where it lies inside this original frame's back silhouette.
     const sx=wx-x,sy=wy-y;if(sx>=0&&sy>=0&&sx<src.info.width&&sy<src.info.height){const q=(sy*src.info.width+sx)*4;if(data[q+3]&&sy<15)data.copy(buffer,i,q,q+4)}
    }
    const gold=[];for(let q=0;q<tex.data.length;q+=4)if(tex.data[q+3]&&tex.data[q]>160&&tex.data[q+1]>130&&tex.data[q+2]<90&&tex.data[q+1]/tex.data[q]>.6)gold.push(q);const gi=gold[Math.floor(gold.length*.55)];
    for(let xx=0;xx<f.w;xx++){let bottom=-1;for(let yy=0;yy<f.h;yy++)if(buffer[(yy*f.w+xx)*4+3])bottom=yy;if(bottom>=0&&bottom-py-hy>=18){const i=(bottom*f.w+xx)*4;tex.data.copy(buffer,i,gi,gi+3)}}
    output=buffer;info={width:f.w,height:f.h,channels:4};ox=bodyX;oy=bodyY;
   }
   if(slot==='neck'){
    const sway=f.name==='move'?[0,1,0,-1][f.i]:0,wide=src.info.width+2,buffer=Buffer.alloc(wide*src.info.height*4);
    for(let yy=0;yy<src.info.height;yy++)for(let xx=0;xx<src.info.width;xx++){const dx=1+Math.round(sway*yy/(src.info.height-1));const i=(yy*src.info.width+xx)*4,j=(yy*wide+xx+dx)*4;data.copy(buffer,j,i,i+4)}
    output=buffer;info={width:wide,height:src.info.height,channels:4};ox=x-1;
   }
   const file=dir+'/fitted-parts/'+f.ruid+'-'+slot+'.png';await sharp(output,{raw:info}).png().toFile(file);fitted[slot]={file:path.relative(dir,file).replace(/\\/g,'/'),x:ox,y:oy,w:info.width,h:info.height};
  }
  fits[f.ruid]={motion:f.name,frame:f.i+1,head:[hx,hy],match:match.score,parts:fitted,body:{x:bodyX,y:bodyY,w:f.w,h:f.h}};
  const base=await sharp(dir+'/native-originals/'+f.ruid+'.png').resize(f.w*2,f.h*2,{kernel:'nearest'}).png().toBuffer();
  for(const code of codes){const layers=[{input:base,left:bodyX*2-layout.left,top:bodyY*2-layout.top}];
   for(const[slot,bit]of [['coat',3],['neck',9],['hat',1]])if(Math.floor(code/bit)%3>0&&fitted[slot]){const p=fitted[slot];layers.push({input:await sharp(dir+'/'+p.file).resize(p.w*2,p.h*2,{kernel:'nearest'}).png().toBuffer(),left:p.x*2-layout.left,top:p.y*2-layout.top})}
   const canvas=await sharp({create:{width:layout.tileW,height:layout.tileH,channels:4,background:'#00000000'}}).composite(layers).png().toBuffer();fs.writeFileSync(dir+'/complete/'+f.ruid+'-'+code+'.png',canvas);
  }
 }
 for(const code of codes){let layers=[];for(const[i,f]of frames.entries())layers.push({input:dir+'/complete/'+f.ruid+'-'+code+'.png',left:i%8*layout.tileW,top:Math.floor(i/8)*layout.tileH});sheets[code]=await register(await sharp({create:{width:layout.tileW*8,height:layout.tileH*8,channels:4,background:'#00000000'}}).composite(layers).png().toBuffer(),'ttunho-motion-'+code)}
 for(const f of frames.filter(f=>['stand','sit'].includes(f.name))){world[f.ruid]={};for(const code of codes)world[f.ruid][code]=await register(fs.readFileSync(dir+'/complete/'+f.ruid+'-'+code+'.png'),'ttunho-world-'+f.name+'-'+f.i+'-'+code)}
 const icons={};for(const slot of ['hat','coat','neck']){const p=parts[slot];let im=await sharp(p.data,{raw:p.info}).resize(p.info.width*2,p.info.height*2,{kernel:'nearest'}).png().toBuffer();icons[slot]=await register(await sharp({create:{width:64,height:64,channels:4,background:'#00000000'}}).composite([{input:im,left:Math.floor((64-p.info.width*2)/2),top:Math.floor((64-p.info.height*2)/2)}]).png().toBuffer(),'ttunho-icon-'+slot)}
 fs.writeFileSync(dir+'/fitting.json',JSON.stringify({layout,frames,fits,codes,indices,sheets,world,icons,assets},null,2));
 let previews=[];for(const[i,f]of frames.entries()){previews.push({input:await sharp(dir+'/complete/'+f.ruid+'-13.png').resize(288,264,{kernel:'nearest'}).png().toBuffer(),left:i%8*288,top:Math.floor(i/8)*288});previews.push({input:Buffer.from('<svg width="288" height="24"><text x="144" y="18" text-anchor="middle" font-size="17" fill="#4a2916">'+f.name+' '+(f.i+1)+'</text></svg>'),left:i%8*288,top:Math.floor(i/8)*288+264})}
 await sharp({create:{width:2304,height:2304,channels:4,background:'#eee2c8'}}).composite(previews).png().toFile(dir+'/previews/all-equipped.png');
 console.log({frames:frames.length,assets:Object.keys(assets).length,worstMatches:Object.entries(fits).sort((a,b)=>b[1].match-a[1].match).slice(0,8).map(([id,v])=>({id,...v,parts:undefined,body:undefined}))});
})();
