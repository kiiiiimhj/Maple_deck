from pathlib import Path
import json,re,sys,ast
sys.path.insert(0,'work/ranged-lua-runtime')
from lupa import LuaRuntime
stage=Path('work/pet-variation-v1');out=Path('outputs/pet-variation-v1');rt=LuaRuntime()
source=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig')
uploads=json.loads((out/'applied-assets.json').read_text());new=json.loads((out/'variant-map.json').read_text())
def lua(v):
 if isinstance(v,dict):return '{'+','.join('['+json.dumps(str(k))+']='+lua(x)for k,x in v.items())+'}'
 if isinstance(v,str):return json.dumps(v,ensure_ascii=False)
 if isinstance(v,bool):return 'true'if v else'false'
 return str(v)
def once(s,a,b):
 assert s.count(a)==1,(a,s.count(a));return s.replace(a,b)
def method(s,name,body):
 pattern=r'(?m)^\tmethod ([^\n]*\b'+name+r'\([^\n]*\))\n.*?^\tend'
 m=re.search(pattern,s,re.S);assert m,name
 return s[:m.start()]+'\tmethod '+m.group(1)+'\n'+body.strip('\n')+'\n\tend'+s[m.end():]
# The existing frame-pool enumeration also prebinds every variation. Base keys
# remain untouched; the selected slot resolves either base or :stripe artwork.
pos=source.index('\n\tproperty boolean PetGearReady')
variant={base+':stripe':{slot:uploads[k]['ruid']for slot,k in layers.items()}for base,layers in new.items()}
extra='\n\tproperty table PetGearVariantOverlays = '+lua(variant)+'\n'
source=source[:pos]+extra+source[pos:]
source=once(source,'\t@Sync property integer RunPetGearMask = 0','\t@Sync property integer RunPetGearMask = 0\n\t@Sync property integer RunPetGearVariantMask = 0')
source=once(source,'or data.version==7 then','or data.version==7 or data.version==8 then')
source=once(source,'local optional=key=="Stat3"','local optional=(data.version<8 and (key=="GearVariantOwnedMask" or key=="GearVariantMask")) or key=="Stat3"')
source=once(source,'\t\t\t\t\tif data.version<7 and id~="ttungttang"','\t\t\t\t\tif id~="ttungttang" and (pets[id].GearVariantOwnedMask~=0 or pets[id].GearVariantMask~=0) then return nil end\n\t\t\t\t\tif data.version<7 and id~="ttungttang"')
source=once(source,'if data.version<7 then migrated=true end','if data.version<8 then migrated=true end')
source=once(source,'return {version=7,pets=pets','return {version=8,pets=pets')
source=source.replace('self.RunPetGearMask=0','self.RunPetGearMask=0 self.RunPetGearVariantMask=0')
source=once(source,'self.RunPetGearMask=pet.GearEquippedMask or 0','self.RunPetGearMask=pet.GearEquippedMask or 0 self.RunPetGearVariantMask=pet.GearVariantMask or 0')
source=once(source,'self.RunPetGearMask=record~=nil and (record.pets[self.RunPetId].GearEquippedMask or 0) or 0','self.RunPetGearMask=record~=nil and (record.pets[self.RunPetId].GearEquippedMask or 0) or 0\n\t\tself.RunPetGearVariantMask=record~=nil and (record.pets[self.RunPetId].GearVariantMask or 0) or 0')
source=once(source,'self.PetSkillCastSerial,self.RunPetGearMask,self.RunUserId)','self.PetSkillCastSerial,self.RunPetGearMask,self.RunPetGearVariantMask,self.RunUserId)')
source=source.replace('pending.serial,pending.gearMask)','pending.serial,pending.gearMask,pending.gearVariantMask or 0)')
source=source.replace('serial=serial,gearMask=gearMask}','serial=serial,gearMask=gearMask,gearVariantMask=gearVariantMask}')
source=once(source,'integer serial, integer gearMask)','integer serial, integer gearMask, integer gearVariantMask)')
source=once(source,'local visual=self._T.petSkillVisual;visual.gearMask=math.max(0,math.min(7,gearMask))','local visual=self._T.petSkillVisual;visual.gearMask=math.max(0,math.min(7,gearMask));visual.gearVariantMask=math.max(0,math.min(7,gearVariantMask or 0))')
# Include both patterns in the world skill's existing warm pool before use.
source=once(source,'local layers=self.PetGearOverlays[base]\n\t\t\t\tfor order','for _,layers in ipairs({self.PetGearOverlays[base],self.PetGearVariantOverlays[base..":stripe"]}) do\n\t\t\t\tfor order')
source=once(source,'\t\t\t-- Spawning can yield.','\t\t\tend\n\t\t\t-- Spawning can yield.')
source=once(source,'for _,base in ipairs(self.PetCharmJumpRUIDs) do for _,ruid in pairs(self.PetGearOverlays[base] or {}) do if not expectedGear[ruid] then expectedGear[ruid]=true;gearCount=gearCount+1 end end end','for _,base in ipairs(self.PetCharmJumpRUIDs) do for _,layers in ipairs({self.PetGearOverlays[base],self.PetGearVariantOverlays[base..":stripe"]}) do for _,ruid in pairs(layers) do if not expectedGear[ruid] then expectedGear[ruid]=true;gearCount=gearCount+1 end end end end')
helpers='''
	method table GetPetGearArtwork()
		local all={} for base,layers in pairs(self.PetGearOverlays) do all[base]=layers end
		for base,layers in pairs(self.PetGearVariantOverlays) do all[base]=layers end
		return all
	end

	method table GetPetGearLayers(string base, integer variantMask)
		local original=self.PetGearOverlays[base] if original==nil then return nil end
		local stripe=self.PetGearVariantOverlays[base..":stripe"] or original local selected={}
		for slot,bit in pairs({hat=1,coat=2,neck=4}) do selected[slot]=self:HasPetGearBit(variantMask or 0,bit) and stripe[slot] or original[slot] end
		return selected
	end

	method table GetPetGearVariants(string petId, string slot)
		local base=self:GetPetGearDefinitionForPet(petId,slot) if base==nil then return {} end
		if petId~="ttungttang" then return {base} end
		local alt={
'''+''.join('\t\t\t'+slot+'={id="ttung-stripe-'+slot.lower()+'",variant=2,bit='+str(bit)+',slot="'+slot+'",name="'+name+'",key="'+key+'",statKey="'+stat+'",icon="'+uploads['ttung-icon-'+part+'-v1']['ruid']+'"},\n'for slot,bit,name,key,stat,part in [('Cap',1,'뚱땅 로즈 스트라이프 모자','PET_GEAR_TTUNG_HAT','PET_GEAR_CRIT_DAMAGE','hat'),('Coat',2,'뚱땅 로즈 스트라이프 옷','PET_GEAR_TTUNG_COAT','PET_GEAR_ATTACK','coat'),('Necklace',4,'뚱땅 루비 목걸이','PET_GEAR_TTUNG_NECK','PET_GEAR_CRIT_CHANCE','neck')])+'''		}
		return {base,alt[slot]}
	end

	method table GetSelectedPetGearDefinition(string petId, string slot, any pet)
		local variants=self:GetPetGearVariants(petId,slot) local base=variants[1]
		if base~=nil and variants[2]~=nil and pet~=nil and self:HasPetGearBit(pet.GearVariantMask or 0,base.bit) then return variants[2] end
		return base
	end

	@ExecSpace("Server")
	method void RequestPetGearVariant(string slot, string petId, integer variant)
		local variants=self:GetPetGearVariants(petId,slot) local def=variants[variant] local record=self.States[senderUserId]
		if def==nil or record==nil then return end
		record.responsePetId=petId
		if _GameManager.GameStarted and not _GameManager.GameOver then self:PushState(senderUserId,"","PET_BATTLE_LOCKED") return end
		local pet=record.pets[petId] local now=_DateTimeLogic:GetTimeElapsedWithoutOffset()
		if pet==nil or now<(record.busyUntil or 0) or now-(record.lastGearRequest or -1000)<250 then return end
		local owned=variant==2 and (pet.GearVariantOwnedMask or 0) or pet.GearOwnedMask
		if not pet.Owned or not self:HasPetGearBit(owned,def.bit) then self:PushState(senderUserId,"","PET_GEAR_NOT_OWNED") return end
		record.lastGearRequest=now
		local same=self:HasPetGearBit(pet.GearEquippedMask,def.bit) and (self:HasPetGearBit(pet.GearVariantMask or 0,def.bit)==(variant==2))
		if same then pet.GearEquippedMask=pet.GearEquippedMask-def.bit
		else
			if not self:HasPetGearBit(pet.GearEquippedMask,def.bit) then pet.GearEquippedMask=pet.GearEquippedMask+def.bit end
			local previous=self:HasPetGearBit(pet.GearVariantMask or 0,def.bit)
			if previous~=(variant==2) then pet.GearVariantMask=(pet.GearVariantMask or 0)+(variant==2 and def.bit or -def.bit) end
		end
		-- Bonuses depend only on the three occupied slots, never the number of owned designs.
		self:MarkDirty(record) self:PushState(senderUserId,"",same and "PET_GEAR_REMOVED" or "PET_GEAR_WORN")
		if not record.test then _GameManager:PersistRewardNow(senderUserId) end
		log("[VRF] PET-GEAR-VARIANT slot="..slot.." design="..variant.." equippedMask="..pet.GearEquippedMask)
	end
'''
pos=source.index('\n\t-- The only grant entry point');source=source[:pos]+helpers+source[pos:]
for full,short in [('뚱땅 로즈 스트라이프 모자','로즈 모자'),('뚱땅 로즈 스트라이프 옷','로즈 코트'),('뚱땅 루비 목걸이','루비 목걸이')]:
 source=once(source,'name="'+full+'"','name="'+full+'",slotName="'+short+'"')
