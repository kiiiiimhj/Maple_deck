const fs=require('fs'),s=require('C:/Users/려진/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out='outputs/ttung-charm-jump-v3';
(async()=>{const m=await s(out+'/pose-sheet.png').metadata(),w=m.width/4,h=m.height/3,info=[];
for(let i=0;i<12;i++){
const file=out+'/key-'+(i+1)+'.png';await s(out+'/pose-sheet.png').extract({left:i%4*w,top:Math.floor(i/4)*h,width:w,height:h}).resize(128,128,{kernel:'nearest'}).png().toFile(file);
const b=await s(file).ensureAlpha().raw().toBuffer();let points=[],box=[128,128,0,0];for(let y=0;y<128;y++)for(let x=0;x<128;x++){const p=(y*128+x)*4;if(b[p+3]<200)continue;box=[Math.min(box[0],x),Math.min(box[1],y),Math.max(box[2],x),Math.max(box[3],y)];if(y<85&&x<94&&b[p+2]>b[p]+35&&b[p+1]>b[p]+23)points.push([x,y]);}
const sx=points.reduce((a,p)=>a+p[0],0)/points.length;const left=points.filter(p=>p[0]<sx),right=points.filter(p=>p[0]>=sx);const mean=p=>[p.reduce((a,v)=>a+v[0],0)/p.length,p.reduce((a,v)=>a+v[1],0)/p.length];const l=mean(left),r=mean(right);info.push({frame:i+1,box,left:l,right:r,eyes:[(l[0]+r[0])/2,(l[1]+r[1])/2],eyeDistance:Math.hypot(l[0]-r[0],l[1]-r[1]),samples:points.length});
await s(file).resize(256,256,{kernel:'nearest'}).png().toFile(out+'/key-'+(i+1)+'-preview.png');
}
await s({create:{width:1024,height:768,channels:4,background:'#b9a582'}}).composite(info.map((p,i)=>({input:out+'/key-'+(i+1)+'-preview.png',left:i%4*256,top:Math.floor(i/4)*256}))).png().toFile(out+'/raw-contact.png');fs.writeFileSync(out+'/key-metrics.json',JSON.stringify(info,null,2));console.log(JSON.stringify(info));})().catch(e=>{console.error(e);process.exit(1)});
