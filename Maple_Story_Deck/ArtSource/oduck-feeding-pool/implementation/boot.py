from runtime_common import *
try:
 mode=s.call('maker_get_current_map');assert mode.get('mode')=='edit'
 (stage/'runtime-start.json').write_text(json.dumps({'start':datetime.now().isoformat(timespec='seconds')}),encoding='utf-8');print('Play:',s.call('maker_play'),flush=True)
 for _ in range(25):
  time.sleep(.8)
  try:mode=s.call('maker_get_current_map')
  except AssertionError:continue
  if mode.get('mode')=='play':break
 assert mode.get('mode')=='play'
 wait_for('final-boot','local result={ready=_PetLogic.ClientReady and _PetLogic.OduckReady and _PetHouseUI.OduckPoolReady}',lambda r:r['ready'])
finally:s.close()
