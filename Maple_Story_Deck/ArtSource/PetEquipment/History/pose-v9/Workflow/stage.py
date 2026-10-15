from pathlib import Path
import re,json,sys,ast,shutil
sys.path.insert(0,'work/ranged-lua-runtime')
from lupa import LuaRuntime
stage=Path('work/pet-gear-pose-v9');out=Path('outputs/pet-gear-pose-v9');source=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig');runtime=LuaRuntime()
def plain(v):return {k:plain(x)for k,x in v.items()}if hasattr(v,'items')else v
def lua(v):
 if isinstance(v,dict):return '{'+','.join('['+(str(k)if isinstance(k,int)else json.dumps(str(k)))+']='+lua(x)for k,x in v.items())+'}'
 if isinstance(v,str):return json.dumps(v)
 if isinstance(v,bool):return 'true'if v else'false'
 return repr(v)
def prop(name):
 offset=source.index('\tproperty table '+name+' = ');offset=source.index('{',offset);depth=0;quote=None;escaped=False
 for j in range(offset,len(source)):
  ch=source[j]
  if quote:
   if escaped:escaped=False
   elif ch=='\\':escaped=True
   elif ch==quote:quote=None
  elif ch in ['"',"'"]:quote=ch
  elif ch=='{':depth+=1
  elif ch=='}':
   depth-=1
   if depth==0:return plain(runtime.execute('return '+source[offset:j+1]))
 raise AssertionError(name)
def replace(name,value):
 global source
 source,n=re.subn(r'(?m)^\tproperty table '+name+r' = .*$',lambda m:'\tproperty table '+name+' = '+lua(value),source);assert n==1
maps=prop('NativePetGearOverlays');new=json.loads((out/'overlay-map.json').read_text());uploaded=json.loads((out/'applied-assets.json').read_text())
for pet,rows in new.items():
 for base,layers in rows.items():
  maps[pet][base]={}
  for slot,z in layers.items():
   maps[pet][base][slot]={k:z[k]for k in ['x','y','w','h','density']};maps[pet][base][slot]['ruid']=uploaded[z['asset']]['ruid']
   if z.get('replacesBody'):maps[pet][base][slot]['replacesBody']=True
replace('NativePetGearOverlays',maps)
# The manual Guri eating frames must share a continuous clip clock. Rapidly
# changing ImageRUID between static frames kept restarting the cold handoff.
motions=prop('Motions');clips=prop('NativePetGearClips');delays=prop('NativePetFrameDelays')
feed=['fb961eaed68149c8ab6835ba0888c762','cf7a9eeab77d473f96f48b36912f5c8d']
clips[motions['eat']]={i+1:r for i,r in enumerate(feed)};delays[motions['eat']]={1:.15,2:.15}
replace('NativePetGearClips',clips);replace('NativePetFrameDelays',delays)
needle='bonusKey="PET_HOUSE_DAMAGE_FORMAT"} end';assert source.count(needle)==1;source=source.replace(needle,'bonusKey="PET_HOUSE_DAMAGE_FORMAT",nativeWalk=true} end')
(stage/'PetLogic.mlua').write_text(source,encoding='utf-8',newline='\r\n')
house=(stage/'PetHouseUI.mlua.before').read_text(encoding='utf-8-sig')
old='elseif action=="feed" and entry.id=="5002617" then self.FeedingFrame=0 self:PlayPortrait(self.FeedingRUIDs[1])';assert old in house;house=house.replace(old,'elseif action=="feed" and entry.id=="5002617" then self.FeedingFrame=1 self:PlayPortrait(entry.motions.eat)')
start=house.index('\t\tlocal frame = math.floor(math.max(0, elapsed) / 0.15)');end=house.index('\n\t\tlocal progress = ',start)
house=house[:start]+'''\t\tif self.FeedingFrame == 0 then
			self.FeedingFrame = 1
			self:PlayPortrait(self:GetDisplayedPet().motions.eat)
		end'''+house[end:]
needle='local pose=noticing and "what" or (digging and "dung" or (celebrating and "love" or "move"))'
assert house.count(needle)==1
house=house.replace(needle,needle+'\n\t\t\tif entry.id=="5002617" then pose="move" end')
needle='\t\tlocal walking=not noticing and not digging and not celebrating'
assert house.count(needle)==1
house=house.replace(needle,'''\t\t-- Guri keeps the original four walking frames and happy expression while
		-- sharing the same native foot pivot as idle and eating.
		if entry.id=="5002617" then
			self.WalkSmile.Enable=true
			self.WalkSmile.UITransformComponent.RectSize=Vector2(21*scale,10*scale)
			self.WalkSmile.UITransformComponent.anchoredPosition=Vector2(0,(17+(frame%2==0 and 1 or 0))*scale)
		end
'''+needle)
needle='portrait.UITransformComponent.UIRotation=Vector3(0,0,digging and entry.id=="5002617" and math.sin((t-4.2)*math.pi*4)*3 or 0)'
assert house.count(needle)==1
house=house.replace(needle,'portrait.UITransformComponent.UIRotation=Vector3(0,0,0)')
# The same feet-at-pivot coordinate convention now applies to Guri's idle,
# walking and eating poses. Keep the original small feeding nod.
(stage/'PetHouseUI.mlua').write_text(house,encoding='utf-8',newline='\r\n');shutil.copy2(stage/'PetUI.mlua.before',stage/'PetUI.mlua')
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text(encoding='utf-8'));fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');ns={};exec('import re\n'+ast.unparse(fn),ns)
runtime.execute('function Vector2(x,y)return {x=x,y=y}end;function Vector3(x,y,z)return {x=x,y=y,z=z}end;function Color(r,g,b,a)return {r=r,g=g,b=b,a=a}end')
for code in [source,house]:runtime.execute(ns['translate'](code))
(out/'overlay-ruids.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');print('Staged pose-specific coats, complete Guri headpiece and continuous native foot alignment. Syntax passed.')
