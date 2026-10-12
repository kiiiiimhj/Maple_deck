from pathlib import Path
import sys,time,json,hashlib,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-hit-feedback');out=Path('outputs/pet-hit-feedback');archive=Path('G:/Maple_Story_Deck/ArtSource/pet-hit-feedback')
repair='--repair' in sys.argv
sources=json.loads((stage/('repair-sources.json' if repair else 'sources.json')).read_text(encoding='utf-8'))
for name in sources:assert (stage/name).exists(),name+' is not staged'
s=MakerSession()
try:
 mode=s.call('maker_get_current_map');print('Maker:',mode,flush=True)
 if mode.get('mode')=='play':
  print('Stop:',s.call('maker_stop'),flush=True)
  for i in range(15):
   time.sleep(2)
   try:mode=s.call('maker_get_current_map')
   except AssertionError as e:
    if 'no map loaded' in str(e):continue
    raise
   if mode.get('mode')=='edit':break
 assert mode.get('mode')=='edit',mode
 for name,item in sources.items():assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest()==item['sha256'],name+' changed during work'
 backup=archive/('repair-backup' if repair else 'source-backup');backup.mkdir(parents=True,exist_ok=True)
 for name,item in sources.items():
  target=Path(item['path']);shutil.copy2(target,backup/name);shutil.copy2(stage/name,target)
 print('Refresh:',s.call('maker_refresh_workspace'),flush=True);time.sleep(7)
 build=s.call('maker_logs',{'kind':'build'});errors=[x for x in build.get('logs',[]) if x.get('logType')=='Error'];assert not errors,errors[:5]
 print('Build errors: 0',flush=True)
 print('Save:',s.call('maker_save'),flush=True);time.sleep(2)
 for name,item in sources.items():
  if name.endswith('.mlua'):assert Path(item['path']).read_bytes()==(stage/name).read_bytes(),name+' differs after save'
 (stage/'build.json').write_text(json.dumps(build,ensure_ascii=False,indent=2),encoding='utf-8')
 for file in out.iterdir():
  if file.is_file():shutil.copy2(file,archive/file.name)
 plan=json.loads((stage/'plan.json').read_text(encoding='utf-8'));plan['steps'][1]['status']='completed';plan['steps'][2]['status']='in_progress'
 (stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
 print('Applied bowl shift and shell hit feedback.',flush=True)
finally:s.close()
