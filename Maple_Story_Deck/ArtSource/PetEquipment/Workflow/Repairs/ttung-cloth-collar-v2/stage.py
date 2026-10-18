from pathlib import Path
import json,re,sys,ast
sys.path.insert(0,'work/ranged-lua-runtime')
stage=Path('work/pet-variation-repair-v2');out=Path('outputs/pet-variation-repair-v2');source=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig')
ns={};p=Path('work/pet-gear-pose-v9/stage.py').read_text();exec(p[:p.index('maps=prop(')],ns);ns['source']=source
original=ns['prop']('PetGearOverlays');variants=ns['prop']('PetGearVariantOverlays');new=json.loads((out/'repair-map.json').read_text());uploads=json.loads((out/'applied-assets.json').read_text())
for design,maps in [(1,original),(2,variants)]:
 for base,layers in new[str(design)].items():
  key=base if design==1 else base+':design2'
  for slot,asset in layers.items():maps[key][slot]=uploads[asset]['ruid']
def replace(name,value):
 global source
 start=source.index('\tproperty table '+name+' = ');opening=source.index('{',start);depth=0;quote=None;escaped=False
 for end in range(opening,len(source)):
  ch=source[end]
  if quote:
   if escaped:escaped=False
   elif ch=='\\':escaped=True
   elif ch==quote:quote=None
  elif ch in ['"',"\x27"]:quote=ch
  elif ch=='{':depth+=1
  elif ch=='}':
   depth-=1
   if depth==0:break
 else:raise AssertionError(name)
 source=source[:opening]+ns['lua'](value)+source[end+1:]
replace('PetGearOverlays',original);replace('PetGearVariantOverlays',variants)
(stage/'PetLogic.mlua').write_text(source,encoding='utf-8',newline='\r\n')
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');t={};exec('import re\n'+ast.unparse(fn),t)
ns['runtime'].execute('function Vector2(x,y)return{x=x,y=y}end;function Vector3(x,y,z)return{x=x,y=y,z=z}end;function Color(r,g,b,a)return{r=r,g=g,b=b,a=a}end');ns['runtime'].execute(t['translate'](source))
(out/'applied-overlay-map.json').write_text(json.dumps({'original':original,'variants':variants},indent=2),encoding='utf-8')
print('Staged repaired coat/collar artwork only. Hat mappings, body frames, stats, item selection and animation clocks unchanged.')
