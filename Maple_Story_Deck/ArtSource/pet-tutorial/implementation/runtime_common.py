from pathlib import Path
from datetime import datetime
import json,sys,time,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-tutorial');out=Path('outputs/pet-tutorial');s=MakerSession();proofs={}
prefix='[VRF] PET-TUTORIAL-CHECK '
def script(body,context='client',pause=.15):
 s.call('maker_execute_script',{'context':context,'script':body});time.sleep(pause)
def run(tag,body,context='client',pause=.15):
 stamp=str(time.time_ns());needle=prefix+tag+' '+stamp+' ';now=datetime.now().isoformat(timespec='seconds')
 script(body+';log("'+needle+'".._HttpService:JSONEncode(result))',context,pause)
 for _ in range(12):
  logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message']for x in logs.get('logs',[])if needle in x.get('message','')]
  if hits:
   value=json.loads(hits[-1].split(needle,1)[1]);proofs[tag]=value;(stage/'runtime-proof-state.json').write_text(json.dumps(proofs,ensure_ascii=False,indent=2),encoding='utf-8');print(tag+': '+json.dumps(value,ensure_ascii=False),flush=True);return value
  errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=now];assert not errors,errors[-3:]
  time.sleep(.3)
 raise AssertionError('Missing runtime result '+tag)
def wait_for(tag,body,predicate,count=20):
 for _ in range(count):
  r=run(tag,body,pause=.05)
  if predicate(r):return r
  time.sleep(.3)
 raise AssertionError(tag)
def shot(name):
 r=s.call('maker_screenshot');shutil.copy2(r['path'],out/name)
def click(x,y):
 s.call('maker_mouse_input',{'sequence':[{'action':'move','position':{'x':float(x),'y':float(y)},'duration':0},{'action':'click','button':'left'}]});time.sleep(.2)
