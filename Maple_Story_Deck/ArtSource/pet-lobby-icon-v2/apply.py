from pathlib import Path
import sys,time,json,hashlib,shutil,re
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-lobby-icon-v2');out=Path('outputs/pet-lobby-icon-v2');archive=Path('G:/Maple_Story_Deck/ArtSource/pet-lobby-icon-v2')
sources=json.loads((stage/'sources.json').read_text(encoding='utf-8'))
for name in sources:assert (stage/name).exists()
old=(stage/'PetHouseUI.mlua.before').read_text(encoding='utf-8-sig');new=(stage/'PetHouseUI.mlua').read_text(encoding='utf-8')
def methods(s):return {m[1]:m[0] for m in re.finditer(r'(?ms)^\tmethod \w+ (\w+)\([^\n]*\)\n.*?^\tend',s)}
a=methods(old);b=methods(new)
assert a.keys()==b.keys()
for k in a:
    if k!='InitializeArtwork':assert a[k]==b[k],k
s=MakerSession()
try:
    mode=s.call('maker_get_current_map');print('Maker:',mode,flush=True)
    if mode.get('mode')=='play':
        print('Stop:',s.call('maker_stop'),flush=True)
        for _ in range(15):
            time.sleep(1)
            try:mode=s.call('maker_get_current_map')
            except AssertionError:continue
            if mode.get('mode')=='edit':break
    assert mode.get('mode')=='edit',mode
    for name,item in sources.items():assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest()==item['sha256'],name+' changed during work'
    backup=archive/'source-backup';backup.mkdir(parents=True,exist_ok=True)
    for name,item in sources.items():shutil.copy2(item['path'],backup/name);shutil.copy2(stage/name,item['path'])
    print('Refresh:',s.call('maker_refresh_workspace'),flush=True);time.sleep(7)
    build=s.call('maker_logs',{'kind':'build'});errors=[x for x in build.get('logs',[]) if x.get('logType')=='Error'];assert not errors,errors[:5]
    print('Build errors: 0',flush=True)
    print('Save:',s.call('maker_save'),flush=True);time.sleep(2)
    assert Path(sources['PetHouseUI.mlua']['path']).read_text(encoding='utf-8-sig')==new
    (stage/'build.json').write_text(json.dumps(build,ensure_ascii=False,indent=2),encoding='utf-8')
    (out/'source-verification.json').write_text(json.dumps({'preservedMethods':len(a)-1,'modifiedMethods':['InitializeArtwork'],'onlyLobbyArtworkChanged':True},indent=2),encoding='utf-8')
    plan=json.loads((stage/'plan.json').read_text(encoding='utf-8'));plan['steps'][1]['status']='completed';plan['steps'][2]['status']='in_progress';(stage/'plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8')
    print('Applied and saved new pet lobby icon.',flush=True)
finally:s.close()
