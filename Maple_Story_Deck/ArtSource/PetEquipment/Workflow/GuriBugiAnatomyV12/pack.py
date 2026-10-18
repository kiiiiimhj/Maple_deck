from pathlib import Path
import json,hashlib,sys
from PIL import Image
sys.path.insert(0,str(Path('work/pet-guri-bugi-v12').resolve()))
from repair_art import data,parts,comp,out,root,changed
old=json.loads((root/'Maps/native-equipment-v11.json').read_text());sheets={};world={};specs=changed.copy()
def register(im,name):
 key=name+'_'+hashlib.sha256(im.tobytes()).hexdigest()[:16];p=out/(key+'.png');im.save(p);specs[key]={'name':key,'file':str(p.resolve()),'size':list(im.size),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()};return key
for pet in ['5002617','landturtle']:
 l=data['layouts'][pet];sheets[pet]={};world[pet]={}
 for code in range(27):
  if code//3%3==0:continue
  sheet=Image.new('RGBA',(l['columns']*l['tileW'],l['rows']*l['tileH']))
  for base,index in data['indices'][pet].items():sheet.paste(comp(pet,base,code),(index%l['columns']*l['tileW'],index//l['columns']*l['tileH']))
  sheets[pet][str(code)]=register(sheet,pet+'_sheet_'+str(code))
 for base,choices in old['world'][pet].items():
  for code in choices:
   if code=='0'or int(code)//3%3==0:continue
   a=comp(pet,base,int(code));b=comp(pet,base,int(code),True)
   if a.tobytes()!=b.tobytes():world[pet].setdefault(base,{})[code]=register(a,pet+'_world_'+str(code))
(out/'asset-specs.json').write_text(json.dumps(list(specs.values()),indent=2));(out/'sheet-input.json').write_text(json.dumps(sheets,indent=2));(out/'world-input.json').write_text(json.dumps(world,indent=2));(out/'repaired-inputs.json').write_text(json.dumps({**data,'parts':parts},indent=2))
u=Path('work/pet-equipment-native-v11/upload.py').read_text().replace('pet-equipment-native-v11','pet-guri-bugi-v12').replace("'pn11_'","'p12_'")
Path('work/pet-guri-bugi-v12/upload.py').write_text(u,encoding='utf-8')
print('Ready',len(specs),'textures; sheets',sum(len(x)for x in sheets.values()),'world',sum(len(c)for p in world.values()for c in p.values()),flush=True)
