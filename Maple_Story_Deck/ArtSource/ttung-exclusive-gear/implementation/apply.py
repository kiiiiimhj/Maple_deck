from pathlib import Path
import json,hashlib,shutil,sys,time
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
stage=Path('work/ttung-gear');out=Path('outputs/ttung-gear');sources=json.loads((stage/'sources.json').read_text(encoding='utf-8'));s=MakerSession()
try:
 for name,d in sources.items():assert hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256'],'Source changed '+name
 mode=s.call('maker_get_current_map');print(mode,flush=True)
 if mode.get('mode')=='play':print('Stop',s.call('maker_stop'),flush=True)
 for _ in range(20):
  mode=s.call('maker_get_current_map')
  if mode.get('mode')=='edit':break
  time.sleep(1)
 assert mode.get('mode')=='edit'
 archive=Path('G:/Maple_Story_Deck/ArtSource/ttung-exclusive-gear');backup=archive/'source-backup';backup.mkdir(parents=True,exist_ok=True)
 for name,d in sources.items():
  target=Path(d['path']);shutil.copy2(target,backup/target.name);shutil.copy2(stage/target.name,target)
 shutil.copytree(out,archive/'outputs',dirs_exist_ok=True);shutil.copytree(stage,archive/'implementation',dirs_exist_ok=True)
 print('Refresh',s.call('maker_refresh_workspace'),flush=True);time.sleep(3)
 print('Save',s.call('maker_save'),flush=True);time.sleep(2)
 build=s.call('maker_logs',{'kind':'build'});(stage/'build.json').write_text(json.dumps(build,ensure_ascii=False,indent=2),encoding='utf-8');errors=[x for x in build.get('logs',[])if x.get('logType')=='Error'];print('Build errors',json.dumps(errors,ensure_ascii=False),flush=True);assert not errors
 print('Play',s.call('maker_play'),flush=True)
 for _ in range(30):
  time.sleep(1);mode=s.call('maker_get_current_map')
  if mode.get('mode')=='play':break
 assert mode.get('mode')=='play';print('Applied saved sources and started fresh Maker runtime.',flush=True)
finally:s.close()
