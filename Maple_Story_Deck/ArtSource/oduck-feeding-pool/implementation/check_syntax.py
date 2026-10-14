from pathlib import Path
import re,sys,json
sys.path.insert(0,str(Path('work/ranged-lua-runtime').resolve()))
from lupa import LuaRuntime
lua=LuaRuntime();report={};scope=json.loads(Path('work/oduck-feeding-pool/scope.json').read_text(encoding='utf-8'))
for name in ['PetHouseUI.mlua','PetLogic.mlua','CardManager.mlua']:
 s=Path('work/oduck-feeding-pool',name).read_text(encoding='utf-8');matches=list(re.finditer(r'(?ms)^\tmethod \w+ (\w+)\(([^\n]*)\)\n(.*?)^\tend',s))
 selected=[m for m in matches if m[1]in scope[name]['modified']+scope[name]['added']]
 for m in selected:
  args=[p.strip().split()[-1]for p in m[2].split(',')if p.strip()];lua.execute('return function(self'+(' ,'+','.join(args)if args else'')+')\n'+m[3]+'\nend')
 report[name]=len(selected)
Path('outputs/oduck-feeding-pool/syntax.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print('All modified scripts parse: '+json.dumps(report))