source=method(source,'RequestPetGear','''		local record=self.States[senderUserId] local pet=record~=nil and record.pets[petId] or nil
		local def=self:GetSelectedPetGearDefinition(petId,slot,pet) if def==nil then return end
		self:ApplyPetGearSelection(senderUserId,slot,petId,def.variant or 1)
''')
pattern=r'\t@ExecSpace\("Server"\)\n\tmethod void RequestPetGearVariant\(string slot, string petId, integer variant\)\n.*?\n\tend'
m=re.search(pattern,source,re.S);assert m
body=m.group(0).replace('@ExecSpace("Server")','@ExecSpace("ServerOnly")').replace('RequestPetGearVariant(string slot, string petId, integer variant)','ApplyPetGearSelection(string userId, string slot, string petId, integer variant)').replace('senderUserId','userId')
wrapper='\t@ExecSpace("Server")\n\tmethod void RequestPetGearVariant(string slot, string petId, integer variant)\n\t\tself:ApplyPetGearSelection(senderUserId,slot,petId,variant)\n\tend\n\n'
source=source[:m.start()]+wrapper+body+source[m.end():]
source=once(source,'preview.pets[petId].GearOwnedMask=7 preview.pets[petId].GearEquippedMask=7','preview.pets[petId].GearOwnedMask=7 preview.pets[petId].GearEquippedMask=7\n\t\tif petId=="ttungttang" then preview.pets[petId].GearVariantOwnedMask=7 end')
source=source.replace('pairs(self.PetGearOverlays) do for _,ruid','pairs(self:GetPetGearArtwork()) do for _,ruid')
source=source.replace('pairs(self.PetGearOverlays) do local ruid','pairs(self:GetPetGearArtwork()) do local ruid')
source=once(source,'for _,slot in ipairs({"Cap","Coat","Necklace"}) do table.insert(list,self:GetPetGearDefinition(slot).icon) end','for _,slot in ipairs({"Cap","Coat","Necklace"}) do for _,def in ipairs(self:GetPetGearVariants("ttungttang",slot)) do table.insert(list,def.icon) end end')
source=once(source,'local selected={} local layers=self.PetGearOverlays[baseRUID]','local selected={} local layers=self:GetPetGearLayers(baseRUID,entry.progress~=nil and (entry.progress.GearVariantMask or 0) or 0)')
source=once(source,'local layers=self.PetGearOverlays[self.PetCharmJumpRUIDs[index]] local selected={}','local layers=self:GetPetGearLayers(self.PetCharmJumpRUIDs[index],visual.gearVariantMask or 0) local selected={}')
(stage/'PetLogic.mlua').write_text(source,encoding='utf-8',newline='\r\n')

