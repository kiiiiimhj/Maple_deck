const fs=require('fs'),path=require('path'),sharp=require('C:/Users/려진/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),{forms}=require('./ttunho-v6-paint-plan.cjs');
const anatomy=JSON.parse(fs.readFileSync('outputs/ttunho-painted-frames-v6/source-anatomy.json','utf8'));
const dir=path.resolve('outputs/ttunho-painted-frames-v6'),manifest=JSON.parse(fs.readFileSync(dir+'/used-motions.json','utf8')),ink='#21190e',gold='#ffc533',goldLight='#ffe875',goldDark='#b87812';
function points(s){return s.split(' ').map(p=>p.split(',').map(Number))}function pp(s,x,y){return points(s).map(p=>[p[0]+x,p[1]+y].join(',')).join(' ')}
function poly(s,x,y,color,stroke='',width=.5){return '<polygon points="'+pp(s,x,y)+'" fill="'+color+'"'+(stroke?' stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round"':'')+'/>'}
function line(s,x,y,color,width,cap='butt'){return '<polyline points="'+pp(s,x,y)+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linejoin="round" stroke-linecap="'+cap+'"/>'}
const maple='-1,-3 -1,-1 -2,-1 -3,-2 -3,0 -4,0 -2,1 -3,2 -1.5,2 -1,3 0,2 1,3 1.5,1.5 3,2 2,0 3,-1 1,-1 1,-2 0,-1';
function mark(x,y){return poly(maple,x,y,'#ffa713','#78480d',.5)+poly('-.5,-1.5 .5,-1.5 .5,1 -.5,1',x,y,'#ffd746')}
function build(f){let form=forms.stand;if(f.name==='move')form=forms['move'+(f.i+1)];else if(['sit','rest','cry','eat'].includes(f.name))form=forms.seated;else if(['sleep','hungry'].includes(f.name))form=forms.sleep;else if(f.name==='dung'&&f.i<5)form=forms.strain;
const[x,y]=anatomy[f.ruid].head;
const capeClip='<defs><clipPath id="cape-fill"><polygon points="'+pp(form.cape,x,y)+'"/></clipPath></defs>';
const coat=capeClip+poly(form.cape,x,y,'#23472d',ink,.75)+'<g clip-path="url(#cape-fill)">'+poly(form.light,x,y,'#3c6039')+poly(form.fold,x,y,'#193c26')+line(form.seam,x,y,'#315737',1)+mark(x+form.leaf[0],y+form.leaf[1])+'</g>'+line(form.collar,x,y,goldDark,1.75,form.collarRound?'round':'butt')+line(form.collar,x,y,gold,1,form.collarRound?'round':'butt')+line(form.front,x,y,goldDark,1.75)+line(form.front,x,y,gold,1);
const cap=poly(form.cap,x,y,'#254a31',ink,.75)+poly(form.crown,x,y,'#3c693f')+poly(form.band,x,y,'#143a25',ink,.5)+mark(x+form.capLeaf[0],y+form.capLeaf[1]);
let neck='';if(form.neck&&!['cry','eat'].includes(f.name)){
 const ax=x+form.pendant[0],top=Math.min(-5,anatomy[f.ruid].beardBottom+.5),end=anatomy[f.ruid].beardBottom-1.5;
 const chain=[[x+10.5,end],[ax-4,end+1],[ax-2,top+.25],[ax,top+.5],[ax+2.5,top],[x+21.5,end+.5]].map(p=>p.join(',')).join(' ');
 neck=line(chain,0,0,ink,1.5)+line(chain,0,0,gold,1)+poly('-1.75,.5 1.75,.5 1.75,2 1,3.5 0,4.5 -1,3.5 -1.75,2',ax,top,'#eeb315',ink,.5)+poly('-2,0 2,0 1.75,1.5 -1.75,1.5',ax,top,'#765022',ink,.5)+poly('-.5,1.5 .5,1.5 .5,3 -.5,3',ax,top,'#ffe971');
}
return{layers:{coat,neck,cap},head:[x,y],emblems:{coat:[x+form.leaf[0],y+form.leaf[1]],cap:[x+form.capLeaf[0],y+form.capLeaf[1]]},form:f.name==='move'?f.name+(f.i+1):Object.keys(forms).find(k=>forms[k]===form)};}
function inside(x,y,p){let on=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>y)!=(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])on=!on;return on}
(async()=>{for(const n of ['drawings','frame-paint','guide-frames','guides','foreground'])fs.mkdirSync(dir+'/'+n,{recursive:true});const plan={};
for(const motion of Object.values(manifest.motions)){
const sheet=[];for(const[i,f]of motion.frames.entries()){
 const art=build(f),px=Math.round(f.px*f.w),py=Math.round((1-f.py)*f.h),b=await sharp(dir+'/native-originals/'+f.ruid+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true}),base=await sharp(b.data,{raw:b.info}).resize(f.w*2,f.h*2,{kernel:'nearest'}).png().toBuffer(),ear=Buffer.alloc(b.data.length),ex=art.head[0]+px,ey=art.head[1]+py,ep=[[23,0],[27,0],[30,4],[30,8],[28,10],[24,10],[22,7],[22,3]];
 const nativeAnatomy=anatomy[f.ruid],beard=Buffer.alloc(b.data.length);for(const k of new Set([...nativeAnatomy.ear,...nativeAnatomy.effects]))b.data.copy(ear,k*4,k*4,k*4+4);for(const k of nativeAnatomy.beard)b.data.copy(beard,k*4,k*4,k*4+4);
 const makeForeground=async raw=>sharp({create:{width:192,height:176,channels:4,background:'#00000000'}}).composite([{input:await sharp(raw,{raw:b.info}).resize(f.w*2,f.h*2,{kernel:'nearest'}).png().toBuffer(),left:96-px*2,top:128-py*2}]).png().toBuffer();
 const fore=await makeForeground(ear),beardFore=await makeForeground(beard);fs.writeFileSync(dir+'/foreground/'+f.ruid+'.png',fore);fs.writeFileSync(dir+'/foreground/'+f.ruid+'-beard.png',beardFore);
 const layers=[];for(const[slot,paths]of Object.entries(art.layers)){
  const svg='<svg width="192" height="176" viewBox="-48 -64 96 88" shape-rendering="crispEdges">'+paths+'</svg>',png=await sharp(Buffer.from(svg)).png().toBuffer();fs.writeFileSync(dir+'/frame-paint/'+f.ruid+'-'+slot+'.png',png);layers.push({input:png,left:0,top:0});
 }
 const masks=await Promise.all(layers.map(p=>sharp(p.input).ensureAlpha().raw().toBuffer()));const originalFore=await sharp(fore).ensureAlpha().raw().toBuffer(),originalBeard=await sharp(beardFore).ensureAlpha().raw().toBuffer(),maskedFore=Buffer.alloc(originalFore.length),maskedBeard=Buffer.alloc(originalBeard.length);
 for(let q=0;q<maskedFore.length;q+=4){if(masks.some(v=>v[q+3]>0))originalFore.copy(maskedFore,q,q,q+4);if(masks[1][q+3]>0)originalBeard.copy(maskedBeard,q,q,q+4)}
 const maskedForePNG=await sharp(maskedFore,{raw:{width:192,height:176,channels:4}}).png().toBuffer(),maskedBeardPNG=await sharp(maskedBeard,{raw:{width:192,height:176,channels:4}}).png().toBuffer();
 const png=await sharp({create:{width:192,height:176,channels:4,background:'#00000000'}}).composite([{input:base,left:96-px*2,top:128-py*2},...layers,{input:maskedForePNG,left:0,top:0},{input:maskedBeardPNG,left:0,top:0}]).png().toBuffer();fs.writeFileSync(dir+'/guide-frames/'+f.ruid+'.png',png);
 const svg='<svg width="192" height="176" viewBox="-48 -64 96 88" shape-rendering="crispEdges"><image href="data:image/png;base64,'+fs.readFileSync(dir+'/native-originals/'+f.ruid+'.png').toString('base64')+'" x="'+(-px)+'" y="'+(-py)+'" width="'+f.w+'" height="'+f.h+'" style="image-rendering:pixelated"/>'+Object.entries(art.layers).map(([k,v])=>'<g id="paint-'+k+'">'+v+'</g>').join('')+'<image href="data:image/png;base64,'+maskedForePNG.toString('base64')+'" x="-48" y="-64" width="96" height="88" style="image-rendering:pixelated"/><image href="data:image/png;base64,'+maskedBeardPNG.toString('base64')+'" x="-48" y="-64" width="96" height="88" style="image-rendering:pixelated"/></svg>';fs.writeFileSync(dir+'/drawings/'+f.ruid+'.svg',svg);
 sheet.push({input:await sharp(png).extract({left:40,top:24,width:128,height:128}).resize(512,512,{kernel:'nearest'}).png().toBuffer(),left:i%motion.cols*512,top:Math.floor(i/motion.cols)*512});plan[f.ruid]={...f,head:art.head,emblems:art.emblems,drawing:'drawings/'+f.ruid+'.svg',form:art.form,body:{x:-px,y:-py},layers:Object.fromEntries(Object.keys(art.layers).map(k=>[k,'frame-paint/'+f.ruid+'-'+k+'.png']))};
 }
 await sharp({create:{width:motion.cols*512,height:motion.rows*512,channels:4,background:'#00000000'}}).composite(sheet).png().toFile(dir+'/guides/'+motion.frames[0].name+'.png');
}
fs.writeFileSync(dir+'/frame-paint-plan.json',JSON.stringify(plan,null,2));console.log({paintedOriginalFrames:Object.keys(plan).length,usedMotions:13,noAccessoryBitmaps:true});})();
