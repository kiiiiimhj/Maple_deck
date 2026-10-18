from pathlib import Path
import sys,json,time,hashlib
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
stage=Path('work/pet-variation-v1');out=Path('outputs/pet-variation-v1');pet=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet');names=['PetLogic.mlua','PetProgress.mlua','PetUI.mlua'];s=MakerSession()
def run(tag,body,context='client'):
 needle='[VRF] PET-STRIPE-APPLY '+tag+' '+str(time.time_ns())+' '
 s.call('maker_execute_script',{'context':context,'script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
 for _ in range(80):
  rows=s.call('maker_logs',{'kind':'normal'}).get('logs',[]);hits=[x['message']for x in rows if needle in x.get('message','')]
  if hits:return json.loads(hits[-1].split(needle,1)[1])
  time.sleep(.25)
 raise AssertionError(tag)
try:
 time.sleep(3);mode=s.call('maker_get_current_map');print('Maker:',mode,flush=True)
 prior=json.loads((out/'source-hashes.json').read_text())if(out/'source-hashes.json').exists()else{}
 for name in names:assert (pet/name).read_bytes()==(stage/(name+'.before')).read_bytes() or (pet/name).read_bytes()==(stage/name).read_bytes() or hashlib.sha256((pet/name).read_bytes()).hexdigest()==prior.get(name),name+' changed externally'
 if mode.get('mode')=='play':
  snap=run('snapshot','local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;local r=L._T.v4Original or L.States[id];local original=L._T.gearDemoOriginalAccount;local result={account=L:SerializeAccount(r),test=r.test,dirty=r.dirty,generation=r.generation,demoOriginal=original~=nil and L:SerializeAccount(original)or false}','server_main');(stage/'private-account-before-reload.json').write_text(json.dumps(snap,ensure_ascii=False),encoding='utf-8');s.call('maker_stop')
 else:
  p=stage/'private-account-before-reload.json';snap=json.loads(p.read_text(encoding='utf-8'))if p.exists()else None
 for _ in range(40):
  time.sleep(.25)
  if s.call('maker_get_current_map').get('mode')=='edit':break
 else:raise AssertionError('stop incomplete')
 for name in names:(pet/name).write_bytes((stage/name).read_bytes())
 print('Applied slot variation selection and artwork.',flush=True)
 print('Refresh:',s.call('maker_refresh_workspace'),flush=True);time.sleep(2)
 print('Save:',s.call('maker_save'),flush=True);time.sleep(1)
 build=s.call('maker_logs',{'kind':'build'});(out/'build.json').write_text(json.dumps(build,ensure_ascii=False),encoding='utf-8');errors=[x for x in build.get('logs',[])if x.get('logType')=='Error'];assert not errors,errors
 print('Play:',s.call('maker_play'),flush=True)
 for _ in range(50):
  time.sleep(.5)
  try:r=run('ready','local result={ready=_PetLogic.ClientReady}')
  except AssertionError as e:
   if 'Not in play mode'in str(e):continue
   raise
  if r['ready']:break
 else:raise AssertionError('boot incomplete')
 if snap:
  packet=json.dumps(snap,ensure_ascii=False,separators=(',',':'))
  run('restore','local old=_HttpService:JSONDecode('+json.dumps(packet,ensure_ascii=False)+');local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;local r=L:ReadAccount(old.account);assert(r~=nil);r.test=old.test;r.dirty=old.dirty;r.generation=old.generation;L.States[id]=r;if old.demoOriginal~=false then L._T.gearDemoOriginalAccount=L:ReadAccount(old.demoOriginal)end;L:InitForRun(id);L:PushState(id,"","");local result={restored=true}','server_main')
 (out/'source-hashes.json').write_text(json.dumps({n:hashlib.sha256((pet/n).read_bytes()).hexdigest()for n in names},indent=2),encoding='utf-8')
 print('Build passed; prior account state restored.',flush=True)
finally:s.close()
