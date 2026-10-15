from pathlib import Path
import sys,json,time,shutil
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
stage=Path('work/ttung-gear-sniff-v6');out=Path('outputs/ttung-gear-sniff-v6');s=MakerSession()
def run(tag,body,context='client'):
 needle='[VRF] SNIFF6-RESTORE '+tag+' '+str(time.time_ns())+' '
 s.call('maker_execute_script',{'context':context,'script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
 for _ in range(80):
  logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message']for x in logs.get('logs',[])if needle in x.get('message','')]
  if hits:return json.loads(hits[-1].split(needle,1)[1])
  time.sleep(.3)
 raise AssertionError(tag)
try:
 original=json.loads((stage/'account-before-reload.json').read_text(encoding='utf-8'));packet=json.dumps(original,ensure_ascii=False,separators=(',',':'))
 body='local old=_HttpService:JSONDecode('+json.dumps(packet,ensure_ascii=False)+');local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;assert(id~=nil);local restored=L:ReadAccount(old.account);assert(restored~=nil);restored.test=old.test;restored.dirty=old.dirty;restored.generation=old.generation;restored.responsePetId="ttungttang";L.States[id]=restored;L:InitForRun(id);L:PushState(id,"","");local p=restored.pets.ttungttang;local result={restored=true,test=restored.test,level=p.Level,equippedMask=p.GearEquippedMask}'
 result=run('account',body,'server_main');assert result['restored'];print('Original Maker pet progress restored.',flush=True)
 run('house','_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;_TitleUI:ShowLobby();local H=_PetHouseUI;H.SelectedPetIndex=2;H.IdleRUID="";H.CustomFrameKey="";H:Open();H:Refresh();local result={open=H.PetMode,id=H:GetDisplayedPet().id}')
 time.sleep(2);pic=s.call('maker_screenshot');shutil.copy2(pic['path'],out/'ready-house.png');(out/'state-restoration.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print('Pet house left open with restored test progress.',flush=True)
finally:s.close()
