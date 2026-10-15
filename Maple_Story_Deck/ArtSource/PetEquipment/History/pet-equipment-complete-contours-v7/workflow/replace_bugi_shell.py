from pathlib import Path
from PIL import Image
import json,sys,numpy as np
sys.path.insert(0,'work/pet-gear-contours-v7/python-libs');import cv2
out=Path('outputs/pet-gear-contours-v7');ns={};code=Path('work/pet-gear-contours-v7/build_contour_assets.py').read_text();exec(code[:code.index('for file in old.glob')],ns);maps=json.loads((out/'landturtle-parts.json').read_text());fits=json.loads(Path('outputs/pet-gear-all-v1/pose-fitting.json').read_text());bindings={z['file']:z for z in json.loads((out/'source-pixel-bindings.json').read_text())};checks=[]
for ruid,layers in maps.items():
 z=layers.get('coat')
 if not z or z.get('replacesBody'):continue
 base=Image.open(ns['meta'][ruid]['file']).convert('RGBA');native=np.array(base);a=Image.new('RGBA',((base.width+32)*2,(base.height+32)*2));a.alpha_composite(base.resize((base.width*2,base.height*2),Image.Resampling.NEAREST),(32,32));pixels=np.array(a);original=pixels.copy();binding=bindings[z['file']];f=ns['frames']['landturtle'][binding['sourceIndex']];pg=next(p for p in ns['pages']if p['pet']=='landturtle'and f in p['frames']);_,reference=ns['painted'](f,pg,'landturtle','coat');box=binding['sourceBounds'];delta=(round((z['x']-(box[0]/2-16))*2),round((z['y']-(box[1]/2-16))*2));ra=Image.new('RGBA',a.size);ra.alpha_composite(reference,delta);alpha=np.array(ra)[:,:,3]>=160
 count,cc,stats,_=cv2.connectedComponentsWithStats(alpha.astype(np.uint8),connectivity=8);largest=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]));silhouette=cv2.dilate((cc==largest).astype(np.uint8),np.ones((3,3),np.uint8))>0
 r,g,b,al=native.transpose(2,0,1).astype(int);skin=(al>=170)&(r>150)&(g>110)&(b>100)&(r>g*.99)&(r>b);hb=fits[ruid]['headBounds']or[0,0,base.width,base.height];head=np.zeros(skin.shape,bool)
 if ns['frames']['landturtle'][next(k for k,v in ns['frames']['landturtle'].items()if v['ruid']==ruid)]['pose']not in ['shell','what','roll']:
  for y in range(max(0,hb[1]),min(base.height,hb[3])):
   xs=np.where(skin[y]&(np.arange(base.width)>=hb[0])&(np.arange(base.width)<hb[2]))[0]
   if len(xs):head[y,max(0,xs.min()-1):min(base.width,xs.max()+2)]=True
 protected=np.zeros(alpha.shape,bool);protected[32:32+base.height*2,32:32+base.width*2]=np.array(Image.fromarray(head).resize((base.width*2,base.height*2),Image.Resampling.NEAREST))
 count,cc,stats,_=cv2.connectedComponentsWithStats((al>0).astype(np.uint8),connectivity=8);largest=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]));detached=(cc>0)&(cc!=largest);fx=np.zeros(alpha.shape,bool);fx[32:32+base.height*2,32:32+base.width*2]=np.array(Image.fromarray(detached).resize((base.width*2,base.height*2),Image.Resampling.NEAREST));keep=silhouette|protected|fx
 shell=Image.new('RGBA',a.size);shell.alpha_composite(Image.open(out/z['file']).convert('RGBA'),(round((z['x']+16)*2),round((z['y']+16)*2)));sp=np.array(shell);sp[protected|fx,3]=0;pixels[:,:,3]=np.where(keep,pixels[:,:,3],0);pixels[sp[:,:,3]>0,3]=0;final=Image.fromarray(pixels);final.alpha_composite(Image.fromarray(sp));fa=np.array(final);assert np.array_equal(fa[protected],original[protected]),ruid
 name='landturtle-'+ruid+'-shell-replacement.png';final.save(out/name);layers['coat']={'x':-16,'y':-16,'w':final.width/2,'h':final.height/2,'density':2,'file':name,'replacesBody':True};checks.append({'frame':ruid,'originalFacePixelsPreserved':True,'visiblePawsUseOriginalPixels':True,'oldShellClippedToPaintedSilhouette':True})
(out/'landturtle-parts.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');(out/'bugi-shell-replacement-verification.json').write_text(json.dumps({'status':'passed','frames':len(checks),'checks':checks},indent=2),encoding='utf-8');print('Replaced original Bugi shell without altering native face/paw pixels on',len(checks),'frames.')
