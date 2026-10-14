from pathlib import Path
import re,sys,csv,io,json
sys.path.insert(0,str(Path('work/ranged-lua-runtime').resolve()))
from lupa import LuaRuntime
lua=LuaRuntime();path=Path('work/pet-oduck/PetLogic.mlua');s=path.read_text(encoding='utf-8');matches=list(re.finditer(r'(?ms)^\tmethod \w+ (\w+)\(([^\n]*)\)\n(.*?)^\tend',s))
for m in matches:
 args=[p.strip().split()[-1]for p in m[2].split(',')if p.strip()];lua.execute('return function(self'+(' ,'+','.join(args)if args else'')+')\n'+m[3]+'\nend')
before=list(csv.DictReader(io.StringIO(Path('work/pet-oduck/GameText.csv.before').read_text(encoding='utf-8-sig'))));after=list(csv.DictReader(io.StringIO(Path('work/pet-oduck/GameText.csv').read_text(encoding='utf-8-sig'))));assert after[:len(before)]==before
keys=[r['Key']for r in after];assert len(keys)==len(set(keys));new=after[len(before):];assert len(new)==15
for r in new:
 for lang in ['ko','en','zh-tw','zh-cn','ja']:assert r[lang]
Path('outputs/pet-oduck/static-verification.json').write_text(json.dumps({'methodsParsed':len(matches),'existingLocalizationRowsPreserved':len(before),'newLocalizedRows':len(new),'languages':5},indent=2),encoding='utf-8')
print('All '+str(len(matches))+' method bodies parse; original localization preserved and 15 new keys cover five languages.',flush=True)
