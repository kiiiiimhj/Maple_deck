from pathlib import Path
from PIL import Image
import json,hashlib
out=Path('outputs/pet-gear-contours-v7');pages=json.loads(Path('outputs/pet-gear-painted-v5/pages.json').read_text());native=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());meta={s['ruid']:s for s in native['sprites']};fits=json.loads(Path('outputs/pet-gear-all-v1/pose-fitting.json').read_text());lm=json.loads(Path('outputs/pet-gear-fit-v2/anatomical-landmarks.json').read_text());audit=[]
for pet in ['5002617','5000498','landturtle','oduck']:
 file=out/(pet+'-parts.json');maps=json.loads(file.read_text());info={f['ruid']:f for p in pages if p['pet']==pet for f in p['frames']};groups={};anchors={}
 for ruid,layers in maps.items():
  if 'neck'not in layers:continue
  f=info[ruid];base=Image.open(meta[ruid]['file']).convert('RGBA');hb=fits[ruid]['headBounds']or[0,0,base.width,base.height]
  if pet=='5002617':ax,ay=lm[ruid]['x'],lm[ruid]['y'];box=(ax+5,ay+23,ax+28,ay+38)
  elif pet=='5000498':p=lm.get(ruid,{'x':0,'y':24});ax,ay=p['x'],p['y'];box=(ax+10,ay+11,ax+29,ay+24)
  elif pet=='landturtle':ax,ay=hb[0],hb[3];box=(ax+5,ay-4,ax+22,ay+8)
  else:
   ax,ay=(hb[0]-2,hb[1]-1)if hb[2]-hb[0]>=20 else(0,0)
   if f['pose']in ['dance','transform']:ax,ay=[(3,0),(4,9),(14,10),(15,16),(23,18),(21,25)][f['index']-(28 if f['pose']=='dance'else 76)]
   if f['pose']=='angry':ax,ay={47:(0,0),48:(0,0),49:(0,5),50:(0,0),51:(0,5),52:(0,0),53:(0,0)}[f['index']]
   box=(ax+1,ay+32,ax+17,ay+48)
  image=base.crop(box);key=hashlib.sha256(image.tobytes()+str(image.size).encode()).hexdigest();groups.setdefault(key,[]).append(ruid);anchors[ruid]=(ax,ay)
 for key,rows in groups.items():
  chosen=min(rows,key=lambda r:(0 if info[r]['pose']in ['stand','stand1']else 1,info[r]['index']));z=maps[chosen]['neck'];cx,cy=anchors[chosen]
  for ruid in rows:
   ax,ay=anchors[ruid];maps[ruid]['neck']=dict(z,x=z['x']+ax-cx,y=z['y']+ay-cy);audit.append({'pet':pet,'frame':ruid,'paintedSourceFrame':chosen,'identicalNativeNecklinePixels':True,'translation':[ax-cx,ay-cy]})
 file.write_text(json.dumps(maps,indent=2),encoding='utf-8')
(out/'neckline-stability-verification.json').write_text(json.dumps({'status':'passed','mappedFrames':len(audit),'method':'Only exactly identical original neckline pixels share a painted pendant; no size, shape, or color deformation','checks':audit},indent=2),encoding='utf-8');print('Stable necklaces on',len(audit),'native frames using exact original neckline pixels.')
