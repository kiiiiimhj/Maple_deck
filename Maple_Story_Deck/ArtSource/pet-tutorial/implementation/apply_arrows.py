from pathlib import Path
import json,hashlib,sys,time,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-tutorial');base=json.loads((stage/'arrow-update-base.json').read_text(encoding='utf-8'))
s=MakerSession()
try:
 mode=s.call('maker_get_current_map')
 if mode.get('mode')=='play':
  print('Stop:',s.call('maker_stop'),flush=True)
  for _ in range(20):
   time.sleep(1)
   try:mode=s.call('maker_get_current_map')
   except AssertionError:continue
   if mode.get('mode')=='edit':break
 assert mode.get('mode')=='edit',mode
 for path,h in base.items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==h,path+' changed during arrow correction'
 for path in base:shutil.copy2(stage/Path(path).name,path)
 print('Refresh:',s.call('maker_refresh_workspace'),flush=True);time.sleep(7)
 build=s.call('maker_logs',{'kind':'build'});errors=[x for x in build.get('logs',[])if x.get('logType')=='Error'];assert not errors,errors
 print('Build errors: 0',flush=True);print('Save:',s.call('maker_save'),flush=True);time.sleep(2)
 (stage/'arrow-build.json').write_text(json.dumps(build,ensure_ascii=False,indent=2),encoding='utf-8')
 print('Redrawn tutorial connectors applied and saved.',flush=True)
finally:s.close()
