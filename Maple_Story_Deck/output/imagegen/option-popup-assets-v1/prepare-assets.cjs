// Copy generated originals unchanged and inspect PNG alpha; no image processing.
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const {UIBuilder}=require('../../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const manifestPath=path.join(__dirname,'manifest.json');
const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const backup=path.join(__dirname,'before.ui');
if(!fs.existsSync(backup))UIBuilder.read('ui/OptionGroup.ui').write(backup,{lint:false});
function paeth(a,b,c){const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;}
for(const a of m.assets){
 if(!fs.existsSync(a.file))fs.copyFileSync(a.source,a.file);
 const png=fs.readFileSync(a.file),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 if(png[24]!==8||png[25]!==6||png[28]!==0)throw Error('Expected non-interlaced RGBA8 '+a.key);
 const chunks=[];for(let o=8;o<png.length;){const n=png.readUInt32BE(o);if(png.toString('ascii',o+4,o+8)==='IDAT')chunks.push(png.subarray(o+8,o+8+n));o+=n+12;}
 const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=width*4;let prev=Buffer.alloc(stride),off=0,minX=width,minY=height,maxX=-1,maxY=-1,cornerAlpha,transparent=0,opaque=0;
 for(let y=0;y<height;y++){
  const filter=raw[off++],row=Buffer.allocUnsafe(stride);
  for(let x=0;x<stride;x++){const l=x>=4?row[x-4]:0,u=prev[x],ul=x>=4?prev[x-4]:0;const p=filter===0?0:filter===1?l:filter===2?u:filter===3?Math.floor((l+u)/2):paeth(l,u,ul);row[x]=(raw[off++]+p)&255;}
  if(y===0)cornerAlpha=row[3];
  for(let x=0;x<width;x++){const alpha=row[x*4+3];if(alpha===0)transparent++;if(alpha===255)opaque++;if(alpha>=192){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
  prev=row;
 }
 Object.assign(a,{width,height,bytes:png.length,bounds:[minX,minY,maxX+1,maxY+1],cornerAlpha,transparent,opaque});
 if(cornerAlpha!==0||transparent===0)throw Error('Transparency missing '+a.key);
 console.log(JSON.stringify({key:a.key,width,height,bytes:a.bytes,bounds:a.bounds,cornerAlpha,transparent,opaque}));
}
fs.writeFileSync(manifestPath,JSON.stringify(m,null,2)+'\n');
