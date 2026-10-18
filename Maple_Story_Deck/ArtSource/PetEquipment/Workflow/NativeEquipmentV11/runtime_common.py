from pathlib import Path
import sys,time,json
from datetime import datetime
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
out=Path('outputs/pet-equipment-native-v11');s=MakerSession();time.sleep(3)
def run(tag,body,context='client'):
 marker='[VRF] NATIVE11 '+tag+' '+str(time.time_ns())+' ';s.call('maker_execute_script',{'context':context,'script':body+';log("'+marker+'".._HttpService:JSONEncode(result))'})
 for _ in range(75):
  rows=s.call('maker_logs',{'kind':'normal'}).get('logs',[]);hits=[x['message']for x in rows if marker in x.get('message','')]
  if hits:return json.loads(hits[-1].split(marker,1)[1])
  time.sleep(.1)
 raise AssertionError(tag)
def wait(tag,body,pred,count=90):
 for _ in range(count):
  r=run(tag,body)
  if pred(r):return r
  time.sleep(.1)
 raise AssertionError((tag,r))
def preserve():
 run('preserve','local L=_PetLogic;local id=nil;for k,_ in pairs(L.States)do id=k break end;assert(L._T.native11Original==nil);L._T.native11User=id;L._T.native11Original=L.States[id];local r=L:ReadAccount(L:SerializeAccount(L.States[id]));assert(r~=nil);r.test=true;r.dirty=false;r.generation=0;L.States[id]=r;local result={preserved=true}','server_main')
def setup(pet,designs=10101):
 run('setup','local L=_PetLogic;local id=L._T.native11User;local r=L.States[id];r.responsePetId="'+pet+'";r.busyUntil=0;r.lastRequest=-10000;r.lastGearRequest=-10000;r.pendingWalk=nil;for k,p in pairs(r.pets)do p.Owned=true;p.GearOwnedMask=7;p.GearVariantOwnedMask=7;p.Equipped=k=="'+pet+'" end;local p=r.pets["'+pet+'"];p.GearEquippedMask=7;p.GearDesigns='+str(designs)+';p.Fullness=40;p.Cleanliness=40;p.Health=40;p.Mood=80;p.Fatigue=30;p.Energy=1000;p.SleepUntil=0;p.NeedsAt=_DateTimeLogic:GetTimeElapsedWithoutOffset();p.EnergyAt=p.NeedsAt;L:PushState(id,"","");local result={set=true}','server_main')
def restore():
 run('restore','local L=_PetLogic;local id=L._T.native11User;if L._T.native11Original~=nil then L.States[id]=L._T.native11Original;L._T.native11Original=nil;L:InitForRun(id);L:PushState(id,"","")end;local result={restored=true}','server_main')
def open_pet(pet,index):
 run('close','_PetHouseUI:Close();_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;local result={closed=true}')
 setup(pet);run('open','_TitleUI:ShowLobby();_PetHouseUI.SelectedPetIndex='+str(index)+';_PetHouseUI:Open();local result={opened=true}')
 return wait('portrait','local H=_PetHouseUI;local p=H.PetDisplay:GetChildByName("Portrait");local q=(_PetLogic._T.nativePetGearUI or {})[p.Id];local result={ready=q~=nil and q.ready or false,pet=q~=nil and q.petId or "",code=q~=nil and q.code or -1}',lambda r:r['ready']and r['pet']==pet and r['code']==26)
def errors(started):return [x for x in s.call('maker_logs',{'kind':'normal'}).get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=started]
