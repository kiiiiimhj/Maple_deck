from pathlib import Path
import sys,json,time,hashlib,shutil
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
stage=Path('work/ttung-gear-sniff-v6');out=Path('outputs/ttung-gear-sniff-v6');source=json.loads((stage/'source.json').read_text(encoding='utf-8'));s=MakerSession()
try:
 p=Path(source['path']);assert hashlib.sha256(p.read_bytes()).hexdigest()==source['sha256']
 mode=s.call('maker_get_current_map')
 if mode.get('mode')=='play':s.call('maker_stop')
 for _ in range(30):
  time.sleep(.5);mode=s.call('maker_get_current_map')
  if mode.get('mode')=='edit':break
 assert mode.get('mode')=='edit'
 archive=Path('G:/Maple_Story_Deck/ArtSource/ttung-exclusive-gear-sniff-v6');(archive/'source-backup').mkdir(parents=True,exist_ok=True)
 backup=archive/'source-backup/PetLogic.mlua'
 if backup.exists():backup=archive/'source-backup'/('PetLogic-'+hashlib.sha256(p.read_bytes()).hexdigest()[:8]+'.mlua')
 shutil.copy2(p,backup);shutil.copy2(stage/'PetLogic.mlua',p)
 print('Refresh',s.call('maker_refresh_workspace'),flush=True);time.sleep(2);print('Save',s.call('maker_save'),flush=True);time.sleep(1)
 build=s.call('maker_logs',{'kind':'build'});errors=[x for x in build.get('logs',[])if x.get('logType')=='Error'];(stage/'build.json').write_text(json.dumps(build,ensure_ascii=False,indent=2),encoding='utf-8');assert not errors,errors
 print('Play',s.call('maker_play'),flush=True)
 for _ in range(40):
  time.sleep(1)
  try:mode=s.call('maker_get_current_map')
  except AssertionError:continue
  if mode.get('mode')=='play':break
 assert mode.get('mode')=='play';print('Clean gear layers applied.',flush=True)
finally:s.close()
