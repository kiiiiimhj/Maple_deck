from pathlib import Path
import json,re,sys,shutil
sys.path.insert(0,'work/ranged-lua-runtime')
from lupa import LuaRuntime
stage=Path('work/pet-gear-painted-v5');out=Path('outputs/pet-gear-painted-v5')
source=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig')
runtime=LuaRuntime();old=runtime.execute('return '+re.search(r'(?m)^\tproperty table NativePetGearOverlays = (.*)$',source)[1])
def plain(v):
 if hasattr(v,'items'):return {str(k):plain(x)for k,x in v.items()}
 return v
def lua(v):
 if isinstance(v,dict):return '{'+','.join('['+json.dumps(str(k))+']='+lua(x)for k,x in v.items())+'}'
 if isinstance(v,str):return json.dumps(v)
 if isinstance(v,bool):return 'true'if v else'false'
 return repr(v)
maps=plain(old);new=json.loads((out/'overlay-map.json').read_text());uploaded=json.loads((out/'applied-assets.json').read_text());expected={'5002617':109,'5000498':98,'landturtle':82,'oduck':81}
for pet,count in expected.items():
 assert len(new[pet])==count,(pet,len(new[pet]),count)
 for base,layers in new[pet].items():
  assert base in maps[pet]
  if not (out/'roll-fixed.json').exists():
   rollids={z['ruid']for z in json.loads((out/'roll-page.json').read_text())['frames']}
   if base in rollids:continue
  maps[pet][base]={}
  for slot,z in layers.items():
   maps[pet][base][slot]=dict({k:z[k]for k in ['x','y','w','h']},ruid=uploaded[z['asset']]['ruid'])
   if z.get('replacesBody'):maps[pet][base][slot]['replacesBody']=True
source,n=re.subn(r'(?m)^\tproperty table NativePetGearOverlays = .*$',lambda m:'\tproperty table NativePetGearOverlays = '+lua(maps),source);assert n==1
ui='local descriptors={{ruid=base,x=0,y=0,w=m.w,h=m.h}}';world='local descriptors={{ruid=base,x=0,y=0,w=m.w,h=m.h,body=true}}'
assert ui in source and world in source
source=source.replace(ui,'local descriptors={}\n\t\tif not(layers.coat~=nil and layers.coat.replacesBody==true and self:HasPetGearBit(mask,2))then table.insert(descriptors,{ruid=base,x=0,y=0,w=m.w,h=m.h})end')
source=source.replace(world,'local descriptors={}\n\t\tif not(layers.coat~=nil and layers.coat.replacesBody==true and self:HasPetGearBit(v.gearMask or 0,2))then table.insert(descriptors,{ruid=base,x=0,y=0,w=m.w,h=m.h,body=true})end')
(stage/'PetLogic.mlua').write_text(source,encoding='utf-8',newline='\r\n')
for name in ['PetUI.mlua','PetHouseUI.mlua']:shutil.copy2(stage/(name+'.before'),stage/name)
(out/'overlay-ruids.json').write_text(json.dumps(maps,indent=2),encoding='utf-8')
print('Staged 370 directly painted native animation frames; timing, options and Ttungttang unchanged.')
