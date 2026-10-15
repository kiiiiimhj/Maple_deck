from pathlib import Path
import json,sys,ast,re,shutil
sys.path.insert(0,'work/ranged-lua-runtime')
stage=Path('work/pet-gear-clean-v10');out=Path('outputs/pet-gear-clean-v10');ns={};p=Path('work/pet-gear-pose-v9/stage.py').read_text();exec(p[:p.index("maps=prop(")],ns)
source=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig');ns['source']=source;maps=ns['prop']('NativePetGearOverlays');new=json.loads((out/'overlay-map.json').read_text());uploads=json.loads((out/'applied-assets.json').read_text())
for ruid,layers in new['5002617'].items():
 for slot,z in layers.items():
  if slot!='hat':continue
  maps['5002617'][ruid][slot]={k:z[k]for k in ['x','y','w','h','density']};maps['5002617'][ruid][slot]['ruid']=uploads[z['asset']]['ruid']
source,count=re.subn(r'(?m)^\tproperty table NativePetGearOverlays = .*$',lambda m:'\tproperty table NativePetGearOverlays = '+ns['lua'](maps),source);assert count==1
(stage/'PetLogic.mlua').write_text(source,encoding='utf-8',newline='\r\n')
house=(stage/'PetHouseUI.mlua.before').read_text(encoding='utf-8-sig')
start=house.index('\t\t-- Only the face is replaced;');end=house.index('\n\t\tfor _,ruid in ipairs(self.WalkFrameRUIDs)',start)
house=house[:start]+'''\t\t-- Native walking frames already include Guri's face. A second masked
		-- full-character image must never be rendered over those frames.
		if isvalid(self.WalkSmile) then self.WalkSmile:Destroy() end
		self.WalkSmile=nil'''+house[end:]
house=house.replace('\t\ttable.insert(assets,self.HappyFaceRUID)\n','')
block='''\t\t\tif entry.id=="5002617" then
				self.WalkSmile.Enable=true
				self.WalkSmile.UITransformComponent.anchoredPosition=Vector2(3.5*scale,(-1+(frame%2==0 and 1 or 0))*scale)
			end'''
assert block in house;house=house.replace(block,'')
start=house.index('\t\t-- Guri keeps the original four walking frames');end=house.index('\n\t\tlocal walking=',start);house=house[:start]+house[end:]
house=house.replace('\n\t\t\tself.WalkSmile.Enable=false','')
assert 'self.WalkSmile.Enable=true'not in house
assert 'self:WalkLayer(face,'not in house and 'local mask=face:AddComponent'not in house
(stage/'PetHouseUI.mlua').write_text(house,encoding='utf-8',newline='\r\n');shutil.copy2(stage/'PetUI.mlua.before',stage/'PetUI.mlua')
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text(encoding='utf-8'));fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');t={};exec('import re\n'+ast.unparse(fn),t);rt=ns['runtime'];rt.execute('function Vector2(x,y)return {x=x,y=y}end;function Vector3(x,y,z)return {x=x,y=y,z=z}end;function Color(r,g,b,a)return {r=r,g=g,b=b,a=a}end')
for code in [source,house]:rt.execute(t['translate'](code))
(out/'overlay-ruids.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');print('Removed the legacy walking face renderer; repaired Guri source leaf with transparent border padding. Lua syntax passed.')
