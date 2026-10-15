from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageChops,ImageFilter
out=Path('outputs/ttung-gear');data=json.loads((out/'base-frames.json').read_text(encoding='utf-8'))
sprites={s:[Image.open(out/(s+'-'+str(i)+'.png')).convert('RGBA') for i in range(1,5)] for s in ['hat','coat','neck']}
specs=[];maps={};hashes={};audit=[];composites={}
manifest=out/'applied-assets.json'
if manifest.exists():
 for name,asset in json.loads(manifest.read_text(encoding='utf-8')).items():
  if Path(asset['file']).exists():hashes[hashlib.sha256(Image.open(asset['file']).convert('RGBA').tobytes()).hexdigest()]=name
def register(name,im):
 h=hashlib.sha256(im.tobytes()).hexdigest()
 if h in hashes:return hashes[h]
 if manifest.exists():name=name+'-fit2'
 path=out/(name+'.png');im.save(path);hashes[h]=name;specs.append({'name':name,'file':str(path.resolve()),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'size':list(im.size)})
 return name
for s in sprites:register(s+'-icon',Image.open(out/(s+'-icon.png')).convert('RGBA'))
def head_shift(current,reference,box):
 a=reference.crop(box);best=None
 for dy in range(-3,4):
  for dx in range(-3,4):
   b=current.crop((box[0]+dx,box[1]+dy,box[2]+dx,box[3]+dy))
   score=sum(abs(x-y) for x,y in zip(a.tobytes(),b.tobytes()))
   candidate=(score,abs(dx)+abs(dy),dx,dy)
   if best is None or candidate<best:best=candidate
 return best[2],best[3]
