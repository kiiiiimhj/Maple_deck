from pathlib import Path
import json,re,sys,ast,hashlib
stage=Path('work/pet-equipment-native-v11');out=Path('outputs/pet-equipment-native-v11');source=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig');ui=(stage/'PetUI.mlua.before').read_text(encoding='utf-8-sig');house=(stage/'PetHouseUI.mlua.before').read_text(encoding='utf-8-sig');up=json.loads((out/'applied-assets.json').read_text())
def lua(v):
 if isinstance(v,dict):return '{'+','.join('['+(str(k)if isinstance(k,int)else json.dumps(str(k),ensure_ascii=False))+']='+lua(x)for k,x in v.items())+'}'
 if isinstance(v,str):return json.dumps(v,ensure_ascii=False)
 if isinstance(v,bool):return 'true'if v else'false'
 return repr(v)
def prop(name,value):
 global source
 text='\tproperty table '+name+' = '+lua(value)
 if re.search(r'(?m)^\tproperty table '+name+r' = ',source):source=re.sub(r'(?m)^\tproperty table '+name+r' = .*$',lambda m:text,source)
 else:source=source.replace('\tproperty boolean NativePetGearReady',text+'\n\tproperty boolean NativePetGearReady')
def method(text,name,body):
 m=re.search(r'(?m)^\tmethod ([^\n]*\b'+name+r'\([^\n]*\))\n.*?^\tend',text,re.S);assert m,name;return text[:m.start()]+'\tmethod '+m.group(1)+'\n'+body.strip('\n')+'\n\tend'+text[m.end():]
def uid(key):return up[key]['ruid']
raw=json.loads((out/'parts.json').read_text());original={};variant={}
for pet,frames in raw.items():
 original[pet]={};variant[pet]={}
 for base,designs in frames.items():
  for code,dest in [('1',original),('2',variant)]:dest[pet][base]={s:{k:v for k,v in d.items()if k!='asset'}|{'ruid':uid(d['asset'])}for s,d in designs[code].items()}
prop('NativePetGearOverlays',original);prop('NativePetGearVariantOverlays',variant)
sheets={pet:{int(c):uid(key)for c,key in rows.items()}for pet,rows in json.loads((out/'atlas-input.json').read_text()).items()};world={pet:{base:{int(c):uid(key)for c,key in rows.items()}for base,rows in frames.items()}for pet,frames in json.loads((out/'world-input.json').read_text()).items()};layouts=json.loads((out/'motion-layouts.json').read_text());indices=json.loads((out/'frame-index.json').read_text());prop('NativePetMotionSheets',sheets);prop('NativePetMotionLayouts',layouts);prop('NativePetFrameIndices',indices);prop('NativePetWorldFrames',world)
defs=json.loads((out/'before-definitions.json').read_text());icons=json.loads((out/'icon-input.json').read_text());alts={}
names={'5002617':['라일락 잎핀','라일락 스트라이프 옷','민트 하트 목걸이'],'5000498':['블루 리본','체크 스카프','별 목걸이'],'landturtle':['분홍 꽃핀','물결 등껍질','분홍 하트 목걸이'],'oduck':['보라 별리본','코랄 스트라이프 옷','방울 목걸이']}
for pet,rows in defs.items():
 alts[pet]={}
 for i,(slot,bit,stat)in enumerate([('Cap',1,'PET_GEAR_CRIT_DAMAGE'),('Coat',2,'PET_GEAR_ATTACK'),('Necklace',4,'PET_GEAR_CRIT_CHANCE')]):
  rows[slot]['icon']=uid(icons[pet][slot]['1']);alts[pet][slot]={'id':pet+'-pattern2-'+slot.lower(),'variant':2,'bit':bit,'slot':slot,'name':names[pet][i],'slotName':names[pet][i],'key':rows[slot]['key'],'statKey':stat,'icon':uid(icons[pet][slot]['2'])}
