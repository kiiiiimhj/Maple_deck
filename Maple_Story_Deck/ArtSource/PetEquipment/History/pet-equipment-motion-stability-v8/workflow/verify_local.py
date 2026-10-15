from pathlib import Path
from PIL import Image
import json,hashlib,numpy as np
root=Path('outputs/pet-gear-motion-v8');old=Path('outputs/pet-gear-contours-v7')
maps=json.loads((root/'overlay-map.json').read_text());before=json.loads((old/'overlay-map.json').read_text())
assets={s['name']:s for s in json.loads((root/'asset-specs.json').read_text())};oldassets={s['name']:s for s in json.loads((old/'asset-specs.json').read_text())};uploaded=json.loads((root/'applied-assets.json').read_text())
native=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());meta={s['ruid']:s for s in native['sprites']}
special={f['ruid']for c in native['clips']if c['pose']=='roll'for f in c['frames']}
necks={};count=0
for pet,rows in maps.items():
 sizes=set()
 for ruid,layers in rows.items():
  for slot,z in layers.items():
   item=assets[z['asset']];im=Image.open(item['file']).convert('RGBA');base=meta[ruid]
   assert im.size==(round(z['w']*z['density']),round(z['h']*z['density']))
   assert hashlib.sha256(Path(item['file']).read_bytes()).hexdigest()==uploaded[z['asset']]['sha256']
   assert -16<=z['x'] and -16<=z['y'] and z['x']+z['w']<=base['w']+16 and z['y']+z['h']<=base['h']+16,(pet,ruid,slot,z)
   if slot=='neck'and ruid not in special:sizes.add((z['w'],z['h']))
   if pet=='landturtle'and slot=='coat':
    prev=before[pet][ruid][slot];oldim=Image.open(oldassets[prev['asset']]['file']).convert('RGBA')
    assert im.size==oldim.size and im.tobytes()==oldim.tobytes(),('original turtle leg/body changed',ruid)
   count+=1
 assert len(sizes)==1,(pet,sizes)
 necks[pet]=list(next(iter(sizes)))
foxmove=next(c for c in native['clips']if c['petId']=='5000498'and c['pose']=='move')
assert len({maps['5000498'][f['ruid']]['hat']['asset']for f in foxmove['frames']})==1
report={'status':'passed','nativeFrames':sum(len(r)for r in maps.values()),'validatedLayers':count,'fixedPendantDimensions':necks,'foxWalkingRibbonShapes':1,'bugiOriginalBodiesAndLegsPreserved':True,'texturesPointFiltered':all(v['properties']['filter_mode']=='Point'for k,v in uploaded.items()if k in assets)}
(root/'local-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
