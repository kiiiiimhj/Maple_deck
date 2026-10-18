"""Keep the first variation data usable when more designs are appended later.

Three radix-100 digits hold independent design indexes (0 = original).
Additional ownership bits are grouped by design, three slots per design.
Combat bonuses still use only GearEquippedMask, never these cosmetic digits.
"""
from pathlib import Path
import re
stage=Path('work/pet-variation-v1')
def method(s,name,body):
 m=re.search(r'(?m)^\tmethod ([^\n]*\b'+name+r'\([^\n]*\))\n.*?^\tend',s,re.S);assert m,name
 return s[:m.start()]+'\tmethod '+m.group(1)+'\n'+body.strip('\n')+'\n\tend'+s[m.end():]
def rename(s):return s.replace('RunPetGearVariantMask','RunPetGearDesigns').replace('GearVariantMask','GearDesigns').replace('gearVariantMask','gearDesigns')
source=rename((stage/'PetLogic.mlua').read_text(encoding='utf-8'))
source=source.replace('or data.version==8 then','or data.version==8 or data.version==9 then').replace('return {version=8,pets=pets','return {version=9,pets=pets').replace('if data.version<8 then migrated=true end','if data.version<9 then migrated=true end')
needle='\t\t\t\t\t-- V2 always writes complete profiles.'
assert needle in source
source=source.replace(needle,'''\t\t\t\t\tif data.version==8 and profile.GearDesigns==nil then
						local mask=profile.GearVariantMask or 0
						if type(mask)~="number" or mask~=math.floor(mask) or mask<0 or mask>7 then return nil end
						local migratedProfile={} for k,v in pairs(profile)do migratedProfile[k]=v end
						migratedProfile.GearDesigns=mask%2+math.floor(mask/2)%2*100+math.floor(mask/4)%2*10000
						profile=migratedProfile
					end
'''+needle)
source=source.replace(':stripe',':design2')
source=source.replace('integer variantMask)','integer designs)')
source=method(source,'GetPetGearLayers','''		local original=self.PetGearOverlays[base] if original==nil then return nil end local selected={}
		for slot,bit in pairs({hat=1,coat=2,neck=4}) do
			local variant=self:GetPetGearDesignIndex(designs,bit)
			local set=variant==1 and original or self.PetGearVariantOverlays[base..":design"..variant]
			selected[slot]=(set~=nil and set[slot]) or original[slot]
		end
		return selected
''')
helpers='''
	method integer GetPetGearDesignCount()
		return math.max(#self:GetPetGearVariants("ttungttang","Cap"),#self:GetPetGearVariants("ttungttang","Coat"),#self:GetPetGearVariants("ttungttang","Necklace"))
	end

	method integer GetPetGearDesignIndex(integer designs, integer bit)
		local weight=bit==1 and 1 or (bit==2 and 100 or 10000)
		return math.floor((designs or 0)/weight)%100+1
	end

	method integer GetPetGearOwnershipBit(integer bit, integer variant)
		return variant==1 and bit or bit*2^((variant-2)*3)
	end
'''
pos=source.index('\n\tmethod table GetPetGearArtwork');source=source[:pos]+helpers+source[pos:]
source=method(source,'GetSelectedPetGearDefinition','''		local variants=self:GetPetGearVariants(petId,slot) local base=variants[1]
		if base==nil then return nil end
		local variant=pet~=nil and self:GetPetGearDesignIndex(pet.GearDesigns or 0,base.bit) or 1
		return variants[variant] or base
''')
source=method(source,'ApplyPetGearSelection','''		local variants=self:GetPetGearVariants(petId,slot) local def=variants[variant] local record=self.States[userId]
		if def==nil or record==nil then return end
		record.responsePetId=petId
		if _GameManager.GameStarted and not _GameManager.GameOver then self:PushState(userId,"","PET_BATTLE_LOCKED") return end
		local pet=record.pets[petId] local now=_DateTimeLogic:GetTimeElapsedWithoutOffset()
		if pet==nil or now<(record.busyUntil or 0) or now-(record.lastGearRequest or -1000)<250 then return end
		local owned=variant>1 and (pet.GearVariantOwnedMask or 0) or pet.GearOwnedMask
		if not pet.Owned or not self:HasPetGearBit(owned,self:GetPetGearOwnershipBit(def.bit,variant)) then self:PushState(userId,"","PET_GEAR_NOT_OWNED") return end
		record.lastGearRequest=now
		local previous=self:GetPetGearDesignIndex(pet.GearDesigns or 0,def.bit)
		local same=self:HasPetGearBit(pet.GearEquippedMask,def.bit) and previous==variant
		if same then pet.GearEquippedMask=pet.GearEquippedMask-def.bit
		else
			if not self:HasPetGearBit(pet.GearEquippedMask,def.bit) then pet.GearEquippedMask=pet.GearEquippedMask+def.bit end
			local weight=def.bit==1 and 1 or (def.bit==2 and 100 or 10000)
			pet.GearDesigns=(pet.GearDesigns or 0)+(variant-previous)*weight
		end
		-- Exactly one bonus per occupied slot, independent of owned design count.
		self:MarkDirty(record) self:PushState(userId,"",same and "PET_GEAR_REMOVED" or "PET_GEAR_WORN")
		if not record.test then _GameManager:PersistRewardNow(userId) end
		log("[VRF] PET-GEAR-VARIANT slot="..slot.." design="..variant.." equippedMask="..pet.GearEquippedMask)
''')
source=source.replace('self.PetGearVariantOverlays[base..":design2"]','self.PetGearVariantOverlays[base..":design2"]')
# Warm all designs for the skill, including future appended entries.
source=source.replace('for _,layers in ipairs({self.PetGearOverlays[base],self.PetGearVariantOverlays[base..":design2"]}) do','for variant=1,self:GetPetGearDesignCount() do local layers=self:GetPetGearLayers(base,(variant-1)*10101)')
source=source.replace('visual.gearDesigns=math.max(0,math.min(7,gearDesigns or 0))','visual.gearDesigns=math.max(0,math.min(161616,gearDesigns or 0))')
source=source.replace('if petId=="ttungttang" then preview.pets[petId].GearVariantOwnedMask=7 end','if petId=="ttungttang" then local mask=0;for slot,bit in pairs({Cap=1,Coat=2,Necklace=4}) do for variant=2,#self:GetPetGearVariants(petId,slot) do mask=mask+self:GetPetGearOwnershipBit(bit,variant) end end;preview.pets[petId].GearVariantOwnedMask=mask end')
# Every selected design must actually be in the pet's catalogue.
needle='if id~="ttungttang" and (pets[id].GearVariantOwnedMask~=0 or pets[id].GearDesigns~=0) then return nil end'
assert needle in source
source=source.replace(needle,needle+'\n\t\t\t\t\tfor slot,bit in pairs({Cap=1,Coat=2,Necklace=4}) do if self:GetPetGearDesignIndex(pets[id].GearDesigns,bit)>#self:GetPetGearVariants(id,slot) then return nil end end')
(stage/'PetLogic.mlua').write_text(source,encoding='utf-8',newline='\r\n')
progress=rename((stage/'PetProgress.mlua').read_text(encoding='utf-8'))
start=progress.index('\t\tfor _,key in ipairs({"GearOwnedMask"');end=progress.index('\n\t\tif not self.Owned and',start)
progress=progress[:start]+'''		for _,key in ipairs({"GearOwnedMask","GearEquippedMask","GearVariantOwnedMask","GearDesigns"}) do
			local value=data[key] local maximum=key=="GearVariantOwnedMask" and 281474976710655 or (key=="GearDesigns" and 161616 or 7)
			if value~=nil and (type(value)~="number" or value~=value or value~=math.floor(value) or value<0 or value>maximum) then return false end
			self[key]=value or 0
		end
		for _,bit in ipairs({1,2,4}) do
			local weight=bit==1 and 1 or (bit==2 and 100 or 10000)
			local variant=math.floor(self.GearDesigns/weight)%100+1 if variant>17 then return false end
			local owns=variant>1 and self.GearVariantOwnedMask or self.GearOwnedMask
			local ownedBit=variant>1 and bit*2^((variant-2)*3) or bit
			if (variant>1 or math.floor(self.GearEquippedMask/bit)%2==1) and math.floor(owns/ownedBit)%2~=1 then return false end
		end'''+progress[end:]
