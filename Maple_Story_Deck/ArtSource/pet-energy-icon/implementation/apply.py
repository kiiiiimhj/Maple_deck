from pathlib import Path
import sys,time,json,shutil,hashlib
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-energy-icon');sources=json.loads((stage/'source-hashes.json').read_text(encoding='utf-8'));s=MakerSession()
try:
 mode=s.call('maker_get_current_map');print('Maker:',mode,flush=True)
 if mode.get('mode')=='play':
  print('Stop:',s.call('maker_stop'),flush=True)
  for _ in range(20):
   time.sleep(1)
   try:mode=s.call('maker_get_current_map')
   except AssertionError:continue
   if mode.get('mode')=='edit':break
 assert mode.get('mode')=='edit',mode
 assert hashlib.sha256(Path(sources['ui']['path']).read_bytes()).hexdigest()==sources['ui']['sha256'],'Pet-house UI changed during work'
 for path,h in sources['preserved'].items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==h,path
 backup=Path('G:/Maple_Story_Deck/ArtSource/pet-energy-icon/source-backup');backup.mkdir(parents=True,exist_ok=True);shutil.copy2(sources['ui']['path'],backup/'PetHouseGroup.ui');shutil.copy2(stage/'PetHouseGroup.ui',sources['ui']['path'])
 print('Refresh:',s.call('maker_refresh_workspace'),flush=True);time.sleep(7)
 logs=s.call('maker_logs',{'kind':'build'});assert not[x for x in logs.get('logs',[])if x.get('logType')=='Error'],logs
 print('Build errors: 0',flush=True);print('Save:',s.call('maker_save'),flush=True);time.sleep(2)
 (stage/'build.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8')
 print('Pet-house energy icon applied and saved.',flush=True)
finally:s.close()
