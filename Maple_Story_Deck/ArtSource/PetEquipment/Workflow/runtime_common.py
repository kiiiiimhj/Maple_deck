from pathlib import Path
import sys,time,json,shutil
from PIL import Image
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
out=Path('outputs/pet-gear-clean-v10');s=MakerSession();time.sleep(3)
def run(tag,body,context='client'):
 needle='[VRF] PET-CLEAN10 '+tag+' '+str(time.time_ns())+' '
 s.call('maker_execute_script',{'context':context,'script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
 for _ in range(60):
  rows=s.call('maker_logs',{'kind':'normal'}).get('logs',[]);hits=[x['message']for x in rows if needle in x.get('message','')]
  if hits:return json.loads(hits[-1].split(needle,1)[1])
  time.sleep(.15)
 raise AssertionError(tag)
def wait(tag,body,predicate,count=100):
 for _ in range(count):
  result=run(tag,body)
  if predicate(result):return result
  time.sleep(.1)
 raise AssertionError(tag)
def shot(name):
 result=s.call('maker_screenshot');shutil.copy2(result['path'],out/(name+'.png'))
 im=Image.open(result['path']).convert('RGB');assert im.size==(1868,1051),im.size
 im.crop((635,370,1260,750)).save(out/(name+'-pet.png'))
def preserve():
 run('preserve','local L=_PetLogic;local id=nil;for k,_ in pairs(L.States)do id=k break end;assert(L._T.clean10Original==nil);L._T.clean10User=id;L._T.clean10Original=L.States[id];local r=L:ReadAccount(L:SerializeAccount(L.States[id]));r.test=true;r.dirty=false;r.generation=0;L.States[id]=r;local result={preserved=true}','server_main')
def setup(pet):
 run('setup','local L=_PetLogic;local id=L._T.clean10User;local r=L.States[id];r.responsePetId="'+pet+'";r.busyUntil=0;r.lastRequest=-10000;r.pendingWalk=nil;local p=r.pets["'+pet+'"];p.Owned=true;p.GearOwnedMask=7;p.GearEquippedMask=7;p.Fullness=40;p.Cleanliness=40;p.Mood=80;p.Health=40;p.Fatigue=30;p.Energy=1000;p.SleepUntil=0;p.NeedsAt=_DateTimeLogic:GetTimeElapsedWithoutOffset();p.EnergyAt=p.NeedsAt;L:PushState(id,"","");local result={set=true}','server_main')
def restore():
 run('restore','local L=_PetLogic;local id=L._T.clean10User;if L._T.clean10Original~=nil then L.States[id]=L._T.clean10Original;L._T.clean10Original=nil;L:InitForRun(id);L:PushState(id,"","")end;local result={restored=true}','server_main')
 run('close','local H=_PetHouseUI;H:Close();H.SelectedPetIndex=3;H:Open();local result={opened=true}')
