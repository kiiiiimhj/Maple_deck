from pathlib import Path
import sys,json,hashlib,time,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
current=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua')
previous=Path('work/ttung-charm-jump-v3/PetLogic.before.mlua')
latest=Path('work/ttung-charm-jump-v3/PetLogic.mlua')
old=previous.read_text(encoding='utf-8-sig')
assert current.read_text(encoding='utf-8-sig')==latest.read_text(encoding='utf-8')
assert old==Path('work/ttung-charm-jump/PetLogic.mlua').read_text(encoding='utf-8')
preserved=json.loads(Path('work/ttung-charm-jump-v3/preserved.json').read_text(encoding='utf-8'))
for p,h in preserved.items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
s=MakerSession()
try:
    mode=s.call('maker_get_current_map')
    if mode.get('mode')=='play':
        print('Stop:',s.call('maker_stop'),flush=True)
        for _ in range(30):
            time.sleep(.5);mode=s.call('maker_get_current_map')
            if mode.get('mode')=='edit':break
    assert mode.get('mode')=='edit',mode
    shutil.copy2(previous,current)
    print('Refresh:',s.call('maker_refresh_workspace'),flush=True)
    time.sleep(3)
    build=s.call('maker_logs',{'kind':'build'})
    assert not[x for x in build.get('logs',[])if x.get('logType')=='Error'],build
    print('Save:',s.call('maker_save'),flush=True)
    assert current.read_text(encoding='utf-8-sig')==old
    for p,h in preserved.items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
    report={'status':'reverted','restoredTo':'20-frame original charm pose before v2 redraw','sourceHash':hashlib.sha256(current.read_bytes()).hexdigest(),'buildErrors':0,'otherFilesPreserved':True}
    Path('outputs/ttung-charm-jump-v3/reverted.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('Previous Ttungttang appearance and behavior restored and saved.',flush=True)
finally:s.close()

