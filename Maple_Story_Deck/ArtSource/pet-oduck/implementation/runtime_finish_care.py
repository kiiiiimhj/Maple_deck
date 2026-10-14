from runtime_common import *
try:
 prior=proofs['care-motion-inject'];assert prior['motion']=='inject'and prior['ruid']in ['9e1b9ed82ef842bdb93c408f7b03dabf','e8e7fbebf2b44e2c90da9f8c117ff086','9ac825fbe4284bdc973cc1ef1bf2d1a5','6ebdb43959d148cdbb3f94d31465b55f']
 wait_for('care-finished-inject','local result={done=_PetHouseUI.Motion==""}',lambda r:r['done'])
 run('care-arm-sleep','local L=_PetLogic;local r=L.States[L._T.oduckVerifyUser];assert(r.test and L._T.oduckVerifyOriginal~=nil);r.lastRequest=-100;r.busyUntil=0;local result={ready=true}','server_main')
 run('care-click-sleep','_PetHouseUI.PetPanel:GetChildByName("sleep"):SendEvent(ButtonClickEvent());local result={clicked=true}')
 r=wait_for('care-motion-sleep','local P=_PetHouseUI;local result={motion=P.Motion,ruid=P.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.ImageRUID.DataId,cushion=P.SleepCushion.Enable}',lambda r:r['motion']=='sleep')
 assert r['ruid']=='e5125fa1d39941489c7301b56f2fad24'and r['cushion'];time.sleep(6.3)
 wait_for('care-finished-sleep','local result={done=_PetHouseUI.Motion==""}',lambda r:r['done'])
 print('All five care actions passed, including the native injection reaction sequence and sleep cushion.',flush=True)
finally:s.close()
