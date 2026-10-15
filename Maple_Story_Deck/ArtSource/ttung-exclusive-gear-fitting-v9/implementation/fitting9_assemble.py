from pathlib import Path
from PIL import Image,ImageDraw,ImageChops,ImageFilter
import json,hashlib,colorsys,math
out=Path('outputs/ttung-gear-fitting-v9');data=json.loads(Path('outputs/ttung-gear/base-frames.json').read_text(encoding='utf-8'))
frames=data['frames'];masters={};specs=[];hashes={};maps={};previews={};fits={}

def components(mask):
 remaining={(x,y)for y in range(128)for x in range(128)if mask.getpixel((x,y))};groups=[]
 while remaining:
  q=remaining.pop();todo=[q];group={q}
  while todo:
   x,y=todo.pop()
   for dx in [-1,0,1]:
    for dy in [-1,0,1]:
     n=(x+dx,y+dy)
     if n in remaining:remaining.remove(n);group.add(n);todo.append(n)
  groups.append(group)
 return groups

def maskof(points):
 m=Image.new('L',(128,128))
 for p in points:m.putpixel(p,255)
 return m

def boxmask(box):
 m=Image.new('L',(128,128));ImageDraw.Draw(m).rectangle(box,fill=255);return m

def poly(points):
 m=Image.new('L',(128,128));ImageDraw.Draw(m).polygon(points,fill=255);return m

def centroid(g):return (sum(x for x,y in g)/len(g),sum(y for x,y in g)/len(g))

def ear(image,side,kind=""):
 skin=Image.new('L',(128,128))
 for y in range(120):
  for x in range(128):
   r,g,b,a=image.getpixel((x,y));h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
   if a and .025<h<.105 and .15<s<.52 and r>175 and g>135 and b>95 and r-g>12 and g-b>12:skin.putpixel((x,y),255)
 roi=boxmask((23 if side==0 else 53,0,54 if side==0 else 72 if kind=='sniffing'else 87,119));skin=ImageChops.multiply(skin,roi)
 groups=[g for g in components(skin)if len(g)>=3]
 assert groups,(side,'no ear interior')
 group=min(groups,key=lambda g:(min(y for x,y in g),-len(g)))
 top=min(y for x,y in group);group={p for p in group if p[1]<=top+10}
 return centroid(group)

def similarity(g1,g2,o1,o2):
 gx,gy=g2[0]-g1[0],g2[1]-g1[1];ox,oy=o2[0]-o1[0],o2[1]-o1[1];den=gx*gx+gy*gy
 a=(gx*ox+gy*oy)/den;b=(gx*oy-gy*ox)/den;tx=o1[0]-a*g1[0]+b*g1[1];ty=o1[1]-b*g1[0]-a*g1[1]
 return a,b,tx,ty

def affine(im,t):
 a,b,tx,ty=t;den=a*a+b*b
 return im.transform((128,128),Image.Transform.AFFINE,(a/den,b/den,(-a*tx-b*ty)/den,-b/den,a/den,(b*tx-a*ty)/den),resample=Image.Resampling.NEAREST)

def translate(im,x,y):
 result=Image.new('RGBA',(128,128));result.alpha_composite(im,(round(x),round(y)));return result

def classify(raw):
 masks={n:Image.new('L',(128,128))for n in ['blue','gold','brown','teal','ink','ivory']}
 for y in range(128):
  for x in range(128):
   r,g,b,a=raw.getpixel((x,y));h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
   if not a:continue
   if b>r*1.22 and b>g*1.15 and s>.32:masks['blue'].putpixel((x,y),255)
   if .055<h<.17 and s>.42 and r>135:masks['gold'].putpixel((x,y),255)
   if .015<h<.105 and s>.35 and 50<r<165 and r>b*1.3:masks['brown'].putpixel((x,y),255)
   if g>r*1.25 and b>r*1.1 and b<g*1.2 and g<b*1.4 and .42<h<.56 and s>.3:masks['teal'].putpixel((x,y),255)
   if max(r,g,b)<75:masks['ink'].putpixel((x,y),255)
   if r>185 and g>155 and b>120 and r-g<65 and g-b<75:masks['ivory'].putpixel((x,y),255)
 return masks

