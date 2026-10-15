from pathlib import Path
from functools import lru_cache
from PIL import Image
import json,sys,re,copy,hashlib,numpy as np
sys.path[:0]=['work/pet-gear-contours-v7/python-libs','work/pet-gear-contours-v7']
import cv2
from grab_contour import locate
source=Path('outputs/pet-gear-contours-v7');out=Path('outputs/pet-gear-motion-v8')
n=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());meta={s['ruid']:s for s in n['sprites']}
maps=json.loads((source/'overlay-map.json').read_text());old=copy.deepcopy(maps);assets={s['name']:s for s in json.loads((source/'asset-specs.json').read_text())}
fits=json.loads(Path('outputs/pet-gear-all-v1/pose-fitting.json').read_text());audit=[]
ns={};code=Path('work/pet-gear-contours-v7/build_contour_assets.py').read_text();exec(code[:code.index('for file in old.glob')],ns)
v6bugi=json.loads(Path('outputs/pet-gear-density-v6/landturtle-parts.json').read_text());bindings={z['sourceIndex']:z for z in json.loads((source/'source-pixel-bindings.json').read_text())if z['pet']=='landturtle'and z['slot']=='coat'}
def origin(ruid):
 m=meta[ruid];return round(96-m['px']*m['w']),round(112-(1-m['py'])*m['h'])
@lru_cache(None)
def native(ruid):
 m=meta[ruid];im=Image.new('RGBA',(192,160));im.alpha_composite(Image.open(m['file']).convert('RGBA'),origin(ruid));return np.array(im)
@lru_cache(None)
def texture(asset):return Image.open(assets[asset]['file']).convert('RGBA')
@lru_cache(None)
def raw_bugi(ruid):
 z=v6bugi[ruid]['coat'];owner=int(re.search(r'-(\d{3})-',z['file'])[1]);f=ns['frames']['landturtle'][owner];pg=next(p for p in ns['pages']if p['pet']=='landturtle'and f in p['frames']);_,paint=ns['painted'](f,pg,'landturtle','coat');oldtex=Image.open(Path('outputs/pet-gear-density-v6')/z['file']).convert('RGBA');at=locate(paint,oldtex);binding=bindings[owner];box=binding['sourceBounds'];tex=Image.open(source/binding['file']).convert('RGBA')
 return tex,{'x':z['x']+(box[0]-at[0])/2,'y':z['y']+(box[1]-at[1])/2,'w':tex.width/2,'h':tex.height/2,'density':2}
def layer(pet,ruid,slot):
 z=old[pet][ruid][slot]
 if pet=='landturtle'and slot=='coat'and z.get('replacesBody')and ns['frames'][pet][next(k for k,f in ns['frames'][pet].items()if f['ruid']==ruid)]['pose']!='roll':return raw_bugi(ruid)
 return texture(z['asset']),z
def core(im,pet):
 a=np.array(im);r,g,b,al=a.transpose(2,0,1).astype(float)
 if pet=='5002617':m=(al>100)&(r>g*1.15)&(g>b*1.4)&(r>150)
 elif pet=='landturtle':m=(al>100)&(b>r*1.1)&(b>g*.98)&(b>100)
 else:m=(al>100)&(g>r*1.15)&(b>r*1.15)&(g>90)
 y,x=np.where(m);assert len(x),pet
 return np.array([x.mean()/2,y.mean()/2])
