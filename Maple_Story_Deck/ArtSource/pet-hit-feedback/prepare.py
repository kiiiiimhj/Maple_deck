from pathlib import Path
import json,hashlib,urllib.request,sys
from PIL import Image,ImageDraw
stage=Path('work/pet-hit-feedback');out=Path('outputs/pet-hit-feedback');stage.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
sources={}
for name in ['PetLogic.mlua','PetHouseUI.mlua']:
    p=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet')/name;before=stage/(name+'.before')
    if not before.exists():before.write_bytes(p.read_bytes())
    sources[name]={'path':str(p),'sha256':hashlib.sha256(before.read_bytes()).hexdigest()}
(stage/'sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8')
(stage/'plan.json').write_text(json.dumps({'task':'Shift Ducky bowl left and add shell shield hit recoil/marker','steps':[{'name':'Inspect existing hit effect and choose restrained feedback','status':'in_progress'},{'name':'Shift bowl 8px and add pooled hit spark plus short shell recoil','status':'pending'},{'name':'Verify placement, repeated hits, pause, expiry and cleanup in Maker','status':'pending'}]},indent=2),encoding='utf-8')
ruid='43b0698875a348229caaf9221a8c8b3a';p=out/'existing-hit.gif'
if not p.exists():urllib.request.urlretrieve('https://mod-resource-search-images.dn.nexoncdn.co.kr/maplestory_world/'+ruid+'.gif',p)
im=Image.open(p);sheet=Image.new('RGB',(min(im.n_frames,8)*160,((im.n_frames+7)//8)*140),(30,40,55));d=ImageDraw.Draw(sheet)
for i in range(im.n_frames):
    im.seek(i);f=im.convert('RGBA');f.thumbnail((145,115),Image.Resampling.NEAREST);sheet.paste(f,(i%8*160+(160-f.width)//2,i//8*140+22),f);d.text((i%8*160+5,i//8*140+3),str(i+1),fill='white')
sheet.save(out/'existing-hit-frames.png');print('Existing Maple hit frames:',im.n_frames)
