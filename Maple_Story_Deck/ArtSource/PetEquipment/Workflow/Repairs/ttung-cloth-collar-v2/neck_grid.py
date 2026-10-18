from pathlib import Path
from PIL import Image,ImageDraw
import json
out=Path('outputs/pet-variation-repair-v2');frames=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text())['frames'];map=json.loads((out/'repair-map.json').read_text())['1']
for i in [1,16,51,65,69,73]:
 row=frames[i-1];base=Image.open(row['file']).convert('RGBA');neck=Image.open(out/(map[row['ruid']]['neck']+'.png')).convert('RGBA');bb=(24,70,100,122);scale=9;board=Image.new('RGBA',(bb[2]*0+(bb[2]-bb[0])*scale*2+64,(bb[3]-bb[1])*scale+40),(110,100,88,255));draw=ImageDraw.Draw(board)
 for n,im in enumerate([base,Image.alpha_composite(base,neck)]):
  x0=n*(bb[2]-bb[0])*scale+32;board.alpha_composite(im.crop(bb).resize(((bb[2]-bb[0])*scale,(bb[3]-bb[1])*scale),Image.Resampling.NEAREST),(x0,30))
  for x in range(bb[0],bb[2]):
   sx=x0+(x-bb[0])*scale;draw.line((sx,30,sx,board.height),fill=(70,65,60));
   if x%5==0:draw.text((sx,10),str(x),fill='white')
  for y in range(bb[1],bb[3]):
   sy=30+(y-bb[1])*scale;draw.line((x0,sy,x0+(bb[2]-bb[0])*scale,sy),fill=(70,65,60))
   if y%5==0:draw.text((x0-25,sy),str(y),fill='white')
 board.save(out/f'neck-anatomy-{i:02}.png')
