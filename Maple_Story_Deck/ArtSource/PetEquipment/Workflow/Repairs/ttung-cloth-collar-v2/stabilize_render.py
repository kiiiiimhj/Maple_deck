from pathlib import Path
import json,re,ast,sys
from PIL import Image
stage=Path('work/pet-variation-repair-v2');out=Path('outputs/pet-variation-repair-v2');logic=(stage/'PetLogic.mlua').read_text(encoding='utf-8');house=(stage/'PetHouseUI.mlua.before').read_text(encoding='utf-8-sig')
start=logic.index('\tmethod void RenderPetGearUI(');end=logic.index('\n\t@ExecSpace',start);method=logic[start:end]
method=method.replace('pool={portrait=portrait,actors={},byRUID={},warmFrames=0,ready=false}','pool={portrait=portrait,actors={},byRUID={},warmFrames=0,warmStart=0,creating=true,ready=false}')
method=method.replace('local e=_SpawnService:SpawnByEntity(portrait,"PetWear_"..slot','local template=_PetUI.PetGearSlots:GetChildByName("Cap"):GetChildByName("Icon")\n\t\t\t\t\t\tlocal e=_SpawnService:SpawnByEntity(template,"PetWear_"..slot')
method=method.replace('if pool==nil then return end','if pool~=nil and pool.creating then pool.creating=false;pool.warmStart=_UtilLogic.ElapsedSeconds end\n\t\tif pool==nil then return end')
# A second OnUpdate must never publish a half-created actor pool.
needle='\t\tif pool==nil and mask>0 then'
method=method.replace(needle,'\t\tif pool~=nil and pool.creating then return end\n'+needle)
method=method.replace('or 0.000001','or 1/255')
method=method.replace('e.SpriteGUIRendererComponent.Color=Color(1,1,1,a);e.Enable=true','''-- Warm the actual full-size renderer behind the opaque popup background.
			e.SpriteGUIRendererComponent.OverrideSorting=not pool.ready
			e.SpriteGUIRendererComponent.SortingLayer="UI"
			e.SpriteGUIRendererComponent.OrderInLayer=pool.ready and 0 or -10000
			e.SpriteGUIRendererComponent.Color=Color(1,1,1,a);e.Enable=true''')
method=method.replace('if pool.warmFrames>=4 then pool.ready=true end','if pool.warmFrames>=8 and _UtilLogic.ElapsedSeconds-pool.warmStart>=0.16 then pool.ready=true end')
logic=logic[:start]+method+logic[end:]
rows=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text())['frames'];tops={row['ruid']:Image.open(row['file']).getbbox()[1]for row in rows};propertyLine='\tproperty table CustomPetVisibleTop = '+json.dumps(tops).replace(':','=')
# JSON object keys need Lua bracket notation.
propertyLine='\tproperty table CustomPetVisibleTop = {'+','.join('["'+k+'"]='+str(v)for k,v in tops.items())+'}'
insert=logic.index('\n\tproperty boolean PetGearReady');logic=logic[:insert]+'\n'+propertyLine+'\n'+logic[insert:]
old='\t\tif entry.id=="ttungttang" then return 42 end'
new='''		if entry.frames~=nil then
			local portrait=self.PetDisplay:GetChildByName("Portrait")
			local scale=_PetLogic:GetCustomPixelScale(portrait,entry.pixelScale)
			local meter=self.PetDisplay:GetChildByName("CareMeters").UITransformComponent
			local ceiling=meter.anchoredPosition.y-meter.RectSize.y*meter.Pivot.y-6
			local highest=entry.canvas
			for _,pose in ipairs({"move","what","sniff","love"}) do for _,base in ipairs(entry.frames[pose] or {}) do highest=math.min(highest,_PetLogic.CustomPetVisibleTop[base] or 0) end end
			local top=self:GetPortraitY()+(entry.canvas*0.5-highest)*scale
			return math.max(0,math.min(42,ceiling-top))
		end'''
assert old in house;house=house.replace(old,new)
(stage/'PetLogic.mlua').write_text(logic,encoding='utf-8',newline='\r\n');(stage/'PetHouseUI.mlua').write_text(house,encoding='utf-8',newline='\r\n')
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');ns={};exec('import re\n'+ast.unparse(fn),ns);sys.path.insert(0,'work/ranged-lua-runtime');from lupa import LuaRuntime
rt=LuaRuntime();rt.execute('function Vector2(x,y)return{x=x,y=y}end;function Vector3(x,y,z)return{x=x,y=y,z=z}end;function Color(r,g,b,a)return{r=r,g=g,b=b,a=a}end')
for text in [logic,house]:rt.execute(ns['translate'](text))
p=(stage/'apply.py').read_text().replace("names=['PetLogic.mlua']","names=['PetLogic.mlua','PetHouseUI.mlua']");(stage/'apply.py').write_text(p,encoding='utf-8')
print('Full-size visible-quantum gear warmup behind popup; no half-built pool; custom walk jump respects the needs panel. Lua syntax passed.')
