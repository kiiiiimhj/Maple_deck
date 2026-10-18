from pathlib import Path
from PIL import Image
import json,numpy as np,functools,math
out=Path('outputs/pet-equipment-native-v11');parts=json.loads((out/'parts.json').read_text());specs={r['name']:r for r in json.loads((out/'part-specs.json').read_text())};bodies=json.loads((out/'original-bodies.json').read_text());tables=json.loads((out/'before-tables.json').read_text());metrics=tables['NativePetGearSpriteMetrics']
@functools.lru_cache(None)
def body(base):return Image.open(bodies[base]['file']).convert('RGBA').resize((bodies[base]['w']*2,bodies[base]['h']*2),Image.Resampling.NEAREST)
@functools.lru_cache(None)
def part(key):return Image.open(specs[key]['file']).convert('RGBA')
def origin(base):
 m=metrics[base];return (-round(m['px']*m['w']*2),-round((1-m['py'])*m['h']*2))
def layout(pet):
 left=top=0;right=bottom=1
 for base,designs in parts[pet].items():
  ox,oy=origin(base);box=body(base).getbbox()
  if box:left=min(left,ox+box[0]);top=min(top,oy+box[1]);right=max(right,ox+box[2]);bottom=max(bottom,oy+box[3])
  for layers in designs.values():
   for d in layers.values():
    box=part(d['asset']).getbbox()
    if box:x=ox+round(d['x']*2);y=oy+round(d['y']*2);left=min(left,x+box[0]);top=min(top,y+box[1]);right=max(right,x+box[2]);bottom=max(bottom,y+box[3])
 return {'left':left-2,'top':top-2,'tileW':right-left+4,'tileH':bottom-top+4,'density':2}
layouts={p:layout(p)for p in parts}
def composite(pet,base,code):
 l=layouts[pet];ox,oy=origin(base);position=(ox-l['left'],oy-l['top']);im=Image.new('RGBA',(l['tileW'],l['tileH']));im.alpha_composite(body(base),position)
 for slot,digit in [('coat',(code//3)%3),('neck',code//9),('hat',code%3)]:
  if not digit:continue
  d=parts[pet][base][str(digit)].get(slot)
  if not d:continue
  if d.get('replacesBody'):im=Image.new('RGBA',im.size)
  im.alpha_composite(part(d['asset']),(position[0]+round(d['x']*2),position[1]+round(d['y']*2)))
 return im
if __name__=='__main__':
 from PIL import ImageDraw
 native=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text())
 print('Stable source canvases:',layouts)
 for pet in parts:
  keys=list(parts[pet]);columns=math.ceil(math.sqrt(len(keys)));rows=math.ceil(len(keys)/columns);l=layouts[pet];print(pet,len(keys),'poses/frames; sheet',columns*l['tileW'],'x',rows*l['tileH'],'RGBA MB for all combos',round(columns*l['tileW']*rows*l['tileH']*4*27/1024**2,1))
  for design,code in [('original',13),('new',26)]:
   board=Image.new('RGB',(320*6,280*((len(keys)+5)//6)),(78,66,57));dr=ImageDraw.Draw(board)
   for i,base in enumerate(keys):
    im=composite(pet,base,code);box=im.getbbox()
    if not box:continue
    crop=im.crop(box);scale=max(1,min(3,230//max(crop.size)));crop=crop.resize((crop.width*scale,crop.height*scale),Image.Resampling.NEAREST);board.paste(crop,(i%6*320+(320-crop.width)//2,i//6*280+30),crop);dr.text((i%6*320+5,i//6*280+6),str(i)+' '+base[:8],fill='white')
   board.save(out/(pet+'-'+design+'-all-frames.png'))
  samples=[]
  for pose in ['stand1','move','eat','chat','love','sleep']:
   c=next((c for c in native['clips']if c['petId']==pet and c['pose']==pose),None)
   if c:samples.extend((pose,f['ruid'])for f in [c['frames'][0],c['frames'][len(c['frames'])//2]])
  board=Image.new('RGB',(320*6,280*4),(78,66,57));dr=ImageDraw.Draw(board)
  for j,code in enumerate([13,26]):
   for i,(pose,base)in enumerate(samples):
    im=composite(pet,base,code);im=im.crop(im.getbbox());k=max(1,min(3,230//max(im.size)));im=im.resize((im.width*k,im.height*k),Image.Resampling.NEAREST);x=i%6*320+(320-im.width)//2;y=(j*2+i//6)*280+30;board.paste(im,(x,y),im);dr.text((i%6*320+5,(j*2+i//6)*280+6),('ORIGINAL 'if code==13 else'NEW ')+pose,fill='white')
  board.save(out/(pet+'-both-designs-review.png'))
 (out/'layouts.json').write_text(json.dumps(layouts,indent=2))
