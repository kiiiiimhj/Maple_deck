from pathlib import Path
import json,re,ast,sys
stage=Path('work/pet-ttung-status-fit-v3');out=Path('outputs/pet-ttung-status-fit-v3');source=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig')
ns={};helper=Path('work/pet-gear-pose-v9/stage.py').read_text();exec(helper[:helper.index('maps=prop(')],ns);ns['source']=source
original=ns['prop']('PetGearOverlays');variants=ns['prop']('PetGearVariantOverlays');atlases=ns['prop']('PetDressedFrameAtlases');assets=json.loads((out/'applied-assets.json').read_text())
def uid(d):return d['ruid']if'ruid'in d else assets[d['asset']]['ruid']
for base,designs in json.loads((out/'part-changes.json').read_text()).items():
 for design,layers in designs.items():
  dest=original[base]if design=='1'else variants[base+':design2']
  for slot,d in layers.items():dest[slot]=uid(d)
for base,d in json.loads((out/'atlas-input.json').read_text()).items():atlases[base]=uid(d)
def lua(v):
 if isinstance(v,dict):return'{'+','.join('['+json.dumps(str(k),ensure_ascii=False)+']='+lua(x)for k,x in v.items())+'}'
 return json.dumps(v,ensure_ascii=False)
for name,value in [('PetGearOverlays',original),('PetGearVariantOverlays',variants),('PetDressedFrameAtlases',atlases)]:
 source=re.sub(r'(?m)^\tproperty table '+name+r' = .*$',lambda m:'\tproperty table '+name+' = '+lua(value),source)
(stage/'PetLogic.mlua').write_text(source,encoding='utf-8',newline='\r\n')
(out/'applied-maps.json').write_text(json.dumps({'original':original,'variants':variants,'atlases':atlases},indent=2))
before=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig')
scrub=lambda t:re.sub(r'(?m)^\tproperty table (PetGearOverlays|PetGearVariantOverlays|PetDressedFrameAtlases) = .*$',r'\1',t)
assert scrub(source)==scrub(before),'Only the three equipment artwork maps may change'
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');env={};exec('import re\n'+ast.unparse(fn),env);sys.path.insert(0,'work/ranged-lua-runtime');from lupa import LuaRuntime
rt=LuaRuntime();rt.execute('function Vector2(x,y)return{x=x,y=y}end;function Vector3(x,y,z)return{x=x,y=y,z=z}end;function Color(r,g,b,a)return{r=r,g=g,b=b,a=a}end');rt.execute(env['translate'](source))
apply=Path('work/pet-equipment-native-v11/apply.py').read_text().replace('pet-equipment-native-v11','pet-ttung-status-fit-v3').replace("names=['PetLogic.mlua','PetHouseUI.mlua','PetUI.mlua']","names=['PetLogic.mlua']")
(stage/'apply.py').write_text(apply,encoding='utf-8')
print('Updated four condition/discovery reaction atlases and fitted gear maps. All body art, animation timing and other pet changes retained. Syntax passed.')
