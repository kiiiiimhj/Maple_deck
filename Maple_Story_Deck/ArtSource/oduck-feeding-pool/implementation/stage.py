from pathlib import Path
import json,re
stage=Path('work/oduck-feeding-pool');assets=json.loads(Path('outputs/oduck-feeding-pool/applied-assets.json').read_text(encoding='utf-8'))
def read(name):return(stage/(name+'.before')).read_text(encoding='utf-8-sig')
def replace(s,a,b):
 assert s.count(a)==1,(a[:100],s.count(a))
 return s.replace(a,b)
pool=assets['pool']['ruid'];icon=assets['icon']['ruid']
s=read('PetHouseUI.mlua')
s=replace(s,'\tproperty any DuckyFoodBowl = nil',f'\tproperty any OduckPoolBack = nil\n\tproperty any OduckPoolFront = nil\n\tproperty boolean OduckPoolReady = false\n\tproperty string OduckPoolRUID = "{pool}"\n\tproperty any DuckyFoodBowl = nil')
s=replace(s,'\t self:InitializeDuckyFoodBowl()','\t self:InitializeDuckyFoodBowl()\n\t self:InitializeOduckFeedingPool()')
s=replace(s,'and (entry.id~="5000498" or action~="feed" or self.DuckyBowlReady)','and (entry.id~="5000498" or action~="feed" or self.DuckyBowlReady) and (entry.id~="oduck" or action~="feed" or self.OduckPoolReady)')
s=replace(s,'\t\tif action=="feed" and entry.id=="5000498" and not self.DuckyBowlReady then return end','\t\tif action=="feed" and entry.id=="5000498" and not self.DuckyBowlReady then return end\n\t\tif action=="feed" and entry.id=="oduck" and not self.OduckPoolReady then return end')
s=replace(s,'\t\tself:SetDuckyFoodBowl(active,elapsed)','\t\tself:SetDuckyFoodBowl(active,elapsed)\n\t\tself:SetOduckFeedingPool(active,elapsed)')
s=replace(s,'\t self.DuckyFoodBowl=nil self.DuckyBowlReady=false','\t self.DuckyFoodBowl=nil self.DuckyBowlReady=false\n\t if isvalid(self.OduckPoolBack) then self.OduckPoolBack:Destroy() end\n\t if isvalid(self.OduckPoolFront) then self.OduckPoolFront:Destroy() end\n\t self.OduckPoolBack=nil self.OduckPoolFront=nil self.OduckPoolReady=false')
methods='''
\t@ExecSpace("ClientOnly")
\tmethod void InitializeOduckFeedingPool()
\t\tif isvalid(self.OduckPoolBack) and isvalid(self.OduckPoolFront) then return end
\t\tlocal portrait=self.PetDisplay:GetChildByName("Portrait")
\t\tlocal back=self:WalkLayer(self.PetDisplay,"OduckPoolBack",self.OduckPoolRUID,384,384,0,0)
\t\tlocal front=self:WalkLayer(self.PetDisplay,"OduckPoolFront",self.OduckPoolRUID,384,384,0,0)
\t\tback.Enable=false front.Enable=false
\t\tself.OduckPoolBack=back self.OduckPoolFront=front self.OduckPoolReady=false
\t\t_UILogic:SetSiblingIndex(back.UITransformComponent,_UILogic:GetSiblingIndex(portrait.UITransformComponent))
\t\t_UILogic:SetSiblingIndex(front.UITransformComponent,_UILogic:GetSiblingIndex(portrait.UITransformComponent)+1)
\t\t-- Reuse the exact pool texture for the near wall: crop its lower portion, never stretch it.
\t\tlocal image=front.SpriteGUIRendererComponent
\t\timage.Type=ImageType.Filled image.FillMethod=FillMethodType.Vertical image.FillOrigin=0 image.FillAmount=0.26
\t\t_ResourceService:PreloadAsync({self.OduckPoolRUID},function(results)
\t\t\tif not isvalid(self) or not isvalid(back) or not isvalid(front) then return end
\t\t\tlocal ready=true for _,result in pairs(results) do if result~=PreloadResultStatus.Success then ready=false end end
\t\t\tself.OduckPoolReady=ready
\t\t\tlog("[VRF] PET-ODUCK round feeding pool ready="..tostring(ready))
\t\t\tif self.PetMode then self:Refresh() end
\t\tend)
\tend

\t@ExecSpace("ClientOnly")
\tmethod void SetOduckFeedingPool(boolean active, number elapsed)
\t\tlocal back=self.OduckPoolBack local front=self.OduckPoolFront
\t\tif not isvalid(back) or not isvalid(front) then return end
\t\tlocal show=active and self.PetMode and self.OduckPoolReady and self:GetDisplayedPet().id=="oduck"
\t\tback.Enable=show front.Enable=show
\t\tif not show then return end
\t\tlocal size=128*_PetLogic:GetCustomPixelScale(back,3)
\t\tback.UITransformComponent.RectSize=Vector2(size,size)
\t\tback.UITransformComponent.anchoredPosition=Vector2(0,self:GetPortraitY()+size*0.28)
\t\t_PetLogic:AlignCustomPortrait(back,{frames={},canvas=128},3)
\t\tfront.UITransformComponent.RectSize=back.UITransformComponent.RectSize
\t\tfront.UITransformComponent.anchoredPosition=back.UITransformComponent.anchoredPosition
\t\tlocal duration=_PetLogic:GetCareDuration("feed")
\t\tlocal fade=math.max(0,math.min(1,elapsed/0.18,(duration-elapsed)/0.22))
\t\tfade=fade*fade*(3-2*fade)
\t\tback.SpriteGUIRendererComponent.Color=Color(1,1,1,fade)
\t\tfront.SpriteGUIRendererComponent.Color=Color(1,1,1,fade)
\tend

'''
s=replace(s,'\t@ExecSpace("ClientOnly")\n\tmethod void InitializeDuckyFoodBowl()',methods+'\t@ExecSpace("ClientOnly")\n\tmethod void InitializeDuckyFoodBowl()')
(stage/'PetHouseUI.mlua').write_text(s,encoding='utf-8')
s=read('PetLogic.mlua')
s=replace(s,'\tproperty string PetDuckMirrorRUID = ',f'\tproperty string PetDuckIconRUID = "{icon}"\n\tproperty number PetDuckMirrorWidth = 2.25\n\tproperty string PetDuckMirrorRUID = ')
s=replace(s,'\t\t\tlog("[VRF] PET-ODUCK dance buff +20% duration="..self.PetDuckBuffDuration)','\t\t\tself:NotifyOduckBuff(self.PetDuckBuffDuration,self.RunUserId)\n\t\t\tlog("[VRF] PET-ODUCK dance buff +20% duration="..self.PetDuckBuffDuration)')
s=replace(s,'description=v[2],icon=self.OduckMotions.icon','description=v[2],icon=self.PetDuckIconRUID')
s=replace(s,'\t\ttable.insert(assets,self.PetDuckMirrorRUID)','\t\ttable.insert(assets,self.PetDuckMirrorRUID)\n\t\ttable.insert(assets,self.PetDuckIconRUID)')
s=replace(s,'\t\tif active then log("[VRF] PET-ODUCK damage buff ended") end','\t\tif active then\n\t\t\tif self.RunUserId~="" then self:NotifyOduckBuff(0,self.RunUserId) end\n\t\t\tlog("[VRF] PET-ODUCK damage buff ended")\n\t\tend')
s=replace(s,'\t\tlocal mirrorY=p.y+self.PetDuckHeight+0.45+math.sin(elapsed*3)*0.025\n\t\tself:PlacePetSkillSprite(v.mirror,Vector3(p.x,mirrorY,p.z-0.05),0.75,0,fade*0.90)','\t\tlocal mirrorY=p.y+self.PetDuckHeight+0.80+math.sin(elapsed*3)*0.025\n\t\tself:PlacePetSkillSprite(v.mirror,Vector3(p.x,mirrorY,p.z-0.05),self.PetDuckMirrorWidth,0,fade*0.90)')
s=replace(s,'\t@ExecSpace("ServerOnly")\n\tmethod void ResetOduckBuff()','''\t@ExecSpace("Client")
\tmethod void NotifyOduckBuff(number duration)
\t\tif duration>0 then _CardManager:ShowOduckBuffIcon(duration)
\t\telse _CardManager:HideOduckBuffIcon() end
\tend

\t@ExecSpace("ServerOnly")
\tmethod void ResetOduckBuff()''')
(stage/'PetLogic.mlua').write_text(s,encoding='utf-8')
s=read('CardManager.mlua')
s=replace(s,'\tproperty Entity vampirePotionBuff = ', '\tproperty any oduckBuff = nil\n\tproperty any oduckBuffFill = nil\n\tproperty Entity vampirePotionBuff = ')
s=replace(s,'\t\telseif panel == self.vampirePotionBuff then return "potion_vampire"','\t\telseif panel == self.oduckBuff then return "pet_oduck"\n\t\telseif panel == self.vampirePotionBuff then return "potion_vampire"')
s=replace(s,'\t\telseif buffName == "potion_vampire" then return self.vampirePotionBuff','\t\telseif buffName == "pet_oduck" then return self.oduckBuff\n\t\telseif buffName == "potion_vampire" then return self.vampirePotionBuff')
s=replace(s,'\t\tself:HideBuffIcon(self.vampirePotionBuff, self.vampirePotionFill)','\t\tself:HideOduckBuffIcon()\n\t\tself:HideBuffIcon(self.vampirePotionBuff, self.vampirePotionFill)')
s=replace(s,'if paused or not entry.reversed then entry.startTime = entry.startTime + frozenFor end','if paused or not entry.reversed or entry.pauseInSafeArea then entry.startTime = entry.startTime + frozenFor end')
s=replace(s,'\tmethod void OnEndPlay()\n\t\tif self:IsClient() then','\tmethod void OnEndPlay()\n\t\tif self:IsClient() then\n\t\t\tself:HideOduckBuffIcon()\n\t\t\tif isvalid(self.oduckBuff) then self.oduckBuff:Destroy() end\n\t\t\tself.oduckBuff=nil self.oduckBuffFill=nil')
methods='''\t@ExecSpace("ClientOnly")
\tmethod void ShowOduckBuffIcon(number duration)
\t\tif duration<=0 or not isvalid(self.vampirePotionBuff) then return end
\t\tif not isvalid(self.oduckBuff) then
\t\t\tlocal panel=_SpawnService:SpawnByEntity(self.vampirePotionBuff,"OduckDanceBuff",Vector3(0,0,0),self.vampirePotionBuff.Parent,false)
\t\t\tpanel.Enable=false
\t\t\t-- SpawnByEntity copies the panel itself; create its two children explicitly.
\t\t\tlocal icon=_SpawnService:SpawnByEntity(self.vampirePotionBuff:GetChildByName("Icon"),"Icon",Vector3(0,0,0),panel,false)
\t\t\tlocal fill=_SpawnService:SpawnByEntity(self.vampirePotionBuff:GetChildByName("Fill"),"Fill",Vector3(0,0,0),panel,false)
\t\t\tfor _,child in ipairs({icon,fill}) do
\t\t\t\tlocal t=child.UITransformComponent
\t\t\t\tt.AnchorsMin=Vector2(0,0) t.AnchorsMax=Vector2(1,1) t.Pivot=Vector2(0.5,0.5)
\t\t\t\tt.RectSize=Vector2(50,50) t.anchoredPosition=Vector2(0,0) t.UIScale=Vector3(1,1,1)
\t\t\tend
\t\t\ticon.SpriteGUIRendererComponent.ImageRUID=DataRef(_PetLogic.PetDuckIconRUID)
\t\t\t_UILogic:SetSiblingIndex(icon.UITransformComponent,0)
\t\t\t_UILogic:SetSiblingIndex(fill.UITransformComponent,1)
\t\t\tself.oduckBuff=panel self.oduckBuffFill=fill.SpriteGUIRendererComponent
\t\tend
\t\t-- Keep the potion HUD's size, placement, radial countdown and shared reflow.
\t\tself:ShowBuffIcon(self.oduckBuff,self.oduckBuffFill,duration)
\t\tfor _,entry in ipairs(self._activeCooldowns) do
\t\t\tif entry.overlay==self.oduckBuffFill then entry.pauseInSafeArea=true end
\t\tend
\t\tlog("[VRF] PET-ODUCK passive countdown shown duration="..duration)
\tend

\t@ExecSpace("ClientOnly")
\tmethod void HideOduckBuffIcon()
\t\tif not isvalid(self.oduckBuff) then return end
\t\tself:HideBuffIcon(self.oduckBuff,self.oduckBuffFill)
\tend

'''
s=replace(s,'\t@ExecSpace("ClientOnly")\n\tmethod void ShowPotionBuffIcon(integer potionType, number duration)',methods+'\t@ExecSpace("ClientOnly")\n\tmethod void ShowPotionBuffIcon(integer potionType, number duration)')
(stage/'CardManager.mlua').write_text(s,encoding='utf-8')
def methods(s):return {m[1]:m[0]for m in re.finditer(r'(?ms)^\tmethod \w+ (\w+)\([^\n]*\)\n.*?^\tend',s)}
report={}
for name in ['PetHouseUI.mlua','PetLogic.mlua','CardManager.mlua']:
 a=methods(read(name));b=methods((stage/name).read_text(encoding='utf-8'));report[name]={'modified':[n for n in a if a[n]!=b[n]],'added':list(b.keys()-a.keys()),'preservedCount':sum(a[n]==b[n]for n in a)}
(stage/'scope.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
