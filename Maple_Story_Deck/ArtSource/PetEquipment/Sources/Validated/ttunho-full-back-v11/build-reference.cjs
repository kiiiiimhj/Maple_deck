const fs=require('fs'),path=require('path'),crypto=require('crypto');
const sharp=require('C:/Users/려진/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root='G:/Maple_Story_Deck',out=__dirname,src=root+'/ArtSource/PetEquipment/Sources/Validated/ttunho-care-junction-v8';
const fitting=JSON.parse(fs.readFileSync(root+'/ArtSource/PetEquipment/Maps/ttunho-care-junction-v8.json','utf8'));
const anatomy=JSON.parse(fs.readFileSync(src+'/source-anatomy.json','utf8'));
const hungry=fitting.frames.filter(f=>f.name==='hungry'),codes=[3,4,12,13];
const contour='-6,-29 3,-29 6,-28 9,-26 12,-23 15,-19 18,-13 20,-7 21,-3 20,0 -5,0 -2,-2 1,-4 3,-7 5,-10 5,-13 4,-16 2,-19 0,-20 -1,-22 -3,-24 -6,-26';
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="176" viewBox="-48 -64 96 88" shape-rendering="crispEdges">
<defs><clipPath id="body"><polygon points="${contour}"/></clipPath></defs>
<polygon points="${contour}" fill="#23472d" stroke="#21190e" stroke-width="0.75" stroke-linejoin="round"/>
<g clip-path="url(#body)">
<polygon points="-6,-29 2,-28 7,-26 12,-22 15,-18 17,-13 18.5,-7.5 18,-4 14.5,-6 11.5,-10.5 9.5,-16 7.5,-21.5 2,-24 -4,-25" fill="#3c6039"/>
<polygon points="0,-20 3,-16 5,-11 4,-7 1,-3 7,-1 14.5,-1 19,-2 15,-7.5 12.5,-12 10.5,-17 8.5,-20 2,-26" fill="#193c26"/>
<polyline points="6.5,-17 9,-13 11,-8.5 14.5,-5" fill="none" stroke="#315737" stroke-width="1"/>
<polyline points="-3,-27 1,-26 4,-24 6,-21" fill="none" stroke="#426743" stroke-width="1"/>
<polygon points="11.5,-20 11.5,-18 10.5,-18 9.5,-19 9.5,-17 8.5,-17 10.5,-16 9.5,-15 11,-15 11.5,-14 12.5,-15 13.5,-14 14,-15.5 15.5,-15 14.5,-17 15.5,-18 13.5,-18 13.5,-19 12.5,-18" fill="#ffa713" stroke="#78480d" stroke-width="0.5" stroke-linejoin="round"/>
<polygon points="12,-18.5 13,-18.5 13,-16 12,-16" fill="#ffd746"/>
</g>
<polyline points="-5,-28 -2,-27 0,-25 1.5,-23 1.5,-21 0,-20" fill="none" stroke="#b87812" stroke-width="1.75" stroke-linejoin="round"/>
<polyline points="-5,-28 -2,-27 0,-25 1.5,-23 1.5,-21 0,-20" fill="none" stroke="#ffc533" stroke-width="1" stroke-linejoin="round"/>
<polyline points="0,-20 2,-18 3.5,-15 4.5,-12 4,-9 2.5,-6 0,-3 -4,-1 2,-1 10,0 20,0" fill="none" stroke="#b87812" stroke-width="1.75" stroke-linejoin="round"/>
<polyline points="0,-20 2,-18 3.5,-15 4.5,-12 4,-9 2.5,-6 0,-3 -4,-1 2,-1 10,0 20,0" fill="none" stroke="#ffc533" stroke-width="1" stroke-linejoin="round"/>
</svg>`;
async function raw(file){return sharp(file).ensureAlpha().raw().toBuffer()}
const png=data=>sharp(data,{raw:{width:192,height:176,channels:4}}).png().toBuffer();
(async()=>{
 for(const d of ['painted','complete','packed','previews'])fs.mkdirSync(out+'/'+d,{recursive:true});
 fs.writeFileSync(out+'/painted/full-body-cape.svg',svg);
 const coat=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();fs.writeFileSync(out+'/painted/full-body-cape.png',await png(coat));
 const tiles={},proof=[];
 for(const f of hungry){
  const px=Math.round(f.px*f.w),py=Math.round((1-f.py)*f.h),left=96-px*2,top=128-py*2;
  const base=await sharp({create:{width:192,height:176,channels:4,background:'#00000000'}}).composite([{input:await sharp(src+'/native-originals/'+f.ruid+'.png').resize(f.w*2,f.h*2,{kernel:'nearest'}).png().toBuffer(),left,top}]).ensureAlpha().raw().toBuffer();
  const hat=await raw(src+'/polished-frame-paint/'+f.ruid+'-cap.png');
  const originalFore=await raw(src+'/foreground/'+f.ruid+'.png');const guard=Buffer.from(originalFore);
  for(const index of new Set([...anatomy[f.ruid].ear,...anatomy[f.ruid].beard,...anatomy[f.ruid].effects])){
   const x=left+(index%f.w)*2,y=top+Math.floor(index/f.w)*2;
   for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const k=((y+dy)*192+x+dx)*4;base.copy(guard,k,k,k+4)}
  }
  tiles[f.ruid]={};
  for(const code of codes){
   const hasHat=code%3!==0,selected=hasHat?[coat,hat]:[coat],fore=Buffer.alloc(base.length);
   for(let i=0;i<base.length;i+=4)if(selected.some(m=>m[i+3]))guard.copy(fore,i,i,i+4);
   const actual=await sharp(base,{raw:{width:192,height:176,channels:4}}).composite([...selected,fore].map(input=>({input,raw:{width:192,height:176,channels:4},left:0,top:0}))).ensureAlpha().raw().toBuffer();
   let outside=0;for(let i=0;i<base.length;i+=4)if(!selected.some(m=>m[i+3])){base.copy(actual,i,i,i+4);if(!base.subarray(i,i+4).equals(actual.subarray(i,i+4)))outside++}
   const buf=await png(actual);fs.writeFileSync(out+'/complete/'+f.ruid+'-'+code+'.png',buf);tiles[f.ruid][code]=buf;
   proof.push({frame:f.i,code,bodyPixelsOutsidePaintChanged:outside});
  }
 }
 const sheets={};
 for(const code of codes){const a=fitting.assets[fitting.sheets[code]],layers=hungry.map(f=>{const i=fitting.indices[f.ruid];return{input:tiles[f.ruid][code],left:i%8*192,top:Math.floor(i/8)*176}});const buf=await sharp(src+'/'+a.file).composite(layers).png().toBuffer();const hash=crypto.createHash('sha256').update(buf).digest('hex');const file=out+'/packed/ttunho-body-v11-'+code+'-'+hash.slice(0,16)+'.png';fs.writeFileSync(file,buf);sheets[code]={file,sha256:hash};}
 const layers=[];
 for(let row=0;row<2;row++)for(let col=0;col<4;col++){const f=hungry[col],code=row===0?3:4;const buf=await sharp(tiles[f.ruid][code]).extract({left:40,top:48,width:104,height:88}).resize(416,352,{kernel:'nearest'}).png().toBuffer();layers.push({input:buf,left:col*416,top:row*352});}
 await sharp({create:{width:1664,height:704,channels:4,background:'#e5dfcc'}}).composite(layers).png().toFile(out+'/previews/full-body-four-frames.png');
 fs.writeFileSync(out+'/build.json',JSON.stringify({sheets,proof,scope:'Only four hungry frames for coat-wearing combinations; head, ears and native effects retained.',baseMap:'ttunho-care-junction-v8.json'},null,2));
 console.log(JSON.stringify({sheets,proofCases:proof.length}));
})();
