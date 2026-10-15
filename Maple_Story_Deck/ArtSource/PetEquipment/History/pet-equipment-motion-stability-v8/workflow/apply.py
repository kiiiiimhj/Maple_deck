from pathlib import Path
import sys,json,time,hashlib,shutil
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
stage=Path('work/pet-gear-motion-v8');out=Path('outputs/pet-gear-motion-v8');target=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua');known=stage/'applied-sha256.txt';assert target.read_bytes()==(stage/'PetLogic.mlua.before').read_bytes() or (known.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==known.read_text());houseTarget=target.parent/'PetHouseUI.mlua';s=MakerSession()
def run(tag,body,context='client'):
 needle='[VRF] PET-MOTION8-APPLY '+tag+' '+str(time.time_ns())+' '
 s.call('maker_execute_script',{'context':context,'script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
 for _ in range(80):
  logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message']for x in logs.get('logs',[])if needle in x.get('message','')]
  if hits:return json.loads(hits[-1].split(needle,1)[1])
  time.sleep(.25)
 raise AssertionError(tag)
try:
 delays=[3]+[5]*59
 for attempt,delay in enumerate(delays):
  time.sleep(delay)
  try:s.call('maker_get_current_map');break
  except AssertionError:
   if attempt==len(delays)-1:raise
 assert (stage/'PetLogic.mlua').exists()
 if s.call('maker_get_current_map').get('mode')=='play':
  snap=run('snapshot','local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;local r=L._T.v4Original or L.States[id];local original=L._T.gearDemoOriginalAccount;local result={account=L:SerializeAccount(r),test=r.test,dirty=r.dirty,generation=r.generation,demoOriginal=original~=nil and L:SerializeAccount(original)or false}','server_main');(stage/'private-account-before-reload.json').write_text(json.dumps(snap,ensure_ascii=False),encoding='utf-8');s.call('maker_stop')
 else:
  saved=stage/'private-account-before-reload.json'
  snap=json.loads(saved.read_text(encoding='utf-8')) if saved.exists() else None
 for _ in range(40):
  time.sleep(.25)
  if s.call('maker_get_current_map').get('mode')=='edit':break
 else:raise AssertionError('stop not complete')
 target.write_bytes((stage/'PetLogic.mlua').read_bytes());
 for name in ['PetHouseUI.mlua','PetUI.mlua']:(target.parent/name).write_bytes((stage/name).read_bytes())
 print('Applied motion-stable pet equipment and single injection recoil.',flush=True)
 print('Refresh:',s.call('maker_refresh_workspace'),flush=True);time.sleep(2);print('Save:',s.call('maker_save'),flush=True);time.sleep(1)
 build=s.call('maker_logs',{'kind':'build'});(out/'build.json').write_text(json.dumps(build,ensure_ascii=False),encoding='utf-8');assert not[x for x in build.get('logs',[])if x.get('logType')=='Error']
 print('Play:',s.call('maker_play'),flush=True)
 for _ in range(50):
  time.sleep(.5)
  try:r=run('ready','local result={ready=_PetLogic.ClientReady}')
  except AssertionError as e:
   if 'Not in play mode'in str(e):continue
   raise
  if r['ready']:break
 else:raise AssertionError('boot not complete')
 if snap is not None:
  packet=json.dumps(snap,ensure_ascii=False,separators=(',',':'))
  run('restore','local old=_HttpService:JSONDecode('+json.dumps(packet,ensure_ascii=False)+');local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;local r=L:ReadAccount(old.account);assert(r~=nil);r.test=old.test;r.dirty=old.dirty;r.generation=old.generation;L.States[id]=r;if old.demoOriginal~=false then L._T.gearDemoOriginalAccount=L:ReadAccount(old.demoOriginal)end;L:InitForRun(id);L:PushState(id,"","");local result={restored=true}','server_main')
 (stage/'applied-sha256.txt').write_text(hashlib.sha256(target.read_bytes()).hexdigest(),encoding='utf-8');print('Maker build passed; original test/account progress restored.',flush=True)
finally:s.close()
