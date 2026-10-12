from pathlib import Path
import json,hashlib,shutil,sys,time,re,csv,io
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-tutorial');out=Path('outputs/pet-tutorial');archive=Path('G:/Maple_Story_Deck/ArtSource/pet-tutorial')
sources=json.loads((stage/'sources.json').read_text(encoding='utf-8'));preserved=json.loads((stage/'preserved-sources.json').read_text(encoding='utf-8'))
for name in sources:assert(stage/name).exists()
def methods(s):return {m[1]:m[0]for m in re.finditer(r'(?ms)^\tmethod \w+ (\w+)\([^\n]*\)\n.*?^\tend',s)}
old=methods((stage/'PetHouseUI.mlua.before').read_text(encoding='utf-8-sig'));new=methods((stage/'PetHouseUI.mlua').read_text(encoding='utf-8'))
allowed={'OnBeginPlay','OnUpdate','Close','RequestCare','BuyEgg','OpenStatPopup','MovePet','UpdateStoneTooltip'}
for name,body in old.items():
 if name not in allowed:assert body==new[name],name
assert not re.search(r'property Entity \w+ = ""',(stage/'PetHouseUI.mlua').read_text(encoding='utf-8'))
before=list(csv.DictReader(io.StringIO((stage/'GameText.csv.before').read_text(encoding='utf-8-sig'))));after=list(csv.DictReader(io.StringIO((stage/'GameText.csv').read_text(encoding='utf-8-sig'))));assert after[:len(before)]==before and len(after)==len(before)+6
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
 assert mode.get('mode')=='edit'
 for name,info in sources.items():assert hashlib.sha256(Path(info['path']).read_bytes()).hexdigest()==info['sha256'],name+' changed during work'
 for path,h in preserved.items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==h,path+' changed during work'
 backup=archive/'source-backup';backup.mkdir(parents=True,exist_ok=True)
 for name,info in sources.items():shutil.copy2(info['path'],backup/name);shutil.copy2(stage/name,info['path'])
 print('Refresh:',s.call('maker_refresh_workspace'),flush=True);time.sleep(7)
 build=s.call('maker_logs',{'kind':'build'});errors=[x for x in build.get('logs',[])if x.get('logType')=='Error'];assert not errors,errors[:4]
 print('Build errors: 0',flush=True);print('Save:',s.call('maker_save'),flush=True);time.sleep(2)
 assert Path(sources['PetHouseUI.mlua']['path']).read_text(encoding='utf-8-sig')==(stage/'PetHouseUI.mlua').read_text(encoding='utf-8')
 saved=list(csv.DictReader(Path(sources['GameText.csv']['path']).open(encoding='utf-8-sig',newline='')));assert saved==after
 (stage/'build.json').write_text(json.dumps(build,ensure_ascii=False,indent=2),encoding='utf-8')
 (out/'source-verification.json').write_text(json.dumps({'existingMethodsPreserved':len(old)-len(allowed),'modifiedMethods':sorted(allowed),'addedMethods':sorted(set(new)-set(old)),'existingLocalizationRowsPreserved':len(before),'newKeys':6,'languages':['ko','en','zh-tw','zh-cn','ja'],'petEconomyAndSkillsUnchanged':True},ensure_ascii=False,indent=2),encoding='utf-8')
 plan=json.loads((stage/'plan.json').read_text(encoding='utf-8'));plan['steps'][2]['status']='completed';plan['steps'][3]['status']='in_progress';(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
 print('Pet-house help tutorial applied and saved.',flush=True)
finally:s.close()
