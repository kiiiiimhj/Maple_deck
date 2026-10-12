from pathlib import Path
import json,shutil,hashlib,sys
from PIL import Image
sys.path.insert(0,str(Path('work').resolve()))
from remote_mcp import initialize,request
out=Path('outputs/pet-lobby-icon');stage=Path('work/pet-lobby-icon')
source=Path('C:/Users/려진/.codex/generated_images/01a0f5b0-2545-75a3-b84c-9a6d84c27dc6/exec-4be15041-ac0a-4262-bf0e-83cf62165a69.png')
target=out/'pet-house-paw.png';shutil.copy2(source,target)
image=Image.open(target);assert image.mode=='RGBA' and image.width==image.height and image.width>=1024
alpha=image.getchannel('A');assert alpha.getextrema()==(0,255)
bbox=alpha.getbbox();assert bbox and alpha.getpixel((0,0))==0 and alpha.getpixel((image.width-1,0))==0
spec={'file':str(target.resolve()),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'size':image.size,'alphaBBox':bbox,'filter':'Bilinear','wrap':'Clamp','content':'Generated pet-house and paw artwork only; no project code, user photos, private data, or text'}
(out/'asset-spec.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
sources={}
for name,path in [('PetHouseUI.mlua','G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetHouseUI.mlua'),('TitleGroup.ui','G:/Maple_Story_Deck/ui/TitleGroup.ui')]:
    p=Path(path);shutil.copy2(p,stage/(name+'.before'));sources[name]={'path':path,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(stage/'sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8')
initialize()
r=request('tools/call',{'name':'asset_get_account_resource_metadata_bulk','arguments':{'guids':['5828fdca6b1d48198e257b2202833abb']}},3)
if 'error' in r or r.get('result',{}).get('isError'):raise RuntimeError('Account resource ownership check failed')
(stage/'existing-account-resource.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'raster':spec,'accountResource':r.get('result',{}).get('structuredContent',r.get('result',{}).get('content'))},ensure_ascii=False),flush=True)
