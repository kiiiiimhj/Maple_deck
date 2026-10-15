from pathlib import Path
import re,json,sys,shutil,ast
sys.path.insert(0,'work/ranged-lua-runtime')
from lupa import LuaRuntime
stage=Path('work/pet-gear-density-v6');out=Path('outputs/pet-gear-density-v6');source=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig');runtime=LuaRuntime()
def plain(v):return {str(k):plain(x)for k,x in v.items()}if hasattr(v,'items')else v
def lua(v):
 if isinstance(v,dict):return '{'+','.join('['+json.dumps(str(k))+']='+lua(x)for k,x in v.items())+'}'
 if isinstance(v,str):return json.dumps(v)
 if isinstance(v,bool):return 'true'if v else'false'
 return repr(v)
maps=plain(runtime.execute('return '+re.search(r'(?m)^\tproperty table NativePetGearOverlays = (.*)$',source)[1]));new=json.loads((out/'overlay-map.json').read_text());uploaded=json.loads((out/'applied-assets.json').read_text())
for pet,count in {'5002617':109,'5000498':98,'landturtle':82,'oduck':81}.items():
 assert len(new[pet])==count
 for base,layers in new[pet].items():
  maps[pet][base]={}
  for slot,z in layers.items():
   im=uploaded[z['asset']];assert im['size']==[round(z['w']*z['density']),round(z['h']*z['density'])]
   maps[pet][base][slot]={k:z[k]for k in ['x','y','w','h','density']};maps[pet][base][slot]['ruid']=im['ruid']
   if z.get('replacesBody'):maps[pet][base][slot]['replacesBody']=True
source,n=re.subn(r'(?m)^\tproperty table NativePetGearOverlays = .*$',lambda m:'\tproperty table NativePetGearOverlays = '+lua(maps),source);assert n==1
before='e.TransformComponent.Scale=scale;e.TransformComponent.ZRotation=rotation;e.TransformComponent.WorldPosition='
after='local density=d.density or 1;e.TransformComponent.Scale=Vector3(scale.x/density,scale.y/density,scale.z);e.TransformComponent.ZRotation=rotation;e.TransformComponent.WorldPosition='
assert source.count(before)==1;source=source.replace(before,after)
(stage/'PetLogic.mlua').write_text(source,encoding='utf-8',newline='\r\n')
for name in ['PetHouseUI.mlua','PetUI.mlua']:shutil.copy2(stage/(name+'.before'),stage/name)
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text(encoding='utf-8'));fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');ns={};exec('import re\n'+ast.unparse(fn),ns)
runtime.execute('function Vector2(x,y)return {x=x,y=y}end;function Vector3(x,y,z)return {x=x,y=y,z=z}end;function Color(r,g,b,a)return {r=r,g=g,b=b,a=a}end');runtime.execute(ns['translate'](source))
(out/'overlay-ruids.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');print('Staged original painted detail at twice the texture density, unchanged display size; syntax passed.')
