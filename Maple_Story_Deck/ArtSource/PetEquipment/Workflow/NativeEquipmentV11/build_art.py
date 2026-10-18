from pathlib import Path
from PIL import Image,ImageDraw
import json,sys,hashlib,copy,shutil,numpy as np
sys.path.insert(0,'work/pet-gear-contours-v7/python-libs');import cv2
out=Path('outputs/pet-equipment-native-v11');tables=json.loads((out/'before-tables.json').read_text());old=tables['NativePetGearOverlays'];files=json.loads((out/'current-resource-files.json').read_text());bodies=json.loads((out/'original-bodies.json').read_text());refs=json.loads((out/'stand-reference.json').read_text());native=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());fits=json.loads(Path('outputs/pet-gear-all-v1/pose-fitting.json').read_text());poses={f['ruid']:c['pose']for c in native['clips']for f in c['frames']};parts={};assets={};proof=[]
generated=Path('C:/Users/려진/.codex/generated_images/01a133e3-93f8-7671-b730-56db4bbbed66/exec-df196b80-9d4c-41c7-8154-3a1da44e950a.png');shutil.copy2(generated,out/'pendant-design-source.png')
def binary(im):
 a=np.array(im.convert('RGBA'));a[:,:,3]=np.where(a[:,:,3]>=128,255,0);a[a[:,:,3]==0,:3]=0;return Image.fromarray(a)
def register(im,pet,slot,kind):
 im=im.convert('RGBA')if pet=='landturtle'and slot=='coat'else binary(im);key=pet+'-'+kind+'-'+slot+'-'+hashlib.sha256(im.tobytes()+str(im.size).encode()).hexdigest()[:14];p=out/(key+'.png')
 if key not in assets:im.save(p);assets[key]={'name':key,'file':str(p.resolve()),'size':list(im.size),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 return key
glyphs={};g=Image.open(generated).convert('RGBA')
for i,name in enumerate(['heart','star','bell']):
 crop=g.crop((round(i*g.width/3),0,round((i+1)*g.width/3),g.height));a=np.array(crop);nc,cc,stats,_=cv2.connectedComponentsWithStats((a[:,:,3]>=128).astype(np.uint8),8);k=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]));a[cc!=k,3]=0;crop=Image.fromarray(a);crop=crop.crop(crop.getbbox());glyph=binary(crop.resize((12,14),Image.Resampling.NEAREST));glyph.save(out/('pendant-'+name+'-12x14.png'));glyphs[name]=glyph
def core(im,pet,slot):
 a=np.array(im);r,g,b,al=a.transpose(2,0,1).astype(float)
 if slot=='hat'and pet=='oduck':m=(r>g*1.22)&(r>b*1.20)&(r>120)&(g>35)&(al>100)
 elif pet=='5000498'and slot=='neck':m=(g>r*1.15)&(b>r*1.15)&(g>65)&(al>100)
 elif pet=='landturtle'and slot=='neck':m=(b>r*1.10)&(b>=g*.98)&(b>90)&(al>100)
 elif pet=='oduck'and slot=='neck':m=(g>r*1.1)&(b>r*1.1)&(g>65)&(al>100)
 else:m=(r>g*1.12)&(g>b*1.25)&(r>130)&(g>60)&(b<160)&(al>100)
 y,x=np.where(m)
 if len(x)==0:y,x=np.where(al>0)
 return np.array([x.mean(),y.mean()])
