const fs=require('fs'),sharp=require('C:/Users/려진/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{const dir='outputs/ttunho-equipment',fit=JSON.parse(fs.readFileSync(dir+'/fitting.json','utf8')),meta=JSON.parse(fs.readFileSync(dir+'/runtime-originals.json','utf8')),clips=JSON.parse(fs.readFileSync(dir+'/clips.json','utf8'));for(const[name,id]of Object.entries(clips.motions))if(!['gift','inject'].includes(name)){
 const frames=meta.clips[id],w=fit.layout.tileW*2,h=fit.layout.tileH*2,buffers=[];
 for(const f of frames)buffers.push(await sharp({create:{width:w,height:h,channels:4,background:'#e6dcc2'}}).composite([{input:await sharp(dir+'/complete/'+f.ruid+'-13.png').resize(w,h,{kernel:'nearest'}).png().toBuffer(),left:0,top:0}]).raw().toBuffer());
 await sharp(Buffer.concat(buffers),{raw:{width:w,height:h*frames.length,pageHeight:h,channels:4}}).gif({delay:frames.map(f=>Math.round(f.delay*1000)),loop:0}).toFile(dir+'/previews/'+name+'.gif');
 }
})();
