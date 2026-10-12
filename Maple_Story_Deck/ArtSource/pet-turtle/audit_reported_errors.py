from pathlib import Path
import json,sys,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-turtle');out=Path('outputs/pet-turtle')
# Keep every reusable test entry point consistent with the successful final probe.
for name in ['runtime_verify.py','resume_combat.py']:
    p=stage/name;s=p.read_text(encoding='utf-8')
    s=s.replace('P._T.bugiRollProof={};','P._T.bugiRollProof={seen=false,done=false,lastAge=0,beyondThree=false};')
    s=s.replace('zone=_MapManager.CurrentMapIndex,ghosts={}}','zone=_MapManager.CurrentMapIndex,ghosts={},fragments={}}')
    p.write_text(s,encoding='utf-8')
s=MakerSession()
try:
    logs=s.call('maker_logs',{'kind':'normal'})
    build=s.call('maker_logs',{'kind':'build'})
    start=json.loads((stage/'runtime-start.json').read_text(encoding='utf-8'))['start']
    errors=[r for r in logs.get('logs',[]) if r.get('logType')=='Error']
    fresh=[r for r in errors if r.get('dateTime','')>=start]
    reported=[r for r in errors if r.get('dateTime','').endswith(('20:39:02','20:35:26'))]
    result={'verificationStart':start,'errorsSinceSuccessfulFinalVerification':len(fresh),'buildErrors':len([r for r in build.get('logs',[]) if r.get('logType')=='Error']),'reportedHistoricalErrors':[{'time':r.get('dateTime'),'message':r.get('message'),'methods':[f.get('methodName') for f in r.get('stackTrace',[])]} for r in reported],'reusableTestEntriesFixed':True}
    (out/'reported-error-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False),flush=True)
    archive=Path('G:/Maple_Story_Deck/ArtSource/pet-turtle')
    for p in [stage/'runtime_verify.py',stage/'resume_combat.py',stage/'audit_reported_errors.py',out/'reported-error-audit.json']:shutil.copy2(p,archive/p.name)
finally:s.close()
