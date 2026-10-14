const fs=require('fs'),crypto=require('crypto');
const sharp=require('C:/Users/려진/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out='outputs/ttung-charm-jump-v2',N=128,COUNT=24,period=.80;
const px=(x,y)=>(y*N+x)*4,ink=[22,13,15];
const palette=JSON.parse(fs.readFileSync('outputs/ttung-charm-jump/palette.json','utf8'));
const solid=(b,x,y)=>x>=0&&y>=0&&x<N&&y<N&&b[px(x,y)+3]>0;
const poly=(x,y,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])c=!c;return c;};
function part(b,f){const r=Buffer.alloc(b.length);for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(f(x,y))b.copy(r,px(x,y),px(x,y),px(x,y)+4);return r;}
function over(dst,src){for(let p=0;p<src.length;p+=4)if(src[p+3])src.copy(dst,p,p,p+4);return dst;}
function move(src,dx,dy){const b=Buffer.alloc(src.length);for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(solid(src,x-dx,y-dy))src.copy(b,px(x,y),px(x-dx,y-dy),px(x-dx,y-dy)+4);return b;}
function rotate(src,pivot,angle,dy){const b=Buffer.alloc(src.length),c=Math.cos(angle),s=Math.sin(angle);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const dx=x-pivot[0],ay=y-dy-pivot[1],sx=Math.round(pivot[0]+c*dx+s*ay),sy=Math.round(pivot[1]-s*dx+c*ay);if(solid(src,sx,sy))src.copy(b,px(x,y),px(sx,sy),px(sx,sy)+4);}return b;}
function paw(src,from,to,angle,vertical){const b=Buffer.alloc(src.length),c=Math.cos(angle),s=Math.sin(angle);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const dx=x-to[0],dy=y-to[1],sx=Math.round(from[0]+(c*dx+s*dy)/.75),sy=Math.round(from[1]+(-s*dx+c*dy)/vertical);if(solid(src,sx,sy))src.copy(b,px(x,y),px(sx,sy),px(sx,sy)+4);}return b;}
function bone(src,a,b,c,A,B,C){
 const r=Buffer.alloc(src.length),from=[[a,b],[b,c]],to=[[A,B],[B,C]];
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  let best=null;
  for(let k=0;k<2;k++){
   const [u,v]=to[k],dx=v[0]-u[0],dy=v[1]-u[1],len=Math.hypot(dx,dy),q=((x-u[0])*dx+(y-u[1])*dy)/(len*len);
   if(q<-.12||q>1.12)continue;
   const t=Math.max(0,Math.min(1,q)),side=((x-u[0])*(-dy)+(y-u[1])*dx)/len;
   const [f,g]=from[k],fdx=g[0]-f[0],fdy=g[1]-f[1],fl=Math.hypot(fdx,fdy);
   const sx=Math.round(f[0]+t*fdx-side*fdy/fl),sy=Math.round(f[1]+t*fdy+side*fdx/fl);
   const dist=(q-t)**2*len*len+side*side;
   if(solid(src,sx,sy)&&(!best||dist<best.dist))best={sx,sy,dist};
  }
  if(best)src.copy(r,px(x,y),px(best.sx,best.sy),px(best.sx,best.sy)+4);
 }
 return r;
}
function finish(input){
 let b=Buffer.from(input);
 // Keep only the connected character, excluding any clipped cut-mask flecks.
 const opaqueSeen=new Set(),parts=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++){let id=y*N+x;if(!solid(b,x,y)||opaqueSeen.has(id))continue;const q=[[x,y]];opaqueSeen.add(id);for(let k=0;k<q.length;k++){const[a,c]=q[k];for(const[d,e]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[-1,1],[1,-1]]){const xx=a+d,yy=c+e,v=yy*N+xx;if(solid(b,xx,yy)&&!opaqueSeen.has(v)){opaqueSeen.add(v);q.push([xx,yy]);}}}parts.push(q);}parts.sort((a,c)=>c.length-a.length);for(const q of parts.slice(1))for(const[x,y]of q)b.fill(0,px(x,y),px(x,y)+4);
 // Back only enclosed cut-layer seams, using nearby interior source colour.
 const seen=new Set();for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const id=y*N+x;if(solid(b,x,y)||seen.has(id))continue;
  const q=[[x,y]],pts=[],neighbors=[];seen.add(id);let edge=false;
  for(let k=0;k<q.length;k++){const [a,c]=q[k];pts.push([a,c]);edge||=a===0||c===0||a===127||c===127;for(const[d,e]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=a+d,yy=c+e;if(xx<0||yy<0||xx>=N||yy>=N)continue;if(solid(b,xx,yy)){neighbors.push([xx,yy]);continue;}const v=yy*N+xx;if(!seen.has(v)){seen.add(v);q.push([xx,yy]);}}}
  if(!edge&&pts.length<150&&neighbors.length)for(const[a,c]of pts){const near=neighbors.reduce((u,v)=>(a-v[0])**2+(c-v[1])**2<(a-u[0])**2+(c-u[1])**2?v:u);b.copy(b,px(a,c),px(...near),px(...near)+4);}
 }
 // Every silhouette pixel has the same opaque ink, never a blurred alpha fringe.
 const copy=Buffer.from(b);for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(solid(copy,x,y)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,c])=>!solid(copy,x+a,y+c))){const p=px(x,y);b[p]=ink[0];b[p+1]=ink[1];b[p+2]=ink[2];}
 return b;
}
const keys=[
 {t:0,d:3,L:-65,R:55,lk:[51,106],lf:[57,119],rk:[80,105],rf:[80,119]},
 {t:.12,d:10,L:-100,R:80,lk:[43,110],lf:[54,119],rk:[89,109],rf:[80,119]},
 {t:.22,d:0,L:0,R:0,lk:[58,105],lf:[63,120],rk:[81,106],rf:[82,122]},
 {t:.38,d:0,L:12,R:-15,lk:[40,98],lf:[52,101],rk:[91,99],rf:[77,103]},
 {t:.48,d:0,L:8,R:-10,lk:[42,98],lf:[52,101],rk:[90,99],rf:[77,103]},
 {t:.61,d:0,L:-15,R:20,lk:[58,105],lf:[63,120],rk:[81,106],rf:[82,122]},
 {t:.69,d:10,L:-85,R:70,lk:[43,110],lf:[54,119],rk:[89,109],rf:[80,119]},
 {t:.80,d:3,L:-65,R:55,lk:[51,106],lf:[57,119],rk:[80,105],rf:[80,119]}
];
function pose(t){let k=0;while(k<keys.length-2&&t>keys[k+1].t)k++;const a=keys[k],b=keys[k+1],q=(t-a.t)/(b.t-a.t),r=q*q*(3-2*q);const p={};for(const key of Object.keys(a)){if(key==='t')continue;p[key]=Array.isArray(a[key])?a[key].map((v,i)=>v+(b[key][i]-v)*r):a[key]+(b[key]-a[key])*r;}p.d=Math.round(p.d);return p;}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 function normalize(raw){const source=Buffer.alloc(raw.length);for(let p=0;p<raw.length;p+=4){if(raw[p+3]<200)continue;const rgb=palette.reduce((a,c)=>{const d=v=>(raw[p]-v[0])**2+(raw[p+1]-v[1])**2+(raw[p+2]-v[2])**2;return d(c)<d(a)?c:a;});source[p]=rgb[0];source[p+1]=rgb[1];source[p+2]=rgb[2];source[p+3]=255;}return source;}
 const source=normalize(await sharp(out+'/key-3.png').ensureAlpha().raw().toBuffer()),tucked=normalize(await sharp(out+'/key-4.png').ensureAlpha().raw().toBuffer());
 const soleL=part(tucked,(x,y)=>poly(x,y,[[43,79],[57,78],[66,90],[62,96],[50,97],[41,89]])),soleR=part(tucked,(x,y)=>poly(x,y,[[68,77],[81,77],[90,90],[85,97],[73,96],[65,85]]));
 const headShape=(x,y)=>poly(x,y,[[27,1],[90,1],[99,40],[87,46],[75,48],[70,57],[53,65],[35,63],[23,51],[16,38]]);
 const lShape=(x,y)=>!headShape(x,y)&&poly(x,y,[[11,45],[27,45],[47,77],[36,81],[14,64]]);
 const rShape=(x,y)=>!headShape(x,y)&&poly(x,y,[[87,44],[96,49],[93,67],[62,87],[52,76],[75,59]]);
 const tailShape=(x,y)=>poly(x,y,[[95,43],[120,43],[124,89],[103,105],[91,95],[96,72]]);
 const leftLeg=(x,y)=>y>=98&&x>=44&&x<70;
 const rightLeg=(x,y)=>y>=98&&x>=72&&x<94;
 const oldMaster=await sharp('outputs/ttung-charm-jump/master.png').ensureAlpha().raw().toBuffer();
 const h=part(source,headShape),l=part(source,lShape),r=part(source,rShape),tail=move(part(oldMaster,(x,y)=>x>=93&&y>=47&&y<105),-4,-2),ll=part(source,leftLeg),rr=part(source,rightLeg);
 const core=part(source,(x,y)=>!headShape(x,y)&&!lShape(x,y)&&!rShape(x,y)&&!tailShape(x,y)&&!leftLeg(x,y)&&!rightLeg(x,y));
 // Back the two shoulder joints with stable sampled chest paint, not the
 // original raised arm (which otherwise appears as a second paw when rotated).
 const bodyShape=(x,y)=>poly(x,y,[[34,61],[70,58],[92,79],[93,88],[90,96],[85,100],[78,103],[60,104],[50,101],[43,95],[38,84],[35,75]]);
 const samples=[];for(let y=58;y<99;y++)for(let x=34;x<92;x++)if(solid(core,x,y)&&core[px(x,y)]>50)samples.push([x,y]);
 const overlap=Buffer.alloc(source.length);for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(bodyShape(x,y)&&!solid(core,x,y)){const near=samples.reduce((a,c)=>(x-c[0])**2+(y-c[1])**2<(x-a[0])**2+(y-a[1])**2?c:a);core.copy(overlap,px(x,y),px(...near),px(...near)+4);}
 const frames=[],timing=[],specs=[];
 for(let i=0;i<COUNT;i++){
  const t=i/COUNT*period,p=pose(t),d=p.d,b=Buffer.alloc(source.length);
  const legL=bone(ll,[53,99],[59,110],[63,120],[53,99+d],p.lk,p.lf),legR=bone(rr,[78,99],[82,111],[82,122],[78,99+d],p.rk,p.rf);
  over(b,move(tail,0,d));over(b,legL);over(b,legR);over(b,move(core,0,d));over(b,move(overlap,0,d));
  if(t>.27&&t<.56){over(b,legL);over(b,legR);}
  const tuck=Math.max(0,Math.min(1,(120-p.lf[1])/19));
  if(tuck>.12){over(b,paw(soleL,[53,88],[p.lf[0],p.lf[1]+1],(1-tuck)*.7,.65+.10*tuck));over(b,paw(soleR,[77,87],[p.rf[0],p.rf[1]+1],-(1-tuck)*.7,.65+.10*tuck));}
  over(b,rotate(l,[38,74],p.L*Math.PI/180,d));over(b,rotate(r,[62,80],p.R*Math.PI/180,d));over(b,move(h,0,d));
  const clean=finish(b),name='jump-'+String(i+1).padStart(2,'0'),file=out+'/'+name+'.png';frames.push(clean);
  let bottom=0;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(solid(clean,x,y))bottom=Math.max(bottom,y+1);
  await sharp(clean,{raw:{width:N,height:N,channels:4}}).png().toFile(file);await sharp(file).resize(256,256,{kernel:'nearest'}).png().toFile(out+'/'+name+'-preview.png');
  timing.push({time:t,...p,bottom,headTop:5+d,mouth:55+d});specs.push({name,file:require('path').resolve(file),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),width:N,height:N,bottom,filter:'Point'});
 }
 await sharp({create:{width:1536,height:1024,channels:4,background:'#b9a582'}}).composite(frames.map((b,i)=>({input:out+'/jump-'+String(i+1).padStart(2,'0')+'-preview.png',left:i%6*256,top:Math.floor(i/6)*256}))).png().toFile(out+'/contact.png');
 const preview=[];for(let i=0;i<COUNT;i++){const t=i/COUNT*period,u=(t-.16)/.48,j=t>.16&&t<.64?4*.42*u*(1-u):0;const sprite=await sharp(frames[i],{raw:{width:N,height:N,channels:4}}).resize(256,256,{kernel:'nearest'}).png().toBuffer();preview.push(await sharp({create:{width:320,height:380,channels:4,background:'#b9a582'}}).composite([{input:sprite,left:32,top:100-Math.round(j*130)}]).raw().toBuffer());}
 await sharp(Buffer.concat(preview),{raw:{width:320,height:380*COUNT,channels:4,pageHeight:380}}).gif({loop:0,delay:33}).toFile(out+'/jump-loop.gif');
 await sharp(h,{raw:{width:N,height:N,channels:4}}).png().toFile(out+'/head-master.png');
 fs.writeFileSync(out+'/asset-specs.json',JSON.stringify(specs,null,2));fs.writeFileSync(out+'/timing.json',JSON.stringify({period,launch:.16,landing:.64,frames:timing},null,2));fs.writeFileSync(out+'/palette.json',JSON.stringify(palette));
 fs.writeFileSync(out+'/provenance.json',JSON.stringify({generatedSource:'pose-sheet.png',partsSource:'key-3.png',fixedHeadAndCoat:true,frames:COUNT,articulatedLegBones:true,independentForelegRotations:true,constantPalette:true,binaryAlpha:true},null,2));
 console.log('24 articulated poses assembled, fixed head and painted body parts.');
})().catch(e=>{console.error(e);process.exit(1)});
