from pathlib import Path
from PIL import Image
import numpy as np,json,sys
sys.path.insert(0,'work/pet-gear-painted-v5');from extract import dilate
root=Path('outputs/pet-gear-density-v6');native=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());meta={s['ruid']:s for s in native['sprites']};cache={};audit=[]
def components(mask):
 left={tuple(p)for p in np.argwhere(mask)};parts=[]
 while left:
  seed=left.pop();part={seed};q=[seed]
  while q:
   y,x=q.pop()
   for dy in [-1,0,1]:
    for dx in [-1,0,1]:
     p=(y+dy,x+dx)
     if p in left:left.remove(p);part.add(p);q.append(p)
  parts.append(part)
 return parts
for file in root.glob('*-parts.json'):
 pet=file.stem[:-6];maps=json.loads(file.read_text())
 for ruid,layers in maps.items():
  for slot,z in layers.items():
   if z.get('replacesBody'):continue
   key=(pet,slot,z['file'])
   if key not in cache:
    im=Image.open(root/z['file']).convert('RGBA');a=np.array(im);cc=components(a[:,:,3]>0)
    if not cc:raise AssertionError(key)
    main=max(cc,key=len);m=np.zeros(a.shape[:2],bool)
    for p in main:m[p]=True
    close=dilate(m,round(1.5*z['density']));keep=m.copy()
    for part in cc:
     near=any(close[p]for p in part)
     panel=slot=='coat'and pet!='landturtle'and len(part)>=max(8,len(main)*.08)
     if near or panel:
      for p in part:keep[p]=True
    removed=int(((a[:,:,3]>0)&~keep).sum());a[:,:,3]=np.where(keep,a[:,:,3],0);clean=Image.fromarray(a);box=clean.getbbox();assert box
    clean=clean.crop(box);name=Path(z['file']).stem+'-clean.png';clean.save(root/name);cache[key]=(name,box,clean.size,removed)
   name,box,size,removed=cache[key];z['file']=name;z['x']+=box[0]/z['density'];z['y']+=box[1]/z['density'];z['w']=size[0]/z['density'];z['h']=size[1]/z['density']
   if removed:audit.append({'pet':pet,'frame':ruid,'slot':slot,'removedDetachedExportPixels':removed})
 file.write_text(json.dumps(maps,indent=2),encoding='utf-8')
(root/'outline-export-cleanup.json').write_text(json.dumps(audit,indent=2),encoding='utf-8');print('Kept complete 8-connected outlines; removed detached extraction islands on',len(audit),'frame/part entries.')
