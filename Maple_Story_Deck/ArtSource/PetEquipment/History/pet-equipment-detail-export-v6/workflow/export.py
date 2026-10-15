from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,sys,inspect,re,shutil
import numpy as np
sys.path.insert(0,'work/pet-gear-painted-v5')
import extract as old
src=Path('outputs/pet-gear-painted-v5');out=Path('outputs/pet-gear-density-v6');out.mkdir(parents=True,exist_ok=True);D=2
pages=json.loads((src/'pages.json').read_text());frames={p['pet']:{f['index']:f for pg in pages if pg['pet']==p['pet'] for f in pg['frames']} for p in pages}
def dilate(m,r):return old.dilate(m,round(r*D))
code=inspect.getsource(old.part_pixels).replace('def part_pixels(','def part_hi(')
code=code.replace('yy,xx=np.indices((h,w))','yy,xx=np.indices((h,w))/D')
code=code.replace('opaque=a>=200','opaque=a>=160')
code=code.replace('sum(xs)/len(xs)-cx','sum(xs)/len(xs)/D-cx').replace('sum(ys)/len(ys)-cy','sum(ys)/len(ys)/D-cy')
code=code.replace('(x-target[0])','(x/D-target[0])').replace('(y-target[1])','(y/D-target[1])').replace('(x-cx)','(x/D-cx)').replace('(y-cy)','(y/D-cy)')
code=code.replace('src.alpha_composite(base,(16,16))','src.alpha_composite(base.resize((base.width*D,base.height*D),Image.Resampling.NEAREST),(16*D,16*D))')
code=code.replace('range(max(0,hy),min(h,bot))','range(max(0,round(hy*D)),min(h,round(bot*D)))')
code=code.replace('np.arange(w)>=hx','np.arange(w)/D>=hx').replace('np.arange(w)<hr','np.arange(w)/D<hr')
code=code.replace('xs.min()-1','xs.min()-D').replace('xs.max()+2','xs.max()+2*D')
code=code.replace('seed&=opaque&(yy>=bot-3)', 'seed&=opaque&(yy>=(bot if pet=="5000498" else bot-3))')
code=code.replace('m|=opaque&dilate(m,1)&ivory\n return m','m|=opaque&dilate(m,1)&ivory\n if pet=="5000498":m&=yy>=bot-.5\n return m')
env={'np':np,'Image':Image,'D':D,'dilate':dilate,'groups':old.groups,'channels':old.channels,'fits':old.fits,'landmarks':old.landmarks};exec(code,env);part_hi=env['part_hi']
(out/'export-mask-function.txt').write_text(code,encoding='utf-8')
raw={};oldboxes={};maps={};audit=[]
def high_canvas(f,page,image,registration,base):
 cell=page.get('cellSize',256);cols=page.get('cols',4);j=f['cell'];pw,ph=page['size'];hi=image.resize((pw*D,ph*D),Image.Resampling.NEAREST)
 patch=hi.crop((j%cols*cell*D,j//cols*cell*D,(j%cols+1)*cell*D,(j//cols+1)*cell*D));edge=round(cell/f['scale'])*D;patch=patch.resize((edge,edge),Image.Resampling.NEAREST)
 canvas=Image.new('RGBA',((base.width+32)*D,(base.height+32)*D));canvas.alpha_composite(patch,((registration['dx']+16)*D,(registration['dy']+16)*D));return canvas
def save_piece(pet,f,slot,paint,mask):
 a=np.array(paint);a[:,:,3]=np.where(mask,a[:,:,3],0);im=Image.fromarray(a);box=im.getbbox()
 if box is None:return None
 im=im.crop(box);name=f'{pet}-{f["index"]:03d}-{slot}-detail.png';im.save(out/name)
 return dict(x=box[0]/D-16,y=box[1]/D-16,w=im.width/D,h=im.height/D,file=name,density=D)
for page in pages:
 pet=page['pet'];raw.setdefault(pet,{})
 paint={slot:Image.open(src/f'{pet}-{kind}-{page["page"]}.png').convert('RGBA') for slot,kind in [('coat','coat'),('neck','painted'),('hat','painted')]}
 native={slot:im.resize(tuple(page['size']),Image.Resampling.NEAREST)for slot,im in paint.items()}
 for f in page['frames']:
  if pet=='landturtle'and f['pose']=='roll' or pet=='5002617'and f['pose']=='roll':continue
  raw[pet][f['index']]={}
  for slot in ['coat','neck','hat']:
   base,lo,reg=old.align(f,native[slot],page,pet);oldbox=Image.fromarray((old.part_pixels(base,lo,f,pet,slot)*255).astype('uint8')).getbbox()
   oldboxes[pet,f['index'],slot]=oldbox
   hi=high_canvas(f,page,paint[slot],reg,base);mask=part_hi(base,hi,f,pet,slot);z=save_piece(pet,f,slot,hi,mask)
   if z:raw[pet][f['index']][slot]=z
 print('Exported original painted detail',pet,page['page'],flush=True)
for pet in frames:
 previous=json.loads((src/(pet+'-parts.json')).read_text());maps[pet]={}
 for ruid,layers in previous.items():
  f=next(v for v in frames[pet].values()if v['ruid']==ruid);new={}
  for slot,z in layers.items():
   owner=int(re.search(r'-(\d{3})-',z['file'])[1]);piece=raw.get(pet,{}).get(owner,{}).get(slot);box=oldboxes.get((pet,owner,slot))
   if piece and box:
    new[slot]=dict(piece,x=piece['x']+z['x']-(box[0]-16),y=piece['y']+z['y']-(box[1]-16))
   elif f['pose']=='roll':
    shutil.copy2(src/z['file'],out/z['file']);new[slot]=dict(z,density=1)
  maps[pet][ruid]=new
 # The twelve idle frames have the same necklace, attached to the original jaw
 # baseline. Eye glints are excluded; the pendant never changes shape per blink.
 if pet=='5000498':
  for chosen,poses in [(54,['stand','stand1']),(76,['rest'])]:
   piece=raw[pet][chosen]['neck'];anchor=frames[pet][chosen];lm=old.landmarks[anchor['ruid']];bot=old.fits[anchor['ruid']]['headBounds'][3]
   for f in frames[pet].values():
    if f['pose']not in poses:continue
    b=old.fits[f['ruid']]['headBounds'][3];p=old.landmarks[f['ruid']]
    maps[pet][f['ruid']]['neck']=dict(piece,x=piece['x']+p['x']-lm['x'],y=piece['y']+b-bot)
    audit.append({'index':f['index'],'pose':f['pose'],'nativeJawBaseline':b,'neckX':maps[pet][f['ruid']]['neck']['x'],'neckY':maps[pet][f['ruid']]['neck']['y'],'samePendantPixels':True})
 (out/(pet+'-parts.json')).write_text(json.dumps(maps[pet],indent=2),encoding='utf-8')
(out/'fox-idle-neck-anchors.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
# The special curled/spinning paintings keep the same improved export density.
rollpage=json.loads((src/'roll-page.json').read_text());rollcoat=Image.open(src/'roll-coat.png').convert('RGBA').resize((rollpage['size'][0]*D,rollpage['size'][1]*D),Image.Resampling.NEAREST);rollacc=Image.open(src/'roll-accessories.png').convert('RGBA')
middle=rollcoat.crop((384*D,0,768*D,384*D)).transpose(Image.Transpose.ROTATE_180);rollcoat.paste(middle,(384*D,0))
for f in rollpage['frames']:
 pet=f['pet'];base,_,reg=old.align(f,rollcoat.resize(tuple(rollpage['size']),Image.Resampling.NEAREST),rollpage,pet);cp=high_canvas(f,rollpage,rollcoat,reg,base)
 if pet=='landturtle':
  im=cp.crop((32,32,32+base.width*D,32+base.height*D));a=np.array(im);original=np.array(base.resize((base.width*D,base.height*D),Image.Resampling.NEAREST));r,g,b,al=original.transpose(2,0,1).astype(int);face=(al>0)&(g>r*.72)&(b>g*.7)&(g>70);a[face]=original[face];im=Image.fromarray(a);name=f'{pet}-{f["index"]:03d}-coat-body-detail.png';im.save(out/name);maps[pet][f['ruid']]={'coat':dict(x=0,y=0,w=base.width,h=base.height,file=name,density=D,replacesBody=True)}
 else:
  _,_,reg=old.align(f,rollacc.resize(tuple(rollpage['size']),Image.Resampling.NEAREST),rollpage,pet);ap=high_canvas(f,rollpage,rollacc,reg,base);layers={}
  for slot,paint in [('coat',cp),('hat',ap)]:
   if slot=='hat':
    r,g,b,a=old.channels(paint);seed=(a>=160)&(g>r*1.15)&(g>b*1.1)&(g>65);dark=(r<85)&(g<85)&(b<85);ivory=(r>160)&(g>145)&(b>100)&(np.maximum.reduce([r,g,b])-np.minimum.reduce([r,g,b])<100);gold=(r>160)&(g>90)&(g<210)&(b<110);mask=seed|((a>=160)&dilate(seed,3)&(dark|ivory|gold))
   else:mask=part_hi(base,paint,f,pet,slot)
   z=save_piece(pet,f,slot,paint,mask)
   if z:layers[slot]=z
  maps[pet][f['ruid']]=layers
for pet in maps:(out/(pet+'-parts.json')).write_text(json.dumps(maps[pet],indent=2),encoding='utf-8')
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17);board=Image.new('RGB',(1200,800),(65,56,47));draw=ImageDraw.Draw(board)
for row,(pet,idx)in enumerate([('5002617',34),('5000498',50),('landturtle',30),('oduck',34)]):
 f=frames[pet][idx];base=Image.open(old.meta[f['ruid']]['file']).convert('RGBA');previous=json.loads((src/(pet+'-parts.json')).read_text())[f['ruid']]
 for col,(root,layers,density)in enumerate([(src,previous,1),(out,maps[pet][f['ruid']],2)]):
  canvas=Image.new('RGBA',((base.width+32)*density,(base.height+32)*density));canvas.alpha_composite(base.resize((base.width*density,base.height*density),Image.Resampling.NEAREST),(16*density,16*density))
  for slot in ['coat','neck','hat']:
   if slot not in layers:continue
   z=layers[slot];im=Image.open(root/z['file']).convert('RGBA');factor=density/z.get('density',1);im=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.NEAREST);canvas.alpha_composite(im,(round((z['x']+16)*density),round((z['y']+16)*density)))
  size=(round(canvas.width*3/density),round(canvas.height*3/density));canvas=canvas.resize(size,Image.Resampling.NEAREST);x=col*600+140;y=row*200+(180-canvas.height)//2;board.paste(canvas,(x,y),canvas);draw.text((col*600+8,row*200+180),pet+(' previous export'if col==0 else' preserved painted detail'),font=font,fill='white')
board.save(out/'detail-export-comparison.png');print('Exported four pets; Fox idle necklace uses one stable source-painted pendant.',flush=True)
