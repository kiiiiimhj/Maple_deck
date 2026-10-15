from pathlib import Path
from PIL import Image
import json,hashlib
out=Path('outputs/pet-gear-motion-v8');parts=json.loads((out/'parts.json').read_text());maps={};assets={}
for pet,rows in parts.items():
 maps[pet]={}
 for ruid,layers in rows.items():
  maps[pet][ruid]={}
  for slot,z in layers.items():
   im=Image.open(z['file']).convert('RGBA');assert im.size==(round(z['w']*z['density']),round(z['h']*z['density']));digest=hashlib.sha256(im.tobytes()+str(im.size).encode()).hexdigest()[:12];key=f'{pet}-{slot}-v8-{digest}';target=out/(key+'.png')
   if key not in assets:
    im.save(target);assets[key]={'name':key,'file':str(target.resolve()),'size':list(im.size),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
   maps[pet][ruid][slot]={k:z[k]for k in ['x','y','w','h','density']}|{'asset':key}
   if z.get('replacesBody'):maps[pet][ruid][slot]['replacesBody']=True
(out/'overlay-map.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');(out/'asset-specs.json').write_text(json.dumps(list(assets.values()),indent=2),encoding='utf-8')
print('Packed',len(assets),'active motion-stable textures.')
