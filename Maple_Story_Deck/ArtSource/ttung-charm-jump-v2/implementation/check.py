from pathlib import Path
from PIL import Image
import json, hashlib
out=Path('outputs/ttung-charm-jump-v2')
timing=json.loads((out/'timing.json').read_text())
head=Image.open(out/'head-master.png').convert('RGBA')
palette={tuple(c)for c in json.loads((out/'palette.json').read_text())}
rows=[]
for i,p in enumerate(timing['frames']):
    im=Image.open(out/f'jump-{i+1:02}.png').convert('RGBA')
    assert im.size==(128,128)
    assert {v[3]for v in im.get_flattened_data()}<={0,255}
    assert all(v[:3]in palette for v in im.get_flattened_data()if v[3])
    face_changes=sum(im.getpixel((x,y+p['d']))!=head.getpixel((x,y))for y in range(12,49)for x in range(30,77)if head.getpixel((x,y))[3]and all(head.getpixel((x+dx,y+dy))[3]for dx,dy in[(1,0),(-1,0),(0,1),(0,-1)]))
    assert face_changes==0,(i,face_changes)
    edges=0
    for y in range(128):
        for x in range(128):
            if not im.getpixel((x,y))[3]:continue
            if any(not(0<=x+dx<128 and 0<=y+dy<128)or not im.getpixel((x+dx,y+dy))[3]for dx,dy in[(1,0),(-1,0),(0,1),(0,-1)]):
                assert im.getpixel((x,y))[:3]==(22,13,15),(i,x,y)
                edges+=1
    rows.append({'frame':i+1,'faceChangedPixels':face_changes,'outlinePixels':edges,'bottom':p['bottom'],'hash':hashlib.sha256(im.tobytes()).hexdigest()})
assert max(p['d']for p in timing['frames'])-min(p['d']for p in timing['frames'])>=8
assert max(p['L']for p in timing['frames'])-min(p['L']for p in timing['frames'])>=90
assert max(p['lf'][1]for p in timing['frames'])-min(p['lf'][1]for p in timing['frames'])>=18
report={'status':'passed','frames':24,'uniqueFrames':len({r['hash']for r in rows}),'fixedFace':True,'fixedPalette':True,'binaryAlpha':True,'opaqueInkEveryBoundary':True,'armSwingDegrees':max(p['L']for p in timing['frames'])-min(p['L']for p in timing['frames']),'hindPawFoldPixels':max(p['lf'][1]for p in timing['frames'])-min(p['lf'][1]for p in timing['frames']),'details':rows}
(out/'frame-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items()if k!='details'}))
