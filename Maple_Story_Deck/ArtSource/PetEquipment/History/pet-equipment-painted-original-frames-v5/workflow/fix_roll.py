from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,sys
sys.path.insert(0,'work/pet-gear-painted-v5')
from extract import align,part_pixels,channels,dilate
out=Path('outputs/pet-gear-painted-v5');page=json.loads((out/'roll-page.json').read_text());coat=Image.open(out/'roll-coat.png').convert('RGBA').resize(tuple(page['size']),Image.Resampling.NEAREST);acc=Image.open(out/'roll-accessories.png').convert('RGBA').resize(tuple(page['size']),Image.Resampling.NEAREST)
# Correct the middle spinning frame's export orientation as a rigid whole-frame
# rotation. Its original phase has the head upper-left, unlike the other phase.
cell=coat.crop((384,0,768,384)).transpose(Image.Transpose.ROTATE_180);coat.paste(cell,(384,0))
maps={pet:json.loads((out/(pet+'-parts.json')).read_text())for pet in ['5002617','landturtle']};review=Image.new('RGB',(1200,400),(65,56,47));draw=ImageDraw.Draw(review);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',18)
for f in page['frames']:
 pet=f['pet'];base,cp,ca=align(f,coat,page,pet);_,ap,aa=align(f,acc,page,pet);parts={}
 if pet=='landturtle':
  # This complete individually painted blurred body REPLACES the original
  # body when the coat is on. Alpha is retained; no brown ring remains under it.
  body=cp.crop((16,16,16+base.width,16+base.height));a=np.asarray(body).copy();original=np.asarray(base);r,g,b,al=[original[:,:,k].astype(int)for k in range(4)];face=(al>0)&(g>r*.72)&(b>g*.7)&(g>70);a[face]=original[face];body=Image.fromarray(a);name=f'{pet}-{f["index"]:03d}-coat-body.png';body.save(out/name);parts['coat']={'x':0,'y':0,'w':body.width,'h':body.height,'file':name,'replacesBody':True};composite=body
 else:
  for slot,paint in [('coat',cp),('hat',ap)]:
   if slot=='hat':
    r,g,b,a=channels(ap);seed=(a>=200)&(g>r*1.15)&(g>b*1.1)&(g>65);dark=(r<85)&(g<85)&(b<85);ivory=(r>160)&(g>145)&(b>100)&(np.maximum.reduce([r,g,b])-np.minimum.reduce([r,g,b])<100);gold=(r>160)&(g>90)&(g<210)&(b<110);mask=seed|((a>=200)&dilate(seed,3)&(dark|ivory|gold))
   else:mask=part_pixels(base,paint,f,pet,slot)
   a=np.asarray(paint).copy();a[:,:,3]=mask.astype('uint8')*255;im=Image.fromarray(a);box=im.getbbox();assert box,(pet,slot)
   im=im.crop(box);name=f'{pet}-{f["index"]:03d}-{slot}-roll-fixed.png';im.save(out/name);parts[slot]={'x':box[0]-16,'y':box[1]-16,'w':im.width,'h':im.height,'file':name}
  composite=Image.new('RGBA',(base.width+32,base.height+32));composite.alpha_composite(base,(16,16))
  for slot in ['coat','hat']:
   z=parts[slot];composite.alpha_composite(Image.open(out/z['file']),(z['x']+16,z['y']+16))
 maps[pet][f['ruid']]=parts;z=composite.resize((composite.width*3,composite.height*3),Image.Resampling.NEAREST);x=f['cell']*400+(400-z.width)//2;y=(360-z.height)//2;review.paste(z,(x,y),z);draw.text((f['cell']*400+10,370),f'{pet} frame {f["index"]}',font=font,fill='white')
for pet,poses in maps.items():(out/(pet+'-parts.json')).write_text(json.dumps(poses,indent=2),encoding='utf-8')
review.save(out/'roll-final-review.png');(out/'roll-fixed.json').write_text(json.dumps({'status':'art-prepared','frames':3,'blurredBugiBodyReplacementFrames':2,'sourceHeadBlurPreserved':True},indent=2),encoding='utf-8');print('Three original roll frames corrected; Bugi blur uses a complete painted frame.')
