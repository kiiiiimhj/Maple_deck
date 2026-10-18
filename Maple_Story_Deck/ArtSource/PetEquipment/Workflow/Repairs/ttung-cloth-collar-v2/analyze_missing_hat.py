from pathlib import Path
from PIL import Image
import json,numpy as np
out=Path('outputs/pet-variation-repair-v2');frames=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text())['frames'];maps=json.loads((out/'applied-overlay-map.json').read_text())['variants'];up=json.loads((out/'applied-assets.json').read_text());root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment');files={r['ruid']:root/r['file']for r in json.loads((root/'Maps/equipment-resources.json').read_text())['resources']};files.update({x['ruid']:Path(x['file'])for x in up.values()})
image=np.array(Image.open(out/'after-actual-feed-sequence.png').convert('RGB').crop((960,0,1440,360)));y,x=np.indices((128,128));sx=np.floor((768+(x+.5)*3)*1868/1920-720).astype(int);sy=np.floor((356+(y+.5)*3)*1051/1080-390).astype(int);valid=(sx>=0)&(sx<480)&(sy>=0)&(sy<360);actual=image[np.clip(sy,0,359),np.clip(sx,0,479)];reports=[]
for row in frames[15:28]:
 a=np.array(Image.open(row['file']).convert('RGBA'));face=(x>=27)&(x<=66)&(y>=83)&(y<=101)&(a[:,:,3]==255)&valid;err=np.abs(actual.astype(int)-a[:,:,:3].astype(int)).max(axis=2);layers=maps[row['ruid']+':design2'];hat=np.array(Image.open(files[layers['hat']]).convert('RGBA'));hm=(hat[:,:,3]==255)&valid;hd=np.abs(actual.astype(int)-hat[:,:,:3].astype(int)).max(axis=2);nativeUnderHat=np.abs(actual.astype(int)-a[:,:,:3].astype(int)).max(axis=2)
 reports.append({'frame':row['index'],'faceBad':int((face&(err>6)).sum()),'hatBounds':Image.fromarray(hat).getbbox(),'hatOpaque':int(hm.sum()),'hatPixelsMissing':int((hm&(hd>6)).sum()),'bodyInsteadOfHat':int((hm&(nativeUnderHat==0)).sum()),'hat':layers['hat']})
print(json.dumps(sorted(reports,key=lambda r:r['faceBad'])[:7],indent=2));(out/'missing-hat-analysis.json').write_text(json.dumps(reports,indent=2))
