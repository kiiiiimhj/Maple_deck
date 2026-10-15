from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import ast, hashlib, json, sys
import numpy as np

root=Path('outputs/pet-gear-painted-v5'); stage=Path('work/pet-gear-painted-v5')
sys.path.insert(0,'work/ranged-lua-runtime')
from lupa import LuaRuntime
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text(encoding='utf-8'))
fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='translate')
ns={};exec('import re\n'+ast.unparse(fn),ns)
lua=LuaRuntime(unpack_returned_tuples=True)
lua.execute('function Vector2(x,y)return {x=x,y=y}end;function Vector3(x,y,z)return {x=x,y=y,z=z}end;function Color(r,g,b,a)return {r=r,g=g,b=b,a=a}end')
for name in ['PetLogic','PetHouseUI','PetUI']:
 lua.execute(ns['translate']((stage/(name+'.mlua')).read_text(encoding='utf-8-sig')))
native=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text())
metrics={s['ruid']:s for s in native['sprites']}
pages=json.loads((root/'pages.json').read_text());frames={p['pet']:{f['ruid']:f for page in pages if page['pet']==p['pet'] for f in page['frames']} for p in pages}
maps=json.loads((root/'overlay-map.json').read_text());uploads=json.loads((root/'applied-assets.json').read_text())
specs=json.loads((root/'asset-specs.json').read_text());specmap={s['name']:s for s in specs}
counts={};cases=0;replacements=0
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
board=Image.new('RGB',(1280,1000),(65,56,47));d=ImageDraw.Draw(board)
for pi,(pet,layersByFrame) in enumerate(maps.items()):
 counts[pet]=len(layersByFrame)
 for ruid,layers in layersByFrame.items():
  base=Image.open(metrics[ruid]['file']).convert('RGBA');f=frames[pet][ruid]
  for slot,z in layers.items():
   spec=specmap[z['asset']];p=Path(spec['file']);assert hashlib.sha256(p.read_bytes()).hexdigest()==spec['sha256']==uploads[z['asset']]['sha256']
   im=Image.open(p).convert('RGBA');assert im.size==(z['w'],z['h'])
   assert -16<=z['x'] and -16<=z['y'] and z['x']+z['w']<=base.width+16 and z['y']+z['h']<=base.height+16,(pet,f['index'],slot,z)
   assert uploads[z['asset']]['properties']['filter_mode']=='Point'
   if z.get('replacesBody'):
    assert pet=='landturtle' and slot=='coat' and f['pose']=='roll'
    assert im.size==base.size and (z['x'],z['y'])==(0,0);replacements+=1
  for mask in range(8):
   canvas=Image.new('RGBA',(base.width+32,base.height+32))
   if not(layers.get('coat',{}).get('replacesBody') and mask&2):canvas.alpha_composite(base,(16,16))
   for slot,bit in [('coat',2),('neck',4),('hat',1)]:
    if mask&bit and slot in layers:
     z=layers[slot];im=Image.open(specmap[z['asset']]['file']).convert('RGBA');canvas.alpha_composite(im,(z['x']+16,z['y']+16))
   if mask==0:
    a=np.asarray(canvas.crop((16,16,base.width+16,base.height+16)));b=np.asarray(base)
    assert np.array_equal(a[:,:,3],b[:,:,3]) and np.array_equal(a[b[:,:,3]>0],b[b[:,:,3]>0])
   assert canvas.getbbox() is not None
   cases+=1
  # Contact sheet: real native standing/sleeping frames with separate accessory layers.
 for row,pose in enumerate(['stand','sleep']):
  candidates=[(r,frames[pet][r])for r in layersByFrame if frames[pet][r]['pose'].startswith(pose)]
  if not candidates:candidates=list((r,frames[pet][r])for r in layersByFrame.items())[:1]
  ruid,f=candidates[0];base=Image.open(metrics[ruid]['file']).convert('RGBA');layers=layersByFrame[ruid]
  for ci,mask in enumerate([1,2,4,7]):
   canvas=Image.new('RGBA',(base.width+32,base.height+32));canvas.alpha_composite(base,(16,16))
   for slot,bit in [('coat',2),('neck',4),('hat',1)]:
    if mask&bit and slot in layers:
     z=layers[slot];canvas.alpha_composite(Image.open(specmap[z['asset']]['file']).convert('RGBA'),(z['x']+16,z['y']+16))
   scale=min(3,280/canvas.width,100/canvas.height);im=canvas.resize((round(canvas.width*scale),round(canvas.height*scale)),Image.Resampling.NEAREST)
   x=ci*320+(320-im.width)//2;y=pi*250+row*120+(95-im.height)//2;board.paste(im,(x,y),im)
   d.text((ci*320+8,pi*250+row*120+99),pet+' '+pose+' '+['head','clothes','neck','all'][ci],font=font,fill='white')
board.save(root/'independent-layers-local-review.png')
assert counts=={'oduck':81,'5002617':109,'5000498':98,'landturtle':82},counts
assert replacements==2
report={'status':'local-checks-passed','sourceFrames':sum(counts.values()),'framesPerPet':counts,'independentCompositions':cases,'activeTextures':len(specs),'specialPaintedBlurBodyFrames':replacements,'syntaxFiles':3,'actualMakerPlaybackVerified':False}
(root/'local-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
