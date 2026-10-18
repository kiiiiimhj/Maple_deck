from pathlib import Path
import json,re,ast,sys
stage=Path('work/pet-guri-bugi-v12');out=Path('outputs/pet-guri-bugi-v12');source=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig');before=source
ns={};helper=Path('work/pet-gear-pose-v9/stage.py').read_text();exec(helper[:helper.index('maps=prop(')],ns);ns['source']=source
original=ns['prop']('NativePetGearOverlays');variants=ns['prop']('NativePetGearVariantOverlays');sheets=ns['prop']('NativePetMotionSheets')
assets=json.loads((out/'applied-assets.json').read_text());parts=json.loads((out/'repaired-inputs.json').read_text())['parts']
for pet in ['5002617','landturtle']:
 for base,designs in parts[pet].items():
  for code,dest in [('1',original),('2',variants)]:
   for slot,d in designs[code].items():
    if d['asset']in assets:dest[pet][base][slot]['ruid']=assets[d['asset']]['ruid']
for pet,choices in json.loads((out/'sheet-input.json').read_text()).items():
 for code,key in choices.items():sheets[pet][int(code)]=assets[key]['ruid']
def lua(v):
 if isinstance(v,dict):return'{'+','.join('['+(str(k)if isinstance(k,int)else json.dumps(str(k),ensure_ascii=False))+']='+lua(x)for k,x in v.items())+'}'
 if isinstance(v,bool):return'true'if v else'false'
 return json.dumps(v,ensure_ascii=False)
names=['NativePetGearOverlays','NativePetGearVariantOverlays','NativePetMotionSheets']
for name,value in zip(names,[original,variants,sheets]):source=re.sub(r'(?m)^\tproperty table '+name+r' = .*$',lambda m:'\tproperty table '+name+' = '+lua(value),source)
scrub=lambda t:re.sub(r'(?m)^\tproperty table ('+'|'.join(names)+r') = .*$',r'\1',t)
assert scrub(source)==scrub(before),'Only native gear art maps may change'
for pet in ['oduck','5000498']:
 for name,val in zip(names,[original,variants,sheets]):assert val[pet]==ns['prop'](name)[pet]
(stage/'PetLogic.mlua').write_text(source,encoding='utf-8',newline='\r\n');(out/'applied-maps.json').write_text(json.dumps({'original':original,'variants':variants,'sheets':sheets},indent=2))
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');env={};exec('import re\n'+ast.unparse(fn),env);sys.path.insert(0,'work/ranged-lua-runtime');from lupa import LuaRuntime
rt=LuaRuntime();rt.execute('function Vector2(x,y)return{x=x,y=y}end;function Vector3(x,y,z)return{x=x,y=y,z=z}end;function Color(r,g,b,a)return{r=r,g=g,b=b,a=a}end');rt.execute(env['translate'](source))
apply=Path('work/pet-equipment-native-v11/apply.py').read_text().replace('pet-equipment-native-v11','pet-guri-bugi-v12').replace("names=['PetLogic.mlua','PetHouseUI.mlua','PetUI.mlua']","names=['PetLogic.mlua']")
(stage/'apply.py').write_text(apply,encoding='utf-8')
print('Only 3 native gear art tables changed. Ttungttang condition fix and other pets preserved. Syntax passed.',flush=True)
