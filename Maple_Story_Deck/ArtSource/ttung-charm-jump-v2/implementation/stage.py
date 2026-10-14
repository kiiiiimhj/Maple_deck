from pathlib import Path
import json,re,hashlib
stage=Path('work/ttung-charm-jump-v2');out=Path('outputs/ttung-charm-jump-v2')
path=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua')
raw=path.read_bytes();s=path.read_text(encoding='utf-8-sig');before=s
(stage/'PetLogic.before.mlua').write_bytes(raw)
assets=json.loads((out/'applied-assets.json').read_text(encoding='utf-8'));timing=json.loads((out/'timing.json').read_text(encoding='utf-8'));assert len(assets)==24
def change(a,b):
 global s
 assert s.count(a)==1,(a[:80],s.count(a));s=s.replace(a,b)
def method(name,body):
 global s
 p=r'(?ms)^\tmethod \w+ '+name+r'\([^\n]*\)\n.*?^\tend'
 assert len(re.findall(p,s))==1,name
 s=re.sub(p,lambda m:body.rstrip(),s)
ruids=[assets[f'jump-{i+1:02}']['ruid']for i in range(24)]
for name,val in [('PetCharmJumpRUIDs','{'+','.join('"'+r+'"'for r in ruids)+'}'),('PetCharmJumpFeet','{'+','.join('0.46875'for _ in ruids)+'}'),('PetCharmJumpMouth','{'+','.join(str((124-p['mouth'])/128)for p in timing['frames'])+'}'),('PetCharmJumpNods','{'+','.join(str(p['d'])for p in timing['frames'])+'}'),('PetCharmJumpPeriod','0.8'),('PetCharmLaunchTime','0.16')]:
 p=r'(?m)^(\tproperty \w+ '+name+r' = ).*$';assert len(re.findall(p,s))==1;s=re.sub(p,lambda m:m[1]+val,s)
