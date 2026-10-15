from pathlib import Path
from PIL import Image,ImageDraw
import json,numpy as np,sys,copy
sys.path[:0]=['work/pet-gear-contours-v7/python-libs','work/pet-gear-contours-v7']
from grab_contour import locate
out=Path('outputs/pet-gear-clean-v10');old=Path('outputs/pet-gear-pose-v9');maps=json.loads((old/'overlay-map.json').read_text());assets={s['name']:s for s in json.loads((old/'asset-specs.json').read_text())}
for pet,rows in maps.items():
 for ruid,layers in rows.items():
  for slot,z in layers.items():z['file']=assets[z.pop('asset')]['file']
ns={};code=Path('work/pet-gear-contours-v7/build_contour_assets.py').read_text();exec(code[:code.index('for file in old.glob')],ns)
binding=next(b for b in json.loads(Path('outputs/pet-gear-contours-v7/source-pixel-bindings.json').read_text())if b['pet']=='5002617'and b['slot']=='hat'and b['sourceIndex']==23)
pg=next(p for p in ns['pages']if p['pet']=='5002617'and p['page']==binding['sourcePage']);_,paint=ns['painted'](ns['frames']['5002617'][23],pg,'5002617','hat');prior=Image.open(old/'guri-complete-flower.png').convert('RGBA');x0,y0=map(int,locate(paint,prior));a=np.array(prior);p=np.array(paint)
# Trace the actual source leaf silhouette, including olive/lime interior
# pixels and its entire edge. No color classifier can punch holes in it.
# Coordinates are relative to the source review crop at (67, 33).
spans={8:(11,13),9:(11,13),10:(10,16),11:(8,16),12:(8,16),13:(8,16),14:(8,16),15:(10,16),16:(11,16),17:(11,16),18:(15,16)}
mask=np.zeros((prior.height,prior.width),bool)
for row,(left,right)in spans.items():
 for col in range(left,right+1):
  x=67+col-x0;y=33+row-y0;assert 0<=x<prior.width and 0<=y<prior.height,(x,y)
  mask[y,x]=True;a[y,x]=p[33+row,67+col]
assert np.all(a[mask,3]>=250)
added=int(np.sum(mask&(np.array(prior)[:,:,3]==0)));assert added>10,added
target=out/'guri-flower-whole-left-leaf.png';padded=Image.new('RGBA',(prior.width+4,prior.height+4));padded.paste(Image.fromarray(a),(2,2));padded.save(target)
count=0
for ruid,layers in maps['5002617'].items():
 z=layers.get('hat')
 if z and Path(z['file']).name.startswith('5002617-hat-v9-6ad86859cf49'):
  z['file']=str(target.resolve());z['x']-=1;z['y']-=1;z['w']+=2;z['h']+=2;count+=1
assert count==101,count
(out/'parts.json').write_text(json.dumps(maps,indent=2),encoding='utf-8')
proof={'status':'passed','sourcePainting':binding['sourceFile'],'sourceFrame':23,'sourceTextureOrigin':[x0,y0],'sourceLeafPixels':int(mask.sum()),'previouslyMissingInteriorAndEdgePixels':added,'minimumLeafAlpha':int(a[mask,3].min()),'sourceRGBAndAlphaExact':bool(np.array_equal(a[mask],p[y0:y0+prior.height,x0:x0+prior.width][mask])),'ordinaryGuriFramesUpdated':count}
(out/'leaf-pixel-verification.json').write_text(json.dumps(proof,indent=2),encoding='utf-8');print(json.dumps(proof))
board=Image.new('RGB',(1000,440),(74,80,87))
for j,im in enumerate([prior,Image.fromarray(a)]):
 checker=Image.new('RGB',im.size,(190,190,190));d=ImageDraw.Draw(checker)
 for y in range(im.height):
  for x in range(im.width):
   if(x//2+y//2)%2:d.point((x,y),fill=(225,225,225))
 checker.paste(im,(0,0),im);board.paste(checker.resize((im.width*14,im.height*14),Image.Resampling.NEAREST),(30+j*500,70))
ImageDraw.Draw(board).text((30,30),'BEFORE',fill='white');ImageDraw.Draw(board).text((530,30),'WHOLE SOURCE LEAF',fill='white');board.save(out/'leaf-before-after.png')