palette=[(35,26,28),(20,27,48),(31,42,70),(44,58,97),(59,76,117),(157,104,35),(224,165,61),(255,209,115),(247,237,215),(219,199,165),(78,45,30),(128,77,47),(25,119,125),(63,158,151)]
def clean(im):
 for y in range(128):
  for x in range(128):
   r,g,b,a=im.getpixel((x,y))
   if not a:im.putpixel((x,y),(0,0,0,0))
   else:
    c=min(palette,key=lambda c:sum((u-v)**2 for u,v in zip((r,g,b),c)))
    im.putpixel((x,y),(*c,255))
 return im

def register(slot,i,im):
 clean(im);h=hashlib.sha256(im.tobytes()).hexdigest()
 if h in hashes:return hashes[h]
 name=f'{slot}-fit9-{i:02d}';p=out/(name+'.png');im.save(p);hashes[h]=name;specs.append({'name':name,'file':str(p.resolve()),'size':[128,128],'sha256':hashlib.sha256(p.read_bytes()).hexdigest()});return name

# Each jump body gets its own painted outfit. There is no vertical clothing stretch.
poses={'standing':1,'feeding':16,'sleeping':51,'sniffing':65,'crouching':69,'jumping':73}
for i in [67,68,70,71,72,74,75,76]:poses['jump-'+str(i)]=i
# Body translations are fitted at the actual sleeve opening and hip, separately from head.
coat_offsets={'standing':(0,0),'feeding':(-1,-5),'sleeping':(-2,-3),'sniffing':(-1,-7),'crouching':(-2,-2),'jumping':(-2,-2)}
for name,i in poses.items():
 path=out/(name+'-guide128.png')
 if not path.exists():continue
 raw=Image.open(path).convert('RGBA');base=Image.open(frames[i-1]['file']).convert('RGBA');colors=classify(raw)
 gleft=ear(raw,0,name);gright=ear(raw,1,name);harea=boxmask((0,0,min(127,round(gright[0]+2)),min(127,round(gright[1]+10))))
 blues=[g for g in components(ImageChops.multiply(colors['blue'],harea))if len(g)>8]
 hatgroup=min(blues,key=lambda g:min(y for x,y in g));hatseed=maskof(hatgroup);hb=hatseed.getbbox()
 hroi=boxmask((max(0,hb[0]-3),max(0,hb[1]-2),min(127,hb[2]+3),min(127,hb[3]+3)))
 hatseed=ImageChops.lighter(hatseed,ImageChops.multiply(colors['gold'],hroi))
 white=ImageChops.multiply(hatseed.filter(ImageFilter.MaxFilter(5)),colors['ivory']);bands=components(white);band=maskof(max(bands,key=len))if bands else Image.new('L',(128,128));fill=ImageChops.lighter(hatseed,band);hatmask=ImageChops.lighter(fill,ImageChops.multiply(fill.filter(ImageFilter.MaxFilter(3)),colors['ink']))
 # Do not copy grey ear surfaces into hat holes. Only painted cap colors/piping/ink.
 hat=raw.copy();hat.putalpha(ImageChops.multiply(hatmask,raw.getchannel('A')))
 headfit=similarity(ear(raw,0,name),ear(raw,1,name),ear(base,0,name),ear(base,1,name));hat=affine(hat,headfit)
 bodyblue=ImageChops.subtract(colors['blue'],ImageChops.multiply(colors['blue'],harea));body_threshold={'standing':88,'feeding':96,'sleeping':99,'sniffing':98}.get(name,min(gleft[1],gright[1])+35);others=[g for g in components(bodyblue)if len(g)>4 and centroid(g)[1]>body_threshold]
 coatseed=maskof(set().union(*others)) if others else Image.new('L',(128,128))
 cbox=coatseed.getbbox();assert cbox is not None,(name,'no vest')
 croi=boxmask((max(0,cbox[0]-2),max(0,cbox[1]-2),min(127,cbox[2]+2),min(127,cbox[3]+2)))
 sidebutton=ImageChops.multiply(ImageChops.multiply(colors['gold'],croi),boxmask((70,0,127,127)));coatseed=ImageChops.lighter(coatseed,sidebutton)
 coatmask=ImageChops.lighter(coatseed,ImageChops.multiply(coatseed.filter(ImageFilter.MaxFilter(5)),ImageChops.lighter(colors['ink'],colors['ivory'])))
 coat=raw.copy();coat.putalpha(ImageChops.multiply(coatmask,raw.getchannel('A')));off=coat_offsets.get(name,(0,0));coat=translate(coat,*off)
 neck=Image.new('RGBA',(128,128))
 if name!='sleeping':
  groups=[g for g in components(colors['teal'])if 2<=len(g)<40 and 30<centroid(g)[0]<76 and min(y for x,y in g)>hb[3]+12]
  assert groups,(name,'no charm');pendant=max(groups,key=lambda g:centroid(g)[1]);cx,cy=centroid(pendant)
  nroi=boxmask((max(0,int(cx)-14),max(0,int(cy)-10),min(127,int(cx)+14),min(127,int(cy)+6)))
  seed=ImageChops.multiply(nroi,ImageChops.lighter(colors['brown'],ImageChops.lighter(colors['gold'],maskof(pendant))))
  nmask=ImageChops.lighter(seed,ImageChops.multiply(seed.filter(ImageFilter.MaxFilter(3)),colors['ink']))
  groups=components(nmask);chosen=max(groups,key=lambda g:len(g.intersection(pendant)));nmask=maskof(chosen)
  neck=raw.copy();neck.putalpha(nmask);neck=affine(neck,headfit)
  goals={1:(49,97),16:(67,103),65:(70,104),67:(52,81),68:(52,93),69:(52,101),70:(52,83),71:(52,81),72:(52,81),73:(52,81),74:(52,84),75:(52,90),76:(52,99)}
  gx,gy=goals[i];nc=classify(neck)['teal'];charm=max(components(nc),key=len);px,py=centroid(charm);neck=translate(neck,gx-px,gy-neck.getbbox()[1])
 else:
  # Same newly painted brown strap, with pendant cropped away while it is behind the head.
  strap=Image.open(out/'standing-guide128.png').convert('RGBA');sc=classify(strap)['brown'];strap.putalpha(ImageChops.multiply(sc,boxmask((39,94,46,97))));box=strap.getbbox();assert box is not None;brown=strap.crop(box).resize((5,2),Image.Resampling.NEAREST);neck.alpha_composite(brown,(77,98))
 masters[name]={'hat':clean(hat),'coat':clean(coat),'neck':clean(neck)};fits[name]={'head':headfit,'guideEars':[ear(raw,0,name),ear(raw,1,name)],'originalEars':[ear(base,0,name),ear(base,1,name)],'coatOffset':off,'hatBox':hat.getbbox(),'coatBox':coat.getbbox(),'neckBox':neck.getbbox()}
 for slot,img in masters[name].items():img.save(out/(name+'-'+slot+'-master.png'))

