from pathlib import Path
import json,ast,sys
stage=Path('work/pet-variation-repair-v2');out=Path('outputs/pet-variation-repair-v2');p=stage/'PetLogic.mlua';source=p.read_text();inputs=json.loads((out/'atomic-atlas-input.json').read_text());up=json.loads((out/'atomic-atlas-assets.json').read_text());mapping={base:up[key]['ruid']for base,key in inputs.items()}
prop='\tproperty table PetDressedFrameAtlases = {'+','.join('["'+base+'"]="'+uid+'"'for base,uid in mapping.items())+'}\n'
needle='\tproperty boolean PetGearReady';assert 'property table PetDressedFrameAtlases'not in source;source=source.replace(needle,prop+needle)
needle='\t\tfor _,slot in ipairs({"Cap","Coat","Necklace"}) do for _,def in ipairs(self:GetPetGearVariants("ttungttang",slot)) do table.insert(list,def.icon) end end'
assert needle in source;source=source.replace(needle,'\t\tfor _,ruid in pairs(self.PetDressedFrameAtlases) do table.insert(list,ruid) end\n'+needle)
start=source.index('\tmethod void RenderPetGearUI(');end=source.index('\n\t@ExecSpace',start)
method='''	method void RenderPetGearUI(Entity portrait, table entry, string baseRUID)
		if not isvalid(portrait) then return end
		self._T.petGearUI=self._T.petGearUI or {} local pool=self._T.petGearUI[portrait.Id]
		if entry.id~="ttungttang" then
			if pool~=nil then for _,e in ipairs(pool.actors) do if isvalid(e) then e.Enable=false end end end
			if portrait.MaskComponent~=nil then portrait.MaskComponent.Enable=false end
			self:RenderNativePetGearUI(portrait,entry);return
		end
		self:HideNativePetGearUI(portrait)
		if not self.PetGearReady then portrait.SpriteGUIRendererComponent.Enable=false;return end
		local atlas=self.PetDressedFrameAtlases[baseRUID]
		if atlas==nil then return end
		if pool==nil then
			local template=_PetUI.PetGearSlots:GetChildByName("Cap"):GetChildByName("Icon")
			local e=_SpawnService:SpawnByEntity(template,"PetDressedFrame",Vector3.zero,portrait,false)
			e.Enable=false
			local t=e.UITransformComponent;t.AnchorsMin=Vector2(.5,.5);t.AnchorsMax=Vector2(.5,.5);t.Pivot=Vector2(.5,.5);t.UIScale=Vector3(1,1,1);t.UIRotation=Vector3.zero
			local r=e.SpriteGUIRendererComponent;r.Type=ImageType.Simple;r.PreserveSprite=PreserveSpriteType.None;r.LocalScale=Vector2(1,1);r.LocalPosition=Vector2.zero;r.RaycastTarget=false;r.Outline=false;r.DropShadow=false;r.PlayRate=0
			pool={portrait=portrait,actors={e},byRUID={},frame=e,atomic=true,ready=true};self._T.petGearUI[portrait.Id]=pool
		end
		-- One selected tile contains the body and all three independently chosen
		-- equipment parts. A frame swap cannot expose a different hat/neck pose.
		local mask=entry.progress~=nil and entry.progress.Owned and (entry.progress.GearEquippedMask or 0) or 0
		local designs=entry.progress~=nil and (entry.progress.GearDesigns or 0) or 0
		local code=0
		for _,slot in ipairs({{bit=1,weight=1,radix=1},{bit=2,weight=100,radix=3},{bit=4,weight=10000,radix=9}}) do
			if self:HasPetGearBit(mask,slot.bit) then code=code+slot.radix*(1+math.min(1,math.floor(designs/slot.weight)%100)) end
		end
		local image=portrait.SpriteGUIRendererComponent local frame=pool.frame local r=frame.SpriteGUIRendererComponent
		local col=code%5 local row=math.floor(code/5)
		if image.FlipX then col=4-col end
		if image.FlipY then row=5-row end
		local size=portrait.UITransformComponent.RectSize
		frame.UITransformComponent.RectSize=Vector2(size.x*5,size.y*6)
		frame.UITransformComponent.anchoredPosition=Vector2((2-col)*size.x,(row-2.5)*size.y)
		if tostring(r.ImageRUID.DataId)~=atlas then r.ImageRUID=DataRef(atlas) end
		r.FlipX=image.FlipX;r.FlipY=image.FlipY;r.Color=image.Color
		local clip=portrait.MaskComponent
		if clip==nil then clip=portrait:AddComponent(MaskComponent) end
		clip.Shape=MaskShape.Rect;clip.Softness=Vector2Int(0,0);clip.Enable=true
		image.Enable=false;frame.Enable=true
		pool.base=baseRUID;pool.code=code;pool.ruid=atlas;pool.mask=mask;pool.ready=true
	end
'''
source=source[:start]+method+source[end:];p.write_text(source,encoding='utf-8',newline='\r\n')
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');ns={};exec('import re\n'+ast.unparse(fn),ns);sys.path.insert(0,'work/ranged-lua-runtime');from lupa import LuaRuntime
rt=LuaRuntime();rt.execute('function Vector2(x,y)return{x=x,y=y}end;function Vector3(x,y,z)return{x=x,y=y,z=z}end;function Color(r,g,b,a)return{r=r,g=g,b=b,a=a}end');rt.execute(ns['translate'](source))
(out/'atomic-atlas-map.json').write_text(json.dumps(mapping,indent=2));print('Staged atomic UI frame tiles with native rect clipping; 27 independent slot combinations preserved. Lua syntax passed.')