(stage/'PetProgress.mlua').write_text(progress,encoding='utf-8',newline='\r\n')
ui=rename((stage/'PetUI.mlua').read_text(encoding='utf-8'))
ui=ui.replace('def.variant==2 and pet.GearVariantOwnedMask','(def.variant or 1)>1 and pet.GearVariantOwnedMask')
ui=ui.replace('HasPetGearBit(ownedMask or 0,def.bit)','HasPetGearBit(ownedMask or 0,_PetLogic:GetPetGearOwnershipBit(def.bit,def.variant or 1))')
ui=ui.replace('variant==2 and (pet~=nil and pet.GearVariantOwnedMask','variant>1 and (pet~=nil and pet.GearVariantOwnedMask')
ui=ui.replace('HasPetGearBit(ownedMask,def.bit)','HasPetGearBit(ownedMask,_PetLogic:GetPetGearOwnershipBit(def.bit,variant))')
ui=ui.replace('local selected=pet~=nil and _PetLogic:HasPetGearBit(pet.GearDesigns or 0,def.bit) or false','local selected=pet~=nil and _PetLogic:GetPetGearDesignIndex(pet.GearDesigns or 0,def.bit) or 1')
ui=ui.replace('selected==(variant==2)','selected==variant')
(stage/'PetUI.mlua').write_text(ui,encoding='utf-8',newline='\r\n')
print('Design selection supports appending more catalog entries per slot; bonuses remain three slot bits.')
