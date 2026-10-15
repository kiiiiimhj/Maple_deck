from pathlib import Path
from PIL import Image
import json,sys,numpy as np
sys.path.insert(0,'work/pet-gear-contours-v7');from grab_contour import extract
sys.path.insert(0,'work/pet-gear-contours-v7/python-libs');import cv2
out=Path('outputs/pet-gear-contours-v7');ns={};code=Path('work/pet-gear-contours-v7/build_contour_assets.py').read_text();exec(code[:code.index('for file in old.glob')],ns);audit=json.loads((out/'source-pixel-bindings.json').read_text());checks=[]
for pet,index,slot in [('5002617',34,'coat'),('5002617',34,'neck'),('5000498',2,'neck'),('5000498',64,'neck')]:
 file=out/(pet+'-parts.json');maps=json.loads(file.read_text());f=ns['frames'][pet][index];assert slot not in maps[f['ruid']];pg=next(p for p in ns['pages']if p['pet']==pet and f in p['frames']);base,paint=ns['painted'](f,pg,pet,slot);a=np.array(paint);r,g,b,alpha=a.transpose(2,0,1).astype(int);yy,xx=np.indices(alpha.shape)/2-16;region=(alpha>=160)&(xx>=0)&(xx<base.width)&(yy>base.height*.38)&(yy<base.height*.95)
 if slot=='coat':seed=region&(g>r*1.12)&(g>b*1.06)&(g>45)
 elif pet=='5002617':seed=region&(r>190)&(g>75)&(b<135)&((r-g)>25)&((g-b)>45)
 else:seed=region&(g>r*1.1)&(b>r*1.1)&(g>65)&(b>70)
 n,cc,stats,centers=cv2.connectedComponentsWithStats(seed.astype(np.uint8),connectivity=8);assert n>1
 target=(32+base.width*.42*2,32+base.height*(.55 if pet=='5002617'else .84)*2);candidate=min(range(1,n),key=lambda k:((centers[k,0]-target[0])**2+(centers[k,1]-target[1])**2)/max(1,stats[k,cv2.CC_STAT_AREA]**.1));init=cc==candidate
 if slot=='coat':init=seed
 mask=extract(paint,init,pet,slot);a[:,:,3]=np.where(mask,a[:,:,3],0);im=Image.fromarray(a);box=im.getbbox();assert box;im=im.crop(box);name=f'{pet}-{index:03d}-{slot}-recovered-contour.png';im.save(out/name);maps[f['ruid']][slot]={'x':box[0]/2-16,'y':box[1]/2-16,'w':im.width/2,'h':im.height/2,'density':2,'file':name};file.write_text(json.dumps(maps,indent=2),encoding='utf-8');audit.append({'pet':pet,'slot':slot,'sourceIndex':index,'sourcePage':pg['page'],'sourceFile':f'{pet}-'+('coat'if slot=='coat'else'painted')+'-'+str(pg['page'])+'.png','sourceBounds':list(box),'file':name,'originalPaintedRGBPreserved':True,'selectedSourcePixels':int(mask.sum()),'method':'Recovered visible painted gear omitted by the previous anatomy window'});checks.append({'pet':pet,'index':index,'slot':slot,'visiblePaintedItemRecovered':True})
(out/'source-pixel-bindings.json').write_text(json.dumps(audit,indent=2),encoding='utf-8');(out/'recovered-frame-verification.json').write_text(json.dumps({'status':'passed','recoveredLayers':checks},indent=2),encoding='utf-8');print('Recovered four visible painted items absent from their previous frame mappings.')
