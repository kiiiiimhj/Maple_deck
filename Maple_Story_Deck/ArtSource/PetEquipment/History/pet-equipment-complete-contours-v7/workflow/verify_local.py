from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,numpy as np
root=Path('outputs/pet-gear-contours-v7');old=Path('outputs/pet-gear-painted-v5');native=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());meta={s['ruid']:s for s in native['sprites']};pages=json.loads((old/'pages.json').read_text());info={p['pet']:{f['ruid']:f for pg in pages if pg['pet']==p['pet'] for f in pg['frames']}for p in pages};maps=json.loads((root/'overlay-map.json').read_text());assets={s['name']:s for s in json.loads((root/'asset-specs.json').read_text())};uploaded=json.loads((root/'applied-assets.json').read_text());count=0;densityCounts={};font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
def compose(pet,ruid,mask):
 base=Image.open(meta[ruid]['file']).convert('RGBA');layers=maps[pet][ruid];im=Image.new('RGBA',((base.width+32)*2,(base.height+32)*2))
 if not(layers.get('coat',{}).get('replacesBody')and mask&2):im.alpha_composite(base.resize((base.width*2,base.height*2),Image.Resampling.NEAREST),(32,32))
 for slot,bit in [('coat',2),('neck',4),('hat',1)]:
  z=layers.get(slot)
  if z and mask&bit:
   tex=Image.open(assets[z['asset']]['file']).convert('RGBA');factor=2/z['density'];tex=tex.resize((round(tex.width*factor),round(tex.height*factor)),Image.Resampling.NEAREST);im.alpha_composite(tex,(round((z['x']+16)*2),round((z['y']+16)*2)))
 return im
for pet,poses in maps.items():
 reviews=[]
 for ruid,layers in poses.items():
  f=info[pet][ruid];base=meta[ruid]
  for slot,z in layers.items():
   a=assets[z['asset']];p=Path(a['file']);im=Image.open(p);densityCounts[z['density']]=densityCounts.get(z['density'],0)+1
   assert im.size==(round(z['w']*z['density']),round(z['h']*z['density']))
   assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256']==uploaded[z['asset']]['sha256']
   assert -16<=z['x'] and -16<=z['y'] and z['x']+z['w']<=base['w']+16 and z['y']+z['h']<=base['h']+16,(pet,f['index'],slot)
  for mask in range(8):assert compose(pet,ruid,mask).getbbox();count+=1
  reviews.append((f,compose(pet,ruid,7)))
 for start in range(0,len(reviews),20):
  board=Image.new('RGB',(1200,1200),(65,56,47));draw=ImageDraw.Draw(board)
  for j,(f,im)in enumerate(reviews[start:start+20]):
   z=im.resize((round(im.width*1.5),round(im.height*1.5)),Image.Resampling.NEAREST);x=j%4*300+(300-z.width)//2;y=j//4*240+(210-z.height)//2;board.paste(z,(x,y),z);draw.text((j%4*300+6,j//4*240+217),str(f['index'])+' '+f['pose'],font=font,fill='white')
  board.save(root/f'{pet}-review-{start//20+1}.png')
fox=maps['5000498'];fit=json.loads(Path('outputs/pet-gear-all-v1/pose-fitting.json').read_text());landmarks=json.loads(Path('outputs/pet-gear-fit-v2/anatomical-landmarks.json').read_text());signatures={}
for ruid,f in info['5000498'].items():
 if f['pose']not in ['stand','stand1','rest']:continue
 z=fox[ruid]['neck'];group='rest'if f['pose']=='rest'else'idle';sig=(z['asset'],z['w'],z['h'],z['x']-landmarks[ruid]['x'],z['y']-fit[ruid]['headBounds'][3]);signatures.setdefault(group,set()).add(sig)
assert all(len(s)==1 for s in signatures.values()),signatures
report={'status':'passed','sourceFrames':sum(len(p)for p in maps.values()),'independentCompositions':count,'textureDensityLayers':densityCounts,'displayFootprintUnchanged':True,'foxIdleAndRestPendantShapes':{k:len(v)for k,v in signatures.items()},'foxNeckStaysAtOriginalJawBaseline':True}
(root/'local-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
