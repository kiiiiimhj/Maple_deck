from pathlib import Path
from PIL import Image,ImageDraw
import json,sys
sys.path.insert(0,'work/pet-gear-contours-v7')
from grab_contour import locate
n=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());m={s['ruid']:s for s in n['sprites']};out=Path('outputs/pet-gear-pose-v9')
v7=json.loads(Path('outputs/pet-gear-contours-v7/overlay-map.json').read_text());v8=json.loads(Path('outputs/pet-gear-motion-v8/overlay-map.json').read_text());a7={s['name']:s for s in json.loads(Path('outputs/pet-gear-contours-v7/asset-specs.json').read_text())};a8={s['name']:s for s in json.loads(Path('outputs/pet-gear-motion-v8/asset-specs.json').read_text())}
def render(pet,ruid,rows,assets,slot):
 b=m[ruid];im=Image.new('RGBA',(100,100));ox=round(50-b['px']*b['w']);oy=round(85-(1-b['py'])*b['h']);im.alpha_composite(Image.open(b['file']).convert('RGBA'),(ox,oy));z=rows[pet][ruid][slot];tex=Image.open(assets[z['asset']]['file']).convert('RGBA');canvas=im.resize((200,200),Image.Resampling.NEAREST);canvas.alpha_composite(tex,(ox*2+round(z['x']*2),oy*2+round(z['y']*2)));return canvas.resize((400,400),Image.Resampling.NEAREST)
for pet,pose in [('oduck','chat'),('oduck','love'),('oduck','move'),('5000498','chat')]:
 c=next(c for c in n['clips']if c['petId']==pet and c['pose']==pose);board=Image.new('RGB',(800,len(c['frames'])*400),(60,53,46))
 for j,f in enumerate(c['frames']):
  for col,(rows,assets)in enumerate([(v7,a7),(v8,a8)]):
   im=render(pet,f['ruid'],rows,assets,'coat');board.paste(im,(400*col,j*400),im)
 board.save(out/(pet+'-'+pose+'-v7-v8-coat.png'))
ns={};p=Path('work/pet-gear-contours-v7/build_contour_assets.py').read_text();exec(p[:p.index('for file in old.glob')],ns)
pages=json.loads(Path('outputs/pet-gear-painted-v5/pages.json').read_text());binding=next(b for b in json.loads(Path('outputs/pet-gear-contours-v7/source-pixel-bindings.json').read_text())if b['pet']=='5002617'and b['slot']=='hat'and b['sourceIndex']==23);pg=next(pg for pg in pages if pg['pet']=='5002617'and pg['page']==binding['sourcePage']);f=next(f for f in pg['frames']if f['index']==23);_,paint=ns['painted'](ns['frames']['5002617'][23],pg,'5002617','hat');tex=Image.open(Path('outputs/pet-gear-contours-v7')/binding['file']).convert('RGBA');at=binding['sourceBounds'][:2];box=(max(0,at[0]-8),max(0,at[1]-8),at[0]+tex.width+8,at[1]+tex.height+8);board=Image.new('RGB',(800,500),(60,53,46));ref=paint.crop(box).resize((400,400),Image.Resampling.NEAREST);board.paste(ref,(0,0),ref);h=tex.resize((tex.width*10,tex.height*10),Image.Resampling.NEAREST);board.paste(h,(420,70),h);board.save(out/'guri-hat-source-and-extracted.png');print('source frame',f['index'],'bounds',at)
