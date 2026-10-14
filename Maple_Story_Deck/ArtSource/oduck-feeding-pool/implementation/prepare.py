from pathlib import Path
import hashlib,json
from PIL import Image
stage=Path('work/oduck-feeding-pool');out=Path('outputs/oduck-feeding-pool')
sources={}
for name,path in {'PetHouseUI.mlua':'G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetHouseUI.mlua','PetLogic.mlua':'G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua','CardManager.mlua':'G:/Maple_Story_Deck/RootDesk/MyDesk/Card/CardManager.mlua'}.items():
 p=Path(path);raw=p.read_bytes();(stage/(name+'.before')).write_bytes(raw);sources[name]={'path':path,'sha256':hashlib.sha256(raw).hexdigest()}
(stage/'sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8')
preserved={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path('G:/Maple_Story_Deck/ui/PetHouseGroup.ui'),Path('G:/Maple_Story_Deck/ui/DefaultGroup.ui'),Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetProgress.mlua'),Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Localization/GameText.csv')]}
(stage/'preserved.json').write_text(json.dumps(preserved,indent=2),encoding='utf-8')
specs=[]
for key,file in [('pool','oduck-pool.png'),('icon','oduck-dance-icon.png')]:
 p=out/file;im=Image.open(p);spec={'name':key,'file':str(p.resolve()),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':list(im.size),'mode':im.mode}
 if key=='pool':
  assert im.mode=='RGBA';alpha=im.getchannel('A');assert alpha.getextrema()==(0,255);spec['opaqueBounds']=alpha.getbbox()
 specs.append(spec)
(out/'asset-specs.json').write_text(json.dumps(specs,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(specs,ensure_ascii=False,indent=2))
