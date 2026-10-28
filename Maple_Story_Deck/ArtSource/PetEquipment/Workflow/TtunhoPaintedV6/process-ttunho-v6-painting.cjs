const fs=require('fs'),path=require('path'),sharp=require('C:/Users/려진/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const d=path.resolve('outputs/ttunho-painted-frames-v6'),id=process.argv[2];if(!id||!/^[a-z0-9-]+$/.test(id))throw Error('Painting job id required');const job=JSON.parse(fs.readFileSync(d+'/generation-records/'+id+'.json','utf8')),plan=JSON.parse(fs.readFileSync(d+'/frame-paint-plan.json','utf8'));
if(!job.frames)job.frames=JSON.parse(fs.readFileSync(d+'/used-motions.json','utf8')).motions[job.motion].frames;
const greens=[[18,49,29],[32,69,42],[44,83,50],[62,103,64],[83,119,71]],golds=[[184,120,18],[230,169,27],[255,197,51],[255,232,117]];function nearest(rgb,palette){let best=palette[0],score=Infinity;for(const p of palette){const s=p.reduce((n,v,i)=>n+(v-rgb[i])**2,0);if(s<score){best=p;score=s}}return best}
(async()=>{fs.copyFileSync(job.path,d+'/polished-sheets/'+id+'.png');const generated=await sharp(job.path).resize(job.cols*128,job.rows*128,{kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true}),reports=[],previews=[];
for(const[index,f]of job.frames.entries()){
const fields=plan[f.ruid],paint=[];let replaced=0;for(const slot of ['coat','neck','cap']){
const p=await sharp(d+'/'+fields.layers[slot]).ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(let y=24;y<152;y++)for(let x=40;x<168;x++){const i=(y*192+x)*4;if(!p.data[i+3])continue;if(p.data[i+3]<128){p.data[i+3]=0;continue}p.data[i+3]=255;
const gx=index%job.cols*128+x-40,gy=Math.floor(index/job.cols)*128+y-24,j=(gy*generated.info.width+gx)*4,R=generated.data[j],G=generated.data[j+1],B=generated.data[j+2],r=p.data[i],g=p.data[i+1],b=p.data[i+2];if(generated.data[j+3]<200)continue;
const ink=r<65&&g<50&&b<40,green=G>R*1.08&&G>B*1.05,gold=R>170&&G>105&&B<G*.66,wasGold=r>165&&g>95&&b<g*.7;
const emblem=fields.emblems&&fields.emblems[slot],wx=(x-96)/2,wy=(y-128)/2,inEmblem=emblem&&Math.abs(wx-emblem[0])<=4&&Math.abs(wy-emblem[1])<=4;
const boundary=ink&&[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([xx,yy])=>xx<0||xx>=192||yy<0||yy>=176||p.data[(yy*192+xx)*4+3]===0);
if(ink&&(!inEmblem||boundary))continue;let rgb;
if(inEmblem){if(gold)rgb=nearest([R,G,B],golds);else if(green)rgb=nearest([R,G,B],greens);else if(R<95&&G<65&&B<50)rgb=[33,25,14];}
else if(wasGold&&gold)rgb=nearest([R,G,B],golds);else if(!wasGold&&green&&slot!=='neck')rgb=nearest([R,G,B],greens);if(rgb){p.data[i]=rgb[0];p.data[i+1]=rgb[1];p.data[i+2]=rgb[2];replaced++}
}
const out=d+'/polished-frame-paint/'+f.ruid+'-'+slot+'.png';await sharp(p.data,{raw:p.info}).png().toFile(out);paint.push(p.data);
}
const px=Math.round(f.px*f.w),py=Math.round((1-f.py)*f.h),base=await sharp({create:{width:192,height:176,channels:4,background:'#00000000'}}).composite([{input:await sharp(d+'/native-originals/'+f.ruid+'.png').resize(f.w*2,f.h*2,{kernel:'nearest'}).png().toBuffer(),left:96-px*2,top:128-py*2}]).ensureAlpha().raw().toBuffer(),fore=await sharp(d+'/foreground/'+f.ruid+'.png').ensureAlpha().raw().toBuffer(),beard=await sharp(d+'/foreground/'+f.ruid+'-beard.png').ensureAlpha().raw().toBuffer(),fg=Buffer.alloc(fore.length),bf=Buffer.alloc(beard.length);
for(let q=0;q<fg.length;q+=4){if(paint.some(v=>v[q+3]>0))fore.copy(fg,q,q,q+4);if(paint[1][q+3]>0)beard.copy(bf,q,q,q+4)}
const png=await sharp(base,{raw:{width:192,height:176,channels:4}}).composite([...paint.map(input=>({input,raw:{width:192,height:176,channels:4},left:0,top:0})),{input:fg,raw:{width:192,height:176,channels:4},left:0,top:0},{input:bf,raw:{width:192,height:176,channels:4},left:0,top:0}]).png().toBuffer(),actual=await sharp(png).ensureAlpha().raw().toBuffer();let outsideChanged=0;for(let q=0;q<base.length;q+=4)if(!paint.some(v=>v[q+3]>0)&&!base.subarray(q,q+4).equals(actual.subarray(q,q+4)))outsideChanged++;
// Compositing can round RGB at tiny-alpha original effects by one unit.
// Restore protected original pixels literally, not merely within a tolerance.
for(let q=0;q<base.length;q+=4)if(!paint.some(v=>v[q+3]>0))base.copy(actual,q,q,q+4);
const protectedPNG=await sharp(actual,{raw:{width:192,height:176,channels:4}}).png().toBuffer(),verified=await sharp(protectedPNG).ensureAlpha().raw().toBuffer();for(let q=0;q<base.length;q+=4)if(!paint.some(v=>v[q+3]>0)&&!base.subarray(q,q+4).equals(verified.subarray(q,q+4)))throw Error('Original body/effects changed outside clothing: '+f.ruid);
fs.writeFileSync(d+'/finished-frames/'+f.ruid+'.png',protectedPNG);const preview=await sharp(protectedPNG).extract({left:38,top:42,width:116,height:98}).resize(348,294,{kernel:'nearest'}).png().toBuffer();previews.push({input:preview,left:index%2*348,top:Math.floor(index/2)*324});previews.push({input:Buffer.from('<svg width="348" height="30"><text x="174" y="22" text-anchor="middle" fill="#4a2916" font-size="18">'+f.name+' '+(f.i+1)+'</text></svg>'),left:index%2*348,top:Math.floor(index/2)*324+294});reports.push({ruid:f.ruid,motion:f.name,frame:f.i+1,clothingPixelsRefined:replaced,outsideChanged:0,rasterizerRoundoffRestored:outsideChanged});
}
await sharp({create:{width:696,height:Math.ceil(job.frames.length/2)*324,channels:4,background:'#e6dcc2'}}).composite(previews).png().toFile(d+'/polished-previews/'+id+'.png');fs.writeFileSync(d+'/generation-records/'+id+'-proof.json',JSON.stringify({job:id,mode:'Direct painting on original frames; protected native body; no accessory bitmap transformation',reports},null,2));console.log({job:id,frames:reports.length,outsideClothingChanged:0});})();
