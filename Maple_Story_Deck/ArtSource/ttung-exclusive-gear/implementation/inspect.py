from pathlib import Path
import re,json,hashlib,shutil
from PIL import Image,ImageDraw
root=Path('G:/Maple_Story_Deck');stage=Path('work/ttung-gear');out=Path('outputs/ttung-gear')
sources={}
for name in ['PetLogic','PetUI','PetHouseUI','PetProgress']:
 p=root/'RootDesk/MyDesk/Pet'/(name+'.mlua');shutil.copy2(p,stage/(name+'.before.mlua'));sources[name]={'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
p=root/'RootDesk/MyDesk/Localization/GameText.csv';shutil.copy2(p,stage/'GameText.before.csv');sources['GameText']={'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(stage/'sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8')
assets={}
for p in list(Path('outputs').glob('pet-ttungttang-*/applied-assets.json'))+[Path('outputs/ttung-charm-jump-v3/applied-assets.json')]:
 for k,v in json.loads(p.read_text(encoding='utf-8')).items():
  if 'ruid' in v and 'file' in v and Path(v['file']).exists():assets[v['ruid']]={'name':k,**v}
s=(stage/'PetLogic.before.mlua').read_text(encoding='utf-8');section=s.split('property table TtungttangFrames = {',1)[1].split('\n\t}',1)[0];motions={k:re.findall(r'"([0-9a-f]{32})"',v) for k,v in re.findall(r'(\w+)=\{([^}]+)\}',section)}
motions['jump']=re.findall(r'"([0-9a-f]{32})"',s.split('property table PetCharmJumpRUIDs = {',1)[1].split('}',1)[0])
used=list(dict.fromkeys(r for v in motions.values() for r in v));assert all(r in assets for r in used),[r for r in used if r not in assets]
rows=[]
for r in used:rows.append({'index':len(rows)+1,'ruid':r,**assets[r]})
(out/'base-frames.json').write_text(json.dumps({'motions':motions,'frames':rows},ensure_ascii=False,indent=2),encoding='utf-8')
for page in range((len(rows)+23)//24):
 selected=rows[page*24:(page+1)*24];img=Image.new('RGB',(6*256,4*284),(210,203,185));d=ImageDraw.Draw(img)
 for i,v in enumerate(selected):
  x=i%6*256;y=i//6*284;im=Image.open(v['file']).convert('RGBA').resize((256,256),Image.Resampling.NEAREST);img.paste(im,(x,y),im);d.text((x+5,y+257),str(v['index'])+' '+v['name'],fill=(20,20,20))
 img.save(out/('base-contact-'+str(page+1)+'.png'))
print('Unique base frames',len(rows),'motions',len(motions))
