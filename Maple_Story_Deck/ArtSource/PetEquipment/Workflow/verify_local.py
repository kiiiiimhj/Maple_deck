from pathlib import Path
from PIL import Image
import json,hashlib,numpy as np
out=Path('outputs/pet-gear-pose-v9');maps=json.loads((out/'overlay-map.json').read_text());assets={s['name']:s for s in json.loads((out/'asset-specs.json').read_text())};uploaded=json.loads((out/'applied-assets.json').read_text());n=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());m={s['ruid']:s for s in n['sprites']};v7=json.loads(Path('outputs/pet-gear-contours-v7/overlay-map.json').read_text());a7={s['name']:s for s in json.loads(Path('outputs/pet-gear-contours-v7/asset-specs.json').read_text())}
layers=0
for pet,rows in maps.items():
 for ruid,row in rows.items():
  for slot,z in row.items():
   p=Path(assets[z['asset']]['file']);im=Image.open(p);assert im.size==(round(z['w']*z['density']),round(z['h']*z['density']));assert hashlib.sha256(p.read_bytes()).hexdigest()==uploaded[z['asset']]['sha256'];assert -16<=z['x']and -16<=z['y']and z['x']+z['w']<=m[ruid]['w']+16 and z['y']+z['h']<=m[ruid]['h']+16,(pet,ruid,slot);layers+=1
count=0
for c in n['clips']:
 if c['petId']not in ['oduck','5000498']or c['pose']not in ['chat','love','move']:continue
 for f in c['frames']:
  pet=c['petId'];ruid=f['ruid'];z=maps[pet][ruid]['coat'];old=v7[pet][ruid]['coat'];im=Image.open(assets[z['asset']]['file']).convert('RGBA');ref=Image.open(a7[old['asset']]['file']).convert('RGBA');assert im.size==ref.size and im.tobytes()==ref.tobytes();count+=1
hatkeys={maps['5002617'][f['ruid']]['hat']['asset']for c in n['clips']if c['petId']=='5002617'and c['pose']not in ['sleep','icon','roll']for f in c['frames']if 'hat'in maps['5002617'].get(f['ruid'],{})};assert len(hatkeys)==1
report={'status':'passed','sourceFrames':sum(len(r)for r in maps.values()),'validatedLayers':layers,'poseSpecificCoatsPreservedByteForByte':count,'guriOrdinaryHeadpieceShapes':1,'allPointFiltered':all(uploaded[k]['properties']['filter_mode']=='Point'for k in assets)}
(out/'local-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
