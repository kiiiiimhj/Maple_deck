from pathlib import Path
from PIL import Image,ImageChops,ImageDraw
import json,sys,ast,hashlib,collections,colorsys
import numpy as np
out=Path('outputs/pet-variation-repair-v2');source=Path('outputs/ttung-gear-fitting-v9');data=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text());frames=data['frames'];fits=json.loads((source/'pose-fitting.json').read_text())
old=json.loads(Path('outputs/pet-variation-v1/original-maps.json').read_text())['PetGearOverlays'];root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment');registry=json.loads((root/'Maps/equipment-resources.json').read_text())['resources'];files={r['ruid']:root/r['file']for r in registry}
# Reuse native-pixel registration helpers, without running the old writer.
ns={};script=Path('work/ttung-gear/fitting9_assemble.py').read_text();exec(script[:script.index('# Each jump body')],ns)
classify=ns['classify'];components=ns['components'];maskof=ns['maskof'];boxmask=ns['boxmask'];affine=ns['affine'];translate=ns['translate'];clean=ns['clean'];centroid=ns['centroid']
poseRefs={'standing':1,'feeding':16,'sleeping':51,'sniffing':65,'crouching':69,'jumping':73}
for i in [67,68,70,71,72,74,75,76]:poseRefs['jump-'+str(i)]=i
masters={};metrics=[]
for pose,index in poseRefs.items():
 raw=Image.open(source/(pose+'-guide128.png')).convert('RGBA');fit=fits[pose];colors=classify(raw)
 # The full garment master contains the piping and fabric that the old broad
 # skin/paw masks later erased. Do not repeat those rectangular erasures.
 # Rebuild the material contour from the source, with a one-pixel piping
 # border. The old two-pixel colour dilation copied adjacent paw/fur lines.
 gleft=fit['guideEars'][0];gright=fit['guideEars'][1]
 harea=boxmask((0,0,min(127,round(gright[0]+2)),min(127,round(gright[1]+10))))
 bodyblue=ImageChops.subtract(colors['blue'],ImageChops.multiply(colors['blue'],harea))
 threshold={'standing':88,'feeding':96,'sleeping':99,'sniffing':98}.get(pose,min(gleft[1],gright[1])+35)
 candidates=[g for g in components(bodyblue)if len(g)>4 and centroid(g)[1]>threshold]
 seed=maskof(set().union(*candidates));cbox=seed.getbbox();assert cbox,pose
 croi=boxmask((max(0,cbox[0]-2),max(0,cbox[1]-2),min(127,cbox[2]+2),min(127,cbox[3]+2)))
 button=ImageChops.multiply(ImageChops.multiply(colors['gold'],croi),boxmask((70,0,127,127)));seed=ImageChops.lighter(seed,button)
 border=ImageChops.multiply(seed.filter(ns['ImageFilter'].MaxFilter(3)),ImageChops.lighter(colors['ink'],colors['ivory']))
 mask=ImageChops.lighter(seed,border)
 coat=raw.copy();coat.putalpha(ImageChops.multiply(mask,raw.getchannel('A')));coat=clean(translate(coat,*fit['coatOffset']))
 if pose=='sleeping':
  neck=Image.open(source/(pose+'-neck-master.png')).convert('RGBA')
 else:
  hb=fit['hatBox'];groups=[g for g in components(colors['teal'])if 2<=len(g)<40 and 30<centroid(g)[0]<76 and min(y for x,y in g)>hb[3]+9]
  assert groups,pose
  pendant=max(groups,key=lambda g:centroid(g)[1]);cx,cy=centroid(pendant)
  region=boxmask((max(0,int(cx)-16),max(0,int(cy)-12),min(127,int(cx)+16),min(127,int(cy)+6)))
  seed=ImageChops.multiply(region,ImageChops.lighter(colors['brown'],ImageChops.lighter(colors['gold'],maskof(pendant))))
  border=ImageChops.multiply(seed.filter(ns['ImageFilter'].MaxFilter(3)),colors['ink']);allowed=ImageChops.lighter(seed,border)
  chosen=max(components(allowed),key=lambda g:len(g.intersection(pendant)));neck=raw.copy();neck.putalpha(maskof(chosen));neck=clean(affine(neck,fit['head']))
  # Fit to the ORIGINAL native chin rather than the slightly shorter chin in
  # the painted guide. The pendant must never draw over mouth, cheek or bowl.
  if pose=='standing':neck=translate(neck,0,4)
  elif pose=='feeding':
   gems=components(classify(neck)['teal']);px,py=centroid(max(gems,key=len));neck=translate(neck,68-px,109-py)
   visible=Image.new('L',(128,128));ImageDraw.Draw(visible).polygon([(65,105),(72,101),(78,101),(78,111),(65,111)],fill=255);neck.putalpha(ImageChops.multiply(neck.getchannel('A'),visible))
  elif pose=='sniffing':
   # The head covers the pendant during sniffing. Expose only the original
   # leather strap behind the lowered head, never a gem on the cheek/ear.
   strap=Image.open(source/'sleeping-neck-master.png').convert('RGBA');part=strap.crop(strap.getbbox());neck=Image.new('RGBA',(128,128));neck.alpha_composite(part,(74,100))
 masters[pose]={'coat':coat,'neck':neck}

