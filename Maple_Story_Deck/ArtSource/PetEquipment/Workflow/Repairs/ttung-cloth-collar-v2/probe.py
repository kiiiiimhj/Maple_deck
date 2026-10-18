from pathlib import Path
import sys,time,json,shutil
from PIL import Image
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
stage=Path('work/pet-variation-repair-v2');out=Path('outputs/pet-variation-repair-v2');out.mkdir(parents=True,exist_ok=True)
for name in ['PetLogic.mlua','PetHouseUI.mlua','PetUI.mlua','PetProgress.mlua']:shutil.copy2(Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet')/name,stage/(name+'.before'))
s=MakerSession();time.sleep(3)
def run(tag,script):
 mark='[VRF] STRIPE-REPAIR '+tag+' '+str(time.time_ns())+' '
 s.call('maker_execute_script',{'context':'client','script':script+';log("'+mark+'".._HttpService:JSONEncode(result))'})
 for _ in range(50):
  rows=s.call('maker_logs',{'kind':'normal'}).get('logs',[]);hits=[x['message']for x in rows if mark in x.get('message','')]
  if hits:return json.loads(hits[-1].split(mark,1)[1])
  time.sleep(.2)
 raise AssertionError(tag)
try:
 mode=s.call('maker_get_current_map');print('Maker',mode,flush=True)
 if mode.get('mode')=='play':
  r=run('screen','''local H=_PetHouseUI;local U=_PetUI;local L=_PetLogic;local result={house=H.PetMode,inventory=U.PetMode,houseMotion=H.Motion,houseBase=H.CustomImageRUID,pet=H:GetDisplayedPet().id,objects={}};local function visit(e,active,path,depth)if depth>6 then return end;active=active and e.Enable;local r=e.SpriteGUIRendererComponent;if r~=nil and active and r.Enable and r.Color.a>.5 then table.insert(result.objects,{path=path.."/"..e.Name,ruid=tostring(r.ImageRUID.DataId),alpha=r.Color.a,x=e.UITransformComponent.anchoredPosition.x,y=e.UITransformComponent.anchoredPosition.y,w=e.UITransformComponent.RectSize.x,h=e.UITransformComponent.RectSize.y})end;for _,child in ipairs(e.Children:ToTable())do visit(child,active,path.."/"..e.Name,depth+1)end end;visit(H.PetDisplay,H.PetMode,"",0);visit(U.PetDisplay,U.PetMode,"",0)''');(out/'initial-layer-probe.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(r,ensure_ascii=False),flush=True)
  p=s.call('maker_screenshot')['path'];shutil.copy2(p,out/'initial-actual.png')
finally:s.close()
