from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
out=Path('outputs/pet-variation-repair-v2')
for name in ['standing','feeding','sleeping','sniffing','crouching','jumping']:
 im=Image.open(Path('outputs/ttung-gear-fitting-v9')/(name+'-guide128.png')).convert('RGBA')
 box=(26,78 if name=='standing' else 75,99,121);crop=im.crop(box);scale=12;can=Image.new('RGB',(crop.width*scale+45,crop.height*scale+30),(90,85,75));can.paste(crop.resize((crop.width*scale,crop.height*scale),Image.Resampling.NEAREST),(40,25),crop.resize((crop.width*scale,crop.height*scale),Image.Resampling.NEAREST));d=ImageDraw.Draw(can)
 for x in range(crop.width+1):
  px=40+x*scale;d.line((px,25,px,25+crop.height*scale),fill=(70,65,60),width=1)
  if (x+box[0])%5==0:d.text((px,7),str(x+box[0]),fill='white')
 for y in range(crop.height+1):
  py=25+y*scale;d.line((40,py,40+crop.width*scale,py),fill=(70,65,60),width=1)
  if(y+box[1])%5==0:d.text((8,py),str(y+box[1]),fill='white')
 can.save(out/(name+'-cloth-grid.png'))
