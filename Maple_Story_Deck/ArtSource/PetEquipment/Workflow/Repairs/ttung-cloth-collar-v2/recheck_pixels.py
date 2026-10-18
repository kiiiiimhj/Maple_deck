from pathlib import Path
from PIL import Image
import json,numpy as np
out=Path('outputs/pet-variation-repair-v2');data=json.loads((out/'actual-pixel-verification.json').read_text());rows=[]
for r in data['cases']:
 tag=('actual-fixed-neutral'if r['frame']==1 and r['selection']==10101 else f'pixel-mismatch-{r["frame"]:02}')
 if r['selection']==0:tag='actual-fixed-original-'+str(r['frame'])
 if r['frame']==10 and (r['selection']in [1,100,10000] or r['mask']==0 or r['flip']):tag='actual-fixed-mix-'+str(r['selection'])+'-'+str(r['mask'])
 raw=out/(tag+'.png');expected=out/(tag+'-expected.png')
 if not raw.exists()or not expected.exists():continue
 im=Image.open(raw).convert('RGB');source=np.array(Image.open(expected).convert('RGBA').resize((128,128),Image.Resampling.NEAREST));xx,yy=np.meshgrid(np.arange(128),np.arange(128));scaleX=im.width/1920;scaleY=im.height/1080
 sx=np.floor((768+(xx+.5)*3)*scaleX).astype(int);sy=np.floor((356+(yy+.5)*3)*scaleY).astype(int);actual=np.array(im)[sy,sx];delta=np.abs(actual.astype(int)-source[:,:,:3].astype(int)).max(axis=2);mask=source[:,:,3]==255;result=r|{'differentPixels':int((mask&(delta>6)).sum()),'maximumDifference':int(delta[mask].max()),'sampling':'Maker 1920x1080 render projected to 1868x1051 capture'};rows.append(result)
 if len(rows)==1:Image.fromarray(actual).resize((512,512),Image.Resampling.NEAREST).save(out/'neutral-physically-aligned.png')
print(rows[:3]);print('Total cases',len(rows),'bad pixels',sum(x['differentPixels']for x in rows))
(out/'reprojected-pixel-verification.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
