from pathlib import Path
import json,re,ast,sys
stage=Path('work/ducky-bowl-fit-v13');out=Path('outputs/ducky-bowl-fit-v13');source=(stage/'PetHouseUI.mlua.before').read_text(encoding='utf-8-sig');before=source
uid=json.loads((out/'applied-assets.json').read_text())['ducky_lowdish_v13']['ruid']
source,n=re.subn(r'(property string DuckyBowlRUID = ")[^"]+',lambda m:m[1]+uid,source);assert n==1
old='''		local scale=_PetLogic:GetCustomPixelScale(bowl,2)
		local size=128*scale
		bowl.UITransformComponent.RectSize=Vector2(size,size)
		-- Original 128px art: bowl bounds (25,96)-(64,118); keep the base on the paw plane.
		bowl.UITransformComponent.anchoredPosition=Vector2(-38+(64-44.5)*scale,self:GetPortraitY()+(118-64)*scale)
		_PetLogic:AlignCustomPortrait(bowl,{frames={},canvas=128},2)'''
new='''		local portrait=self.PetDisplay:GetChildByName("Portrait")
		local desiredScale=portrait.SpriteGUIRendererComponent.LocalScale.x*0.5
		local scale=_PetLogic:GetCustomPixelScale(portrait,desiredScale)
		local size=128*scale
		bowl.UITransformComponent.RectSize=Vector2(size,size)
		-- Shallow 32x10px dish at (28,108)-(60,118). Centre it in front
		-- of the muzzle, leaving the forepaws visible, with its base on the floor.
		bowl.UITransformComponent.anchoredPosition=Vector2((-32+64-44)*scale,self:GetPortraitY()+(118-64)*scale)
		_PetLogic:AlignCustomPortrait(bowl,{frames={},canvas=128},desiredScale)'''
assert source.count(old)==1;source=source.replace(old,new)
(stage/'PetHouseUI.mlua').write_text(source,encoding='utf-8',newline='\r\n')
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');env={};exec('import re\n'+ast.unparse(fn),env);sys.path.insert(0,'work/ranged-lua-runtime');from lupa import LuaRuntime
rt=LuaRuntime();rt.execute('function Vector2(x,y)return{x=x,y=y}end;function Vector3(x,y,z)return{x=x,y=y,z=z}end;function Color(r,g,b,a)return{r=r,g=g,b=b,a=a}end');rt.execute(env['translate'](source))
apply=Path('work/pet-equipment-native-v11/apply.py').read_text().replace('pet-equipment-native-v11','ducky-bowl-fit-v13').replace("names=['PetLogic.mlua','PetHouseUI.mlua','PetUI.mlua']","names=['PetHouseUI.mlua']")
(stage/'apply.py').write_text(apply,encoding='utf-8')
print('Staged only Ducky bowl resource, scale and ground-aligned position. Syntax passed.',flush=True)
