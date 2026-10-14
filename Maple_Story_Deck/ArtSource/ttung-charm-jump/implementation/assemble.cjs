// Extend the project's editable pixel animation rig. Paint/colour is sampled once
// from the existing charm pose; all motion uses inverse sampling at whole pixels.
const fs=require('fs'),crypto=require('crypto');
const sharp=require('C:/Users/려진/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out='outputs/ttung-charm-jump',N=128,COUNT=20,period=.66;
fs.mkdirSync(out,{recursive:true});
const px=(x,y)=>(y*N+x)*4;
const original=JSON.parse(fs.readFileSync('outputs/pet-ttungttang-v5/palette.json','utf8'));
const palette=[...original,[246,114,159],[221,83,126],[178,52,91],[126,31,48],[246,169,193],[249,219,226],[118,190,219],[172,220,239],[231,247,251],[59,111,158]];
function nearest(r,g,b){let best=0,d=Infinity;palette.forEach((c,i)=>{const q=(r-c[0])**2+(g-c[1])**2+(b-c[2])**2;if(q<d){d=q;best=i;}});return palette[best];}
function solid(b,x,y){return x>=0&&y>=0&&x<N&&y<N&&b[px(x,y)+3]===255;}
function contour(input){
 const b=Buffer.from(input);
 // Keep a continuous one-pixel ink boundary. Only boundary pixels are touched;
 // interior eyes, muzzle and fur are copied from the same immutable master.
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  if(!solid(input,x,y))continue;
  if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!solid(input,x+dx,y+dy))){
   const p=px(x,y);b[p]=22;b[p+1]=13;b[p+2]=15;
  }
 }
 return b;
}
function closeInnerSeams(input){
 const b=Buffer.from(input),visited=new Set();
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const start=y*N+x;if(solid(b,x,y)||visited.has(start))continue;
  const queue=[[x,y]],part=[],neighbors=[];let boundary=false;
  visited.add(start);
  for(let k=0;k<queue.length;k++){
   const [cx,cy]=queue[k];part.push([cx,cy]);if(cx===0||cy===0||cx===N-1||cy===N-1)boundary=true;
   for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
    const ax=cx+dx,ay=cy+dy;if(ax<0||ay<0||ax>=N||ay>=N)continue;
    if(solid(b,ax,ay)){neighbors.push([ax,ay]);continue;}
    const id=ay*N+ax;if(!visited.has(id)){visited.add(id);queue.push([ax,ay]);}
   }
  }
  if(!boundary&&part.length<=12&&neighbors.length){
   for(const [cx,cy]of part){const near=neighbors.reduce((a,c)=>(cx-c[0])**2+(cy-c[1])**2<(cx-a[0])**2+(cy-a[1])**2?c:a);b.copy(b,px(cx,cy),px(...near),px(...near)+4);}
  }
 }
 return b;
}
function pose(t){
 let nod=0,foot=123,tuck=0;
 if(t<.10)nod=Math.round(4*Math.sin(t/.10*Math.PI/2));
 else if(t<.17)nod=Math.round(4-6*(t-.10)/.07);
 else if(t<.47){const q=(t-.17)/.30;nod=-Math.round(Math.sin(q*Math.PI));foot=123-Math.round(3*Math.sin(q*Math.PI));tuck=Math.sin(q*Math.PI)*2;}
 else if(t<.54)nod=-Math.round(1-(t-.47)/.07);
 else if(t<.60)nod=Math.round(4*Math.sin((t-.54)/.06*Math.PI));
 else nod=Math.round(2*(1-(t-.60)/.06));
 return {nod,foot,tuck,wag:Math.sin(t/period*Math.PI*2)*1.3};
}
function frame(master,t){
 const p=pose(t),b=Buffer.alloc(master.length),hinge=70,joint=hinge+p.nod;
 for(let y=0;y<N;y++){
  const sy=y<=joint?y-p.nod:Math.round(hinge+(y-joint)*(123-hinge)/(p.foot-joint));
  if(sy<0||sy>N-1)continue;
  for(let x=0;x<N;x++){
   let shift=0;
   if(sy>100)shift=(x<64?1:-1)*p.tuck*Math.min(1,(sy-100)/23);
   // The tail root stays attached; only the tip sways by one source pixel.
   if(x>=96&&sy<100)shift+=p.wag*Math.min(1,Math.max(0,(100-sy)/35));
   const sx=Math.round(x-shift);if(sx<0||sx>=N||!solid(master,sx,sy))continue;
   master.copy(b,px(x,y),px(sx,sy),px(sx,sy)+4);
  }
 }
 return {pixels:contour(closeInnerSeams(b)),pose:p};
}
(async()=>{
 const source=await sharp('outputs/pet-skills/roar.png').ensureAlpha().raw().toBuffer();let master=Buffer.alloc(source.length);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const p=px(x,y);if(source[p+3]<160)continue;
  const c=nearest(source[p],source[p+1],source[p+2]);master[p]=c[0];master[p+1]=c[1];master[p+2]=c[2];master[p+3]=255;
 }
 master=contour(closeInnerSeams(master));
 await sharp(master,{raw:{width:N,height:N,channels:4}}).png().toFile(out+'/master.png');
 const specs=[],frames=[],timing=[];
 for(let i=0;i<COUNT;i++){
  const t=i/COUNT*period,{pixels:b,pose:p}=frame(master,t),name='jump-'+String(i+1).padStart(2,'0'),file=out+'/'+name+'.png';
  await sharp(b,{raw:{width:N,height:N,channels:4}}).png().toFile(file);
  await sharp(b,{raw:{width:N,height:N,channels:4}}).resize(256,256,{kernel:'nearest'}).png().toFile(out+'/'+name+'-preview.png');
  const bounds=await sharp(file).trim({threshold:0}).metadata();
  let bottom=0;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(solid(b,x,y))bottom=Math.max(bottom,y+1);
  specs.push({name,file:strPath(file),width:N,height:N,filter:'Point',sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),bottom});
  frames.push(b);timing.push({time:t,...p,bottom});
 }
 await sharp({create:{width:1280,height:1024,channels:4,background:'#b9a582'}}).composite(frames.map((b,i)=>({input:out+'/jump-'+String(i+1).padStart(2,'0')+'-preview.png',left:i%5*256,top:Math.floor(i/5)*256}))).png().toFile(out+'/contact.png');
 const preview=[];
 for(let k=0;k<COUNT;k++){
  const t=k/COUNT*period,q=(t-.12)/.42,h=t>.12&&t<.54?Math.round(4*.36*q*(1-q)*170):0;
  const sprite=await sharp(frames[k],{raw:{width:N,height:N,channels:4}}).resize(256,256,{kernel:'nearest'}).png().toBuffer();
  const canvas=await sharp({create:{width:320,height:360,channels:4,background:'#b9a582'}}).composite([{input:sprite,left:32,top:100-h}]).raw().toBuffer();preview.push(canvas);
 }
 await sharp(Buffer.concat(preview),{raw:{width:320,height:360*COUNT,channels:4,pageHeight:360}}).gif({loop:0,delay:33}).toFile(out+'/jump-loop.gif');
 fs.writeFileSync(out+'/asset-specs.json',JSON.stringify(specs,null,2));fs.writeFileSync(out+'/timing.json',JSON.stringify({period,launch:.12,landing:.54,frames:timing},null,2));fs.writeFileSync(out+'/palette.json',JSON.stringify(palette));
 fs.writeFileSync(out+'/provenance.json',JSON.stringify({mode:'existing editable pixel rig',source:'outputs/pet-skills/roar.png',paintedFaceMasters:1,fixedPalette:true,wholePixelInverseSampling:true,frames:COUNT,independentBodyAndLegPoses:true,noImageGenerationCall:true},null,2));
 console.log('Created 20-frame charm jump from one immutable pixel master.');
})().catch(e=>{console.error(e);process.exit(1)});
function strPath(p){return require('path').resolve(p);}
