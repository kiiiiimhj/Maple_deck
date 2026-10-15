from pathlib import Path
import json,csv,io,re
stage=Path('work/ttung-gear');out=Path('outputs/ttung-gear');assets=json.loads((out/'applied-assets.json').read_text(encoding='utf-8'));maps=json.loads((out/'overlay-map.json').read_text(encoding='utf-8'))
def change(s,a,b,count=1):
 assert s.count(a)==count,(a[:100],s.count(a));return s.replace(a,b)
s=(stage/'PetLogic.before.mlua').read_text(encoding='utf-8-sig')
rows=['\tproperty table PetGearOverlays = {']
for base,layers in maps.items():rows.append('\t\t["'+base+'"]={'+','.join(k+'="'+assets[v]['ruid']+'"'for k,v in layers.items())+'},')
rows.append('\t}')
props='\n'.join(rows)+'\n\tproperty boolean PetGearReady = false\n\t@Sync property integer RunPetGearMask = 0\n'
s=change(s,'\tproperty table ClientPets = {}',props+'\tproperty table ClientPets = {}')
s=change(s,'\t\tself:PreloadPetSkillArtwork()','\t\tself:PreloadPetGearArtwork()\n\t\tself:PreloadPetSkillArtwork()')
s=change(s,'data.version==4 or data.version==5','data.version==4 or data.version==5 or data.version==6')
s=change(s,'local optional=key=="Stat3" or key=="Stat6" or key=="Stat9"','local optional=key=="Stat3" or key=="Stat6" or key=="Stat9" or (data.version<6 and (key=="GearOwnedMask" or key=="GearEquippedMask"))')
s=change(s,'if not pets[id]:Deserialize(profile) then return nil end','if not pets[id]:Deserialize(profile) then return nil end\n\t\t\t\t\tif id~="ttungttang" and (pets[id].GearOwnedMask~=0 or pets[id].GearEquippedMask~=0) then return nil end')
s=change(s,'if data.version<5 then migrated=true end','if data.version<6 then migrated=true end')
s=change(s,'return {version=5,pets=pets','return {version=6,pets=pets')
s=change(s,'\t\tout.cooldown=math.min(0.9,out.cooldown)','''
\t\tif petId=="ttungttang" and pet~=nil and pet.Owned then
\t\t\tlocal mask=pet.GearEquippedMask or 0
\t\t\tif self:HasPetGearBit(mask,1) then out.critDmg=out.critDmg+0.10 end
\t\t\tif self:HasPetGearBit(mask,2) then out.atkPct=(1+out.atkPct)*1.05-1 end
\t\t\tif self:HasPetGearBit(mask,4) then out.critRate=out.critRate+0.05 end
\t\tend
\t\tout.cooldown=math.min(0.9,out.cooldown)''')
s=change(s,'self.RunToken=self.RunToken+1 self.RunUserId=userId','self.RunPetGearMask=0\n\t\tself.RunToken=self.RunToken+1 self.RunUserId=userId')
s=change(s,'self.RunDamageMultiplier=1+stats.atkPct self.RunCritChanceBonus=stats.critRate','if id=="ttungttang" then self.RunPetGearMask=pet.GearEquippedMask or 0 end\n\t\t\t\tself.RunDamageMultiplier=1+stats.atkPct self.RunCritChanceBonus=stats.critRate')
# Map skill equipment is render-warmed with fixed textures, like the puppy itself.
s=change(s,'if not isvalid(map) or not self.PetCharmJumpReady then return end','if not isvalid(map) or not self.PetCharmJumpReady or not self.PetGearReady then return end')
s=change(s,'pool={map=map,bodies={},waves={},hearts={},warmFrames=0,ready=false}','pool={map=map,bodies={},waves={},hearts={},gear={},gearByRUID={},warmFrames=0,ready=false}')
s=change(s,'for i=1,16 do table.insert(pool.hearts,self:SpawnPetSkillSprite(self.PetCharmHeartRUID,map,131)) end','''for i=1,16 do table.insert(pool.hearts,self:SpawnPetSkillSprite(self.PetCharmHeartRUID,map,131)) end
\t\t\tfor _,base in ipairs(self.PetCharmJumpRUIDs) do
\t\t\t\tlocal layers=self.PetGearOverlays[base]
\t\t\t\tfor order,slot in ipairs({"coat","neck","hat"}) do
\t\t\t\t\tlocal ruid=layers[slot]
\t\t\t\t\tif pool.gearByRUID[ruid]==nil then local actor=self:SpawnPetSkillSprite(ruid,map,132+order);pool.gearByRUID[ruid]=actor;table.insert(pool.gear,actor) end
\t\t\t\tend
\t\t\tend''')
s=s.replace('{pool.bodies,pool.waves,pool.hearts}','{pool.bodies,pool.waves,pool.hearts,pool.gear or {}}')
s=change(s,'v.waves=pool.waves v.hearts=pool.hearts','v.waves=pool.waves v.hearts=pool.hearts v.charmGear=pool.gear v.gearByRUID=pool.gearByRUID v.gearMask=self.RunPetGearMask')
s=change(s,'local launchIndex=self:GetPetCharmJumpFrameIndex(self.PetCharmLaunchTime)','self:RenderPetSkillGear(v,index,width,jump,fade)\n\t\t\tlocal launchIndex=self:GetPetCharmJumpFrameIndex(self.PetCharmLaunchTime)')
s=change(s,'{v.charmBodies,v.waves,v.hearts}','{v.charmBodies,v.waves,v.hearts,v.charmGear or {}}')
s=change(s,'self.RunPetId=ids[nextIndex]','''self.RunPetId=ids[nextIndex]
\t\tlocal record=self.States[self.RunUserId]
\t\tself.RunPetGearMask=(record~=nil and self.RunPetId=="ttungttang") and (record.pets.ttungttang.GearEquippedMask or 0) or 0''')
s=change(s,'if self:IsClient() then self:ClearPetSkillVisual();self:ClearPetCharmRenderPool()','if self:IsClient() then self:ClearPetSkillVisual();self:ClearPetCharmRenderPool();self:ClearPetGearUI()')
methods='''
\tmethod boolean HasPetGearBit(integer mask, integer bit)
\t\treturn math.floor(mask/bit)%2==1
\tend

\tmethod table GetPetGearDefinition(string slot)
\t\tlocal defs={
\t\t\tCap={id="ttung-cap",bit=1,slot="Cap",key="PET_GEAR_TTUNG_HAT",statKey="PET_GEAR_CRIT_DAMAGE",icon="HAT_ICON"},
\t\t\tCoat={id="ttung-coat",bit=2,slot="Coat",key="PET_GEAR_TTUNG_COAT",statKey="PET_GEAR_ATTACK",icon="COAT_ICON"},
\t\t\tNecklace={id="ttung-neck",bit=4,slot="Necklace",key="PET_GEAR_TTUNG_NECK",statKey="PET_GEAR_CRIT_CHANCE",icon="NECK_ICON"}
\t\t}
\t\treturn defs[slot]
\tend

\t-- The only grant entry point is server-only; purchase/reward code supplies the validated mask.
\t@ExecSpace("ServerOnly")
\tmethod boolean GrantPetGear(string userId, integer mask)
\t\tlocal record=self.States[userId]
\t\tif record==nil or not record.pets.ttungttang.Owned or mask<1 or mask>7 then return false end
\t\tlocal pet=record.pets.ttungttang local before=pet.GearOwnedMask
\t\tfor _,bit in ipairs({1,2,4}) do if self:HasPetGearBit(mask,bit) and not self:HasPetGearBit(pet.GearOwnedMask,bit) then pet.GearOwnedMask=pet.GearOwnedMask+bit end end
\t\tif pet.GearOwnedMask~=before then self:MarkDirty(record) end
\t\trecord.responsePetId="ttungttang" self:PushState(userId,"","") return true
\tend

\t@ExecSpace("Server")
\tmethod void RequestPetGear(string slot)
\t\tlocal def=self:GetPetGearDefinition(slot) local record=self.States[senderUserId]
\t\tif def==nil or record==nil then return end
\t\trecord.responsePetId="ttungttang"
\t\tif _GameManager.GameStarted and not _GameManager.GameOver then self:PushState(senderUserId,"","PET_BATTLE_LOCKED") return end
\t\tlocal pet=record.pets.ttungttang local now=_DateTimeLogic:GetTimeElapsedWithoutOffset()
\t\tif now<(record.busyUntil or 0) or now-(record.lastGearRequest or -1000)<250 then return end
\t\tif not pet.Owned or not self:HasPetGearBit(pet.GearOwnedMask,def.bit) then self:PushState(senderUserId,"","PET_GEAR_NOT_OWNED") return end
\t\trecord.lastGearRequest=now
\t\tlocal equipped=self:HasPetGearBit(pet.GearEquippedMask,def.bit)
\t\tpet.GearEquippedMask=pet.GearEquippedMask+(equipped and -def.bit or def.bit)
\t\tself:MarkDirty(record) self:PushState(senderUserId,"",equipped and "PET_GEAR_REMOVED" or "PET_GEAR_WORN")
\t\tif not record.test then _GameManager:PersistRewardNow(senderUserId) end
\t\tlog("[VRF] PET-GEAR slot="..slot.." equippedMask="..pet.GearEquippedMask)
\tend

\t@ExecSpace("Server")
\tmethod void RequestTestPetGear()
\t\tif not Environment:IsMakerPlay() or (_GameManager.GameStarted and not _GameManager.GameOver) then return end
\t\tlocal record=self.States[senderUserId] if record==nil or not record.pets.ttungttang.Owned then return end
\t\tif _DateTimeLogic:GetTimeElapsedWithoutOffset()<(record.busyUntil or 0) then return end
\t\tlocal preview=self:ReadAccount(self:SerializeAccount(record)) if preview==nil then return end
\t\tpreview.test=true preview.dirty=false preview.generation=0 preview.responsePetId="ttungttang"
\t\tpreview.pets.ttungttang.GearOwnedMask=7 preview.pets.ttungttang.GearEquippedMask=7
\t\tself.States[senderUserId]=preview self:PushState(senderUserId,"","PET_GEAR_TEST_NOTICE")
\tend

\t@ExecSpace("ClientOnly")
\tmethod void PreloadPetGearArtwork()
\t\tself.PetGearReady=false local list={} local seen={}
\t\tfor _,layers in pairs(self.PetGearOverlays) do for _,ruid in pairs(layers) do if not seen[ruid] then seen[ruid]=true table.insert(list,ruid) end end end
\t\tfor _,slot in ipairs({"Cap","Coat","Necklace"}) do table.insert(list,self:GetPetGearDefinition(slot).icon) end
\t\t_ResourceService:PreloadAsync(list,function(results)
\t\t\tif not isvalid(self) then return end
\t\t\tlocal ready=true for _,r in pairs(results) do if r~=PreloadResultStatus.Success then ready=false end end
\t\t\tif ready then for _,ruid in ipairs(list) do local metrics=_CardManager:GetSpriteMetrics(ruid) if metrics.w<=0 or metrics.h<=0 then ready=false end end end
\t\t\tself.PetGearReady=ready log("[VRF] PET-GEAR preloaded="..tostring(ready).." textures="..#list)
\t\tend)
\tend

\t@ExecSpace("ClientOnly")
\tmethod void RenderPetGearUI(Entity portrait, table entry, string baseRUID)
\t\tif not isvalid(portrait) then return end
\t\tself._T.petGearUI=self._T.petGearUI or {} local pool=self._T.petGearUI[portrait.Id]
\t\tlocal mask=entry.id=="ttungttang" and entry.progress~=nil and entry.progress.Owned and (entry.progress.GearEquippedMask or 0) or 0
\t\tif not self.PetGearReady then return end
\t\tif pool==nil and mask>0 then
\t\t\tpool={portrait=portrait,actors={},byRUID={},warmFrames=0,ready=false} self._T.petGearUI[portrait.Id]=pool
\t\t\tfor _,slot in ipairs({"coat","neck","hat"}) do
\t\t\t\tfor _,layers in pairs(self.PetGearOverlays) do local ruid=layers[slot]
\t\t\t\t\tif pool.byRUID[ruid]==nil then
\t\t\t\t\t\tlocal e=_SpawnService:SpawnByEntity(portrait,"PetWear_"..slot,Vector3.zero,portrait,false)
\t\t\t\t\t\tlocal t=e.UITransformComponent;t.AnchorsMin=Vector2(0.5,0.5);t.AnchorsMax=Vector2(0.5,0.5);t.Pivot=Vector2(0.5,0.5);t.anchoredPosition=Vector2.zero;t.UIScale=Vector3(1,1,1);t.UIRotation=Vector3.zero
\t\t\t\t\t\tlocal r=e.SpriteGUIRendererComponent;r.Color=Color(1,1,1,0);r.ImageRUID=DataRef(ruid);r.Type=ImageType.Simple;r.PreserveSprite=PreserveSpriteType.None;r.LocalScale=Vector2(1,1);r.LocalPosition=Vector2.zero;r.RaycastTarget=false;r.Outline=false;r.DropShadow=false;r.FlipX=false;r.FlipY=false;r.PlayRate=0
\t\t\t\t\t\tpool.byRUID[ruid]=e;table.insert(pool.actors,e)
\t\t\t\t\tend
\t\t\t\tend
\t\t\tend
\t\tend
\t\tif pool==nil then return end
\t\tlocal selected={} local layers=self.PetGearOverlays[baseRUID]
\t\tif layers~=nil and mask>0 then
\t\t\tfor slot,bit in pairs({hat=1,coat=2,neck=4}) do if self:HasPetGearBit(mask,bit) then selected[layers[slot]]=true end end
\t\tend
\t\tfor ruid,e in pairs(pool.byRUID) do if isvalid(e) then
\t\t\te.UITransformComponent.RectSize=portrait.UITransformComponent.RectSize
\t\t\tlocal a=pool.ready and (selected[ruid] and portrait.SpriteGUIRendererComponent.Color.a or 0) or 0.000001
\t\t\te.SpriteGUIRendererComponent.Color=Color(1,1,1,a);e.Enable=true
\t\tend end
\t\tpool.warmFrames=pool.warmFrames+1 if pool.warmFrames>=4 then pool.ready=true end
\tend

\t@ExecSpace("ClientOnly")
\tmethod void ClearPetGearUI()
\t\tfor _,pool in pairs(self._T.petGearUI or {}) do for _,actor in ipairs(pool.actors) do if isvalid(actor) then actor:Destroy() end end end
\t\tself._T.petGearUI={}
\tend

\t@ExecSpace("ClientOnly")
\tmethod void RenderPetSkillGear(table visual, integer index, number width, number jump, number alpha)
\t\tlocal layers=self.PetGearOverlays[self.PetCharmJumpRUIDs[index]] local selected={}
\t\tfor slot,bit in pairs({hat=1,coat=2,neck=4}) do if self:HasPetGearBit(visual.gearMask or 0,bit) then selected[layers[slot]]=true end end
\t\tlocal pos=self:GetPetCharmBodyPosition(visual,index,width,jump)
\t\tfor ruid,actor in pairs(visual.gearByRUID or {}) do self:PlacePetCharmSprite(actor,pos,width,0,selected[ruid] and alpha or 0) end
\tend
'''
for key,slot in [('HAT_ICON','hat'),('COAT_ICON','coat'),('NECK_ICON','neck')]:methods=methods.replace(key,assets[slot+'-icon']['ruid'])
s=s.rsplit('\nend',1)[0]+methods+'\nend\n';(stage/'PetLogic.mlua').write_text(s,encoding='utf-8')
s=(stage/'PetProgress.before.mlua').read_text(encoding='utf-8-sig')
s=change(s,'\tproperty integer Stat9 = 0','\tproperty integer Stat9 = 0\n\tproperty integer GearOwnedMask = 0\n\tproperty integer GearEquippedMask = 0')
s=change(s,'Stat9=self.Stat9}','Stat9=self.Stat9, GearOwnedMask=self.GearOwnedMask, GearEquippedMask=self.GearEquippedMask}')
s=change(s,'\t\treturn true','''\t\tfor _,key in ipairs({"GearOwnedMask","GearEquippedMask"}) do
\t\t\tlocal value=data[key]
\t\t\tif value~=nil and (type(value)~="number" or value~=value or value~=math.floor(value) or value<0 or value>7) then return false end
\t\t\tself[key]=value or 0
\t\tend
\t\tfor _,bit in ipairs({1,2,4}) do if math.floor(self.GearEquippedMask/bit)%2==1 and math.floor(self.GearOwnedMask/bit)%2~=1 then return false end end
\t\tif not self.Owned and (self.GearOwnedMask~=0 or self.GearEquippedMask~=0) then return false end
\t\treturn true''')
(stage/'PetProgress.mlua').write_text(s,encoding='utf-8')
s=(stage/'PetUI.before.mlua').read_text(encoding='utf-8-sig')
s=change(s,'self:SetPetMode(false)\n\tend','''self:BindClick(self.PetGearSlots:GetChildByName("TestGear"),function() _PetLogic:RequestTestPetGear() end)
\t for _,slot in ipairs({"Cap","Coat","Necklace"}) do local key=slot self:BindClick(self.PetGearSlots:GetChildByName(slot),function() local e=_PetLogic:GetEquippedClientEntry();if e.id=="ttungttang" then _PetLogic:RequestPetGear(key) end end) end
\t self:SetPetMode(false)
\tend''')
s=change(s,'self.ShownRevision = _PetLogic.ClientRevision self:PlayIdle()','self.ShownRevision = _PetLogic.ClientRevision self:PlayIdle() self:RefreshPetGear()')
s=change(s,'\t\t\tend\n\t\tend\n\tend\n\n\t@ExecSpace("ClientOnly")\n\tmethod void OnEndPlay()', '\t\t\tend\n\t\t\t_PetLogic:RenderPetGearUI(self.PetDisplay:GetChildByName("Portrait"),entry,self.CustomImageRUID)\n\t\tend\n\tend\n\n\t@ExecSpace("ClientOnly")\n\tmethod void OnEndPlay()')
methods='''
\t@ExecSpace("ClientOnly")
\tmethod void RefreshPetGear()
\t\tlocal entry=_PetLogic:GetEquippedClientEntry() local pet=entry.progress local dog=entry.id=="ttungttang" and pet~=nil and pet.Owned
\t\tfor _,slot in ipairs({"Cap","Coat","Necklace"}) do
\t\t\tlocal def=_PetLogic:GetPetGearDefinition(slot) local e=self.PetGearSlots:GetChildByName(slot)
\t\t\tlocal owned=dog and _PetLogic:HasPetGearBit(pet.GearOwnedMask or 0,def.bit)
\t\t\tlocal worn=owned and _PetLogic:HasPetGearBit(pet.GearEquippedMask or 0,def.bit)
\t\t\te.ButtonComponent.Enable=owned;e:GetChildByName("Icon").SpriteGUIRendererComponent.ImageRUID=DataRef(def.icon)
\t\t\te:GetChildByName("Icon").SpriteGUIRendererComponent.Color=Color(1,1,1,owned and 1 or 0.28)
\t\t\te:GetChildByName("Label").TextGUIRendererComponent.Text=_LocalizationService:GetText(def.key)
\t\t\te:GetChildByName("Stat").TextGUIRendererComponent.Text=_LocalizationService:GetText(def.statKey)
\t\t\te:GetChildByName("Mark").Enable=worn;e:GetChildByName("Mark").TextGUIRendererComponent.Text=_LocalizationService:GetText("PET_GEAR_WORN")
\t\tend
\t\tself.PetGearSlots:GetChildByName("Hint").TextGUIRendererComponent.Text=_LocalizationService:GetText(dog and "PET_GEAR_HINT" or "PET_GEAR_EXCLUSIVE")
\t\tlocal test=self.PetGearSlots:GetChildByName("TestGear");test.Enable=Environment:IsMakerPlay() and dog;test.ButtonComponent.Enable=Environment:IsMakerPlay() and dog;test:GetChildByName("Label").TextGUIRendererComponent.Text=_LocalizationService:GetText("PET_GEAR_TEST")
\tend
'''
s=s.rsplit('\nend',1)[0]+methods+'\nend\n';(stage/'PetUI.mlua').write_text(s,encoding='utf-8')
s=(stage/'PetHouseUI.before.mlua').read_text(encoding='utf-8-sig')
s=change(s,'_PetLogic:AlignCustomPortrait(self.PetDisplay:GetChildByName("Portrait"),entry,entry.pixelScale)','_PetLogic:AlignCustomPortrait(self.PetDisplay:GetChildByName("Portrait"),entry,entry.pixelScale)\n\t _PetLogic:RenderPetGearUI(self.PetDisplay:GetChildByName("Portrait"),entry,self.CustomImageRUID)')
(stage/'PetHouseUI.mlua').write_text(s,encoding='utf-8')
rows=list(csv.reader(io.StringIO((stage/'GameText.before.csv').read_text(encoding='utf-8-sig'))));entries={
'PET_GEAR_TTUNG_HAT':['별빛 베레모','Starlight Beret','星光貝雷帽','星光贝雷帽','星明かりベレー'],
'PET_GEAR_TTUNG_COAT':['산책 조끼','Walking Vest','散步背心','散步背心','お散歩ベスト'],
'PET_GEAR_TTUNG_NECK':['하트 목걸이','Heart Collar','愛心項圈','爱心项圈','ハート首輪'],
'PET_GEAR_CRIT_DAMAGE':['크리티컬 대미지 +10%','Critical damage +10%','暴擊傷害 +10%','暴击伤害 +10%','クリティカルダメージ +10%'],
'PET_GEAR_ATTACK':['공격력 +5%','Attack +5%','攻擊力 +5%','攻击力 +5%','攻撃力 +5%'],
'PET_GEAR_CRIT_CHANCE':['크리티컬 확률 +5%','Critical chance +5%','暴擊率 +5%','暴击率 +5%','クリティカル率 +5%'],
'PET_GEAR_HINT':['장비를 눌러 장착·해제','Tap gear to equip or remove','點擊裝備穿戴或卸下','点击装备穿戴或卸下','装備をタップして着脱'],
'PET_GEAR_EXCLUSIVE':['뚱땅 전용 장비','Ttungttang exclusive gear','뚱땅專用裝備','뚱땅专用装备','뚱땅専用装備'],
'PET_GEAR_NOT_OWNED':['보유한 전용 장비가 필요해요.','You need to own this gear.','需要持有此專用裝備。','需要持有此专用装备。','この専用装備が必要です。'],
'PET_GEAR_WORN':['장착 중','Equipped','已裝備','已装备','装備中'],
'PET_GEAR_REMOVED':['장비를 해제했어요.','Gear removed.','已卸下裝備。','已卸下装备。','装備を外しました。'],
'PET_GEAR_TEST':['장비 시험','Try gear','試穿裝備','试穿装备','装備を試す'],
'PET_GEAR_TEST_NOTICE':['장비 시험 중 · 저장되지 않아요.','Trying gear · progress is not saved.','試穿中 · 不會儲存。','试穿中 · 不会保存。','装備試着中・保存されません。']}
assert not any(r and r[0] in entries for r in rows)
for k,langs in entries.items():rows.append([k,langs[0],'Ttungttang exclusive pet equipment',*langs])
buf=io.StringIO();csv.writer(buf,lineterminator='\n').writerows(rows);(stage/'GameText.csv').write_text(buf.getvalue(),encoding='utf-8')
print('Staged equipment validation, v6 save migration, independent stats and synchronized fixed-texture render pools.')
