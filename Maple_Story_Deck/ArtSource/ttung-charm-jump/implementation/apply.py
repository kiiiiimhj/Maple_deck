from pathlib import Path
import sys,json,time,shutil,hashlib,re
sys.path.insert(0,str(Path('work').resolve()));sys.path.insert(0,str(Path('work/ranged-lua-runtime').resolve()))
from maker_session import MakerSession
from lupa import LuaRuntime
stage=Path('work/ttung-charm-jump');out=Path('outputs/ttung-charm-jump');sources=json.loads((stage/('repair-sources.json'if(stage/'repair-sources.json').exists()else'sources.json')).read_text(encoding='utf-8'));scope=json.loads((out/'scope.json').read_text(encoding='utf-8'));text=(stage/'PetLogic.mlua').read_text(encoding='utf-8');lua=LuaRuntime()
for m in re.finditer(r'(?ms)^\tmethod \w+ (\w+)\(([^\n]*)\)\n(.*?)^\tend',text):
 if m[1]not in scope['modifiedMethods']+scope['newMethods']:continue
 args=[p.strip().split()[-1]for p in m[2].split(',')if p.strip()];lua.execute('return function(self'+(' ,'+','.join(args)if args else'')+')\n'+m[3]+'\nend')
s=MakerSession()
try:
 mode=s.call('maker_get_current_map');print('Maker:',mode,flush=True)
 if mode.get('mode')=='play':
  print('Stop:',s.call('maker_stop'),flush=True)
  for _ in range(25):
   time.sleep(.5);mode=s.call('maker_get_current_map')
   if mode.get('mode')=='edit':break
 assert mode.get('mode')=='edit',mode
 for name,info in sources.items():assert hashlib.sha256(Path(info['path']).read_bytes()).hexdigest()==info['sha256'],name+' changed during staging'
 for path,h in json.loads((stage/'preserved.json').read_text(encoding='utf-8')).items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==h,path
 backup=Path('G:/Maple_Story_Deck/ArtSource/ttung-charm-jump/source-backup');backup.mkdir(parents=True,exist_ok=True)
 for name,v in sources.items():
  if not(backup/name).exists():shutil.copy2(v['path'],backup/name)
  shutil.copy2(stage/name,v['path'])
 print('Refresh:',s.call('maker_refresh_workspace'),flush=True);time.sleep(4)
 logs=s.call('maker_logs',{'kind':'build'});assert not[x for x in logs.get('logs',[])if x.get('logType')=='Error'],logs
 print('Save:',s.call('maker_save'),flush=True)
 assert Path(sources['PetLogic.mlua']['path']).read_text(encoding='utf-8-sig')==text
 (stage/'build.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8');print('Twenty-frame jump and takeoff hearts saved; build errors 0.',flush=True)
finally:s.close()
