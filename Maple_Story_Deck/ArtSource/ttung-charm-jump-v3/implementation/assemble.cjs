const fs=require('fs'),crypto=require('crypto'),path=require('path');
const sharp=require('C:/Users/려진/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out='outputs/ttung-charm-jump-v3',N=128,px=(x,y)=>(y*N+x)*4;
const palette=JSON.parse(fs.readFileSync('outputs/ttung-charm-jump/palette.json','utf8'));
const metrics=JSON.parse(fs.readFileSync(out+'/key-metrics.json','utf8'));
const order=[1,2,3,4,5,6,7,7,9,10,11,1];
const times=[0,.06,.12,.17,.23,.30,.36,.42,.48,.56,.64,.72],period=.8,launch=.17,landing=.64;
const solid=(b,x,y)=>x>=0&&y>=0&&x<N&&y<N&&b[px(x,y)+3]>0;
function normal(raw){const b=Buffer.alloc(raw.length);for(let p=0;p<raw.length;p+=4){if(raw[p+3]<200)continue;let best=palette[0],d=Infinity;for(const c of palette){const v=(raw[p]-c[0])**2+(raw[p+1]-c[1])**2+(raw[p+2]-c[2])**2;if(v<d){best=c;d=v;}}b[p]=best[0];b[p+1]=best[1];b[p+2]=best[2];b[p+3]=255;}return b;}
function translated(src,dx,dy){const b=Buffer.alloc(src.length);let clipped=0;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(solid(src,x,y)){const a=x+dx,c=y+dy;if(a<0||c<0||a>=N||c>=N){clipped++;continue;}src.copy(b,px(a,c),px(x,y),px(x,y)+4);}return{b,clipped};}
function clean(b){
 // Remove detached antialias specks; the painted character remains one piece.
 const seen=new Set(),parts=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++){const id=y*N+x;if(!solid(b,x,y)||seen.has(id))continue;const q=[[x,y]];seen.add(id);for(let k=0;k<q.length;k++){const[a,c]=q[k];for(const[d,e]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const xx=a+d,yy=c+e,v=yy*N+xx;if(solid(b,xx,yy)&&!seen.has(v)){seen.add(v);q.push([xx,yy]);}}}parts.push(q);}parts.sort((a,c)=>c.length-a.length);for(const q of parts.slice(1))for(const[x,y]of q)b.fill(0,px(x,y),px(x,y)+4);
 // Uniform opaque outline; no rotated limb patches or mesh resampling.
 const src=Buffer.from(b);for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(solid(src,x,y)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,c])=>!solid(src,x+a,y+c))){const p=px(x,y);b[p]=22;b[p+1]=13;b[p+2]=15;}
 return b;
}
(async()=>{
 const key=[];for(let i=0;i<12;i++)key.push(normal(await sharp(out+'/key-'+(i+1)+'.png').ensureAlpha().raw().toBuffer()));
 const first=key[0],eye=metrics[0].eyes,frames=[],timing=[],specs=[];
 for(let i=0;i<12;i++){
  const id=order[i]-1,m=metrics[id],dx=Math.round(eye[0]-m.eyes[0]);
  const airborne=i>=4&&i<=8,dy=airborne?Math.round(eye[1]-m.eyes[1]):123-m.box[3];
  const {b,clipped}=translated(key[id],dx,dy),nod=Math.round(m.eyes[1]+dy-eye[1]);
  // Repeat the same interior eye/nose/mouth paint, with the naturally lowered
  // head. No outlines, ears, paws, body, leg joints or silhouette are cut apart.
  for(let y=42;y<79;y++)for(let x=28;x<73;x++){
   const ty=y+nod;if(!solid(first,x,y)||!solid(b,x,ty))continue;
   if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,c])=>!solid(first,x+a,y+c)||!solid(b,x+a,ty+c)))continue;
   first.copy(b,px(x,ty),px(x,y),px(x,y)+4);
  }
  const frame=clean(b),name='jump-'+String(i+1).padStart(2,'0'),file=out+'/'+name+'.png';frames.push(frame);
  let bottom=0;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(solid(frame,x,y))bottom=Math.max(bottom,y+1);
  await sharp(frame,{raw:{width:N,height:N,channels:4}}).png().toFile(file);await sharp(file).resize(256,256,{kernel:'nearest'}).png().toFile(out+'/'+name+'-preview.png');
  specs.push({name,file:path.resolve(file),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),width:N,height:N,bottom,filter:'Point'});
  timing.push({time:times[i],key:id+1,nod,dx,dy,bottom,clipped,mouth:70+nod,wholePaintedPose:true});
 }
 // The loop returns to the identical initial painting.
 frames[11]=Buffer.from(frames[0]);await sharp(frames[11],{raw:{width:N,height:N,channels:4}}).png().toFile(out+'/jump-12.png');await sharp(out+'/jump-12.png').resize(256,256,{kernel:'nearest'}).png().toFile(out+'/jump-12-preview.png');specs[11].sha256=specs[0].sha256;timing[11]={...timing[0],time:times[11]};
 await sharp({create:{width:1024,height:768,channels:4,background:'#b9a582'}}).composite(frames.map((b,i)=>({input:out+'/jump-'+String(i+1).padStart(2,'0')+'-preview.png',left:i%4*256,top:Math.floor(i/4)*256}))).png().toFile(out+'/contact.png');
 // Smooth world trajectory surrounds the complete painted poses, like in-game.
 const preview=[];for(let k=0;k<48;k++){const t=k/48*period;let i=0;while(i<11&&t>=times[i+1])i++;const u=(t-launch)/(landing-launch),j=t>launch&&t<landing?4*.34*u*(1-u):0;const spr=await sharp(frames[i],{raw:{width:N,height:N,channels:4}}).resize(256,256,{kernel:'nearest'}).png().toBuffer();preview.push(await sharp({create:{width:320,height:380,channels:4,background:'#b9a582'}}).composite([{input:spr,left:32,top:100-Math.round(j*150)}]).raw().toBuffer());}
 await sharp(Buffer.concat(preview),{raw:{width:320,height:380*48,channels:4,pageHeight:380}}).gif({loop:0,delay:17}).toFile(out+'/jump-loop.gif');
 fs.writeFileSync(out+'/asset-specs.json',JSON.stringify(specs,null,2));fs.writeFileSync(out+'/timing.json',JSON.stringify({period,launch,landing,frameTimes:times,frames:timing},null,2));fs.writeFileSync(out+'/palette.json',JSON.stringify(palette));
 fs.writeFileSync(out+'/provenance.json',JSON.stringify({mode:'whole newly painted poses',generatedSource:'pose-sheet.png',frames:12,paintedKeys:10,noLimbCutouts:true,noBoneWarp:true,noPartRotation:true,fixedInteriorFace:true,fullPosePixelTranslationsOnly:true,uniformInk:true},null,2));
 console.log(JSON.stringify(timing));
})().catch(e=>{console.error(e);process.exit(1)});
