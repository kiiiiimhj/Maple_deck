from runtime_common import *
try:
 mode=s.call('maker_get_current_map');print('Maker mode:',mode,flush=True)
 if mode.get('mode')=='edit':
  print(s.call('maker_play'),flush=True)
 for _ in range(20):
  time.sleep(1)
  try:mode=s.call('maker_get_current_map')
  except AssertionError:continue
  if mode.get('mode')=='play':break
 assert mode.get('mode')=='play',mode
 wait_for('capture-ready','local result={ready=_PetHouseUI.PetTutorialReady}',lambda r:r['ready'])
 script('_TitleUI:ShowLobby();_PetHouseUI:Open();_PetHouseUI:OpenPetTutorial()',pause=4)
 shot('pet-tutorial-before-arrow-fix.png')
 print('Captured current applied tutorial.',flush=True)
finally:s.close()
