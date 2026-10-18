from pathlib import Path
from PIL import Image
import json,numpy as np
out=Path('outputs/pet-variation-repair-v2');root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment')
frames=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text())['frames'];maps=json.loads((out/'applied-overlay-map.json').read_text())['variants'];up=json.loads((out/'applied-assets.json').read_text());files={r['ruid']:root/r['file']for r in json.loads((root/'Maps/equipment-resources.json').read_text())['resources']};files.update({r['ruid']:Path(r['file'])for r in up.values()})
y,x=np.indices((128,128));sx=np.floor((768+(x+.5)*3)*1868/1920).astype(int);sy=np.floor((356+(y+.5)*3)*1051/1080).astype(int);templates=[]
for row in frames[:28]:
 im=Image.open(row['file']).convert('RGBA');layers=maps[row['ruid']+':design2']
 for slot in ['coat','neck','hat']:im.alpha_composite(Image.open(files[layers[slot]]).convert('RGBA'))
 a=np.array(im);hat=np.array(Image.open(files[layers['hat']]).convert('RGBA'))
 templates.append((row['index'],a,hat))
reports=[]
for file in sorted((out/'after-actual-feed-raw').glob('*.png')):
 actual=np.array(Image.open(file).convert('RGB'))[sy,sx];candidates=[]
 for index,a,hat in templates:
  d=np.abs(actual.astype(int)-a[:,:,:3].astype(int)).max(axis=2);opaque=a[:,:,3]==255;hm=hat[:,:,3]==255;hd=np.abs(actual.astype(int)-hat[:,:,:3].astype(int)).max(axis=2)
  candidates.append({'nativeFrame':index,'opaquePixels':int(opaque.sum()),'differentPixels':int((opaque&(d>6)).sum()),'hatPixels':int(hm.sum()),'hatPixelsMissing':int((hm&(hd>6)).sum())})
 best=min(candidates,key=lambda r:r['differentPixels']);reports.append({'capture':file.name,**best})
result={'captures':reports,'frames':len(reports),'differentPixels':sum(r['differentPixels']for r in reports),'missingHatPixels':sum(r['hatPixelsMissing']for r in reports)}
(out/'live-feed-pixel-verification.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));assert reports and result['differentPixels']==result['missingHatPixels']==0,result
