from pathlib import Path
from PIL import Image
import hashlib,json
out=Path('outputs/pet-gear-contours-v7');maps={};assets={}
for f in out.glob('*-parts.json'):
 pet=f.stem[:-6];poses=json.loads(f.read_text());maps[pet]={}
 for base,layers in poses.items():
  maps[pet][base]={}
  for slot,p in layers.items():
   source=out/p['file'];im=Image.open(source).convert('RGBA');digest=hashlib.sha256(im.tobytes()+str(im.size).encode()).hexdigest()[:12];key=f'{pet}-{slot}-v7-{digest}';target=out/(key+'.png')
   if key not in assets:
    im.save(target);assets[key]={'name':key,'file':str(target.resolve()),'size':list(im.size),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
   maps[pet][base][slot]={k:p[k]for k in ['x','y','w','h']};maps[pet][base][slot]['asset']=key
   maps[pet][base][slot]['density']=p.get('density',1)
   if p.get('replacesBody'):maps[pet][base][slot]['replacesBody']=True
(out/'overlay-map.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');(out/'asset-specs.json').write_text(json.dumps(list(assets.values()),indent=2),encoding='utf-8');print('Packed',len(assets),'directly painted native layers across',len(maps),'pets.')