def head_shift(current,reference,box):
 best=None
 for dy in range(-3,4):
  for dx in range(-3,4):
   a=np.array(reference.crop(box)).astype(int);b=np.array(current.crop((box[0]+dx,box[1]+dy,box[2]+dx,box[3]+dy))).astype(int);score=np.abs(a-b).sum();v=(score,abs(dx)+abs(dy),dx,dy)
   if best is None or v<best:best=v
 return best[2:]
refs={pose:Image.open(frames[i-1]['file']).convert('RGBA')for pose,i in poseRefs.items()}
palette=[tuple(x)for x in json.loads(Path('outputs/pet-variation-v1/art-verification.json').read_text())['palette']]
def stripe(image,slot,dx=0,dy=0):
 result=image.copy()
 for y in range(128):
  for x in range(128):
   r,g,b,a=result.getpixel((x,y))
   if not a:continue
   if slot=='coat'and b>r*1.12 and b>g*1.06 and b>20:
    lum=(r+g+b)/3;q=min(2,max(0,int((lum-20)/23)));c=palette[min(3,q+1)]if(x-dx+(y-dy)//3)%6==0 and lum>26 else palette[q];result.putpixel((x,y),(*c,a))
   elif slot=='neck'and g>r*1.14 and b>r*1.1 and max(r,g,b)>65:
    v=max(r,g,b);result.putpixel((x,y),(v,int(v*.24),int(v*.37),a))
 return result
assets={};maps={1:{},2:{}};previews={1:{},2:{}};proof=[]
def register(slot,design,im):
 digest=hashlib.sha256(im.tobytes()).hexdigest()[:12];key=f'ttung-repair2-{slot}-d{design}-{digest}';p=out/(key+'.png')
 if key not in assets:im.save(p);assets[key]={'name':key,'file':str(p.resolve()),'size':[128,128],'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 return key
for row in frames:
 i=row['index'];base=Image.open(row['file']).convert('RGBA');pose='standing';dx=dy=0
 if 16<=i<=28:pose='feeding';dx,dy=head_shift(base,refs[pose],(24,57,78,91))
 elif i in [51,52]:pose='sleeping'
 elif i in [65,66]:pose='sniffing';dx,dy=head_shift(base,refs[pose],(24,59,76,90))
 elif i>=67:pose='crouching'if i==69 else 'jumping'if i==73 else 'jump-'+str(i)
 else:dx,dy=head_shift(base,refs[pose],(26,43,75,71))
 layers={}
 for slot in ['coat','neck']:
  layer=translate(masters[pose][slot],dx if slot=='neck'else 0,dy if slot=='neck'else 0)
  if slot=='coat':
   # Preserve the original external body silhouette, without using fur color
   # as a reason to delete cloth inside that silhouette.
   layer.putalpha(ImageChops.multiply(layer.getchannel('A'),base.getchannel('A')))
  layers[slot]=layer
 for design in [1,2]:
  maps[design][row['ruid']]={};combo=base.copy()
  for slot in ['coat','neck']:
   im=layers[slot]if design==1 else stripe(layers[slot],slot,dx if slot=='neck'else 0,dy if slot=='neck'else 0);maps[design][row['ruid']][slot]=register(slot,design,im);combo.alpha_composite(im)
  if design==1:hat=Image.open(files[old[row['ruid']]['hat']]).convert('RGBA')
  else:
   m=json.loads(Path('outputs/pet-variation-v1/variant-map.json').read_text())[row['ruid']]['hat'];hat=Image.open(Path('outputs/pet-variation-v1')/(m+'.png')).convert('RGBA')
  combo.alpha_composite(hat);previews[design][i]=combo
  previous=Image.open(files[old[row['ruid']]['coat']]).convert('RGBA')
  proof.append({'frame':i,'design':design,'coatPixelsBefore':sum(a>0 for a in previous.getchannel('A').getdata()),'coatPixelsAfter':sum(a>0 for a in layers['coat'].getchannel('A').getdata()),'neckBounds':layers['neck'].getbbox(),'pose':pose})
for design in [1,2]:
 board=Image.new('RGBA',(768,148*13),(107,94,77,255));d=ImageDraw.Draw(board)
 for j,row in enumerate(frames):
  x=j%6*128;y=j//6*148;board.alpha_composite(previews[design][row['index']],(x,y));d.text((x+3,y+128),str(row['index'])+' '+row['name'],fill='white')
 board.save(out/f'proposed-d{design}-all-frames.png')
 sheet=Image.new('RGBA',(256*6,256),(107,94,77,255))
 for j,i in enumerate([1,16,51,65,69,73]):sheet.alpha_composite(previews[design][i].resize((256,256),Image.Resampling.NEAREST),(j*256,0))
 sheet.save(out/f'proposed-d{design}-six-poses.png')
(out/'repair-map.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');(out/'asset-specs.json').write_text(json.dumps(list(assets.values()),indent=2),encoding='utf-8');(out/'art-proof.json').write_text(json.dumps(proof,indent=2),encoding='utf-8')
print('Proposed full fabric masks and chin-relative collars:',len(assets),'textures, 76 frames in both designs.')