def physical_point(ruid,z,point):return np.array(origin(ruid))+np.array([z['x'],z['y']])+point
def track(ref,target,point,slot):
 if ref==target:return 0,0,0.
 a=native(ref);b=native(target);cx,cy=point
 radius=9 if slot=='neck'else 14
 x0=max(5,round(cx-radius));x1=min(187,round(cx+radius));y0=max(5,round(cy-radius));y1=min(155,round(cy+radius))
 patch=a[y0:y1,x0:x1];mask=patch[:,:,3]>180
 # Exact original-body pixels in a local garment/neck region determine translation.
 best=None
 for dy in range(-12,13):
  for dx in range(-12,13):
   if y0+dy<0 or y1+dy>160 or x0+dx<0 or x1+dx>192:continue
   q=b[y0+dy:y1+dy,x0+dx:x1+dx];valid=q[:,:,3]>180
   error=np.abs(patch[:,:,:3].astype(float)-q[:,:,:3].astype(float)).mean(axis=2)/255
   cost=float((np.where(valid,error,1.2)[mask]).mean())+.0002*(dx*dx+dy*dy)
   value=(cost,abs(dx)+abs(dy),dy,dx)
   if best is None or value<best:best=value
 return best[3],best[2],best[0]
def occluder(pet,ruid):
 m=meta[ruid];a=np.array(Image.open(m['file']).convert('RGBA'));r,g,b,al=a.transpose(2,0,1).astype(float);hb=fits.get(ruid,{}).get('headBounds')or[0,0,m['w'],m['h']];yy,xx=np.indices(al.shape);head=(xx>=hb[0])&(xx<hb[2])&(yy>=hb[1])&(yy<hb[3])&(al>100)
 if pet=='5000498':head&=~((r>g*1.3)&(b>g*1.05)&(g<120)&(r<235)&(r>40))
 elif pet=='landturtle':
  skin=(al>150)&(r>150)&(g>110)&(b>100)&(r>=g*.99)&(r>b);head=np.zeros_like(head)
  for y in range(max(0,hb[1]),min(m['h'],hb[3])):
   xs=np.where(skin[y]&(xx[y]>=hb[0])&(xx[y]<hb[2]))[0]
   if len(xs):head[y,max(0,xs.min()-1):min(m['w'],xs.max()+2)]=True
 elif pet=='oduck':
  orange=(r>150)&(g>45)&(g<195)&(b<130)&(r>g*1.15)&(yy<m['h']-7)&(xx<m['w']*.78)&(al>100)
  nc,cc,stats,_=cv2.connectedComponentsWithStats(orange.astype(np.uint8),connectivity=8)
  if nc>1:
   k=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]));bill=cv2.dilate((cc==k).astype(np.uint8),np.ones((3,3),np.uint8))>0;head|=bill&(al>100)
 return head
def save_descriptor(im,z,name):
 p=out/name;im.save(p)
 return {k:z[k]for k in ['x','y','w','h','density']}|{'file':str(p.resolve())}
def shell_only(im):
 a=np.array(im);r,g,b,al=a.transpose(2,0,1).astype(float);yy,xx=np.indices(al.shape)
 green=(g>r*1.09)&(g>b*1.04)&(g>35)&(al>100)
 gy,gx=np.where(green);assert len(gx)
 cols=np.unique(gx);bottom=np.interp(np.arange(im.width),cols,[np.where(green[:,x])[0].max()for x in cols])
 cream=(r>160)&(g>100)&(b>75)&(r>g*1.02)&(g>b*1.08)&(al>100)&(xx>=gx.min()-5)&(xx<=gx.max()+5)&(yy>=bottom[None,:]-3)&(yy<=bottom[None,:]+10)
 keep=green|cream;edge=cv2.dilate(keep.astype(np.uint8),np.ones((3,3),np.uint8))>0
 keep|=edge&(r<120)&(g<115)&(b<110)&(al>0)
 a[~keep,3]=0
 return Image.fromarray(a)
canonical={}
for pet in maps:
 clip=next(c for c in n['clips']if c['petId']==pet and c['pose']=='stand1');ruid=clip['frames'][0]['ruid'];im,z=layer(pet,ruid,'neck');canonical[pet]=(im,z,core(im,pet))
