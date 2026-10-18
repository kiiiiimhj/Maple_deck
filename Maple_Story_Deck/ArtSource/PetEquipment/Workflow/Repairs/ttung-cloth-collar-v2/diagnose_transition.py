from pathlib import Path
from PIL import Image
import json,numpy as np,itertools
out=Path('outputs/pet-variation-repair-v2');root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment');frames=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text())['frames'];maps=json.loads((out/'applied-overlay-map.json').read_text())['variants'];up=json.loads((out/'applied-assets.json').read_text());files={r['ruid']:root/r['file']for r in json.loads((root/'Maps/equipment-resources.json').read_text())['resources']};files.update({r['ruid']:Path(r['file'])for r in up.values()})
y,x=np.indices((128,128));sx=np.floor((768+(x+.5)*3)*1868/1920).astype(int);sy=np.floor((356+(y+.5)*3)*1051/1080).astype(int);actual=np.array(Image.open(out/'cold-feed-raw/frame-010.png').convert('RGB'))[sy,sx]
hats={};necks={};coats={};faces=[]
for row in frames[15:28]:
 a=np.array(Image.open(row['file']).convert('RGBA'));face=(x>=27)&(x<=66)&(y>=83)&(y<=101)&(a[:,:,3]==255);d=np.abs(actual.astype(int)-a[:,:,:3].astype(int)).max(axis=2);faces.append({'frame':row['index'],'faceBad':int((face&(d>6)).sum())})
 for slot,target in [('hat',hats),('neck',necks),('coat',coats)]:
  uid=maps[row['ruid']+':design2'][slot];target[uid]=Image.open(files[uid]).convert('RGBA')
print('Face matches',json.dumps(sorted(faces,key=lambda r:r['faceBad'])));print('Unique layers',len(hats),len(necks),len(coats))
best=None
for row in frames[15:28]:
 for (h,hat),(n,neck),(c,coat) in itertools.product(hats.items(),necks.items(),coats.items()):
  im=Image.open(row['file']).convert('RGBA');im.alpha_composite(coat);im.alpha_composite(neck);im.alpha_composite(hat);a=np.array(im);delta=np.abs(actual.astype(int)-a[:,:,:3].astype(int)).max(axis=2);bad=int(((a[:,:,3]==255)&(delta>6)).sum())
  if best is None or bad<best['bad']:best={'frame':row['index'],'hat':h,'neck':n,'coat':c,'bad':bad};im.resize((512,512),Image.Resampling.NEAREST).save(out/'cold-feed-best-composite.png')
print('Best independently shifted layers',json.dumps(best));Image.fromarray(actual).resize((512,512),Image.Resampling.NEAREST).save(out/'cold-feed-actual-sampled.png')
(out/'transition-analysis.json').write_text(json.dumps({'faceMatches':faces,'best':best},indent=2))