alts['5002617']['Coat']['slotName']='라일락 줄무늬'
alts['oduck']['Coat']['slotName']='코랄 줄무늬'
prop('NativePetGearDefinitions',defs);prop('NativePetGearVariantDefinitions',alts)
source=source.replace('if petId~="ttungttang" then return {base} end','if petId~="ttungttang" then local alt=(self.NativePetGearVariantDefinitions[petId] or {})[slot];return alt~=nil and {base,alt} or {base} end')
source=source.replace('if id~="ttungttang" and (pets[id].GearVariantOwnedMask~=0 or pets[id].GearDesigns~=0) then return nil end','-- Every pet now has independently owned cosmetic designs; validate each digit against its catalogue below.')
source=source.replace('or data.version==9 then','or data.version==9 or data.version==10 then').replace('if data.version<9 then migrated=true end','if data.version<10 then migrated=true end').replace('return {version=9,pets=pets','return {version=10,pets=pets')
source=source.replace('if petId=="ttungttang" then local mask=0;for slot,bit','do local mask=0;for slot,bit')
helpers='''
	method integer GetNativePetEquipmentCode(integer mask, integer designs)
		local code=0
		for _,row in ipairs({{bit=1,weight=1,radix=1},{bit=2,weight=100,radix=3},{bit=4,weight=10000,radix=9}}) do
			if self:HasPetGearBit(mask,row.bit) then code=code+row.radix*(1+math.min(1,math.floor((designs or 0)/row.weight)%100)) end
		end
		return code
	end
'''
pos=source.index('\n\t@ExecSpace("ClientOnly")\n\tmethod void RenderNativePetGearUI');source=source[:pos]+helpers+source[pos:]
source=method(source,'PreloadNativePetGearArtwork','''		self.NativePetGearReady=false local assets={} local seen={}
		for _,catalogue in ipairs({self.NativePetGearDefinitions,self.NativePetGearVariantDefinitions}) do for _,defs in pairs(catalogue) do for _,def in pairs(defs) do if not seen[def.icon] then seen[def.icon]=true;table.insert(assets,def.icon) end end end end
		for _,poses in pairs(self.NativePetWorldFrames) do for base,choices in pairs(poses) do if not seen[base] then seen[base]=true;table.insert(assets,base) end;for _,ruid in pairs(choices) do if not seen[ruid] then seen[ruid]=true;table.insert(assets,ruid) end end end end
		for _,clip in ipairs({self.FoxMotions.stand,self.OduckMotions.dance}) do if not seen[clip] then seen[clip]=true;table.insert(assets,clip) end end
		_ResourceService:PreloadAsync(assets,function(results)
			if not isvalid(self) then return end
			local ready=true for _,status in pairs(results) do if status~=PreloadResultStatus.Success then ready=false end end
			if ready then for _,ruid in ipairs(assets) do local m=_CardManager:GetSpriteMetrics(ruid);if m.w<=0 or m.h<=0 then ready=false end end end
			self.NativePetGearReady=ready log("[VRF] PET-GEAR-ALL atomic artwork ready="..tostring(ready).." textures="..#assets)
		end)
''')
source=source.replace('visual.nativeClip=fx.SpriteRendererComponent.SpriteRUID;visual.nativeFrameStart=0;fx.SpriteRendererComponent.Enable=false','visual.nativeClip=fx.SpriteRendererComponent.SpriteRUID;visual.nativeFrameStart=0;fx.SpriteRendererComponent.Enable=false;self:UpdateNativePetSkillGear(visual)')
source=method(source,'RenderNativePetGearUI','''		if not isvalid(portrait) or not self.NativePetGearReady then return end
		local sheets=self.NativePetMotionSheets[entry.id] local layout=self.NativePetMotionLayouts[entry.id]
		if sheets==nil or layout==nil then self:HideNativePetGearUI(portrait);return end
		self._T.nativePetGearUI=self._T.nativePetGearUI or {} local pool=self._T.nativePetGearUI[portrait.Id]
		if pool==nil then
			local template=_PetUI.PetGearSlots:GetChildByName("Cap"):GetChildByName("Icon")
			local viewport=_SpawnService:SpawnByEntity(template,"NativePetViewport",Vector3.zero,portrait,false);viewport.SpriteGUIRendererComponent.Enable=false
			local t=viewport.UITransformComponent;t.AnchorsMin=Vector2(.5,.5);t.AnchorsMax=Vector2(.5,.5);t.Pivot=Vector2(.5,.5);t.UIScale=Vector3(1,1,1);t.UIRotation=Vector3.zero
			local mask=viewport:AddComponent(MaskComponent);mask.Shape=MaskShape.Rect;mask.Softness=Vector2Int(0,0)
			local frame=_SpawnService:SpawnByEntity(template,"NativePetCompleteFrame",Vector3.zero,viewport,false);frame.Enable=false
			local ft=frame.UITransformComponent;ft.AnchorsMin=Vector2(.5,.5);ft.AnchorsMax=Vector2(.5,.5);ft.Pivot=Vector2(.5,.5);ft.UIScale=Vector3(1,1,1);ft.UIRotation=Vector3.zero
			local r=frame.SpriteGUIRendererComponent;r.Type=ImageType.Simple;r.PreserveSprite=PreserveSpriteType.None;r.LocalScale=Vector2(1,1);r.LocalPosition=Vector2.zero;r.PlayRate=0;r.RaycastTarget=false;r.Outline=false;r.DropShadow=false
			pool={portrait=portrait,viewport=viewport,frame=frame,actors={frame},atomic=true,ready=false,clip="",age=0,lastTick=_UtilLogic.ElapsedSeconds};self._T.nativePetGearUI[portrait.Id]=pool
		end
		local image=portrait.SpriteGUIRendererComponent local now=_UtilLogic.ElapsedSeconds local clip=tostring(image.ImageRUID.DataId)
		if pool.petId~=entry.id then pool.petId=entry.id;pool.clip="";pool.ready=false;pool.frame.Enable=false end
		if pool.clip~=clip then pool.clip=clip;pool.age=0;pool.lastTick=now end
		pool.age=pool.age+math.max(0,now-pool.lastTick)*math.max(0,image.PlayRate);pool.lastTick=now
		local base=self:GetNativePetFrame(clip,pool.age) local index=self.NativePetFrameIndices[entry.id][base]
		if index==nil then return end
		local mask=entry.progress~=nil and entry.progress.Owned and (entry.progress.GearEquippedMask or 0) or 0
		local code=self:GetNativePetEquipmentCode(mask,entry.progress~=nil and (entry.progress.GearDesigns or 0) or 0) local ruid=sheets[code]
		self._T.nativeSheetReady=self._T.nativeSheetReady or {};self._T.nativeSheetLoading=self._T.nativeSheetLoading or {}
		image.Enable=false
		if not self._T.nativeSheetReady[ruid] then
			if not self._T.nativeSheetLoading[ruid] then
				self._T.nativeSheetLoading[ruid]=true
				_ResourceService:PreloadAsync({ruid},function(results)
					if not isvalid(self) then return end
					local ready=true for _,v in pairs(results) do if v~=PreloadResultStatus.Success then ready=false end end
					local m=ready and _CardManager:GetSpriteMetrics(ruid) or nil
					self._T.nativeSheetReady[ruid]=ready and m~=nil and m.w>0 and m.h>0;self._T.nativeSheetLoading[ruid]=nil
				end)
			end
			return
		end
		local m=self.NativePetGearSpriteMetrics[base] local native=image.PreserveSprite==PreserveSpriteType.NativeSize
		local sx=native and self:GetCustomPixelScale(portrait,image.LocalScale.x/2)*2 or portrait.UITransformComponent.RectSize.x/m.w
		local sy=native and self:GetCustomPixelScale(portrait,image.LocalScale.y/2)*2 or portrait.UITransformComponent.RectSize.y/m.h
		local origin=image.LocalPosition local screen=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(origin,portrait.UITransformComponent))
		origin=_UILogic:ScreenToLocalUIPosition(Vector2(math.floor(screen.x+.5),math.floor(screen.y+.5)),portrait.UITransformComponent)
		local cx=(layout.left+layout.tileW*.5)*sx*.5 local cy=-(layout.top+layout.tileH*.5)*sy*.5
		local t=pool.viewport.UITransformComponent;t.RectSize=Vector2(layout.tileW*sx*.5,layout.tileH*sy*.5);t.anchoredPosition=Vector2(origin.x+(image.FlipX and -cx or cx),origin.y+(image.FlipY and -cy or cy))
		local col=index%layout.columns local row=math.floor(index/layout.columns)
		if image.FlipX then col=layout.columns-1-col end
		if image.FlipY then row=layout.rows-1-row end
		local ft=pool.frame.UITransformComponent;ft.RectSize=Vector2(t.RectSize.x*layout.columns,t.RectSize.y*layout.rows);ft.anchoredPosition=Vector2(((layout.columns-1)*.5-col)*t.RectSize.x,(row-(layout.rows-1)*.5)*t.RectSize.y)
		local r=pool.frame.SpriteGUIRendererComponent;if tostring(r.ImageRUID.DataId)~=ruid then r.ImageRUID=DataRef(ruid) end
		r.FlipX=image.FlipX;r.FlipY=image.FlipY;r.Color=image.Color;pool.viewport.Enable=true;pool.frame.Enable=true
		pool.base=base;pool.mask=mask;pool.code=code;pool.ruid=ruid;pool.pixelScale=sx;pool.origin=origin;pool.entry=entry;pool.ready=true
''')
source=method(source,'ClearNativePetGearUI','''		for _,pool in pairs(self._T.nativePetGearUI or {}) do
			if isvalid(pool.portrait) then pool.portrait.SpriteGUIRendererComponent.Enable=true end
			if isvalid(pool.viewport) then pool.viewport:Destroy() end
		end
		self._T.nativePetGearUI={}
''')
source=method(source,'WarmNativePetGearWorldPool','''		if not self.NativePetGearReady then return end
		local player=_UserService.LocalPlayer local map=isvalid(player) and player.CurrentMap or nil;if not isvalid(map) then return end
		local pool=self._T.nativePetGearWorld
		if pool~=nil and pool.map~=map then self:ClearNativePetGearWorldPool();pool=nil end
		if pool==nil then
			local first=nil for _,poses in pairs(self.NativePetWorldFrames) do for _,choices in pairs(poses) do for _,id in pairs(choices) do first=id break end;if first~=nil then break end end;if first~=nil then break end end
			local actor=self:SpawnPetSkillSprite(first,map,135);pool={map=map,actors={atomic=actor},frame=actor,ready=false,frames=0,elapsed=0};self._T.nativePetGearWorld=pool
		end
		if not pool.ready then
			local p=_UILogic:ScreenToWorldPosition(Vector2(_UILogic.ScreenWidth*.5,20));local u=_UILogic:ScreenToWorldPosition(Vector2(_UILogic.ScreenWidth*.5+1,20))
			if self:PlacePetCharmSprite(pool.frame,Vector3(p.x,p.y,0),4*math.abs(u.x-p.x),0,1/255) then pool.frames=pool.frames+1;pool.elapsed=pool.elapsed+math.min(.05,math.max(0,delta)) end
			if pool.frames>=8 and pool.elapsed>=.12 then pool.frame.SpriteRendererComponent.Color=Color(1,1,1,0);pool.ready=true end
		end
		local pending=self._T.pendingNativePetGearVisual
		if pool.ready and pending~=nil then self._T.pendingNativePetGearVisual=nil;self:StartPetSkillVisual(pending.petId,pending.zone,pending.run,pending.route,pending.anchor,pending.serial,pending.gearMask,pending.gearDesigns or 0) end
''')
source=method(source,'UpdateNativePetSkillGear','''		local pool=self._T.nativePetGearWorld;if pool==nil or not pool.ready or pool.map~=v.map or not isvalid(v.body) then return end
		local r=v.body.SpriteRendererComponent local clip=r.SpriteRUID
		if v.nativeClip~=clip then v.nativeClip=clip;v.nativeFrameStart=v.age end
		local base=self:GetNativePetFrame(clip,v.age-(v.nativeFrameStart or 0));local choices=(self.NativePetWorldFrames[v.id] or {})[base];if choices==nil then return end
		local code=self:GetNativePetEquipmentCode(v.gearMask or 0,v.gearDesigns or 0) local uid=choices[code];local l=self.NativePetMotionLayouts[v.id];local m=self.NativePetGearSpriteMetrics[base]
		local e=pool.frame local er=e.SpriteRendererComponent;if er.SpriteRUID~=uid then er.SpriteRUID=uid end
		local tr=v.body.TransformComponent;local pos=tr.WorldPosition local scale=tr.Scale local angle=tr.ZRotation;local theta=angle*math.pi/180
		local x=(l.left+l.tileW*.5)*.5/m.ppu*scale.x*(r.FlipX and -1 or 1);local y=-(l.top+l.tileH*.5)*.5/m.ppu*scale.y*(r.FlipY and -1 or 1)
		e.TransformComponent.Scale=Vector3(scale.x*.5,scale.y*.5,scale.z);e.TransformComponent.ZRotation=angle;e.TransformComponent.WorldPosition=Vector3(pos.x+x*math.cos(theta)-y*math.sin(theta),pos.y+x*math.sin(theta)+y*math.cos(theta),pos.z)
		er.Color=r.Color;er.FlipX=r.FlipX;er.FlipY=r.FlipY;er.OrderInLayer=r.OrderInLayer+3;e.Enable=true;r.Enable=false
		v.nativeGearBase=base;v.nativeGearCode=code;pool.selected={atomic=true}
''')
# The global inventory remains readable when all five pets have two designs.
ui=ui.replace('\tproperty integer PetInvTooltipTimer','\tproperty integer PetInvPage = 1\n\tproperty integer PetInvTooltipTimer')
ui=ui.replace('self.PetInvTab=tabName self:HidePetInvTooltip()','self.PetInvTab=tabName self.PetInvPage=1 self:HidePetInvTooltip()').replace('self.ViewedPetIndex=nextIndex self.IdleRUID','self.ViewedPetIndex=nextIndex self.PetInvPage=1 self.IdleRUID')
ui=ui.replace('local items=self:BuildPetInvItems() self._T.petInvItems=items','local items=self:BuildPetInvItems() self._T.petInvItems=items\n\t\tlocal pages=math.max(1,math.ceil(#items/24));self.PetInvPage=math.max(1,math.min(pages,self.PetInvPage));local offset=(self.PetInvPage-1)*24\n\t\tself:RefreshPetInventoryPages(pages)')
ui=ui.replace('local item=items[i+1]','local item=items[offset+i+1]').replace('if #items>24 then log_warning("PetUI: pet gear list "..#items.." > 24 cells") end','')
ui=ui.replace('local item=(self._T.petInvItems or {})[index+1]','local item=(self._T.petInvItems or {})[(self.PetInvPage-1)*24+index+1]')
pager='''
	@ExecSpace("ClientOnly")
	method void RefreshPetInventoryPages(integer pages)
		local q=self._T.petInvPager
		if q==nil then
			q={};self._T.petInvPager=q
			for _,spec in ipairs({{"Prev","PrevPet",-1},{"Next","NextPet",1}}) do
				local e=_SpawnService:SpawnByEntity(self.PetDisplay:GetChildByName(spec[2]),"PetGearPage"..spec[1],Vector3.zero,self.PetInventoryPanel,false)
				local dir=spec[3];self:BindClick(e,function()self.PetInvPage=self.PetInvPage+dir;self:HidePetInvTooltip();self:RefreshPetInventory()end);q[spec[1]]=e
			end
			q.Label=_SpawnService:SpawnByEntity(self.PetGearSlots:GetChildByName("Cap"):GetChildByName("Label"),"PetGearPageCount",Vector3.zero,self.PetInventoryPanel,false)
		end
		local size=self.PetInventoryPanel.UITransformComponent.RectSize local x=size.x*.5-100 local y=-size.y*.5-24
		for _,spec in ipairs({{"Prev",-52,self.PetInvPage>1},{"Next",52,self.PetInvPage<pages}}) do
			local e=q[spec[1]] local t=e.UITransformComponent;t.AnchorsMin=Vector2(.5,.5);t.AnchorsMax=Vector2(.5,.5);t.Pivot=Vector2(.5,.5);t.anchoredPosition=Vector2(x+spec[2],y);t.RectSize=Vector2(34,34);t.UIScale=Vector3(1,1,1);e.Enable=pages>1;e.ButtonComponent.Enable=spec[3];e.SpriteGUIRendererComponent.ImageRUID=DataRef(spec[3] and self.ArrowOnRUID or self.ArrowOffRUID)
		end
		local t=q.Label.UITransformComponent;t.AnchorsMin=Vector2(.5,.5);t.AnchorsMax=Vector2(.5,.5);t.Pivot=Vector2(.5,.5);t.anchoredPosition=Vector2(x,y);t.RectSize=Vector2(60,30);t.UIScale=Vector3(1,1,1);q.Label.TextGUIRendererComponent.Text=tostring(self.PetInvPage).." / "..tostring(pages);q.Label.Enable=pages>1
	end
'''
ui=ui.replace('\n\t@ExecSpace("ClientOnly")\n\tmethod void OnPetInvCellClicked',pager+'\n\t@ExecSpace("ClientOnly")\n\tmethod void OnPetInvCellClicked')
ui=ui.replace('-- Release all click bindings before Maker rebuilds the global logic.','-- Release all click bindings before Maker rebuilds the global logic.\n\t\tfor _,e in pairs(self._T.petInvPager or {})do if isvalid(e)then e:Destroy()end end;self._T.petInvPager=nil')
house=house.replace('local scale=native and entry.pixelScale or self.PortraitPixelScale','local scale=native and (_PetLogic:GetCustomPixelScale(self.PetDisplay:GetChildByName("Portrait"),entry.pixelScale/2)*2) or self.PortraitPixelScale')
for name,text in [('PetLogic.mlua',source),('PetUI.mlua',ui),('PetHouseUI.mlua',house)]:
 (stage/name).write_text(text,encoding='utf-8',newline='\r\n')
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');t={};exec('import re\n'+ast.unparse(fn),t);sys.path.insert(0,'work/ranged-lua-runtime');from lupa import LuaRuntime
rt=LuaRuntime();rt.execute('function Vector2(x,y)return{x=x,y=y}end;function Vector3(x,y,z)return{x=x,y=y,z=z}end;function Color(r,g,b,a)return{r=r,g=g,b=b,a=a}end')
for text in [source,ui,house]:rt.execute(t['translate'](text))
(out/'applied-maps.json').write_text(json.dumps({'original':original,'variants':variant,'sheets':sheets,'world':world,'layouts':layouts,'indices':indices,'definitions':defs,'alternateDefinitions':alts},indent=2))
apply=Path('work/pet-variation-repair-v2/apply.py').read_text().replace('pet-variation-repair-v2','pet-equipment-native-v11').replace("names=['PetLogic.mlua','PetHouseUI.mlua']","names=['PetLogic.mlua','PetHouseUI.mlua','PetUI.mlua']")
(stage/'apply.py').write_text(apply,encoding='utf-8');print('Staged all four native pets: atomic fixed-texture UI animation, atomic skill frames, 12 new separately removable items, schema 10 and 30-item inventory paging. Syntax passed.')
