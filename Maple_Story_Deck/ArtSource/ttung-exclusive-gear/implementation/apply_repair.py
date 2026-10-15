from pathlib import Path
import sys,shutil,json,time
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
stage=Path('work/ttung-gear');s=MakerSession()
try:
 mode=s.call('maker_get_current_map')
 if mode.get('mode')=='play':s.call('maker_stop')
 for _ in range(25):
  time.sleep(.5);mode=s.call('maker_get_current_map')
  if mode.get('mode')=='edit':break
 assert mode.get('mode')=='edit'
 p=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua');shutil.copy2(p,stage/'PetLogic.first-applied.mlua');shutil.copy2(stage/'PetLogic.mlua',p)
 print('Refresh',s.call('maker_refresh_workspace'),flush=True);time.sleep(2);print('Save',s.call('maker_save'),flush=True);time.sleep(1)
 build=s.call('maker_logs',{'kind':'build'});(stage/'build-final.json').write_text(json.dumps(build,ensure_ascii=False,indent=2),encoding='utf-8');errors=[x for x in build.get('logs',[])if x.get('logType')=='Error'];assert not errors,errors
 print('Play',s.call('maker_play'),flush=True)
 for _ in range(40):
  time.sleep(1)
  try:mode=s.call('maker_get_current_map')
  except AssertionError:continue
  if mode.get('mode')=='play':break
 assert mode.get('mode')=='play';print('Final gear direction and skill snapshot fixes applied.',flush=True)
finally:s.close()
