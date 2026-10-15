from pathlib import Path
from PIL import Image
import json,copy,re,sys,numpy as np
sys.path[:0]=['work/pet-gear-contours-v7/python-libs','work/pet-gear-contours-v7']
import cv2
root=Path('outputs/pet-gear-pose-v9');old=Path('outputs/pet-gear-motion-v8');v7root=Path('outputs/pet-gear-contours-v7')
maps=json.loads((old/'overlay-map.json').read_text());a8={s['name']:s for s in json.loads((old/'asset-specs.json').read_text())};v7=json.loads((v7root/'overlay-map.json').read_text());a7={s['name']:s for s in json.loads((v7root/'asset-specs.json').read_text())}
n=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());meta={s['ruid']:s for s in n['sprites']};audit=[]
for pet,rows in maps.items():
 for ruid,layers in rows.items():
  for slot,z in layers.items():z['file']=a8[z.pop('asset')]['file']
# The original frame-specific vest/scarf contours already leave the moving
# wing/ear in front. Do not cut them with a rectangular "head" estimate.
for c in n['clips']:
 if c['petId']not in ['oduck','5000498']or c['pose']not in ['chat','love','move']:continue
 for f in c['frames']:
  pet=c['petId'];ruid=f['ruid'];z=copy.deepcopy(v7[pet][ruid]['coat']);z['file']=a7[z.pop('asset')]['file'];maps[pet][ruid]['coat']=z
  audit.append({'pet':pet,'pose':c['pose'],'frame':ruid,'slot':'coat','method':'original pose-specific painted contour, without broad head erasure'})
# Recover the complete left leaf and its dark edge directly from the existing
# painting. The former extraction box cut through that leaf.
ns={};code=Path('work/pet-gear-contours-v7/build_contour_assets.py').read_text();exec(code[:code.index('for file in old.glob')],ns)
binding=next(b for b in json.loads((v7root/'source-pixel-bindings.json').read_text())if b['pet']=='5002617'and b['slot']=='hat'and b['sourceIndex']==23)
pg=next(p for p in ns['pages']if p['pet']=='5002617'and p['page']==binding['sourcePage']);_,paint=ns['painted'](ns['frames']['5002617'][23],pg,'5002617','hat')
box=binding['sourceBounds'];prior=Image.open(v7root/binding['file']).convert('RGBA');expanded=(max(0,box[0]-8),max(0,box[1]-5),min(paint.width,box[2]+5),min(paint.height,box[3]+6));crop=paint.crop(expanded);a=np.array(crop);r,g,b,alpha=a.transpose(2,0,1).astype(float)
seed=Image.new('L',crop.size);seed.paste(prior.getchannel('A'),(box[0]-expanded[0],box[1]-expanded[1]));keep=np.array(seed)>0
green=(g>r*1.07)&(g>b*1.08)&(g>40)&(alpha>130)
nc,labels,stats,_=cv2.connectedComponentsWithStats(green.astype(np.uint8),connectivity=8)
for k in range(1,nc):
 component=labels==k
 if (cv2.dilate(component.astype(np.uint8),np.ones((5,5),np.uint8))&keep.astype(np.uint8)).any():keep|=component
border=cv2.dilate(keep.astype(np.uint8),np.ones((5,5),np.uint8))>0
keep|=border&(r<120)&(g<130)&(b<100)&(alpha>100)
a[~keep,3]=0;ys,xs=np.where(a[:,:,3]>0);trim=(int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1));hat=Image.fromarray(a).crop(trim);hat.save(root/'guri-complete-flower.png')
assert (np.array(hat)[:,:,3]>0).sum()>(np.array(prior)[:,:,3]>0).sum()
def flower(im):
 a=np.array(im);r,g,b,al=a.transpose(2,0,1).astype(float);ys,xs=np.where((r>185)&(g>80)&(g<215)&(b<120)&(r>g*1.1)&(al>100));assert len(xs);return np.array([xs.mean()/2,ys.mean()/2])
newcore=flower(hat)
# Match the native head only, using the existing per-pose positions to define
# one attachment anchor; the flower/leaf image itself never changes shape.
tracking={};src=Path('work/pet-gear-motion-v8/stabilize.py').read_text();exec(src[:src.index('canonical={}')],tracking)
origin=tracking['origin'];track=tracking['track']
for c in n['clips']:
 if c['petId']!='5002617'or c['pose']in ['icon','sleep','roll']:continue
 visible=[f['ruid']for f in c['frames']if 'hat'in maps['5002617'].get(f['ruid'],{})]
 if not visible:continue
 points={}
 for ruid in visible:
  z=maps['5002617'][ruid]['hat'];points[ruid]=np.array(origin(ruid))+np.array([z['x'],z['y']])+flower(Image.open(z['file']).convert('RGBA'))
 median=np.median(list(points.values()),axis=0);ref=min(visible,key=lambda q:np.linalg.norm(points[q]-median));shifts={ruid:track(ref,ruid,points[ref]+np.array([-6,6]),'hat')for ruid in visible};anchor=np.round(np.median([points[q]-np.array(shifts[q][:2])for q in visible],axis=0)*2)/2
 for ruid in visible:
  dx,dy,error=shifts[ruid];target=anchor+np.array([dx,dy]);xy=np.round((target-np.array(origin(ruid))-newcore)*2)/2
  maps['5002617'][ruid]['hat']={'file':str((root/'guri-complete-flower.png').resolve()),'x':float(xy[0]),'y':float(xy[1]),'w':hat.width/2,'h':hat.height/2,'density':2}
  audit.append({'pet':'5002617','pose':c['pose'],'frame':ruid,'slot':'hat','headTranslation':[dx,dy],'matchingError':error,'sameFlowerPixels':True})
# Guri's two manually exported feeding frames are also one stable headpiece.
extras=[r for r in maps['5002617']if r not in {f['ruid']for c in n['clips']for f in c['frames']}]
for ruid in extras:
 z=maps['5002617'][ruid].get('hat')
 if not z:continue
 point=flower(Image.open(z['file']).convert('RGBA'))+np.array([z['x'],z['y']]);xy=np.round((point-newcore)*2)/2;maps['5002617'][ruid]['hat']={'file':str((root/'guri-complete-flower.png').resolve()),'x':float(xy[0]),'y':float(xy[1]),'w':hat.width/2,'h':hat.height/2,'density':2}
(root/'parts.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');(root/'pose-repair.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
print('Restored source-specific moving coats and complete stable Guri headpiece:',hat.size,'layers',len(audit))
