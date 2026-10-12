from pathlib import Path
import json,hashlib,shutil,sys
from PIL import Image
sys.path.insert(0,str(Path('work').resolve()))
from remote_mcp import initialize,request
stage=Path('work/pet-tutorial');out=Path('outputs/pet-tutorial')
names={'care':'exec-3aaaee1b-2bba-41f5-a469-36deed213cf5.png','rewards':'exec-85753d73-ad76-4440-ac4a-59102fbec4a4.png','stones':'exec-b5898323-8969-4bf4-bdf9-37f229c49f82.png','adventure':'exec-1093721d-c1e0-4ca7-a486-0344c158126c.png'}
specs=[]
for key,name in names.items():
    p=out/(key+'.png');shutil.copy2(Path('C:/Users/려진/.codex/generated_images/01a0f5b0-2545-75a3-b84c-9a6d84c27dc6',name),p)
    image=Image.open(p);assert image.mode=='RGBA';alpha=image.getchannel('A');assert alpha.getextrema()==(0,255)
    specs.append({'name':key,'file':str(p.resolve()),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size,'width':image.width,'height':image.height,'alphaBBox':alpha.getbbox(),'filter':'Bilinear','borders':{'left':0,'right':0,'top':0,'bottom':0}})
(out/'asset-specs.json').write_text(json.dumps(specs,ensure_ascii=False,indent=2),encoding='utf-8')
sources={}
for name,path in [('PetHouseUI.mlua','G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetHouseUI.mlua'),('PetHouseGroup.ui','G:/Maple_Story_Deck/ui/PetHouseGroup.ui'),('GameText.csv','G:/Maple_Story_Deck/RootDesk/MyDesk/Localization/GameText.csv')]:
    p=Path(path);shutil.copy2(p,stage/(name+'.before'));sources[name]={'path':path,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(stage/'sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8')
preserved={}
for path in ['G:/Maple_Story_Deck/ui/TitleGroup.ui','G:/Maple_Story_Deck/ui/RaidGroup.ui','G:/Maple_Story_Deck/RootDesk/MyDesk/Raid/RaidTutorialUI.mlua','G:/Maple_Story_Deck/RootDesk/MyDesk/Raid/RaidUI.mlua','G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua','G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetProgress.mlua']:
    preserved[path]=hashlib.sha256(Path(path).read_bytes()).hexdigest()
(stage/'preserved-sources.json').write_text(json.dumps(preserved,indent=2),encoding='utf-8')
initialize();r=request('tools/call',{'name':'asset_get_account_resource_metadata_bulk','arguments':{'guids':['5a92fc6b08a74049b46186bab0b049db']}},3)
assert 'error' not in r and not r.get('result',{}).get('isError')
(stage/'existing-account-resource.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
plan=json.loads((stage/'plan.json').read_text(encoding='utf-8'));plan['steps'][0]['status']='completed';plan['steps'][1]['status']='in_progress';(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{'name':x['name'],'size':[x['width'],x['height']],'bytes':x['bytes'],'sha256':x['sha256']}for x in specs],ensure_ascii=False),flush=True)
