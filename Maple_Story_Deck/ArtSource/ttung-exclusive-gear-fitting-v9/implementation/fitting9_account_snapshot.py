from pathlib import Path
import sys,time,json
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
stage=Path('work/ttung-gear-fitting-v9');stage.mkdir(exist_ok=True);s=MakerSession()
try:
 needle='[VRF] GEAR-SNIFF6-SNAPSHOT '+str(time.time_ns())+' '
 script='''local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;local r=L.States[id];local result={account=L:SerializeAccount(r),test=r.test,dirty=r.dirty,generation=r.generation}'''
 s.call('maker_execute_script',{'context':'server_main','script':script+';log("'+needle+'".._HttpService:JSONEncode(result))'})
 for _ in range(80):
  logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message']for x in logs.get('logs',[])if needle in x.get('message','')]
  if hits:
   result=json.loads(hits[-1].split(needle,1)[1]);(stage/'account-before-reload.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print('Current Maker pet progress and test equipment preserved for reload.',flush=True);break
  time.sleep(.3)
 else:raise AssertionError('No completed snapshot')
finally:s.close()
