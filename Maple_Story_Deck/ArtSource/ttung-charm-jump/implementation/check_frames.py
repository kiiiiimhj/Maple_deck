from pathlib import Path
from PIL import Image
from collections import deque
import json,hashlib
out=Path('outputs/ttung-charm-jump');master=Image.open(out/'master.png').convert('RGBA');timing=json.loads((out/'timing.json').read_text(encoding='utf-8'));palette={tuple(p)for p in json.loads((out/'palette.json').read_text())}
def components(im,on,diagonal=False):
 pts={(x,y)for y in range(128)for x in range(128)if(im.getpixel((x,y))[3]>0)==on};parts=[];ds=[(1,0),(-1,0),(0,1),(0,-1)]+([(1,1),(-1,-1),(1,-1),(-1,1)]if diagonal else[])
 while pts:
  p=pts.pop();part={p};q=deque([p])
  while q:
   x,y=q.popleft()
   for dx,dy in ds:
    p=(x+dx,y+dy)
    if p in pts:pts.remove(p);part.add(p);q.append(p)
  parts.append(part)
 return parts
frames=[];rows=[]
for i,pose in enumerate(timing['frames']):
 im=Image.open(out/f'jump-{i+1:02}.png').convert('RGBA');frames.append(im);assert im.size==(128,128)
 assert {p[3]for p in im.get_flattened_data()}<={0,255}
 assert all(p[:3]in palette for p in im.get_flattened_data()if p[3])
 edges=0
 for y in range(128):
  for x in range(128):
   if not im.getpixel((x,y))[3]:continue
   if any(not(0<=x+dx<128 and 0<=y+dy<128)or not im.getpixel((x+dx,y+dy))[3]for dx,dy in[(1,0),(-1,0),(0,1),(0,-1)]):
    assert im.getpixel((x,y))[:3]==(22,13,15),(i,x,y,'broken ink');edges+=1
 # The face is the identical original pixel patch, translated by a whole pixel.
 changed=sum(im.getpixel((x,y+pose['nod']))!=master.getpixel((x,y))for y in range(15,64)for x in range(26,85))
 assert changed==0,(i,'face flickers',changed)
 opaque=components(im,True,True);holes=[c for c in components(im,False)if not any(x in[0,127]or y in[0,127]for x,y in c)]
 rows.append({'frame':i+1,'solidComponents':[len(c)for c in opaque],'holes':[len(c)for c in holes],'faceChangedPixels':changed,'outlinePixels':edges,'bottom':pose['bottom']})
 assert len(opaque)==1 and not holes,rows[-1]
changes=[sum(a!=b for a,b in zip(frames[i].get_flattened_data(),frames[(i+1)%20].get_flattened_data()))for i in range(20)]
assert changes[-1]<=max(changes[:-1]),changes
report={'status':'passed','frames':20,'uniqueFrames':len({hashlib.sha256(im.tobytes()).hexdigest()for im in frames}),'binaryAlpha':True,'fixedPalette':True,'facePixelChanges':0,'everyOutlinePixelHasSameInk':True,'detachedFragments':0,'transparentSeams':0,'loopSeamChange':changes[-1],'adjacentPixelChanges':changes,'details':rows}
(out/'frame-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in report.items()if k!='details'}))