# Refine these shared-pose movement offsets from the actual unchanged source head.
def head_shift(current,reference,box):
 a=reference.crop(box);best=None
 for dy in range(-3,4):
  for dx in range(-3,4):
   b=current.crop((box[0]+dx,box[1]+dy,box[2]+dx,box[3]+dy));score=sum(abs(x-y)for x,y in zip(a.tobytes(),b.tobytes()));v=(score,abs(dx)+abs(dy),dx,dy)
   if best is None or v<best:best=v
 return best[2:]
refs={n:Image.open(frames[i-1]['file']).convert('RGBA')for n,i in poses.items()if n in masters}
for row in frames:
 i=row['index'];base=Image.open(row['file']).convert('RGBA');name='standing';dx=dy=0
 if 16<=i<=28:name='feeding';dx,dy=head_shift(base,refs[name],(24,57,78,91))
 elif i in [51,52]:name='sleeping'
 elif i in [65,66]:name='sniffing';dx,dy=head_shift(base,refs[name],(24,59,76,90))
 elif i>=67:name='crouching'if i==69 else 'jumping'if i==73 else 'jump-'+str(i)
 else:dx,dy=head_shift(base,refs[name],(26,43,75,71))
 if name not in masters:continue
 layers={};combo=base.copy()
 for slot in ['coat','neck','hat']:
  layer=translate(masters[name][slot],dx if slot!='coat'else 0,dy if slot!='coat'else 0)
  # Only original-pet eye/mouth/foreground pixels own the face; never generated body pixels.
  if name=='standing':eye=(27,72,70,93)
  elif name=='feeding':eye=(25,84,67,102)
  elif name=='sleeping':eye=(26,91,73,110)
  elif name=='sniffing':eye=(24,94,66,113)
  else:
   nods={67:0,68:12,69:23,70:2,71:0,72:0,73:0,74:0,75:8,76:17};eye=(18,47+nods[i],80,77+nods[i])
  guard=Image.new('L',(128,128),255);ImageDraw.Draw(guard).rectangle((eye[0],eye[1],eye[2]-1,eye[3]-1),fill=0);layer.putalpha(ImageChops.multiply(layer.getchannel('A'),guard))
  if slot=='coat':
   layer.putalpha(ImageChops.multiply(layer.getchannel('A'),base.getchannel('A')))
  if name=='feeding':
   bowlkeep=Image.new('L',(128,128),255);ImageDraw.Draw(bowlkeep).rectangle((0,101,61,127),fill=0);layer.putalpha(ImageChops.multiply(layer.getchannel('A'),bowlkeep))
  if slot=='coat':
   if name=='standing':pawboxes=[(34,107,49,127),(54,104,68,127),(80,108,98,127)]
   elif name=='feeding':pawboxes=[(54,104,71,127),(79,105,99,127)]
   elif name=='sleeping':pawboxes=[(26,105,72,127),(76,108,100,127)]
   elif name=='sniffing':pawboxes=[(57,108,72,127),(77,105,101,127)]
   else:pawboxes={67:[(11,72,41,91),(66,73,83,93)],68:[(16,85,38,104),(58,91,84,111)],69:[(26,97,47,119),(56,102,84,124)],70:[(12,73,40,94),(66,75,84,94)],71:[(19,75,37,91),(48,80,80,103)],72:[(19,75,37,92),(48,80,80,103)],73:[(19,75,37,92),(48,80,80,103)],74:[(19,78,38,96),(49,81,80,103)],75:[(22,86,40,106),(47,91,79,114)],76:[(26,94,47,116),(47,99,80,122)]}[i]
   footprint=Image.new('L',(128,128));cream=Image.new('L',(128,128))
   for bounds in pawboxes:footprint=ImageChops.lighter(footprint,boxmask(bounds))
   for y in range(128):
    for x in range(128):
     r,g,b,a=base.getpixel((x,y))
     if a and r>165 and g>145 and b>100:cream.putpixel((x,y),255)
   paws=ImageChops.multiply(ImageChops.multiply(cream,footprint).filter(ImageFilter.MaxFilter(3)),footprint);paws=ImageChops.multiply(paws,base.getchannel('A'))
   layer.putalpha(ImageChops.subtract(layer.getchannel('A'),paws))

  # Original ears' peach interiors stay in front. Keep the garment ends between ear bases.
  if slot=='hat':
   skin=Image.new('L',(128,128))
   for side in [0,1]:
    cx,cy=ear(base,side,name)
    roi=boxmask((int(cx)-4,int(cy)-8,int(cx)+4,int(cy)+6))
    for y in range(max(0,int(cy)-8),min(128,int(cy)+7)):
     for x in range(max(0,int(cx)-4),min(128,int(cx)+5)):
      r,g,b,a=base.getpixel((x,y));h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
      if a and .025<h<.105 and .15<s<.52 and r>175 and g>135 and b>95:skin.putpixel((x,y),255)
   layer.putalpha(ImageChops.subtract(layer.getchannel('A'),skin))
  layers[slot]=register(slot,i,layer);combo=Image.alpha_composite(combo,layer)
 maps[row['ruid']]=layers;previews[i]=combo;combo.save(out/f'equipped-{i:02d}.png')

