from pathlib import Path
from PIL import Image,ImageDraw
import json,copy,hashlib,numpy as np
root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment');out=Path('outputs/pet-ttung-status-fit-v3');stage=Path('work/pet-ttung-status-fit-v3')
registry=json.loads((root/'Maps/equipment-resources.json').read_text())['resources'];files={r['ruid']:root/r['file']for r in registry};bysha={r['sha256']:r['ruid']for r in registry}
inputs=json.loads((root/'Maps/validated-ttung-equipment-inputs.json').read_text());body={r['frame']:root/r['file']for r in inputs['originalBodyFrames']};maps=json.loads((root/'Maps/ttung-cloth-collar-repair-v2.json').read_text());before=copy.deepcopy(maps);rows=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text())['frames'];specs={};changed={};proof=[]
def register(im,name):
 file=out/(name+'.png');im.save(file);sha=hashlib.sha256(file.read_bytes()).hexdigest()
 if sha in bysha:return {'ruid':bysha[sha]}
 key=name+'-'+hashlib.sha256(im.tobytes()).hexdigest()[:12];target=out/(key+'.png');file.rename(target);specs[key]={'name':key,'file':str(target.resolve()),'size':list(im.size),'sha256':sha};return {'asset':key}
def shifted(im,dx,dy):
 result=Image.new('RGBA',im.size);result.paste(im,(dx,dy));return result
# The original reaction animation uses this exact moving-head polygon.
# Keep the back and planted paws fixed, while the chest/neck portion follows
# the head. Move native pixels by an integer, with no filtering or repaint.
polygon=[(19,40),(77,40),(84,79),(80,90),(74,99),(55,105),(19,105)]
def point(x,y):
 inside=False
 for i,(ax,ay)in enumerate(polygon):
  bx,by=polygon[i-1]
  if (ay>y)!=(by>y)and x<(bx-ax)*(y-ay)/(by-ay)+ax:inside=not inside
 return inside
head=np.array([[point(x,y)for x in range(128)]for y in range(128)])
def nod_coat(im):
 a=np.array(im);front=a.copy();front[~head]=0;back=a.copy();back[head]=0
 result=Image.fromarray(back);result.alpha_composite(shifted(Image.fromarray(front),0,1))
 return result
for i in [58,60,62,64]:
 first,second=rows[i:i+2];base=second['ruid'];changed[base]={}
 for design,table in [('1','original'),('2','variants')]:
  oldkey=first['ruid']if design=='1'else first['ruid']+':design2';targetkey=base if design=='1'else base+':design2';changed[base][design]={}
  for slot in ['hat','neck','coat']:
   src=Image.open(files[before[table][oldkey][slot]]).convert('RGBA')
   fixed=nod_coat(src)if slot=='coat'else shifted(src,0,1)
   old=Image.open(files[before[table][targetkey][slot]]).convert('RGBA');pixels=int((np.array(fixed)!=np.array(old)).any(2).sum())
   if pixels:
    key=register(fixed,'ttstatus3-'+str(i+2)+'-'+design+'-'+slot);changed[base][design][slot]=key;maps[table][targetkey][slot]=key
    proof.append({'frame':base,'pose':second['name'],'design':int(design),'slot':slot,'changedPixels':pixels,'source':before[table][oldkey][slot],'movement':'native head rig +1px; stationary back retained'if slot=='coat'else'whole accessory +1px with native head'})
   else:changed[base][design][slot]={'ruid':before[table][targetkey][slot]}
def part(d):
 if isinstance(d,str):return Image.open(files[d]).convert('RGBA')
 if 'ruid'in d:return Image.open(files[d['ruid']]).convert('RGBA')
 return Image.open(specs[d['asset']]['file']).convert('RGBA')
def compose(base,code):
 im=Image.open(body[base]).convert('RGBA')
 for slot,digit in [('coat',code//3%3),('neck',code//9),('hat',code%3)]:
  if digit:
   d=maps['original'][base][slot]if digit==1 else maps['variants'][base+':design2'][slot];im.alpha_composite(part(d))
 return im
atlases={}
for base in changed:
 sheet=Image.new('RGBA',(640,768))
 for code in range(27):sheet.paste(compose(base,code),(code%5*128,code//5*128))
 atlases[base]=register(sheet,'ttstatus3-atlas-'+base[:8])
board=Image.new('RGB',(384*4,410*8),(70,60,52));d=ImageDraw.Draw(board)
for j,row in enumerate(rows[58:66]):
 for col,(old,code)in enumerate([(True,13),(False,13),(True,26),(False,26)]):
  base=row['ruid']
  if old:
   im=Image.open(body[base]).convert('RGBA');layers=before['original'][base]if code==13 else before['variants'][base+':design2']
   for slot in ['coat','neck','hat']:im.alpha_composite(Image.open(files[layers[slot]]).convert('RGBA'))
  else:im=compose(base,code)
  im=im.resize((384,384),Image.Resampling.NEAREST);board.paste(im,(col*384,j*410),im);d.text((col*384+5,j*410+386),row['name']+(' before'if old else' fixed')+(' original'if code==13 else' new'),fill='white')
board.save(out/'reaction-fit-comparison.png')
(out/'part-changes.json').write_text(json.dumps(changed,indent=2));(out/'atlas-input.json').write_text(json.dumps(atlases,indent=2));(out/'asset-specs.json').write_text(json.dumps(list(specs.values()),indent=2));(out/'movement-proof.json').write_text(json.dumps(proof,indent=2));(out/'body-inputs.json').write_text(json.dumps({k:str(v.resolve())for k,v in body.items()},indent=2))
upload=Path('work/pet-equipment-native-v11/upload.py').read_text().replace('pet-equipment-native-v11','pet-ttung-status-fit-v3').replace("'pn11_'","'ts3_'").replace('Native pet original frames and independent equipment. Point filtering.','Ttungttang condition reaction equipment, integer native head/chest rig.')
(stage/'upload.py').write_text(upload,encoding='utf-8')
print('Prepared',len(specs),'changed parts/sheets;',len(proof),'part fixes on four breathing reaction frames; native body frames and unrelated poses unchanged.')
