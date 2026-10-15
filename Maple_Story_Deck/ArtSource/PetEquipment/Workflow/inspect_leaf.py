from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,sys,numpy as np
sys.path[:0]=['work/pet-gear-contours-v7/python-libs','work/pet-gear-contours-v7']
ns={};s=Path('work/pet-gear-contours-v7/build_contour_assets.py').read_text();exec(s[:s.index('for file in old.glob')],ns)
root=Path('outputs/pet-gear-clean-v10');binding=next(b for b in json.loads(Path('outputs/pet-gear-contours-v7/source-pixel-bindings.json').read_text())if b['pet']=='5002617'and b['slot']=='hat'and b['sourceIndex']==23)
pg=next(p for p in ns['pages']if p['pet']=='5002617'and p['page']==binding['sourcePage']);_,paint=ns['painted'](ns['frames']['5002617'][23],pg,'5002617','hat');box=(67,33,111,66);crop=paint.crop(box);crop.save(root/'source-flower-crop.png');prior=Image.open('outputs/pet-gear-pose-v9/guri-complete-flower.png').convert('RGBA')
board=Image.new('RGB',(1200,600),(74,80,87));d=ImageDraw.Draw(board);font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13)
for j,im in enumerate([crop,prior]):
 im=im.resize((im.width*12,im.height*12),Image.Resampling.NEAREST);board.paste(im,(j*600+35,50),im)
 for x in range((crop if j==0 else prior).width):d.text((j*600+35+x*12,30),str(x%10),font=font,fill='white')
 for y in range((crop if j==0 else prior).height):d.text((j*600+15,50+y*12),str(y),font=font,fill='white')
board.save(root/'leaf-before-source-grid.png')
print('Source crop origin',box[:2],'source leaf/flower RGB and alpha retained in crop')
