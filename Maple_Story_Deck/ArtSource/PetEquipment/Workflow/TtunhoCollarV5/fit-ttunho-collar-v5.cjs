const fs=require('fs'),path=require('path'),sharp=require('C:/Users/려진/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir=path.resolve('outputs/ttunho-collar-v5');
fs.mkdirSync(dir+'/previews',{recursive:true});
// Editable attachment curve, in double-density source pixels. A single
// tangent-continuous curve replaces independent per-row trim relocation.
const knots=[[2,11],[5,14.5],[9,17],[13,16],[17,13.5],[21,10.8],[24,10.8],[28,12.5],[32,14.3],[36,15],[39,15.5]];
function curve(y){let k=0;while(k<knots.length-2&&y>knots[k+1][0])k++;const a=knots[k],b=knots[k+1],p=knots[Math.max(0,k-1)],q=knots[Math.min(knots.length-1,k+2)],t=(y-a[0])/(b[0]-a[0]),m0=(b[1]-p[1])/(b[0]-p[0]),m1=(q[1]-a[1])/(q[0]-a[0]);return(2*t*t*t-3*t*t+1)*a[1]+(t*t*t-2*t*t+t)*(b[0]-a[0])*m0+(-2*t*t*t+3*t*t)*b[1]+(t*t*t-t*t)*(b[0]-a[0])*m1}
(async()=>{
const src=await sharp(dir+'/parts/coat.png').ensureAlpha().raw().toBuffer({resolveWithObject:true}),gen=await sharp(dir+'/parts/generated-seam-grid.png').ensureAlpha().raw().toBuffer({resolveWithObject:true}),data=Buffer.from(src.data),w=src.info.width,h=src.info.height;
// These colours are sampled from the newly generated trim. The border is
// mapped to the curve as one continuous band; no isolated highlight pixels.
const at=(x,y)=>Array.from(gen.data.subarray(((y+7)*64+x+10)*4,((y+7)*64+x+10)*4+3));
const palette={ink:at(14,30),shadow:at(15,30),gold:at(16,30),light:at(17,30)};
// Keep the warm dark exterior ink from the generated bottom rim rather than
// the translucent edge pixels introduced by image generation.
const dark=[];for(let i=0;i<gen.data.length;i+=4)if(gen.data[i+3]===255&&gen.data[i]<65&&gen.data[i+1]<40&&gen.data[i+2]<25)dark.push(Array.from(gen.data.subarray(i,i+3)));palette.ink=dark[Math.floor(dark.length/2)];
const gold=[];for(let i=0;i<gen.data.length;i+=4)if(gen.data[i+3]===255&&gen.data[i]>225&&gen.data[i+1]>145&&gen.data[i+2]<125)gold.push(Array.from(gen.data.subarray(i,i+3)));gold.sort((a,b)=>a[1]-b[1]);for(const[k,q]of [['shadow',.25],['gold',.67],['light',.92]])palette[k]=gold[Math.floor((gold.length-1)*q)];
for(let y=2;y<=39;y++){
 const c=curve(y),normal=Math.sqrt(1+Math.pow((curve(Math.min(39,y+.25))-curve(Math.max(2,y-.25)))/.5,2));
 // Project pixel centres onto the fitted front edge. Width is measured
 // normal to the curve, including the upper bend, rather than by row.
 for(let x=0;x<22;x++){
  const i=(y*w+x)*4,d=(x+.5-c)/normal;
  if(d< -1.8){data[i+3]=0;continue}
  let rgb;
  if(d< -1.0)rgb=palette.ink;
  else if(d<0)rgb=palette.shadow;
  else if(d<.85)rgb=palette.gold;
  else if(d<1.35)rgb=palette.light;
  else{
   // Retain the original painted green fold. Only the narrow strip exposed
   // by the seam's fitted overlap uses neighbouring generated green cloth.
   const o=Array.from(src.data.subarray(i,i+3));if(src.data[i+3]&&o[1]>o[0]*1.05&&o[1]>o[2]*1.05)continue;
   let j=((y+7)*64+x+10)*4,r=gen.data[j],g=gen.data[j+1],b=gen.data[j+2];
   if(!gen.data[j+3]||g<r*1.05||g<b*1.05){j=((y+7)*64+31)*4;r=gen.data[j];g=gen.data[j+1];b=gen.data[j+2]}
   // A transparent fallback is empty space, not opaque black cloth.
   // Leave the original alpha/contour intact if no painted sample exists.
   if(!gen.data[j+3])continue;
   rgb=[r,g,b];
  }
  if(rgb){data[i]=rgb[0];data[i+1]=rgb[1];data[i+2]=rgb[2];data[i+3]=255}
 }
}
// Use the original sloped bottom hem unchanged. The fitted front endpoint
// meets its existing first gold pixels, without a new spike or corner tab.
await sharp(data,{raw:src.info}).png().toFile(dir+'/parts/coat-fitted-front.png');
await sharp(data,{raw:src.info}).flatten({background:'#e6dcc2'}).resize(w*12,h*12,{kernel:'nearest'}).png().toFile(dir+'/previews/coat-fitted-front.png');
fs.writeFileSync(dir+'/seam-geometry.json',JSON.stringify({knots,palette,sourceDensity:2,method:'Single continuous fitted curve; normal-width generated ink/gold band; original back/emblem/hem preserved'},null,2));console.log({palette,knots});
})();
