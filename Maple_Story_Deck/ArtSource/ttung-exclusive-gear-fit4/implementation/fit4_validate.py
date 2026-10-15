from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib
out=Path('outputs/ttung-gear-fit4')
data=json.loads(Path('outputs/ttung-gear/base-frames.json').read_text(encoding='utf-8'))
maps=json.loads((out/'overlay-map.json').read_text())
assets=json.loads((out/'applied-assets.json').read_text())
specs={s['name']:s for s in json.loads((out/'asset-specs.json').read_text())}
report=[]
for row in data['frames']:
    i=row['index'];base=Image.open(row['file']).convert('RGBA')
    assert hashlib.sha256(Path(row['file']).read_bytes()).hexdigest()==row['sha256']
    paths={k:(specs[v] if v in specs else assets[v])['file'] for k,v in maps[row['ruid']].items()}
    if i<=15 or 29<=i<=64:
        eye=(30,72,67,91) if i not in [51,52] else (28,91,70,108)
        for slot,file in paths.items():
            overlay=Image.open(file).convert('RGBA')
            assert overlay.getchannel('A').crop(eye).getbbox() is None,(i,slot,'eye overlap')
        combo=Image.open(out/f'equipped-{i:02d}.png').convert('RGBA')
        assert combo.crop(eye).tobytes()==base.crop(eye).tobytes()
        report.append(i)
    for file in paths.values():
        img=Image.open(file).convert('RGBA')
        assert img.size==(128,128)
        assert set(img.getchannel('A').get_flattened_data())<={0,255}
neck=Image.open(out/'neck-master-3.png').convert('RGBA')
assert neck.getchannel('A').crop((0,107,128,128)).getbbox() is None
im=Image.new('RGB',(1536,1044),(210,203,185));d=ImageDraw.Draw(im)
for j,i in enumerate([1,29,51]):
    for n,version in enumerate(['ttung-gear-fit3','ttung-gear-fit4']):
        p=Image.open(f'outputs/{version}/equipped-{i:02d}.png').convert('RGBA').resize((512,512),Image.Resampling.NEAREST)
        x=j*512;y=n*522;im.paste(p,(x,y),p)
        d.text((x+3,y+496),str(i)+' '+('before'if n==0 else'after'),fill=(0,0,0))
im.save(out/'before-after.png')
(out/'art-verification.json').write_text(json.dumps({'eyePixelPreservedFrames':report,'sleepNeckOpaquePixels':sum(1 for x in neck.get_flattened_data()if x[3]),'allOriginalSpritesHashUnchanged':True,'allCanvas128':True,'binaryAlpha':True},indent=2))
print('Original eye pixels preserved in',len(report),'idle/care frames. Original body sprites unchanged. Sleep pendant removed.')