change('if self:IsClient() then self:UpdatePetSkillVisual(delta) return end','if self:IsClient() then self:WarmPetCharmRenderPool();self:UpdatePetSkillVisual(delta) return end')
change('if phase<=self.PetCharmLaunchTime or phase>=0.54 then return 0 end','if phase<=self.PetCharmLaunchTime or phase>=0.64 then return 0 end')
change('(0.54-self.PetCharmLaunchTime)','(0.64-self.PetCharmLaunchTime)')
change('return 4*0.36*u*(1-u)','return 4*0.42*u*(1-u)')
change('log("[VRF] TTUNG-JUMP twenty frames prewarmed="..tostring(ready))','log("[VRF] TTUNG-JUMP articulated frames loaded="..tostring(ready))')
change('''\t\tself:ClearPetSkillVisual()
\t\tlocal player=_UserService.LocalPlayer''','''\t\tif petId=="ttungttang" then
\t\t\tlocal pool=self._T.petCharmRenderPool
\t\t\tif not self.PetCharmJumpReady or pool==nil or not pool.ready then
\t\t\t\tself._T.pendingPetCharmVisual={petId=petId,zone=zone,run=run,route=routeJSON,anchor=anchor,serial=serial}
\t\t\t\treturn
\t\t\tend
\t\tend
\t\tself:ClearPetSkillVisual()
\t\tlocal player=_UserService.LocalPlayer''')
change('local fx=self:SpawnPetSkillSprite(bodyRUID,map,132)','local pool=petId=="ttungttang" and self._T.petCharmRenderPool or nil\n\t\tlocal fx=pool~=nil and pool.bodies[1] or self:SpawnPetSkillSprite(bodyRUID,map,132)')
change('''\t\t\tif self.PetCharmJumpReady then
\t\t\t\tlocal bodies={fx}
\t\t\t\tfor i=2,#self.PetCharmJumpRUIDs do bodies[i]=self:SpawnPetSkillSprite(self.PetCharmJumpRUIDs[i],map,132) end
\t\t\t\tself._T.petSkillVisual.charmBodies=bodies self._T.petSkillVisual.charmFrame=1
\t\t\tend
\t\t\tfor i=1,6 do table.insert(self._T.petSkillVisual.waves,self:SpawnPetSkillSprite(self.PetCharmWaveRUID,map,130)) end
\t\t\tfor i=1,16 do table.insert(self._T.petSkillVisual.hearts,self:SpawnPetSkillSprite(self.PetCharmHeartRUID,map,131)) end''','''\t\t\tlocal v=self._T.petSkillVisual
\t\t\tv.charmPool=true v.charmBodies=pool.bodies v.charmFrame=1
\t\t\tv.waves=pool.waves v.hearts=pool.hearts
\t\t\t-- Integral source-pixel scale and a snapped origin keep every ink pixel stable.
\t\t\tv.charmWidth=128*pixel*math.max(1,math.floor(self.PetCharmWidth/(128*pixel)+0.5))''')
start=s.index('\t\tif v.id=="ttungttang" then',s.index('\tmethod void UpdatePetSkillVisual('));end=s.index('\t\telseif v.id=="oduck" then',start)
branch=s[start:end]
branch=branch.replace('local fade=math.min(1,t/0.12)*(v.ending and math.max(0,1-v.endAge/0.18) or 1)','local fade=v.ending and math.max(0,1-v.endAge/0.18) or 1')
branch=branch.replace('local p=v.center local width=self.PetCharmWidth','local p=v.center local width=v.charmWidth or self.PetCharmWidth')
branch=branch.replace('self:PlacePetSkillSprite(', 'self:PlacePetCharmSprite(')
branch=branch.replace('previous.Enable=false','previous.SpriteRendererComponent.Color=Color(1,1,1,0)')
branch=branch.replace('slot*0.66','slot*self.PetCharmJumpPeriod').replace('elapsed%1.32','elapsed%(self.PetCharmJumpPeriod*2)')
branch=branch.replace('''-- Every texture is fixed on its actor and already prewarmed. Reveal the
\t\t\t\t\t-- next complete pose before hiding the previous one; never reload a RUID mid-hop.''','''-- Reuse render-warmed actors. Only opacity changes: no activation
\t\t\t\t\t-- or texture reassignment can restart the renderer at a pose boundary.''')
s=s[:start]+branch+s[end:]
method('ClearPetSkillVisual','''\tmethod void ClearPetSkillVisual()
\t\tself._T.pendingPetCharmVisual=nil
\t\tlocal v=self._T.petSkillVisual if v==nil then return end
\t\tif v.charmPool then
\t\t\tfor _,list in ipairs({v.charmBodies,v.waves,v.hearts}) do
\t\t\t\tfor _,actor in ipairs(list) do if isvalid(actor) then actor.SpriteRendererComponent.Color=Color(1,1,1,0) end end
\t\t\tend
\t\t\tself._T.petSkillVisual=nil return
\t\tend
\t\tif isvalid(v.body) then v.body:Destroy() end
\t\tif isvalid(v.hitFx) then v.hitFx:Destroy() end
\t\tif isvalid(v.mirror) then v.mirror:Destroy() end
\t\tfor _,dust in ipairs(v.dusts) do if isvalid(dust.fx) then dust.fx:Destroy() end end
\t\tfor _,list in ipairs({v.waves,v.hearts}) do for _,e in ipairs(list) do if isvalid(e) then e:Destroy() end end end
\t\tself._T.petSkillVisual=nil
\tend''')
change('if self:IsClient() then self:ClearPetSkillVisual() else self:ResetOduckBuff() end','if self:IsClient() then self:ClearPetSkillVisual();self:ClearPetCharmRenderPool() else self:ResetOduckBuff() end')
extra='''\t@ExecSpace("ClientOnly")
\tmethod void ClearPetCharmRenderPool()
\t\tlocal pool=self._T.petCharmRenderPool
\t\tif pool~=nil then
\t\t\tfor _,list in ipairs({pool.bodies,pool.waves,pool.hearts}) do
\t\t\t\tfor _,actor in ipairs(list) do if isvalid(actor) then actor:Destroy() end end
\t\t\tend
\t\tend
\t\tself._T.petCharmRenderPool=nil
\tend

\t@ExecSpace("ClientOnly")
\tmethod void PlacePetCharmSprite(Entity fx, Vector3 pos, number width, number rotation, number alpha)
\t\tif not isvalid(fx) then return end
\t\tlocal metrics=_CardManager:GetSpriteMetrics(fx.SpriteRendererComponent.SpriteRUID)
\t\tif metrics.w<=0 or metrics.h<=0 then return end
\t\t_MonsterProjectileFx:PlaceVisual(fx,metrics,pos,width/metrics.w,rotation)
\t\tfx.SpriteRendererComponent.Color=Color(1,1,1,math.max(0,math.min(1,alpha)))
\t\t-- Keep the renderer alive even in its transparent pose; never reactivate on a swap.
\t\tfx.Enable=true
\tend

\t@ExecSpace("ClientOnly")
\tmethod void WarmPetCharmRenderPool()
\t\tlocal player=_UserService.LocalPlayer
\t\tlocal map=isvalid(player) and player.CurrentMap or nil
\t\tif not isvalid(map) or not self.PetCharmJumpReady then return end
\t\tlocal pool=self._T.petCharmRenderPool
\t\tif pool~=nil and (pool.map~=map or not isvalid(pool.map)) then self:ClearPetCharmRenderPool();pool=nil end
\t\tif pool==nil then
\t\t\tpool={map=map,bodies={},waves={},hearts={},warmFrames=0,ready=false}
\t\t\tself._T.petCharmRenderPool=pool
\t\t\tfor _,ruid in ipairs(self.PetCharmJumpRUIDs) do table.insert(pool.bodies,self:SpawnPetSkillSprite(ruid,map,132)) end
\t\t\tfor i=1,6 do table.insert(pool.waves,self:SpawnPetSkillSprite(self.PetCharmWaveRUID,map,130)) end
\t\t\tfor i=1,16 do table.insert(pool.hearts,self:SpawnPetSkillSprite(self.PetCharmHeartRUID,map,131)) end
\t\tend
\t\tif not pool.ready then
\t\t\tlocal p=_UILogic:ScreenToWorldPosition(Vector2(_UILogic.ScreenWidth*0.5,_UILogic.ScreenHeight*0.5))
\t\t\tlocal loaded=true
\t\t\tfor _,list in ipairs({pool.bodies,pool.waves,pool.hearts}) do
\t\t\t\tfor _,actor in ipairs(list) do
\t\t\t\t\tif not isvalid(actor) then loaded=false else
\t\t\t\t\t\tlocal sprite=_ResourceService:LoadSpriteAndWait(actor.SpriteRendererComponent.SpriteRUID)
\t\t\t\t\t\tif sprite==nil or not sprite.IsLoadComplete then loaded=false end
\t\t\t\t\t\tactor.SpriteRendererComponent.PlayRate=0
\t\t\t\t\t\t-- A sub-pixel opacity warm draw binds each texture before the first cast.
\t\t\t\t\t\tself:PlacePetCharmSprite(actor,Vector3(p.x,p.y,0),self.PetCharmWidth,0,0.000001)
\t\t\t\t\tend
\t\t\t\tend
\t\t\tend
\t\t\tpool.warmFrames=loaded and pool.warmFrames+1 or 0
\t\t\tif pool.warmFrames>=4 then
\t\t\t\tfor _,list in ipairs({pool.bodies,pool.waves,pool.hearts}) do for _,actor in ipairs(list) do actor.SpriteRendererComponent.Color=Color(1,1,1,0) end end
\t\t\t\tpool.ready=true
\t\t\t\tlog("[VRF] TTUNG-JUMP render pool ready frames="..pool.warmFrames.." poses="..#pool.bodies)
\t\t\tend
\t\tend
\t\tlocal pending=self._T.pendingPetCharmVisual
\t\tif pool.ready and pending~=nil then
\t\t\tself._T.pendingPetCharmVisual=nil
\t\t\tself:StartPetSkillVisual(pending.petId,pending.zone,pending.run,pending.route,pending.anchor,pending.serial)
\t\tend
\tend

'''
change('\t@ExecSpace("ClientOnly")\n\tmethod void GetUnusedMethodNeverCalled()',extra) if False else None
needle='\t@ExecSpace("ClientOnly")\n\tmethod void PreloadPetSkillArtwork()'
change(needle,extra+needle)
def methods(t):return{m[1]:m[0]for m in re.finditer(r'(?ms)^\tmethod \w+ (\w+)\([^\n]*\)\n.*?^\tend',t)}
a,b=methods(before),methods(s);modified=[n for n in a if a[n]!=b[n]]
allowed={'OnUpdate','GetPetCharmJumpHeight','PreloadPetSkillArtwork','StartPetSkillVisual','UpdatePetSkillVisual','ClearPetSkillVisual','OnEndPlay'};assert set(modified)==allowed,modified
(stage/'PetLogic.mlua').write_text(s,encoding='utf-8')
(stage/'sources.json').write_text(json.dumps({'PetLogic.mlua':{'path':str(path),'sha256':hashlib.sha256(raw).hexdigest()}},indent=2),encoding='utf-8')
preserved={str(p):hashlib.sha256(p.read_bytes()).hexdigest()for p in[Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetHouseUI.mlua'),Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Card/CardManager.mlua'),Path('G:/Maple_Story_Deck/RootDesk/MyDesk/MonsterAI.mlua'),Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetProgress.mlua')]}
(stage/'preserved.json').write_text(json.dumps(preserved,indent=2),encoding='utf-8')
(out/'scope.json').write_text(json.dumps({'modifiedMethods':modified,'newMethods':list(b.keys()-a.keys()),'frames':24,'gpuWarmDraws':4,'noRendererActivationOnPoseChange':True,'pixelScaleIntegral':True,'launch':.16,'otherPetsUnchanged':True,'poolOffset55Preserved':True},indent=2),encoding='utf-8')
print('24 articulated frames and render-warmed persistent actors staged. Other pet behavior preserved.')
