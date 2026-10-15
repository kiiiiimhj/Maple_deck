from pathlib import Path
import shutil,json,hashlib
from PIL import Image,ImageDraw
out=Path('outputs/ttung-gear')
files={'hat':'exec-64ec4f66-6ed0-4435-acbb-26d651027f54.png','coat':'exec-f4f6b192-eee7-4015-93ab-cf35077c91ac.png','neck':'exec-dc03f49d-9c97-4c6f-b6ec-b03f5503a02a.png'}
root=Path('C:/Users/려진/.codex/generated_images/01a133e3-93f8-7671-b730-56db4bbbed66')
for slot,file in files.items():
 shutil.copy2(root/file,out/(slot+'-sheet.png'));im=Image.open(root/file).convert('RGBA');w,h=im.size
 for i in range(4):
  cell=im.crop((i%2*w//2,i//2*h//2,(i%2+1)*w//2,(i//2+1)*h//2));a=cell.getchannel('A').point(lambda x:255 if x>=200 else 0);bbox=a.getbbox();assert bbox
  cell=cell.crop(bbox);a=a.crop(bbox);cell.putalpha(a)
  # Only preparation of generated sprites: whole-item nearest sampling, stable ink and binary alpha.
  target={'hat':(36,24),'coat':(37,28),'neck':(28,16)}[slot]
  if slot=='coat' and i==2:target=(40,19)
  if slot=='coat' and i==3:target=(35,34)
  if slot=='hat' and i==2:target=(36,19)
  cell=cell.resize(target,Image.Resampling.NEAREST)
  px=cell.load()
  for y in range(cell.height):
   for x in range(cell.width):
    r,g,b,a=px[x,y]
    if not a:px[x,y]=(0,0,0,0)
    elif max(r,g,b)<75:px[x,y]=(22,13,15,255)
    else:px[x,y]=(round(r/8)*8 if r<248 else 248,round(g/8)*8 if g<248 else 248,round(b/8)*8 if b<248 else 248,255)
  cell.save(out/(slot+'-'+str(i+1)+'.png'))
  icon=Image.new('RGBA',(64,64));large=cell.resize((48,round(cell.height*48/cell.width)),Image.Resampling.NEAREST);icon.alpha_composite(large,((64-large.width)//2,(64-large.height)//2));icon.save(out/(slot+'-icon.png')) if i==3 else None
base=json.loads((out/'base-frames.json').read_text(encoding='utf-8'))
ids=[1,12,16,25,51,65,67,68,69,70,71,72,73,74,75,76]
sheet=Image.new('RGB',(1024,4*300),(210,203,185));d=ImageDraw.Draw(sheet)
for n,i in enumerate(ids):
 v=base['frames'][i-1];im=Image.open(v['file']).convert('RGBA').resize((256,256),Image.Resampling.NEAREST);x=n%4*256;y=n//4*300;sheet.paste(im,(x,y),im)
 for p in range(0,129,16):
  d.line((x+p*2,y,x+p*2,y+256),fill=(155,146,120));d.line((x,y+p*2,x+256,y+p*2),fill=(155,146,120));d.text((x+p*2+2,y+3),str(p),fill=(30,30,30));d.text((x+2,y+p*2+2),str(p),fill=(30,30,30))
 d.text((x+3,y+262),str(i)+' '+v['name'],fill=(20,20,20))
sheet.save(out/'anchor-grid.png')
print('Generated art sliced into 12 perspective sprites and 3 icons.')