refs={i:Image.open(data['frames'][i-1]['file']).convert('RGBA') for i in [1,16,51,65]}
for v in data['frames']:
 i=v['index'];base=Image.open(v['file']).convert('RGBA');params={}
 # Full canvas gear overlays have the same origin as the untouched pet frame.
 if i<=15 or 29<=i<=50 or 53<=i<=64:
  dx,dy=head_shift(base,refs[1],(26,43,75,71))
  params={'hat':(0,(36+dx,43+dy),(27,18)),'neck':(0,(44+dx,92+dy),(26,15)),'coat':(0,(53,82),(37,29))}
  fg=[(0,0),(128,0),(128,80+dy),(80,80+dy),(77,88+dy),(69,96+dy),(56,101+dy),(32,104+dy),(0,104+dy)]
  paws=[(0,105+dy),(69,105+dy),(72,128),(0,128)]
 elif 16<=i<=28:
  # The lowered head moves by a few integer pixels; never move the food bowl.
  dx,dy=head_shift(base,refs[16],(24,57,78,91))
  params={'hat':(1,(35+dx,51+dy),(28,17)),'neck':(1,(47+dx,94+dy),(25,13)),'coat':(1,(54,82),(39,28))}
  fg=[(0,0),(128,0),(128,72),(84,72),(82,91),(68,104),(57,110),(0,110)]
  paws=[(0,104),(67,104),(66,128),(0,128)]
 elif i in [51,52]:
  params={'hat':(2,(36,57),(27,14)),'neck':(2,(65,99),(20,11)),'coat':(2,(54,94),(41,18))}
  fg=[(0,0),(128,0),(128,75),(83,75),(81,101),(62,111),(0,115)]
  paws=[(0,110),(75,110),(75,128),(0,128)]
 elif i in [65,66]:
  dx,dy=head_shift(base,refs[65],(24,59,76,90))
  params={'hat':(1,(37+dx,57+dy),(28,17)),'neck':(1,(46+dx,99+dy),(25,13)),'coat':(1,(53,87),(40,26))}
  fg=[(0,0),(128,0),(128,73),(81,73),(80,99),(63,109),(0,111)]
  paws=[(0,110),(69,110),(72,128),(0,128)]
 else:
  nod={67:0,68:12,69:23,70:2,71:0,72:0,73:0,74:0,75:8,76:17}[i]
  params={'hat':(0,(36,19+nod),(28,19)),'neck':(0,(42,79+nod),(29,16)),'coat':(3,(49,74+(nod//2)),(41,33))}
  # Coat is behind the huge fluffy head and the jumping paws.
  fg=[(0,0),(128,0),(128,52+nod),(81,52+nod),(81,72+nod),(70,81+nod),(57,86+nod),(0,82+nod)]
  paws=[]
 layers={};combo=base.copy()
 for s in ['coat','neck','hat']:
  variant,pos,size=params[s];item=sprites[s][variant].resize(size,Image.Resampling.NEAREST)
  if s=='neck':
   # The rear arc is behind the fluffy neck, rather than a floating ring on the chest.
   a=item.getchannel('A');ImageDraw.Draw(a).rectangle((2,0,size[0]-3,round(size[1]*0.34)),fill=0);item.putalpha(a)
  layer=Image.new('RGBA',(128,128));layer.alpha_composite(item,pos)
  if s=='coat':
   foreground=Image.new('L',(128,128));d=ImageDraw.Draw(foreground);d.polygon(fg,fill=255)
   if paws:d.polygon(paws,fill=255)
   # Jump front paws cover the vest; use original foreground pixels at explicit arm boxes.
   if i>=67:
    boxes={67:[(11,72,41,91),(66,73,83,93)],68:[(16,85,38,104),(58,91,84,111)],69:[(26,97,47,119),(56,102,84,124)],70:[(12,73,40,94),(66,75,84,94)],71:[(19,75,37,91),(48,80,80,103)],72:[(19,75,37,92),(48,80,80,103)],73:[(19,75,37,92),(48,80,80,103)],74:[(19,78,38,96),(49,81,80,103)],75:[(22,86,40,106),(47,91,79,114)],76:[(26,94,47,116),(47,99,80,122)]}[i]
    for box in boxes:d.rectangle(box,fill=255)
   occluded=ImageChops.multiply(foreground,base.getchannel('A'));alpha=ImageChops.subtract(layer.getchannel('A'),occluded)
   # Do not paint floating vest pixels outside the torso silhouette.
   alpha=ImageChops.multiply(alpha,base.getchannel('A').filter(ImageFilter.MaxFilter(3)));layer.putalpha(alpha)
  if s=='neck' and 16<=i<=28:
   # Bowl and muzzle occupy the foreground while the pendant sits on the right chest.
   mask=Image.new('L',(128,128),255);ImageDraw.Draw(mask).rectangle((0,98,59,127),fill=0);layer.putalpha(ImageChops.multiply(layer.getchannel('A'),mask))
  key=register(s+'-frame-'+str(i).zfill(2),layer);layers[s]=key;combo=Image.alpha_composite(combo,layer)
  audit.append({'frame':i,'slot':s,'variant':variant+1,'position':pos,'size':size,'pixels':sum(a>0 for a in layer.getchannel('A').getdata())})
 maps[v['ruid']]=layers;composites[i]=combo
 combo.save(out/('equipped-'+str(i).zfill(2)+'.png'))
for page in range(4):
 img=Image.new('RGB',(1536,1136),(210,203,185));d=ImageDraw.Draw(img)
 for n,v in enumerate(data['frames'][page*24:(page+1)*24]):
  im=composites[v['index']].resize((256,256),Image.Resampling.NEAREST);x=n%6*256;y=n//6*284;img.paste(im,(x,y),im);d.text((x+4,y+258),str(v['index'])+' '+v['name'],fill=(20,20,20))
 img.save(out/('equipped-contact-'+str(page+1)+'.png'))
for pose,ids in data['motions'].items():
 frames=[composites[next(v['index']for v in data['frames'] if v['ruid']==r)].resize((512,512),Image.Resampling.NEAREST) for r in ids]
 frames[0].save(out/(pose+'-equipped.gif'),save_all=True,append_images=frames[1:],duration=80,loop=0,disposal=2)
(out/'asset-specs.json').write_text(json.dumps(specs,indent=2),encoding='utf-8');(out/'overlay-map.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');(out/'anchors.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
print(len(specs),'unique assets for',len(maps),'base frames. Pet pixels never resampled or redrawn.')