known={f['ruid']for c in n['clips']for f in c['frames']};extra={}
for page in json.loads(Path('outputs/pet-gear-painted-v5/pages.json').read_text()):
 for frame in page['frames']:
  if frame['ruid']not in known:
   extra.setdefault((page['pet'],frame['pose']),[]).append({'ruid':frame['ruid']})
for (pet,pose),frames in extra.items():n['clips'].append({'petId':pet,'pose':pose,'frames':frames})
for c in n['clips']:
 pet=c['petId'];pose=c['pose']
 if pet not in maps or pose in ['icon','roll']:continue
 frames=[f['ruid']for f in c['frames']]
 groups={}
 for j,ruid in enumerate(frames):
  group=(1 if pet=='landturtle'and pose=='love'and j>=4 else 0)
  if pet=='oduck'and pose in ['dance','transform']:group=j
  groups.setdefault(group,[]).append(ruid)
 for group,ruids in groups.items():
  for slot in (['neck','coat','hat']if pet=='5000498'else['neck','coat']):
   visible=[r for r in ruids if slot in old[pet].get(r,{})]
   if not visible:continue
   # Bugi's coat replaces a whole native frame. Preserve those already painted
   # body/leg poses instead of rebuilding a shell with an approximate body mask.
   if slot=='coat'and pet=='landturtle':continue
   # Keep original special torso transformations; their source geometry changes on purpose.
   if slot=='coat'and pet=='oduck'and pose in ['dance','transform']:continue
   ref=visible[0];reftex,refz=layer(pet,ref,slot)
   if slot=='neck':
    points=[physical_point(r,old[pet][r]['neck'],core(texture(old[pet][r]['neck']['asset']),pet))for r in visible]
    median=np.median(points,axis=0);ref=min(visible,key=lambda r:np.linalg.norm(physical_point(r,old[pet][r]['neck'],core(texture(old[pet][r]['neck']['asset']),pet))-median));reftex,refz=layer(pet,ref,slot);refpoint=physical_point(ref,refz,core(reftex,pet))
    shifts={r:track(ref,r,refpoint,slot)for r in visible}
    referenceCenters=[p-np.array(shifts[r][:2])for p,r in zip(points,visible)];center=np.round(np.median(referenceCenters,axis=0)*2)/2
    stable,stablez,stablecore=canonical[pet];basez={'w':stable.width/2,'h':stable.height/2,'density':2}
   else:
    stable=shell_only(reftex)if pet=='landturtle'else reftex;refpoint=physical_point(ref,refz,np.array([refz['w']/2,refz['h']/2]));shifts={r:track(ref,r,refpoint,slot)for r in visible}
   for ruid in visible:
    dx,dy,score=shifts[ruid];targetOrigin=np.array(origin(ruid));refOrigin=np.array(origin(ref));shift=np.array([dx,dy]);head=occluder(pet,ruid)
    # A substantially different anatomical pose needs its own painted contour.
    # Never force an unrelated torso/ear patch onto it based on a weak match.
    if slot!='neck'and score>.20:continue
    if slot=='neck':
     neckcenter=center+shift
     if score>.20:neckcenter=physical_point(ruid,old[pet][ruid]['neck'],core(texture(old[pet][ruid]['neck']['asset']),pet))
     xy=np.round((neckcenter-targetOrigin-stablecore)*2)/2;z=basez|{'x':float(xy[0]),'y':float(xy[1])};im=stable.copy()
    else:
     z={k:refz[k]for k in ['w','h','density']};xy=np.array([refz['x'],refz['y']])+refOrigin+shift-targetOrigin;z|={'x':float(xy[0]),'y':float(xy[1])};im=stable.copy()
    # Bake the actual native head/bill overlap into this frame; no jewelry rescaling.
    hmask=Image.fromarray(head.astype(np.uint8)*255).resize((meta[ruid]['w']*2,meta[ruid]['h']*2),Image.Resampling.NEAREST)
    if slot=='coat'and pet!='landturtle':
     rh=Image.fromarray(occluder(pet,ref).astype(np.uint8)*255).resize((meta[ref]['w']*2,meta[ref]['h']*2),Image.Resampling.NEAREST)
     previous=Image.new('L',hmask.size);previous.paste(rh,(round((refOrigin[0]+dx-targetOrigin[0])*2),round((refOrigin[1]+dy-targetOrigin[1])*2)))
     hmask=Image.fromarray(np.where((np.array(hmask)>0)&(np.array(previous)==0),255,0).astype(np.uint8))
    mask=Image.new('L',im.size);mask.paste(hmask,(-round(z['x']*2),-round(z['y']*2)))
    a=np.array(im);hidden=(np.asarray(mask)>0)if slot!='hat'else np.zeros((im.height,im.width),bool);a[hidden,3]=0;im=Image.fromarray(a)
    if pet=='landturtle'and slot=='coat':
     current=old[pet][ruid]['coat'];previousBody=texture(current['asset']);m=meta[ruid];base=Image.open(m['file']).convert('RGBA');body=Image.new('RGBA',previousBody.size);body.alpha_composite(base.resize((m['w']*2,m['h']*2),Image.Resampling.NEAREST),(32,32));ba=np.array(body)
     protected=Image.new('L',body.size);protected.paste(hmask,(32,32));protect=np.array(protected)>0
     painted=Image.new('RGBA',body.size);painted.alpha_composite(im,(round((z['x']+16)*2),round((z['y']+16)*2)));pa=np.array(painted)
     oldtex,oldz=raw_bugi(ruid);green=np.array(oldtex);rr,gg,bb,aa=green.transpose(2,0,1).astype(float);greenMask=(gg>rr*1.09)&(gg>bb*1.04)&(aa>100);gy,gx=np.where(greenMask);shellCenter=oldz['x']+gx.mean()/2
     hb=fits[ruid]['headBounds']
     if hb is None:
      nc,cc,stats,_=cv2.connectedComponentsWithStats((ba[:,:,3]>100).astype(np.uint8),connectivity=8);largest=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]));ba[cc==largest,3]=0
     else:
      headCenter=(hb[0]+hb[2])/2;plane=(headCenter+shellCenter)/2;yy,xx=np.indices(ba.shape[:2]);xx=xx/2-16;yy=yy/2-16;behind=(xx>=plane)if shellCenter>headCenter else(xx<=plane)
      r0,g0,b0,alpha0=ba.transpose(2,0,1).astype(float);paw=(r0>175)&(g0>140)&(b0>105)&(alpha0>100)&(yy>=hb[3]-1)
      # Keep original belly/leg poses while replacing the rear shell footprint.
      footprint=behind&(yy>=oldz['y']-1)&(yy<m['h']-2)&~protect&~paw
      ba[footprint,3]=0
     ba[(pa[:,:,3]>0)&~protect,3]=0
     body=Image.fromarray(ba);body.alpha_composite(painted);im=body;z={'x':-16,'y':-16,'w':im.width/2,'h':im.height/2,'density':2,'replacesBody':True}
    desc=save_descriptor(im,z,f'{pet}-{pose}-{group}-{ruid}-{slot}.png')
    if z.get('replacesBody'):desc['replacesBody']=True
    maps[pet][ruid][slot]=desc
    audit.append({'pet':pet,'pose':pose,'frame':ruid,'slot':slot,'referenceFrame':ref,'rigidTranslation':[dx,dy],'matchingError':score,'noScaleOrWarp':True,'occludedPixels':int(hidden.sum())})
# Retain unchanged asset references as concrete files for a single complete manifest.
for pet,rows in maps.items():
 for ruid,layers in rows.items():
  for slot,z in list(layers.items()):
   if 'file'not in z:
    z['file']=assets[z.pop('asset')]['file']
(out/'parts.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');(out/'motion-registration.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
print('Built',len(audit),'motion-registered layers with fixed jewel artwork and native occlusion.')