for page in range(4):
 sheet=Image.new('RGB',(1536,1136),(210,204,190));draw=ImageDraw.Draw(sheet)
 for j,row in enumerate(frames[page*24:(page+1)*24]):
  if row['index']not in previews:continue
  im=previews[row['index']].resize((256,256),Image.Resampling.NEAREST);x=j%6*256;y=j//6*284;sheet.paste(im,(x,y),im);draw.text((x+4,y+258),str(row['index'])+' '+row['name'],fill=(20,20,20))
 sheet.save(out/f'contact-{page+1}.png')
for motion,ruids in data['motions'].items():
 indices=[next(x['index']for x in frames if x['ruid']==r)for r in ruids]
 if any(i not in previews for i in indices):continue
 images=[previews[i].resize((512,512),Image.Resampling.NEAREST)for i in indices];images[0].save(out/(motion+'.gif'),save_all=True,append_images=images[1:],duration=80,loop=0,disposal=2)
(out/'overlay-map.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');(out/'asset-specs.json').write_text(json.dumps(specs,indent=2),encoding='utf-8');(out/'pose-fitting.json').write_text(json.dumps(fits,indent=2),encoding='utf-8')
print('Original frames fitted:',len(maps),'separate layer textures:',len(specs),'painted original-pose guides:',len(masters))
