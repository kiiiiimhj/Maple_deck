from pathlib import Path
import sys,time,json,hashlib,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/oduck-feeding-pool');sources=json.loads((stage/('repair-sources.json'if(stage/'repair-sources.json').exists()else'sources.json')).read_text(encoding='utf-8'));s=MakerSession()
try:
 mode=s.call('maker_get_current_map');print('Maker:',mode,flush=True)
 if mode.get('mode')=='play':
  print('Stop:',s.call('maker_stop'),flush=True)
  for _ in range(25):
   time.sleep(.5)
   try:mode=s.call('maker_get_current_map')
   except AssertionError:continue
   if mode.get('mode')=='edit':break
 assert mode.get('mode')=='edit',mode
 for name,info in sources.items():assert hashlib.sha256(Path(info['path']).read_bytes()).hexdigest()==info['sha256'],name+' changed while staging'
 backup=Path('G:/Maple_Story_Deck/ArtSource/oduck-feeding-pool/source-backup');backup.mkdir(parents=True,exist_ok=True)
 for name,info in sources.items():
  if not(backup/name).exists():shutil.copy2(info['path'],backup/name)
  shutil.copy2(stage/name,info['path'])
 print('Refresh:',s.call('maker_refresh_workspace'),flush=True);time.sleep(5)
 build=s.call('maker_logs',{'kind':'build'});errors=[x for x in build.get('logs',[])if x.get('logType')=='Error'];assert not errors,errors
 print('Build errors: 0',flush=True);print('Save:',s.call('maker_save'),flush=True);time.sleep(1)
 for name,info in sources.items():assert Path(info['path']).read_text(encoding='utf-8-sig')==(stage/name).read_text(encoding='utf-8'),name
 for path,h in json.loads((stage/'preserved.json').read_text(encoding='utf-8')).items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==h,path
 (stage/'build.json').write_text(json.dumps(build,ensure_ascii=False,indent=2),encoding='utf-8')
 print('Oduck pool, passive countdown and triple mirror applied and saved.',flush=True)
finally:s.close()