masters={p:{s:binary(Image.open(files[z['ruid']]))for s,z in r['layers'].items()}for p,r in refs.items()}
def repair_turtle(base,desc,im):
 b=Image.open(bodies[base]['file']).convert('RGBA');b=b.resize((b.width*2,b.height*2),Image.Resampling.NEAREST);nativeCanvas=Image.new('RGBA',im.size);ox=round(-desc['x']*2);oy=round(-desc['y']*2);nativeCanvas.paste(b,(ox,oy));a=np.array(nativeCanvas);p=np.array(im);r,g,bb,al=a.transpose(2,0,1).astype(float);yy,xx=np.indices(al.shape);hx=fits.get(base,{}).get('headBounds')
 if hx is None:return im,0
 skin=(r>175)&(g>125)&(bb>90)&(r>=g*.98)&(g>=bb*1.04)&(al>0);protect=np.zeros_like(skin)
 for y in range(max(0,oy+hx[1]*2),min(im.height,oy+(hx[3]+1)*2)):
  xs=np.where(skin[y]&(xx[y]>=ox+hx[0]*2)&(xx[y]<ox+hx[2]*2))[0]
  if len(xs):protect[y,max(0,xs.min()-2):min(im.width,xs.max()+3)]=al[y,max(0,xs.min()-2):min(im.width,xs.max()+3)]>0
 feet=skin&(yy>=oy+(b.height/2-4)*2);protect|=(cv2.dilate(feet.astype(np.uint8),np.ones((3,3),np.uint8))>0)&(al>0)
 orange=(r>90)&(g>45)&(bb<110)&(r>g*1.08)&(g>bb*1.3)&(al>0)&(xx>ox+(hx[0]+hx[2]))&~protect
 shell=cv2.dilate(orange.astype(np.uint8),np.ones((3,3),np.uint8))>0;shell&=~protect
 pr,pg,pb,pa=p.transpose(2,0,1).astype(float);green=(pg>pr*1.05)&(pg>pb*1.04)&(pg>30)&(pa>0);nc,cc,stats,_=cv2.connectedComponentsWithStats(green.astype(np.uint8),8)
 if nc<=1:return im,0
 main=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]));gy,gx=np.where(cc==main);region=(xx>=gx.min()-3)&(xx<=gx.max()+3)&(yy>=gy.min()-3)&(yy<=gy.max()+9)&(pa>0)&~protect
 # Original head, mouth, effects and feet come from the original frame. Only
 # the orange shell is replaced; no broad colour-based body eraser is reused.
 result=a.copy();result[shell,3]=0;result[region]=p[region];result[protect]=a[protect]
 # The last native rows contain the orange rear toes as well as the front
 # feet. They are not shell material. Preserve those rows verbatim instead
 # of retaining the painted shell export's disconnected black rim pixels.
 footline=oy+b.height-4
 result[yy>=footline]=a[yy>=footline]
 restored=int(((a[:,:,3]>250)&protect&(p[:,:,3]==0)).sum());assert np.array_equal(result[protect],a[protect]);return Image.fromarray(result),restored
def recolor(im,pet,slot):
 a=np.array(im);r,g,b,al=a.transpose(2,0,1).astype(float);lum=(r+g+b)/3;yy,xx=np.indices(al.shape);mask=np.zeros(al.shape,bool)
 if slot=='coat':
  if pet in ['5002617','landturtle']:mask=(g>r*1.03)&(g>b*1.10)&(g>24)
  elif pet=='5000498':mask=(r>g*1.25)&(b>g*1.05)&(r<235)&(g<130)&(r>35)
  else:mask=(b>r*1.25)&(b>g*1.10)&(b>25)
  if pet=='landturtle':
   nc,cc,stats,_=cv2.connectedComponentsWithStats((mask&(al>0)).astype(np.uint8),8);candidates=[k for k in range(1,nc)if stats[k,cv2.CC_STAT_HEIGHT]>=8 and stats[k,cv2.CC_STAT_WIDTH]>=8]
   if candidates:
    k=max(candidates,key=lambda k:stats[k,cv2.CC_STAT_AREA]);ys,xs=np.where(cc==k);mask&=(xx>=xs.min()-2)&(xx<=xs.max()+2)&(yy>=ys.min()-2)&(yy<=ys.max()+2)
   else:mask[:]=False
  palettes={'5002617':[(51,29,68),(84,47,106),(126,73,151),(180,126,195)],'5000498':[(15,55,60),(26,94,94),(48,140,130),(110,185,164)],'landturtle':[(14,49,70),(20,85,113),(36,126,145),(95,179,176)],'oduck':[(102,33,41),(153,51,60),(205,81,82),(240,132,115)]};q=np.clip(((lum-20)/32).astype(int),0,3);palette=np.array(palettes[pet]);motif=((yy%6)==2)&(lum>36)&(lum<140);q=np.minimum(3,q+motif);a[mask,:3]=palette[q[mask]]
 elif slot=='hat':
  if pet=='5000498':mask=(r>g*1.25)&(b>g*1.05)&(r>90);pal=[(19,53,89),(25,102,151),(57,164,196),(151,224,232)]
  elif pet=='oduck':mask=(g>r*1.12)&(b>r*1.12)&(max(1,0)==1);pal=[(62,27,100),(105,53,151),(157,100,196),(216,170,230)]
  else:mask=(r>150)&(g>140)&(b>120)&((np.maximum.reduce([r,g,b])-np.minimum.reduce([r,g,b]))<65);pal=[(85,50,111),(135,83,158),(188,126,192),(236,191,225)]if pet=='5002617'else[(111,42,64),(174,78,110),(223,135,157),(255,206,212)]
  q=np.clip(((lum-45)/62).astype(int),0,3);a[mask,:3]=np.array(pal)[q[mask]]
  if pet=='oduck':star=(r>g*1.22)&(r>b*1.2)&(r>120)&(g>35);a[star,:3]=np.stack([np.minimum(255,r+15),np.minimum(230,g+100),np.maximum(30,b*.55)],axis=2)[star]
 mask&=al>0;edge=(np.maximum.reduce([r,g,b])<35)&(al>0);a[edge]=np.array(im)[edge];assert np.array_equal(np.array(im)[edge],a[edge]);assert np.array_equal(np.array(im)[:,:,3],a[:,:,3]);return Image.fromarray(a)
