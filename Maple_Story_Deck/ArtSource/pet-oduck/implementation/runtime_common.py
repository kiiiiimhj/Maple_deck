from pathlib import Path
from datetime import datetime
import sys,time,json,shutil
sys.path.insert(0,str(Path('work').resolve()));sys.path.insert(0,str(Path('work/ranged-lua-runtime').resolve()))
from maker_session import MakerSession
from lupa import LuaRuntime
stage=Path('work/pet-oduck');out=Path('outputs/pet-oduck');s=MakerSession();lua=LuaRuntime()
proofs=json.loads((out/'runtime-proof-state.json').read_text(encoding='utf-8'))if(out/'runtime-proof-state.json').exists()else{}
def run(tag,body,context='client',pause=.15):
 lua.execute('return function() '+body+' end')
 needle='[VRF] PET-ODUCK-CHECK '+tag+' '+str(time.time_ns())+' ';attempt_start=datetime.now().isoformat(timespec='seconds')
 s.call('maker_execute_script',{'context':context,'script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'});time.sleep(pause)
 for _ in range(20):
  logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message']for x in logs.get('logs',[])if needle in x.get('message','')]
  if hits:
   r=json.loads(hits[-1].split(needle,1)[1]);proofs[tag]=r;(out/'runtime-proof-state.json').write_text(json.dumps(proofs,ensure_ascii=False,indent=2),encoding='utf-8');print(tag+': '+json.dumps(r,ensure_ascii=False),flush=True);return r
  errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=attempt_start];assert not errors,errors[-3:]
  time.sleep(.3)
 raise AssertionError('Missing completed checkpoint '+tag)
def wait_for(tag,body,predicate,count=30,context='client'):
 for _ in range(count):
  r=run(tag,body,context=context,pause=.05)
  if predicate(r):return r
  time.sleep(.3)
 raise AssertionError(tag)
def shot(name):
 r=s.call('maker_screenshot');shutil.copy2(r['path'],out/name)
