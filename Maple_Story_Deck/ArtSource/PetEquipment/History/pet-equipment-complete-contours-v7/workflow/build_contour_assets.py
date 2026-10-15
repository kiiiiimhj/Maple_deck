from pathlib import Path
from functools import lru_cache
from PIL import Image
import json,re,sys,shutil,numpy as np
sys.path.insert(0,'work/pet-gear-contours-v7')
from grab_contour import extract,locate
source=Path('outputs/pet-gear-painted-v5');old=Path('outputs/pet-gear-density-v6');out=Path('outputs/pet-gear-contours-v7')
pages=json.loads((source/'pages.json').read_text());frames={p['pet']:{f['index']:f for pg in pages if pg['pet']==p['pet']for f in pg['frames']}for p in pages};native=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());meta={s['ruid']:s for s in native['sprites']};regs={pet:{r['index']:r for r in json.loads((source/(pet+'-registration.json')).read_text())}for pet in frames};audit=[];cache={};output={};exclusions=[]
@lru_cache(maxsize=4)
def atlas(pet,page,kind,pw,ph):return Image.open(source/f'{pet}-{kind}-{page}.png').convert('RGBA').resize((pw*2,ph*2),Image.Resampling.NEAREST)
def painted(f,pg,pet,slot):
 base=Image.open(meta[f['ruid']]['file']).convert('RGBA');cell=pg.get('cellSize',256);cols=pg.get('cols',4);j=f['cell'];a=atlas(pet,pg['page'],'coat'if slot=='coat'else'painted',*pg['size']);patch=a.crop((j%cols*cell*2,j//cols*cell*2,(j%cols+1)*cell*2,(j//cols+1)*cell*2));edge=round(cell/f['scale'])*2;patch=patch.resize((edge,edge),Image.Resampling.NEAREST);reg=regs[pet][f['index']]['coatRegistration'if slot=='coat'else'accessoryRegistration'];canvas=Image.new('RGBA',((base.width+32)*2,(base.height+32)*2));canvas.alpha_composite(patch,((reg['dx']+16)*2,(reg['dy']+16)*2));return base,canvas
for file in old.glob('*-parts.json'):
 pet=file.stem[:-6];maps=json.loads(file.read_text());output[pet]={}
 for ruid,layers in maps.items():
  current=next(f for f in frames[pet].values()if f['ruid']==ruid);output[pet][ruid]={}
  for slot,z in layers.items():
   if pet=='5002617'and slot=='coat'and current['pose']=='sleep':continue
   owner=int(re.search(r'-(\d{3})-',z['file'])[1]);f=frames[pet][owner]
   if pet=='landturtle'and slot=='neck'and owner in [45,46]:
    if not any(e['index']==owner for e in exclusions):exclusions.append({'pet':pet,'index':owner,'slot':slot,'reason':'Visually confirmed original tear effect, not a necklace; the painted pendant is occluded by the lowered head/open mouth'})
    continue
   if f['pose']=='roll':
    shutil.copy2(old/z['file'],out/z['file']);output[pet][ruid][slot]=dict(z);continue
   key=pet,slot,z['file']
   if key not in cache:
    pg=next(p for p in pages if p['pet']==pet and f in p['frames']);base,paint=painted(f,pg,pet,slot);initial=Image.open(old/z['file']).convert('RGBA');at=locate(paint,initial);init=np.zeros((paint.height,paint.width),bool);init[at[1]:at[1]+initial.height,at[0]:at[0]+initial.width]=np.asarray(initial)[:,:,3]>0
    if pet=='5002617'and slot=='neck':
     pr,pgreen,pb,pa=np.array(paint).transpose(2,0,1).astype(int);yy,xx=np.indices(init.shape)/2-16;lm=json.loads(Path('outputs/pet-gear-fit-v2/anatomical-landmarks.json').read_text())[f['ruid']];seed=(pa>=160)&(pr>190)&(pgreen>75)&(pb<135)&((pr-pgreen)>25)&((pgreen-pb)>45)&(yy>=lm['y']+24)&(yy<lm['y']+42)&(xx>=lm['x']+4)&(xx<lm['x']+29);cv=__import__('cv2');nc,cc,ss,centers=cv.connectedComponentsWithStats(seed.astype(np.uint8),connectivity=8);assert nc>1,(pet,owner,slot);best=1+int(np.argmax(ss[1:,cv.CC_STAT_AREA]));init=cc==best
    if pet=='landturtle'and slot=='neck':
     pr,pgreen,pb,pa=np.array(paint).transpose(2,0,1).astype(int);yy,xx=np.indices(init.shape)/2-16;hb=json.loads(Path('outputs/pet-gear-all-v1/pose-fitting.json').read_text())[f['ruid']]['headBounds'];center=(hb[0]+hb[2])/2;seed=(pa>=160)&(pb>140)&(pgreen<200)&(pb>pgreen*1.05)&(pb>pr*1.15)&(yy>base.height*.55)&(yy<base.height+1)&(abs(xx-center)<9);cv=__import__('cv2');nc,cc,ss,centers=cv.connectedComponentsWithStats(seed.astype(np.uint8),connectivity=8);candidates=[k for k in range(1,nc)if ss[k,cv.CC_STAT_WIDTH]<=16 and ss[k,cv.CC_STAT_HEIGHT]<=16 and ss[k,cv.CC_STAT_AREA]>=2]
     if not candidates:cache[key]=None;exclusions.append({'pet':pet,'index':owner,'slot':slot,'reason':'Native tear effect was incorrectly exported as jewelry; pendant is occluded in the painted pose'});continue
     best=min(candidates,key=lambda k:(centers[k,0]-(center+16)*2)**2+(centers[k,1]-(base.height-2+16)*2)**2);init=cc==best
    if pet=='oduck'and slot=='neck':
     pr,pgreen,pb,pa=np.array(paint).transpose(2,0,1).astype(int);yy,xx=np.indices(init.shape)/2-16;seed=(pa>=160)&(pgreen>140)&(pb>130)&(pr<pgreen*.82)&(pr<pb*.82)&(yy>base.height*.6)&(xx<base.width*.68)&(xx>=-2);cv=__import__('cv2');nc,cc,ss,centers=cv.connectedComponentsWithStats(seed.astype(np.uint8),connectivity=8);assert nc>1,(pet,owner,slot);best=1+int(np.argmax(ss[1:,cv.CC_STAT_AREA]));init=cc==best
    try:mask=extract(paint,init,pet,slot)
    except Exception as e:raise RuntimeError((pet,owner,f['pose'],slot))from e
    a=np.array(paint);a[:,:,3]=np.where(mask,a[:,:,3],0);cut=Image.fromarray(a);box=cut.getbbox();assert box,(pet,owner,slot);cut=cut.crop(box);name=f'{pet}-{owner:03d}-{slot}-source-contour.png';cut.save(out/name);cache[key]={'file':name,'x':box[0]/2-16,'y':box[1]/2-16,'w':cut.width/2,'h':cut.height/2,'density':2,'oldSourceX':at[0]/2-16,'oldSourceY':at[1]/2-16}
    audit.append({'pet':pet,'slot':slot,'sourceIndex':owner,'sourcePage':pg['page'],'sourceFile':f'{pet}-'+('coat'if slot=='coat'else'painted')+'-'+str(pg['page'])+'.png','sourceBounds':list(box),'file':name,'originalPaintedRGBPreserved':True,'selectedSourcePixels':int(mask.sum()),'method':'seeded contour segmentation, connected silhouette and enclosed original palette'})
   new=cache[key]
   if new is None:continue
   output[pet][ruid][slot]={k:new[k]for k in ['file','w','h','density']};output[pet][ruid][slot]['x']=new['x']+z['x']-new['oldSourceX'];output[pet][ruid][slot]['y']=new['y']+z['y']-new['oldSourceY']
 print('Complete painted contour export',pet,flush=True)
for pet,maps in output.items():(out/(pet+'-parts.json')).write_text(json.dumps(maps,indent=2),encoding='utf-8')
(out/'source-pixel-bindings.json').write_text(json.dumps(audit,indent=2),encoding='utf-8');print('Preserved source colors in',len(cache),'complete item contours.',flush=True)
(out/'excluded-native-effects.json').write_text(json.dumps(exclusions,indent=2),encoding='utf-8')
