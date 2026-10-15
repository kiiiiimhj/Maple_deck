from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,numpy as np
out=Path('outputs/pet-gear-contours-v7');ns={};code=Path('work/pet-gear-contours-v7/build_contour_assets.py').read_text();exec(code[:code.index('for file in old.glob')],ns);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',15);reviews={s:[]for s in ['hat','coat','neck']};audit=json.loads((out/'source-pixel-bindings.json').read_text());checks=[]
for z in audit:
 pet,slot,index=z['pet'],z['slot'],z['sourceIndex'];f=ns['frames'][pet][index];pg=next(p for p in ns['pages']if p['pet']==pet and f in p['frames']);base,paint=ns['painted'](f,pg,pet,slot);box=z['sourceBounds'];texture=Image.open(out/z['file']).convert('RGBA');expected=np.array(paint.crop(box));actual=np.array(texture);opaque=actual[:,:,3]>0;assert np.array_equal(actual[opaque],expected[opaque]),(pet,index,slot)
 pbox=(box[0]-8,box[1]-8,box[2]+8,box[3]+8);raw=paint.crop(pbox);layer=Image.new('RGBA',raw.size);layer.alpha_composite(texture,(8,8));reviews[slot].append((f'{pet} {index} {f["pose"]}',raw,layer));checks.append({'pet':pet,'index':index,'slot':slot,'keptRGBAndAlphaMatchSource':True})
for slot,rows in reviews.items():
 for start in range(0,len(rows),20):
  board=Image.new('RGB',(1200,1400),(58,56,54));d=ImageDraw.Draw(board)
  for j,(label,raw,layer)in enumerate(rows[start:start+20]):
   x=j%4*300;y=j//4*280;d.text((x+3,y+3),label,font=font,fill='white');d.text((x+10,y+25),'source / extracted',font=font,fill='white');scale=min(4,140/max(raw.width,raw.height))
   for k,im in enumerate([raw,layer]):
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST);bg=Image.new('RGB',(145,225),(70,70,100));draw=ImageDraw.Draw(bg)
    for yy in range(0,225,8):
     for xx in range(0,145,8):
      if(xx//8+yy//8)%2:draw.rectangle((xx,yy,xx+7,yy+7),fill=(110,110,140))
    bg.paste(im,((145-im.width)//2,(225-im.height)//2),im);board.paste(bg,(x+k*150,y+50))
  board.save(out/f'{slot}-source-review-{start//20+1}.png')
 print(slot,len(rows),'direct source comparisons',flush=True)
for pet in ns['frames']:
 maps=json.loads((out/(pet+'-parts.json')).read_text());rows=[]
 for ruid,layers in maps.items():
  f=next(f for f in ns['frames'][pet].values()if f['ruid']==ruid);base=Image.open(ns['meta'][ruid]['file']).convert('RGBA');im=Image.new('RGBA',((base.width+32)*2,(base.height+32)*2))
  if not layers.get('coat',{}).get('replacesBody'):im.alpha_composite(base.resize((base.width*2,base.height*2),Image.Resampling.NEAREST),(32,32))
  for slot in ['coat','neck','hat']:
   z=layers.get(slot)
   if z:im.alpha_composite(Image.open(out/z['file']).convert('RGBA'),(round((z['x']+16)*2),round((z['y']+16)*2)))
  rows.append((f,im))
 for start in range(0,len(rows),20):
  board=Image.new('RGB',(1200,1200),(65,56,47));d=ImageDraw.Draw(board)
  for j,(f,im)in enumerate(rows[start:start+20]):
   im=im.resize((round(im.width*1.5),round(im.height*1.5)),Image.Resampling.NEAREST);x=j%4*300+(300-im.width)//2;y=j//4*240+(210-im.height)//2;board.paste(im,(x,y),im);d.text((j%4*300+8,j//4*240+217),f'{f["index"]} {f["pose"]}',font=font,fill='white')
  board.save(out/f'{pet}-review-{start//20+1}.png')
(out/'source-pixel-verification.json').write_text(json.dumps({'status':'passed','checkedUniquePaintedContours':len(checks),'allKeptRGBAndAlphaMatchSource':True,'checks':checks},indent=2),encoding='utf-8')
