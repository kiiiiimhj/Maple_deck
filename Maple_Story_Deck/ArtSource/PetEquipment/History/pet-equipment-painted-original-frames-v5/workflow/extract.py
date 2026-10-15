from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,hashlib

out=Path('outputs/pet-gear-painted-v5')
meta={x['ruid']:x for x in json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text())['sprites']}
fits=json.loads(Path('outputs/pet-gear-all-v1/pose-fitting.json').read_text())
landmarks=json.loads(Path('outputs/pet-gear-fit-v2/anatomical-landmarks.json').read_text())
pages=json.loads((out/'pages.json').read_text())

def groups(mask):
 left={tuple(p)for p in np.argwhere(mask)};result=[]
 while left:
  p=left.pop();q=[p];part={p}
  while q:
   y,x=q.pop()
   for dy,dx in [(0,1),(0,-1),(1,0),(-1,0)]:
    n=(y+dy,x+dx)
    if n in left:left.remove(n);part.add(n);q.append(n)
  result.append(part)
 return result

def dilate(mask,radius):
 h,w=mask.shape;result=np.zeros_like(mask)
 for dy in range(-radius,radius+1):
  for dx in range(-radius,radius+1):
   if dx*dx+dy*dy>radius*radius:continue
   sy0=max(0,-dy);sy1=min(h,h-dy);sx0=max(0,-dx);sx1=min(w,w-dx)
   result[sy0+dy:sy1+dy,sx0+dx:sx1+dx]|=mask[sy0:sy1,sx0:sx1]
 return result

def channels(im):return [v.astype(int)for v in np.asarray(im).transpose(2,0,1)]

def feature(im,pet,pose):
 r,g,b,a=channels(im)
 if pet=='oduck':m=(a>=180)&(r>150)&(g>120)&(b<g*.68)&(r<g*1.6)
 elif pet=='5000498':m=(a>=180)&(r>150)&(g>100)&(b<170)&(r>g*1.08)
 elif pet=='5002617':m=(a>=180)&(r>150)&(g>125)&(b>100)&(r>g*.95)&(r>b)
 else:m=(a>=180)&(r>150)&(g>120)&(b>100)&(r>g*.99)&(r>b)
 if pet=='landturtle'and pose in ['shell','what','roll']:m=a>=180
 cc=groups(m)
 z=max(cc,key=len)if cc else set();n=np.zeros_like(m)
 for p in z:n[p]=True
 return n