progress=(stage/'PetProgress.mlua.before').read_text(encoding='utf-8-sig')
progress=once(progress,'\tproperty integer GearEquippedMask = 0','\tproperty integer GearEquippedMask = 0\n\tproperty integer GearVariantOwnedMask = 0\n\tproperty integer GearVariantMask = 0')
progress=once(progress,'GearEquippedMask=self.GearEquippedMask}','GearEquippedMask=self.GearEquippedMask,GearVariantOwnedMask=self.GearVariantOwnedMask,GearVariantMask=self.GearVariantMask}')
progress=once(progress,'{"GearOwnedMask","GearEquippedMask"}','{"GearOwnedMask","GearEquippedMask","GearVariantOwnedMask","GearVariantMask"}')
progress=once(progress,'for _,bit in ipairs({1,2,4}) do if math.floor(self.GearEquippedMask/bit)%2==1 and math.floor(self.GearOwnedMask/bit)%2~=1 then return false end end','for _,bit in ipairs({1,2,4}) do local owns=math.floor(self.GearVariantMask/bit)%2==1 and self.GearVariantOwnedMask or self.GearOwnedMask; if math.floor(self.GearEquippedMask/bit)%2==1 and math.floor(owns/bit)%2~=1 then return false end end')
progress=once(progress,'\t\tif not self.Owned and','\t\tfor _,bit in ipairs({1,2,4}) do if math.floor(self.GearVariantMask/bit)%2==1 and math.floor(self.GearVariantOwnedMask/bit)%2~=1 then return false end end\n\t\tif not self.Owned and (self.GearVariantOwnedMask~=0 or self.GearVariantMask~=0) then return false end\n\t\tif not self.Owned and')
(stage/'PetProgress.mlua').write_text(progress,encoding='utf-8',newline='\r\n')

