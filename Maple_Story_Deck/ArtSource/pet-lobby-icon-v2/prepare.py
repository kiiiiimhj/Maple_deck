from pathlib import Path
import json,shutil,hashlib,sys
from PIL import Image
sys.path.insert(0,str(Path('work').resolve()))
from remote_mcp import initialize,request
out=Path('outputs/pet-lobby-icon-v2');out.mkdir(parents=True,exist_ok=True)
stage=Path('work/pet-lobby-icon-v2');stage.mkdir(parents=True,exist_ok=True)
source=Path('C:/Users/려진/.codex/generated_images/01a0f5b0-2545-75a3-b84c-9a6d84c27dc6/exec-ebc1b548-9f7b-4faa-af56-7d4b9b23feff.png')
target=out/'pet-house-paw-v2.png';shutil.copy2(source,target)
image=Image.open(target);assert image.mode=='RGBA' and image.width==image.height and image.width>=1024
alpha=image.getchannel('A');assert alpha.getextrema()==(0,255)
spec={'file':str(target.resolve()),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'size':image.size,'alphaBBox':alpha.getbbox(),'filter':'Bilinear','wrap':'Clamp','content':'Generated front-view symmetric pet-house and centered paw artwork only; no project code, user photos, private data, or text'}
(out/'asset-spec.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
sources={}
for name,path in [('PetHouseUI.mlua','G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetHouseUI.mlua'),('TitleGroup.ui','G:/Maple_Story_Deck/ui/TitleGroup.ui')]:
    p=Path(path);shutil.copy2(p,stage/(name+'.before'));sources[name]={'path':path,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(stage/'sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8')
for name in ['run_stage.py','apply.py','verify.py','finalize.cjs','finalize.py']:
    text=Path('work/pet-lobby-icon',name).read_text(encoding='utf-8').replace('pet-lobby-icon','pet-lobby-icon-v2')
    if name=='finalize.py':
        text=text.replace('아이콘은 정사각형 104px, 중앙에서 위로 19px이며 텍스트와 2px 간격을 둔다.','정면 형태로 다시 그려 지붕, 입구, 발바닥을 같은 세로 중심축에 맞췄다. 발바닥은 네 개 발가락과 중심 패드가 좌우 대칭이며 기울이지 않았다. 기존 104px 크기와 위치를 유지한다.')
    (stage/name).write_text(text,encoding='utf-8')
plan={'task':'Correct pet-house doorway and paw alignment; replace only icon art','classification':'modify-existing','steps':[{'name':'Redraw symmetric front view and review alpha','status':'in_progress'},{'name':'Upload reviewed raster and replace icon RUID','status':'pending'},{'name':'Verify actual lobby and saved source in one runtime cycle','status':'pending'}]}
(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
initialize()
r=request('tools/call',{'name':'asset_get_account_resource_metadata_bulk','arguments':{'guids':['9c00086f822540d5bacfe376c4c9c738']}},3)
if 'error' in r or r.get('result',{}).get('isError'):raise RuntimeError('Account resource ownership check failed')
(stage/'existing-account-resource.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(spec,ensure_ascii=False),flush=True)
