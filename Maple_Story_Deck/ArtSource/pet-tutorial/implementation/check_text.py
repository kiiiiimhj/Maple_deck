from pathlib import Path
import ast,re,sys,json,csv
sys.path.insert(0,str(Path('work/ranged-lua-runtime').resolve()))
from lupa import LuaRuntime
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text(encoding='utf-8'));fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');ns={'re':re};exec(compile(ast.Module(body=[fn],type_ignores=[]),'translator','exec'),ns)
lua=LuaRuntime();lua.execute('function Vector2(x,y)return {}end');logic=lua.execute(ns['translate'](Path('work/pet-tutorial/PetHouseUI.mlua').read_text(encoding='utf-8')))
service=lua.table();service.GetText=lambda self,key:'first\\nsecond';lua.globals()['_LocalizationService']=service
value=logic.GetPetTutorialText(logic,'probe');print(json.dumps({'decoded':value,'newlines':value.count('\n'),'backslashes':value.count('\\')},ensure_ascii=False));assert value=='first\nsecond'
rows=list(csv.DictReader(Path('work/pet-tutorial/GameText.csv').open(encoding='utf-8-sig',newline='')))
new=[r for r in rows if r['Key'].startswith('PET_GUIDE_')];assert len(new)==6
for r in new:
 for language in ['ko','en','zh-tw','zh-cn','ja']:assert r[language]
print('Literal CSV line breaks decode into two displayed lines; six keys cover five languages.')