def align(frame,painted,page,pet):
 # Decode the exported atlas's ORIGINAL pixel grid as a whole. No garment resizing,
 # contour warping, reusable templates, color-ramp painting or material filling.
 j=frame['cell'];cell=page.get('cellSize',256);cols=page.get('cols',4);paint=painted.crop((j%cols*cell,j//cols*cell,j%cols*cell+cell,j//cols*cell+cell))
 edge=round(cell/frame['scale']);paint=paint.resize((edge,edge),Image.Resampling.NEAREST)
 base=Image.open(meta[frame['ruid']]['file']).convert('RGBA');pose=frame['pose']
 sm=feature(base,pet,pose);gm=feature(paint,pet,pose);sy,sx=np.where(sm);gy,gx=np.where(gm)
 assert len(sx)>0 and len(gx)>0,(pet,frame['index'])
 dx0=int(round(float(sx.mean()-gx.mean())));dy0=int(round(float(sy.min()-gy.min())))
 best=None
 for dy in range(dy0-3,dy0+4):
  for dx in range(dx0-4,dx0+5):
   mapped={(int(y+dy),int(x+dx))for y,x in zip(gy,gx)};src={(int(y),int(x))for y,x in zip(sy,sx)}
   score=len(mapped&src)/max(1,len(mapped|src))
   # Source facial silhouette is the registration guide, never the garment rectangle.
   if best is None or score>best[0]:best=(score,dx,dy)
 score,dx,dy=best;canvas=Image.new('RGBA',(base.width+32,base.height+32));canvas.alpha_composite(paint,(dx+16,dy+16))
 return base,canvas,{'dx':dx,'dy':dy,'headRegistrationIoU':score,'nativeGridScale':frame['scale']}

def part_pixels(base,paint,frame,pet,slot):
 r,g,b,a=channels(paint);h,w=a.shape;yy,xx=np.indices((h,w));opaque=a>=200
 hb=fits[frame['ruid']]['headBounds'] or [0,0,base.width,base.height]
 if pet=='5000498':
  lm=landmarks.get(frame['ruid'],{'x':0,'y':24});alpha=np.asarray(base.getchannel('A'));ys,xs=np.where((alpha>=170)&(np.indices(alpha.shape)[0]<lm['y']+5))
  if len(xs):hb=[int(xs.min()),int(ys.min()),int(xs.max()+1),hb[3]]
 if pet=='oduck'and hb[2]-hb[0]<20:
  # Red angry-face frames have only a tiny yellow crown in the legacy color
  # detector. Use their actual full frame head area when separating the bow.
  hb=[0,0,base.width,32]
 hx,hy,hr,bot=[v+16 for v in hb];pose=frame['pose'];low=pose in ['sleep','stunned','surprise','cry']if pet=='oduck'else pose=='sleep'
 dark=(r<85)&(g<85)&(b<85)
 ivory=(r>165)&(g>150)&(b>105)&(np.maximum.reduce([r,g,b])-np.minimum.reduce([r,g,b])<100)
 gold=(r>110)&(g>65)&(b<115)&(g<r*.95)&(r<g*2)&((r<235)|(b>45))
 if slot=='coat':
  if pet in ['5002617','landturtle']:seed=opaque&(g>r*1.12)&(g>b*1.06)&(g<215);cx=(hx+hr)/2;cy=bot+4
  elif pet=='5000498':seed=opaque&(r>g*1.4)&(b>g*1.05)&(r<230)&(g<120);cx=(hx+hr)/2+5;cy=bot+3
  else:
   seed=opaque&(b>r*1.3)&(g>r*.95)&(b<165)&(g<125)&(b>40)
   cx=(hx+hr)/2-2;cy=bot+10
   if low:cx=hr-4;cy=bot+1
  if pet=='landturtle':cx=hr+4;cy=bot-5
  if pet=='landturtle'and pose in ['shell','what','roll']:cx=base.width/2+16;cy=base.height/2+16
  candidates=[p for p in groups(seed)if len(p)>=2]
  if not candidates:return np.zeros_like(opaque)
  def cost(p):
   ys,xs=zip(*p);return ((sum(xs)/len(xs)-cx)**2+(sum(ys)/len(ys)-cy)**2)/max(1,len(p)**.25)
  main=min(candidates,key=cost);m=np.zeros_like(seed)
  for p in main:m[p]=True
  # Keep the actual painted collar/hem next to its actual painted fabric.
  # Adjacent fabric islands separated by the drawn piping belong to this same garment.
  near=dilate(m,3)
  m|=seed&near
  if pet=='5002617':m=seed&(yy>=bot-3)&(yy<bot+15)&(xx>=hx-3)&(xx<hr+13)
  if pet=='5002617'and pose=='roll':m=seed.copy()
  if pet=='landturtle':
   # The painted source can face right as well as left; all new green shell
   # plates belong to the coat. Original green food/props stay in foreground.
   m=seed.copy();src=Image.new('RGBA',paint.size);src.alpha_composite(base,(16,16));sr,sg,sb,sa=channels(src);prop=(sa>=170)&(sg>sr*1.12)&(sg>sb*1.05);m&=~dilate(prop,1)
  m|=opaque&dilate(m,4 if pet=='landturtle'else 2)&(ivory|gold|dark)
  m|=opaque&dilate(m,1)&dark
  if pet=='landturtle'and pose not in ['shell','what','roll']:
   # Exact original head scanlines and cream toes occlude the individually
   # painted shell, so its new rim never paints across the face or paws.
   src=Image.new('RGBA',paint.size);src.alpha_composite(base,(16,16));sr,sg,sb,sa=channels(src);skin=(sa>=170)&(sr>150)&(sg>110)&(sb>100)&(sr>sg*.99)&(sr>sb)
   front=np.zeros_like(m)
   for y in range(max(0,hy),min(h,bot)):
    xs=np.where(skin[y]& (np.arange(w)>=hx)&(np.arange(w)<hr))[0]
    if len(xs):front[y,max(0,xs.min()-1):min(w,xs.max()+2)]=True
   front|=skin&(yy>=base.height+16-4)
   m&=~front
  return m
 if slot=='hat':
  if pet=='landturtle'and pose in ['shell','what','roll']:return np.zeros_like(opaque)
  region=(yy<hy+(bot-hy)*.6)&(xx>hx-8)&(xx<hr+10)&(yy>hy-12)
  if pet=='oduck':seed=((g>r*1.15)&(b>r*1.15)&(g>35))|((r>150)&(r-b>75)&(r-g>60)&(g>40)&(b>40))
  elif pet=='5000498':seed=(r>g*1.4)&(b>g*1.1)&(r>110)
  else:seed=((g>r*1.15)&(g>b*1.1)&(g>75))|((r>170)&(g>100)&(g<195)&(b<85))
  m=seed&opaque&region
  cc=[p for p in groups(m)if len(p)>=2]
  if not cc:return np.zeros_like(m)
  target=(hr-8,hy+8)if pet in ['oduck','5000498']else((hx+hr)/2,hy+2)
  group=min(cc,key=lambda p:sum((x-target[0])**2+(y-target[1])**2 for y,x in p)/len(p));n=np.zeros_like(m)
  for p in group:n[p]=True
  n|=m&dilate(n,6)
  n|=opaque&dilate(n,2)&(ivory|gold|dark)
  n|=opaque&dilate(n,1)&dark
  return n
 # A separately painted necklace. Never bake it into the clean coat-only art.
 if pet=='landturtle'and pose in ['shell','what','roll']:return np.zeros_like(opaque)
 if low:return np.zeros_like(opaque)
 if pet=='5002617':seed=(r>g*1.25)&(g>65)&(g<185)&(b<95)&(r>140)
 elif pet=='landturtle':seed=(b>r*1.3)&(b>g*1.1)&(b>100)
 else:seed=(g>r*1.15)&(b>r*1.15)&(g>100)&(b>80)
 seed&=opaque&(yy>=bot-3)&(yy<bot+15)&(xx>=hx-3)&(xx<hr+4)
 cc=[p for p in groups(seed)if len(p)>=1]
 if not cc:return np.zeros_like(opaque)
 cx=(hx+hr)/2-2;cy=bot+7
 cc=min(cc,key=lambda p:sum((x-cx)**2+(y-cy)**2 for y,x in p)/len(p));m=np.zeros_like(opaque)
 for p in cc:m[p]=True
 brown=(r>g*1.13)&(r>b*1.3)&(g>20)&(g<150)&(r<210)
 m|=opaque&dilate(m,2)&(brown|gold|dark)
 m|=opaque&dilate(m,1)&ivory
 return m

def extract(pet):
 result={};reviews=[];audit=[];originals={};frameinfo={}
 for page in pages:
  if page['pet']!=pet:continue
  coatfile=out/f'{pet}-coat-{page["page"]}.png';fullfile=out/f'{pet}-painted-{page["page"]}.png'
  if not coatfile.exists()or not fullfile.exists():continue
  coat=Image.open(coatfile).convert('RGBA').resize(tuple(page['size']),Image.Resampling.NEAREST)
  full=Image.open(fullfile).convert('RGBA').resize(tuple(page['size']),Image.Resampling.NEAREST)
  for f in page['frames']:
   base,cp,ca=align(f,coat,page,pet);_,fp,fa=align(f,full,page,pet);parts={};composite=Image.new('RGBA',cp.size);composite.alpha_composite(base,(16,16))
   for slot in ['coat','neck','hat']:
    painted=cp if slot=='coat'else fp;mask=part_pixels(base,painted,f,pet,slot);arr=np.asarray(painted).copy();arr[:,:,3]=mask.astype('uint8')*255;im=Image.fromarray(arr);box=im.getbbox()
    if box:
     part=im.crop(box);part.save(out/f'{pet}-{f["index"]:03d}-{slot}.png');parts[slot]={'x':box[0]-16,'y':box[1]-16,'w':part.width,'h':part.height,'file':f'{pet}-{f["index"]:03d}-{slot}.png'};composite.alpha_composite(part,(box[0],box[1]))
   result[f['ruid']]=parts;originals[f['ruid']]=base;frameinfo[f['ruid']]=f;audit.append({'index':f['index'],'pose':f['pose'],'coatRegistration':ca,'accessoryRegistration':fa})
 # Hold paintings unchanged only when the ORIGINAL pixels/pose are themselves identical.
 # This is lossless source-frame deduplication, not a fitted/recolored garment template.
 exact={}
 for ruid,base in originals.items():
  key=hashlib.sha256(base.tobytes()+str(base.size).encode()).hexdigest()
  if key in exact:result[ruid]=dict(result[exact[key]])
  else:exact[key]=ruid
 if pet=='oduck':
  groupsByPart={'hat':{},'coat':{},'neck':{}};anchors={}
  for ruid,base in originals.items():
   f=frameinfo[ruid];hb=fits[ruid]['headBounds'];ox=hb[0]-2 if hb and hb[2]-hb[0]>=20 else 0;oy=hb[1]-1 if hb and hb[2]-hb[0]>=20 else 0
   if f['pose'] in ['dance','transform']:ox,oy=[(3,0),(4,9),(14,10),(15,16),(23,18),(21,25)][f['index']-(28 if f['pose']=='dance'else 76)]
   if f['pose']=='angry':ox,oy={47:(0,0),48:(0,0),49:(0,5),50:(0,0),51:(0,5),52:(0,0),53:(0,0)}[f['index']]
   anchors[ruid]=(ox,oy)
   # Native upper-scalp alpha is independent of eye/expression colors. Exact same
   # scalp pose keeps the same complete drawn bow, including on red angry faces.
   head=base.crop((ox,oy,ox+36,oy+18)).getchannel('A')
   torso=base.crop((ox+3,oy+33,ox+35,oy+58))
   for slot,im in [('hat',head),('coat',torso),('neck',torso)]:
    side=b'side'if slot=='hat'and f['pose']in ['sleep','stunned','surprise','cry']else b'front'
    key=hashlib.sha256(im.tobytes()+str(im.size).encode()+side).hexdigest();groupsByPart[slot].setdefault(key,[]).append(ruid)
  for slot,gg in groupsByPart.items():
   for group in gg.values():
    available=[r for r in group if slot in result[r]]
    if not available:continue
    def quality(r):
     z=result[r][slot]
     return -abs(z['w']-12)-abs(z['h']-9)if slot=='hat'else -frameinfo[r]['index']
    chosen=max(available,key=quality);piece=result[chosen][slot];ax,ay=anchors[chosen]
    for r in group:
     bx,by=anchors[r];result[r][slot]=dict(piece,x=piece['x']+bx-ax,y=piece['y']+by-ay)
 else:
  bypart={'hat':{},'coat':{},'neck':{}};anchors={}
  for ruid,base in originals.items():
   f=frameinfo[ruid];hb=fits[ruid]['headBounds']or[0,0,base.width,base.height]
   if pet=='5002617'and f['pose']!='roll':
    ax,ay=landmarks[ruid]['x'],landmarks[ruid]['y'];cap=base.crop((ax,ay,ax+28,ay+14)).getchannel('A');torso=base.crop((ax-2,ay+22,ax+39,ay+40));orient=''
   elif pet=='5000498':
    lm=landmarks.get(ruid,{'x':0,'y':24});ax,ay=lm['x'],lm['y'];cap=base.crop((ax-3,ay-24,ax+44,ay+5)).getchannel('A');torso=base.crop((ax+12,ay+10,ax+45,ay+27));orient=''
   elif pet=='landturtle'and f['pose']not in ['shell','what','roll']:
    ax,ay=hb[0],hb[1];cap=base.crop((ax,ay,ax+26,ay+13)).getchannel('A');torso=base.crop((ax-20,ay+5,ax+48,ay+36));a=np.array(base).astype(int);orange=(a[:,:,0]>a[:,:,1]*1.3)&(a[:,:,0]-a[:,:,1]>60)&(a[:,:,1]-a[:,:,2]>35)&(a[:,:,3]>=170);ys,xs=np.where(orange);orient=str(bool(len(xs)and xs.mean()>(hb[0]+hb[2])/2))
   else:continue
   anchors[ruid]=(ax,ay)
   for slot,im in [('hat',cap),('coat',torso),('neck',torso)]:
    side=b'side'if slot=='hat'and f['pose']=='sleep'else b'front'
    key=hashlib.sha256(im.tobytes()+str(im.size).encode()+orient.encode()+side).hexdigest();bypart[slot].setdefault(key,[]).append(ruid)
  for slot,gg in bypart.items():
   for group in gg.values():
    available=[r for r in group if slot in result[r]]
    if not available:continue
    # Identical source geometry keeps the most complete actually painted layer.
    def quality(r):
     z=result[r][slot]
     if slot=='hat':return min(z['w'],16)*min(z['h'],13)
     if slot=='coat'and pet=='5002617':
      b=originals[r];a=np.asarray(b).astype(int);blue=(a[:,:,2]>a[:,:,0]+8)&(a[:,:,1]>a[:,:,0]*.94)&(a[:,:,2]<200)&(a[:,:,3]>=170);layer=Image.new('L',b.size);layer.paste(Image.open(out/z['file']).getchannel('A'),(z['x'],z['y']));return int((blue&(np.asarray(layer)>0)).sum())
     return -frameinfo[r]['index']
    chosen=max(available,key=quality);z=result[chosen][slot];ax,ay=anchors[chosen]
    for r in group:
     bx,by=anchors[r];result[r][slot]=dict(z,x=z['x']+bx-ax,y=z['y']+by-ay)
 for ruid,base in originals.items():
  f=frameinfo[ruid];composite=Image.new('RGBA',(base.width+32,base.height+32));composite.alpha_composite(base,(16,16))
  for slot in ['coat','neck','hat']:
   z=result[ruid].get(slot)
   if z:composite.alpha_composite(Image.open(out/z['file']),(z['x']+16,z['y']+16))
  composite.save(out/f'{pet}-{f["index"]:03d}-assembled.png');reviews.append((f,composite))
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',18)
 for start in range(0,len(reviews),20):
  board=Image.new('RGB',(1200,1200),(70,62,54));d=ImageDraw.Draw(board)
  for j,(f,im)in enumerate(reviews[start:start+20]):
   z=im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST);x=j%4*300+(300-z.width)//2;y=j//4*240+(210-z.height)//2;board.paste(z,(x,y),z);d.text((j%4*300+8,j//4*240+214),f'{f["index"]} {f["pose"]}',font=font,fill='white')
  board.save(out/f'{pet}-assembled-review-{start//20+1}.png')
 (out/f'{pet}-parts.json').write_text(json.dumps(result,indent=2),encoding='utf-8');(out/f'{pet}-registration.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
 print(pet,'directly painted original frames extracted:',len(result))

if __name__=='__main__':
 import sys
 for pet in sys.argv[1:]or['oduck']:extract(pet)
