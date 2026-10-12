from pathlib import Path
from datetime import datetime
import sys,time,json,shutil
sys.path.insert(0,str(Path('work').resolve()));sys.path.insert(0,str(Path('work/ranged-lua-runtime').resolve()))
from maker_session import MakerSession
from lupa import LuaRuntime
s=MakerSession();lua=LuaRuntime();out=Path('outputs/pet-hit-feedback');stage=Path('work/pet-hit-feedback');prefix='[VRF] PET-HIT-FEEDBACK '
proofs=json.loads((out/'runtime-proof-state.json').read_text(encoding='utf-8')) if (out/'runtime-proof-state.json').exists() else {}
def script(body,context='client',pause=.4):
 lua.execute('return function() '+body+' end')
 s.call('maker_execute_script',{'context':context,'script':body});time.sleep(pause)
def run(tag,body,context='client',pause=.4):
 call_started=datetime.now().isoformat(timespec='seconds')
 stamp=str(time.time_ns());needle=prefix+tag+' '+stamp+' '
 script(body+';log("'+needle+'".._HttpService:JSONEncode(result))',context,pause)
 for _ in range(10):
  logs=s.call('maker_logs',{'kind':'normal'})
  hits=[x['message'] for x in logs.get('logs',[]) if needle in x.get('message','')]
  if hits:
   value=json.loads(hits[-1].split(needle,1)[1]);proofs[tag]=value
   (out/'runtime-proof-state.json').write_text(json.dumps(proofs,ensure_ascii=False,indent=2),encoding='utf-8')
   shown={'checked':len(value['rows']),'stacked':value.get('stacked'),'absent':value.get('absent')} if tag=='all-zone-bottoms' else value
   if tag=='await-pause':shown={'paused':value['paused'],'lateSpawn':value['proof'].get('lateSpawn')}
   
   if tag.startswith('samples-'):shown={'frames':len(value['rows']),'earlyVisible':sum(v['visible'] for v in value['rows'] if v['age']<.34),'wrong':sum(v['wrong'] for v in value['rows'])}
   print(tag+': '+json.dumps(shown,ensure_ascii=False),flush=True);return value
  start=json.loads((stage/'runtime-start.json').read_text(encoding='utf-8')).get('start','') if (stage/'runtime-start.json').exists() else ''
  errors=[x for x in logs.get('logs',[]) if x.get('logType')=='Error' and x.get('dateTime','')>=call_started]
  if errors:raise AssertionError(errors[-3:])
  time.sleep(.6)
 raise AssertionError('Missing runtime result '+tag)
def shot(name):
 r=s.call('maker_screenshot');shutil.copy2(r['path'],out/name)