# Reuse the original native-head mask only to determine natural necklace
# occlusion. It never cuts a shirt or a pin's coloured silhouette.
ns={};code=Path('work/pet-gear-motion-v8/stabilize.py').read_text();exec(code[:code.index('canonical={}')],ns)
for pet,rows in old.items():
 parts[pet]={}
 for base,layers in rows.items():
  parts[pet][base]={'1':{},'2':{}}
  for slot,z0 in layers.items():
   if pet=='landturtle'and slot in ['hat','neck']and fits.get(base,{}).get('headBounds') is None:continue
   z=copy.deepcopy(z0);im=binary(Image.open(files[z.pop('ruid')]));pose=poses.get(base,'extra');fix=0
   if pet=='landturtle'and slot=='coat'and z.get('replacesBody'):im,fix=repair_turtle(base,z,im)
   if slot=='hat'and pose not in ['sleep','roll','dance','transform']:
    master=masters[pet]['hat'];oldCore=core(im,pet,'hat');newCore=core(master,pet,'hat');z['x']+=float((oldCore[0]-newCore[0])/2);z['y']+=float((oldCore[1]-newCore[1])/2);z['x']=round(z['x']*2)/2;z['y']=round(z['y']*2)/2;im=master.copy();z['w']=im.width/2;z['h']=im.height/2
   first=register(im,pet,slot,'base');parts[pet][base]['1'][slot]={**z,'asset':first}
   if slot=='neck':
    shape={'5002617':'heart','5000498':'star','landturtle':'heart','oduck':'bell'}[pet];new=glyphs[shape].copy()
    if pet=='5002617':
     a=np.array(new);r,g,b,al=a.transpose(2,0,1).astype(float);m=(r>g*1.3)&(b>g*1.1)&(r>80);v=np.maximum.reduce([r,g,b]);a[m,:3]=np.stack([v*.23,v*.87,v*.92],axis=2)[m].astype(np.uint8);new=Image.fromarray(a)
    oldMaster=masters[pet]['neck'];p=core(oldMaster,pet,'neck');center=np.array([z['x']+p[0]/oldMaster.width*z['w'],z['y']+p[1]/oldMaster.height*z['h']]);xy=np.round((center-np.array([6,9])/2)*2)/2;nz={'x':float(xy[0]),'y':float(xy[1]),'w':6.,'h':7.,'density':2}
    head=ns['occluder'](pet,base);a=np.array(new);hy,hx=np.indices(a.shape[:2]);xx=np.floor(nz['x']+(hx+.5)/2).astype(int);yy=np.floor(nz['y']+(hy+.5)/2).astype(int);valid=(xx>=0)&(xx<head.shape[1])&(yy>=0)&(yy<head.shape[0]);hidden=np.zeros_like(valid);hidden[valid]=head[yy[valid],xx[valid]];a[hidden,3]=0;new=Image.fromarray(a);z2=nz
   else:new=recolor(im,pet,slot);z2=z
   second=register(new,pet,slot,'variant2');parts[pet][base]['2'][slot]={**z2,'asset':second}
   if fix:proof.append({'pet':pet,'frame':base,'restoredOriginalHeadAndFootOutlinePixels':fix})
(out/'parts.json').write_text(json.dumps(parts,indent=2));(out/'part-specs.json').write_text(json.dumps(list(assets.values()),indent=2));(out/'art-repairs.json').write_text(json.dumps(proof,indent=2))
print('Prepared',len(assets),'separate original/variant item textures;',len(proof),'Bugi frames restored original head/foot pixels; necklaces use fixed-size distinct generated silhouettes.')