ui=(stage/'PetUI.mlua.before').read_text(encoding='utf-8-sig')
ui=once(ui,'local def=_PetLogic:GetPetGearDefinitionForPet(entry.id,slot) local e=self.PetGearSlots','local def=_PetLogic:GetSelectedPetGearDefinition(entry.id,slot,pet) local e=self.PetGearSlots')
ui=once(ui,'local owned=dog and _PetLogic:HasPetGearBit(pet.GearOwnedMask or 0,def.bit)','local ownedMask=dog and (def.variant==2 and pet.GearVariantOwnedMask or pet.GearOwnedMask) or 0\n\t\t\tlocal owned=dog and _PetLogic:HasPetGearBit(ownedMask or 0,def.bit)')
ui=once(ui,'Text=_LocalizationService:GetText(def.key)','Text=def.slotName or def.name or _LocalizationService:GetText(def.key)')
start=ui.index('\t\t\t\tlocal def=_PetLogic:GetPetGearDefinitionForPet(entry.id,slot)',ui.index('method table BuildPetInvItems'))
end=ui.index('\n\t\t\tend\n\t\tend',start)
ui=ui[:start]+'''				for variant,def in ipairs(_PetLogic:GetPetGearVariants(entry.id,slot)) do
					local ownedMask=variant==2 and (pet~=nil and pet.GearVariantOwnedMask or 0) or (pet~=nil and pet.GearOwnedMask or 0)
					local owned=pet~=nil and pet.Owned and _PetLogic:HasPetGearBit(ownedMask,def.bit)
					local selected=pet~=nil and _PetLogic:HasPetGearBit(pet.GearVariantMask or 0,def.bit) or false
					local worn=owned and _PetLogic:HasPetGearBit(pet.GearEquippedMask or 0,def.bit) and selected==(variant==2)
					local item={petId=entry.id,slot=slot,variant=variant,def=def,worn=worn,wearable=isCurrent and owned}
					table.insert(isCurrent and mine or others,item)
				end'''+ui[end:]
ui=once(ui,'_LocalizationService:GetText(item.def.key).."\\n"','(item.def.name or _LocalizationService:GetText(item.def.key)).."\\n"')
ui=once(ui,'_PetLogic:RequestPetGear(item.slot,item.petId)','_PetLogic:RequestPetGearVariant(item.slot,item.petId,item.variant or 1)')
(stage/'PetUI.mlua').write_text(ui,encoding='utf-8',newline='\r\n')
# Parser check uses the same translation as earlier work; native build follows.
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text(encoding='utf-8'));fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');ns={};exec('import re\n'+ast.unparse(fn),ns)
rt.execute('function Vector2(x,y)return {x=x,y=y}end;function Vector3(x,y,z)return {x=x,y=y,z=z}end;function Color(r,g,b,a)return {r=r,g=g,b=b,a=a}end')
for name in ['PetLogic','PetUI','PetProgress']:
 rt.execute(ns['translate']((stage/(name+'.mlua')).read_text(encoding='utf-8')))
print('Staged separate per-slot design selection, v7 save migration, test ownership, shared UI/skill frames; Lua syntax passed.')
