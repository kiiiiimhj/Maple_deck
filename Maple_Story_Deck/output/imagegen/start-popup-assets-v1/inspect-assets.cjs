// Read-only PNG alpha inspection; original generated pixels remain unchanged.
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const manifestPath = path.join(__dirname, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
function paeth(a,b,c) { const p=a+b-c, x=Math.abs(p-a), y=Math.abs(p-b), z=Math.abs(p-c); return x<=y&&x<=z?a:y<=z?b:c; }
for (const asset of manifest.assets) {
  const png = fs.readFileSync(asset.file);
  const width=png.readUInt32BE(16), height=png.readUInt32BE(20), depth=png[24], type=png[25];
  if(depth!==8 || type!==6 || png[28]!==0) throw Error('Expected non-interlaced RGBA8: '+asset.key);
  const chunks=[];
  for(let o=8;o<png.length;) { const len=png.readUInt32BE(o); if(png.toString('ascii',o+4,o+8)==='IDAT') chunks.push(png.subarray(o+8,o+8+len)); o+=len+12; }
  const raw=zlib.inflateSync(Buffer.concat(chunks)), stride=width*4;
  let previous=Buffer.alloc(stride), offset=0, minX=width,minY=height,maxX=-1,maxY=-1,cornerAlpha;
  for(let y=0;y<height;y++) {
    const filter=raw[offset++], row=Buffer.allocUnsafe(stride);
    for(let x=0;x<stride;x++) {
      const left=x>=4?row[x-4]:0, up=previous[x], ul=x>=4?previous[x-4]:0;
      const predictor=filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):paeth(left,up,ul);
      row[x]=(raw[offset++]+predictor)&255;
    }
    if(y===0) cornerAlpha=row[3];
    for(let x=0;x<width;x++) if(row[x*4+3]>=192) { minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y); }
    previous=row;
  }
  Object.assign(asset,{width,height,bytes:png.length,bounds:[minX,minY,maxX+1,maxY+1],cornerAlpha});
  console.log(JSON.stringify({key:asset.key,width,height,bytes:png.length,bounds:asset.bounds,cornerAlpha}));
}
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
