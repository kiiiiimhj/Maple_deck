from pathlib import Path
import sys,time,json,hashlib,shutil,re,csv,io
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-oduck');out=Path('outputs/pet-oduck');sources=json.loads((stage/'sources.json').read_text(encoding='utf-8'));preserved=json.loads((stage/'preserved-sources.json').read_text(encoding='utf-8'))
def methods(s):return {m[1]:m[0]for m in re.finditer(r'(?ms)^\tmethod \w+ (\w+)\([^\n]*\)\n.*?^\tend',s)}
old=methods((stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig'));new=methods((stage/'PetLogic.mlua').read_text(encoding='utf-8'))
allowed={'OnBeginPlay','GetPetDefinition','GetBonusPercent','GetPurchasedPetId','GetPetMessageKey','GetPetCatalog','GetRunDamageMult','ReadAccount','SerializeAccount','InitForRun','OnUpdate','TryCastPetSkill','TickPetSkillCast','GetPetSkillInfo','StartPetSkillVisual','UpdatePetSkillVisual','ClearPetSkillVisual','OnEndPlay','CheatRequestNextPetSkill'}
for name,body in old.items():
 if name not in allowed:assert body==new[name],name
assert set(new)-set(old)=={'PreloadOduckArtwork','ResetOduckBuff','UpdateOduckBuff','UpdateOduckVisual'}
s=MakerSession()
try:
 mode=s.call('maker_get_current_map');print('Maker:',mode,flush=True)
 if mode.get('mode')=='play':
  print('Stop:',s.call('maker_stop'),flush=True)
  for _ in range(25):
   time.sleep(1)
   try:mode=s.call('maker_get_current_map')
   except AssertionError:continue
   if mode.get('mode')=='edit':break
 assert mode.get('mode')=='edit',mode
 for name,info in sources.items():assert hashlib.sha256(Path(info['path']).read_bytes()).hexdigest()==info['sha256'],name+' changed during work'
 for path,h in preserved.items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==h,path
 backup=Path('G:/Maple_Story_Deck/ArtSource/pet-oduck/source-backup');backup.mkdir(parents=True,exist_ok=True)
 for name,info in sources.items():shutil.copy2(info['path'],backup/name);shutil.copy2(stage/name,info['path'])
 print('Refresh:',s.call('maker_refresh_workspace'),flush=True);time.sleep(7)
 build=s.call('maker_logs',{'kind':'build'});errors=[x for x in build.get('logs',[])if x.get('logType')=='Error'];assert not errors,errors
 print('Build errors: 0',flush=True);print('Save:',s.call('maker_save'),flush=True);time.sleep(2)
 for name,info in sources.items():assert Path(info['path']).read_text(encoding='utf-8-sig')==(stage/name).read_text(encoding='utf-8')
 (stage/'build.json').write_text(json.dumps(build,ensure_ascii=False,indent=2),encoding='utf-8')
 (out/'source-verification.json').write_text(json.dumps({'existingMethodsPreserved':len(old)-len(allowed),'modifiedMethods':sorted(allowed),'addedMethods':sorted(set(new)-set(old)),'originalPetHouseInventoryAndProgressUnchanged':True,'UIAndEnergyIconUnchanged':True,'savedScriptAndLocalizationMatchStaged':True},indent=2),encoding='utf-8')
 plan=json.loads((stage/'plan.json').read_text(encoding='utf-8'));plan['steps'][1]['status']='completed';plan['steps'][2]['status']='in_progress';(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
 print('Oduck pet and dance damage buff applied and saved.',flush=True)
finally:s.close()
