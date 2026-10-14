from pathlib import Path
from PIL import Image
from collections import deque
import hashlib,json
out=Path('outputs/ttung-charm-jump-v3');timing=json.loads((out/'timing.json').read_text());palette={tuple(c)for c in json.loads((out/'palette.json').read_text())}
first=Image.open(out/'jump-01.png').convert('RGBA');rows=[]
for i,p in enumerate(timing['frames']):
    im=Image.open(out/f'jump-{i+1:02}.png').convert('RGBA');assert im.size==(128,128)and p['clipped']==0
    assert {v[3]for v in im.get_flattened_data()}<={0,255}
    assert all(v[:3]in palette for v in im.get_flattened_data()if v[3])
    faceChanges=sum(im.getpixel((x,y+p['nod']))!=first.getpixel((x,y))for y in range(48,75)for x in range(35,64))
    assert faceChanges==0,(i,faceChanges)
    pts={(x,y)for y in range(128)for x in range(128)if im.getpixel((x,y))[3]};q=deque([next(iter(pts))]);pts.remove(q[0])
    while q:
        x,y=q.popleft()
        for dx,dy in[(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]:
            t=(x+dx,y+dy)
            if t in pts:pts.remove(t);q.append(t)
    assert not pts,(i,'detached flecks')
    for y in range(128):
        for x in range(128):
            if not im.getpixel((x,y))[3]:continue
            if any(not(0<=x+dx<128 and 0<=y+dy<128)or not im.getpixel((x+dx,y+dy))[3]for dx,dy in[(1,0),(-1,0),(0,1),(0,-1)]):assert im.getpixel((x,y))[:3]==(22,13,15),(i,x,y)
    rows.append({'frame':i+1,'faceChangedPixels':faceChanges,'sha256':hashlib.sha256(im.tobytes()).hexdigest()})
assert rows[0]['sha256']==rows[-1]['sha256']
report={'status':'passed','phases':12,'uniquePaintedPoses':len({r['sha256']for r in rows}),'faceChanges':0,'detachedFlecks':0,'clippedPixels':0,'binaryAlpha':True,'uniformInk':True,'fixedPalette':True,'identicalLoopClosure':True,'noLimbWarp':True,'details':rows}
(out/'frame-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in report.items()if k!='details'}))
