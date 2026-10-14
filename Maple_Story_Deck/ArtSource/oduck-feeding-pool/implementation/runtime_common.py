from pathlib import Path
from datetime import datetime
import sys,time,json,shutil
sys.path.insert(0,str(Path('work').resolve()));sys.path.insert(0,str(Path('work/ranged-lua-runtime').resolve()))
from maker_session import MakerSession
from lupa import LuaRuntime
stage=Path('work/oduck-feeding-pool');out=Path('outputs/oduck-feeding-pool');s=MakerSession();lua=LuaRuntime();proofs=json.loads((out/'runtime-proof.json').read_text(encoding='utf-8'))if(out/'runtime-proof.json').exists()else{}
def run(tag,body,context='client'):
 lua.execute('return function() '+body+' end')
 needle='[VRF] ODUCK-POOL-CHECK '+tag+' '+str(time.time_ns())+' ';started=datetime.now().isoformat(timespec='seconds')
 s.call('maker_execute_script',{'context':context,'script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
 for _ in range(25):
  logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message']for x in logs.get('logs',[])if needle in x.get('message','')]
  if hits:
   r=json.loads(hits[-1].split(needle,1)[1]);proofs[tag]=r;(out/'runtime-proof.json').write_text(json.dumps(proofs,ensure_ascii=False,indent=2),encoding='utf-8');print(tag+': '+json.dumps(r,ensure_ascii=False),flush=True);return r
  errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=started];assert not errors,errors[-3:]
  time.sleep(.2)
 raise AssertionError('No completed checkpoint '+tag)
def wait_for(tag,body,predicate,count=35,context='client'):
 for _ in range(count):
  r=run(tag,body,context)
  if predicate(r):return r
  time.sleep(.3)
 raise AssertionError(tag)
def shot(name):
 r=s.call('maker_screenshot');shutil.copy2(r['path'],out/name)
