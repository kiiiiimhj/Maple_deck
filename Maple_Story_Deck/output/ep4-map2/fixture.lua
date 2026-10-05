local live=_Ep4Map2EasterEggLogic
local realCard=_CardManager local realGame=_GameManager local realMap=_MapManager local realInventory=_PlayerInventory
local initialZone=realMap.CurrentMapIndex
local users=_UserService.UserEntities local user=nil
for _,u in pairs(users) do if isvalid(u) then user=u break end end
assert(isvalid(user)) local userId=user.PlayerComponent.UserId
_TeleportService:TeleportToMapPosition(user,Vector3(0,-1.32,0),"ep4_map2")
wait(1)
realGame:SetEasterEggPaused(true)
local counts={skill=0,coin=0,standard=0,toast=0} local timers={}
local roll=60 local zone=144 local level=0 local pool={3}
local _GameManager={GameStarted=true,GameOver=false,Wave=1,IsGamePaused=function() return false end,
 GetTimeStep=function() return 1 end,GetTimeStepHp=function() return 100 end,GetWaveApproachSpeed=function() return 0.15 end,
 GetGroundFallFor=function() return Vector2(0,-1.32) end,
 ScheduleLootDrop=function(_,p,icon,fall,ground,callback,scale) assert(icon=="ecfe24412de04eaf98b1dd188bbb21b8") table.insert(timers,callback) end}
local _MapManager={CurrentMapIndex=144,AwayOnSideMap=false,GetSpawnPositionForIndex=function(_,i) return Vector3((i-144)*15.5,0,0) end,
 GetZoneInfo=function(_,i) return realMap:GetZoneInfo(i) end}
local _PlayerInventory={ReserveAcquisitionOrder=function() end,GetItemCount=function() return counts.coin end,
 AddItem=function(_,id,n) counts.coin=counts.coin+n end,RemoveItem=function(_,id,n) if counts.coin<n then return false end counts.coin=counts.coin-n return true end}
local _CardManager={PotionLevel=0,Potion2RUID=realCard.Potion2RUID,BuildActiveUpgradePool=function() return pool end,
 GrantCardUpgradesFromPool=function(_,p,pos,fall,ground,scale,n) assert(n==1) counts.skill=counts.skill+1 end,
 GetCurrentMap=function() return realCard:GetCurrentMap() end,
 SpawnEffectWithModel=function(_,...) return realCard:SpawnEffectWithModel(...) end,
 GetMonstersInCurrentZone=function(_,map) return realCard:GetMonstersInCurrentZone(map) end,
 FindClosestByPosition=function(_,map,pos) return realCard:FindClosestByPosition(map,pos) end}
local _Ep4Map1EasterEggLogic={GrantStandardReward=function() counts.standard=counts.standard+1 end}
local _UIToast={ShowMessage=function(_,key) counts.toast=counts.toast+1 counts.lastToast=key end}
local _UtilLogic={RandomIntegerRange=function(_,min,max) return math.min(max,math.max(min,roll)) end}
local l={Placed=false,Healed=false,SummonUsed=false,CoinItemId=live.CoinItemId,HealedRUID=live.HealedRUID,
 TargetX=live.TargetX,TargetY=live.TargetY,PlacementTolerance=live.PlacementTolerance,
 _originalPositions=live._originalPositions,_originalSprites=live._originalSprites,_used={},_invaders={},_revision=0}
local a={Duration=60,AttackInterval=3,AoeRadius=4.3,DamageRatio=2/3,_summon=nil,_parent=nil,_remaining=0,_zone=-1,
 _phase=0,_phaseTime=0,_attackWait=0,_pack={},_damage=0,Packs=_Ep4Map2SummonLogic.Packs}
local _Ep4Map2SummonLogic=a
a.SummonAlly=function(self)
		-- 두 리소스팩 중 하나를 동일 확률로 선택하고 실제 생성 성공 후에만 수명을 시작한다.
		self:EndSummon(false)
		self._pack=self.Packs[_UtilLogic:RandomIntegerRange(1,#self.Packs)]
		if not self:Relocate() then return false end
		self._remaining=self.Duration self._attackWait=self.AttackInterval
		self._damage=_GameManager:GetTimeStepHp(_GameManager:GetTimeStep())*self.DamageRatio
		return true
end
a.Relocate=function(self)
		-- 같은 물리 맵 내 존 이동도 감지한다. 비전투 사이드맵에서는 실제 현재 맵의 플레이어를 따른다.
		local map=_CardManager:GetCurrentMap()
		local info=_MapManager:GetZoneInfo(_MapManager.CurrentMapIndex)
		if not isvalid(map) or info==nil then return false end
		local p=Vector3(info.spawnX-1,info.landY,-2)
		if _MapManager.AwayOnSideMap then
			local users=_UserService.UserEntities
			for _,user in pairs(users) do
				if user.CurrentMap==map then local wp=user.TransformComponent.WorldPosition p=Vector3(wp.x-1,wp.y,-2) break end
			end
		end
		local fresh=_CardManager:SpawnEffectWithModel(self._pack.stand,_MonsterSpawner:ToLocalSpawnPos(map,p),0,1,1,1,"persistenteffect")
		if not isvalid(fresh) then return false end
		if isvalid(self._summon) then self._summon:Destroy() end
		self._summon=fresh self._parent=map self._zone=_MapManager.CurrentMapIndex self._phase=0 self._phaseTime=0
		return true
end
a.OnUpdate=function(self,delta)
		-- 일시정지 동안 수명/공격 시간을 함께 멈추고 게임 종료에는 즉시 정리한다.
		if self._remaining<=0 then return end
		if _GameManager.GameOver or not _GameManager.GameStarted then self:EndSummon(false) return end
		if _GameManager:IsGamePaused() then return end
		self._remaining=self._remaining-delta
		if self._remaining<=0 then self:EndSummon(true) return end
		local map=_CardManager:GetCurrentMap()
		if not isvalid(self._summon) or self._zone~=_MapManager.CurrentMapIndex or self._parent~=map then
			if not self:Relocate() then return end
		end
		if _MapManager.AwayOnSideMap then return end
		if self._phase>0 then
			self._phaseTime=self._phaseTime+delta
			if self._phase==1 and self._phaseTime>=0.6 then self:ResolveHit() self._phase=2 end
			if self._phaseTime>=1.2 then self._summon.SpriteRendererComponent.SpriteRUID=self._pack.stand self._phase=0 end
			return
		end
		self._attackWait=self._attackWait-delta
		local target=_CardManager:FindClosestByPosition(map,self._summon.TransformComponent.Position)
		if not isvalid(target) or not isvalid(target.Entity) or target._dead then return end
		local tp=target.Entity.TransformComponent.WorldPosition
		local p=self._summon.TransformComponent.WorldPosition
		local dx=tp.x-p.x
		local r=self._summon.SpriteRendererComponent
		r.FlipX=dx>0
		if math.abs(dx)>1.2 then
			-- persistenteffect에는 물리 body가 없으므로 지면 높이를 유지한 채 짧게 다가간다.
			local step=math.min(math.abs(dx)-1.2,delta*2)
			self._summon.TransformComponent.Position=_MonsterSpawner:ToLocalSpawnPos(map,Vector3(p.x+(dx>0 and step or -step),p.y,p.z))
			if r.SpriteRUID~=self._pack.move then r.SpriteRUID=self._pack.move end
		else
			if self._attackWait<=0 then
				self._hitCenter=tp self._attackZone=self._zone self._phase=1 self._phaseTime=0
				self._attackWait=self.AttackInterval-1.2 r.SpriteRUID=self._pack.attack
				_SoundOptionLogic:PlaySfx(self._pack.sound,1)
			elseif r.SpriteRUID~=self._pack.stand then r.SpriteRUID=self._pack.stand end
		end
end
a.ResolveHit=function(self)
		-- 공격 중 대상이 죽어도 현재 존의 범위 판정은 끝까지 수행한다. 다른 존에는 피해를 주지 않는다.
		if self._attackZone~=_MapManager.CurrentMapIndex or not isvalid(self._summon) then return end
		local map=_CardManager:GetCurrentMap() local center=self._hitCenter
		for _,m in ipairs(_CardManager:GetMonstersInCurrentZone(map)) do
			if isvalid(m) and not m._dead and isvalid(m.Entity) then
				local p=m.Entity.TransformComponent.WorldPosition local dx=p.x-center.x local dy=p.y-center.y
				if dx*dx+dy*dy<=self.AoeRadius*self.AoeRadius then
					m:TakeDamage(self._damage)
					local fx=_CardManager:SpawnEffectWithModel(self._pack.hit[1],_MonsterSpawner:ToLocalSpawnPos(map,Vector3(p.x,p.y+0.3,p.z-0.05)),0,1,1,1,"skilleffect")
					if isvalid(fx) then
						if #self._pack.hit>1 then
							local frames=self._pack.hit
							for i=2,#frames do
								local ruid=frames[i]
								_TimerService:SetTimerOnce(function() if isvalid(fx) then fx.SpriteRendererComponent.SpriteRUID=ruid end end,(i-1)*0.08)
							end
						end
						fx:Destroy(0.6)
					end
				end
			end
		end
end
a.EndSummon=function(self,animate)
		-- 과거 소환의 공격 예약을 남기지 않는다. 만료에만 사망 클립을 잠깐 보여준다.
		self._remaining=0 self._phase=0 self._zone=-1
		if isvalid(self._summon) then
			if animate then self._summon.SpriteRendererComponent.SpriteRUID=self._pack.die self._summon:Destroy(0.8)
			else self._summon:Destroy() end
		end
		self._summon=nil self._parent=nil
end
l.ValidObject=function(self,egg,obj,userId)
		-- 서버에서 실제 맵/존/호출자와 원래 배치를 검증한다. 드래그 미리보기 좌표를 신뢰하지 않는다.
		if egg<1 or egg>6 or not isvalid(obj) then return false end
		if obj~=_EntityService:GetEntityByPath("/maps/ep4_map2/esteregg_" .. egg) then return false end
		if not _GameManager.GameStarted or _GameManager.GameOver or _GameManager:IsGamePaused() then return false end
		local user=_UserService:GetUserEntityByUserId(userId)
		if not isvalid(user) or user.CurrentMap~=obj.CurrentMap then return false end
		local zone=_MapManager.CurrentMapIndex
		if zone<144 or zone>153 then return false end
		local p=self._originalPositions[egg]
		return p~=nil and math.abs(p.x-_MapManager:GetSpawnPositionForIndex(zone).x)<8
end
l.CheckPlacement=function(self,obj,x,y,userId)
		-- 기존 배치 퍼즐과 같은 0.4 오차 안에서만 성공하며 보상은 한 번 지급한다.
		if self.Placed or not self:ValidObject(1,obj,userId) then return end
		local dx=x-self.TargetX local dy=y-self.TargetY
		if x~=x or y~=y or dx*dx+dy*dy>self.PlacementTolerance*self.PlacementTolerance then
			obj.TransformComponent.Position=self._originalPositions[1]
			return
		end
		self.Placed=true
		obj.TransformComponent.Position=Vector3(self.TargetX,self.TargetY,self._originalPositions[1].z)
		_Ep4Map1EasterEggLogic:GrantStandardReward(obj)
		_UIToast:ShowMessage("EP4M2_PLACED",userId)
end
l.OnObjectTouched=function(self,egg,obj,userId)
		-- 중복 지급은 조건 충족 직후 차단하고 보상은 기존 드롭 연출을 재사용한다.
		if not self:ValidObject(egg,obj,userId) then return end
		if egg==2 then
			if self.Healed then return end
			if _CardManager.PotionLevel<2 then
				_UIToast:ShowMessage("EP4M2_NEEDS_HEAL",userId)
				self:ShowRequirement(obj,_CardManager.Potion2RUID)
				return
			end
			self.Healed=true
			obj.SpriteRendererComponent.SpriteRUID=self.HealedRUID
			self:GrantSkill(obj)
			local p=obj.TransformComponent.WorldPosition local f=_GameManager:GetGroundFallFor(obj,p)
			local revision=self._revision
			_PlayerInventory:ReserveAcquisitionOrder(self.CoinItemId)
			_GameManager:ScheduleLootDrop(p,"ecfe24412de04eaf98b1dd188bbb21b8",f.x,f.y,function()
				if revision==self._revision and self.Healed then _PlayerInventory:AddItem(self.CoinItemId,1) end
			end,1)
			_UIToast:ShowMessage("EP4M2_HEALED",userId)
		elseif egg==3 then
			if self.SummonUsed then return end
			if not _PlayerInventory:RemoveItem(self.CoinItemId,1) then
				_UIToast:ShowMessage("EP4M2_NO_COIN",userId)
				self:ShowRequirement(obj,"ecfe24412de04eaf98b1dd188bbb21b8")
				return
			end
			if not _Ep4Map2SummonLogic:SummonAlly() then _PlayerInventory:AddItem(self.CoinItemId,1) return end
			self.SummonUsed=true
			_UIToast:ShowMessage("EP4M2_SUMMON",userId)
		elseif egg>=4 then
			if self._used[egg] then return end
			self._used[egg]=true
			if _UtilLogic:RandomIntegerRange(1,100)<=60 then
				if self:SpawnInvaders(obj)==0 then self._used[egg]=nil return end
				_UIToast:ShowMessage("EP4M2_INVADERS",userId)
			else
				self:GrantSkill(obj)
			end
			obj.Enable=false
		end
end
l.GrantSkill=function(self,obj)
		-- 소장 스킬이 아닌 현재 인게임 슬롯의 강화 가능 스킬 한 개를 지급한다.
		local p=obj.TransformComponent.WorldPosition local f=_GameManager:GetGroundFallFor(obj,p)
		local pool=_CardManager:BuildActiveUpgradePool()
		if #pool>0 then _CardManager:GrantCardUpgradesFromPool(pool,p,f.x,f.y,1,1,0) end
end
l.ShowRequirement=function(self,obj,icon)
		-- 기존 NPC의 흰 말풍선/아이콘 배치와 표시 시간을 그대로 재사용한다.
		local p=obj.TransformComponent.WorldPosition
		_Ep2Map1GiftNpcLogic:SpawnBubble(obj.CurrentMap,Vector3(p.x-0.765297,p.y+0.9155867,p.z-0.5),icon,"",false,1,_Ep2Map1GiftNpcLogic.DefaultIconPosition,_Ep2Map1GiftNpcLogic.DefaultIconScale)
		local bubble=_Ep2Map1GiftNpcLogic._activeBubble
		if isvalid(bubble) then _CollectBubbleLogic:ApplyForegroundDepth(bubble) end
end
l.SpawnInvaders=function(self,obj)
		-- 기존 지상 침입자 초기화로 광기의 무도회 주민 5마리를 지면에 펼쳐 놓는다.
		local zone=_MapManager.CurrentMapIndex local info=_MapManager:GetZoneInfo(zone)
		local map=_MonsterSpawner:GetZoneEntity(zone)
		if not isvalid(map) or info==nil then return 0 end
		local count=0 local hp=_GameManager:GetTimeStepHp(_GameManager:GetTimeStep())*2
		for i=1,5 do
			local world=Vector3(info.spawnX+(i-3)*1.2,info.landY,0)
			local p=_MonsterSpawner:ToLocalSpawnPos(map,world)
			local e=_SpawnService:SpawnByModelId(_MonsterSpawner.MonsterModelId,"Ep4BallResident" .. i,p,map)
			if isvalid(e) then
				---@type MonsterAI
				local ai=e:GetComponent("script.MonsterAI")
				if ai~=nil then
					ai:InitializeGroundAlienInvader(zone,hp,_GameManager:GetWaveApproachSpeed(_GameManager.Wave),"36c9662683db4d0cb67c48627b080796","2c8b00d5a1774085b063d18551d1e279","2ba57894b82f4efda5e80dbedb7cf67b","2805bf31ea364d80ba136776ed3e0663",0.8,"b4a1ab38881847618788a82c13b38746",p.x,p.y)
					ai:SetMinionAttack("b4a1ab38881847618788a82c13b38746",1.2,true)
					ai:SetMinionHitEffect("8f40bd74d19b4104a463e90296d127bd",0.6)
					ai:SetAlienInvaderSounds("2a8c07434f1744519429d36205eb8d4d","5743a7d40141467fba61d7de41af378d","46ddfba0306d4f489fd953e36aa9cb2f")
					table.insert(self._invaders,e) count=count+1
				else e:Destroy() end
			end
		end
		log("Ep4Map2: invaders=" .. count .. " hp=" .. hp)
		return count
end
l.ResetForNewRun=function(self)
		-- 새 게임/다시하기만 초기화한다. 이어하기에서는 동전/성공 상태를 유지한다.
		self._revision=self._revision+1 self.Placed=false self.Healed=false self.SummonUsed=false self._used={}
		_Ep4Map2SummonLogic:EndSummon(false)
		for _,e in ipairs(self._invaders) do if isvalid(e) then e:Destroy() end end
		self._invaders={}
		for i=1,6 do
			local e=_EntityService:GetEntityByPath("/maps/ep4_map2/esteregg_" .. i)
			if isvalid(e) and self._originalPositions[i]~=nil then
				e.Enable=true e.TransformComponent.Position=self._originalPositions[i]
				e.SpriteRendererComponent.SpriteRUID=self._originalSprites[i]
			end
		end
end
assert(realInventory:GetItemDef("ep4_helper_coin").icon=="ecfe24412de04eaf98b1dd188bbb21b8")
for i=1,6 do
 local e=_EntityService:GetEntityByPath("/maps/ep4_map2/esteregg_" .. i)
 assert(isvalid(e) and e.TouchReceiveComponent.AutoFitToSize and e:GetComponent("script.Ep4Map2EasterEggTrigger").EggNumber==i)
end
local e1=_EntityService:GetEntityByPath("/maps/ep4_map2/esteregg_1")
assert(l:ValidObject(1,e1,userId)) assert(not l:ValidObject(2,e1,userId))
l:CheckPlacement(e1,0,0,userId) assert(not l.Placed)
l:CheckPlacement(e1,l.TargetX+0.15,l.TargetY,userId)
assert(l.Placed and counts.standard==1 and math.abs(e1.TransformComponent.Position.x-l.TargetX)<0.001)
l:CheckPlacement(e1,l.TargetX,l.TargetY,userId) assert(counts.standard==1)
log("EP4M2_PLACEMENT_PASS miss=true tolerance=true duplicate=true")
_MapManager.CurrentMapIndex=146 realMap.CurrentMapIndex=146
local e2=_EntityService:GetEntityByPath("/maps/ep4_map2/esteregg_2")
l:OnObjectTouched(2,e2,userId) assert(not l.Healed and counts.lastToast=="EP4M2_NEEDS_HEAL")
local bubble=_Ep2Map1GiftNpcLogic._activeBubble
assert(isvalid(bubble) and bubble:GetChildByName("Icon").SpriteRendererComponent.SpriteRUID==realCard.Potion2RUID)
assert(bubble.SpriteRendererComponent.OrderInLayer==1000)
_CardManager.PotionLevel=2
l:OnObjectTouched(2,e2,userId) l:OnObjectTouched(2,e2,userId)
assert(l.Healed and counts.skill==1 and #timers==1 and e2.SpriteRendererComponent.SpriteRUID==l.HealedRUID)
timers[1]() assert(counts.coin==1)
log("EP4M2_HEAL_PASS potionLevel2=true sprite=true skill1=true junkCoin1=true duplicate=true bubble=true")
_MapManager.CurrentMapIndex=148 realMap.CurrentMapIndex=148
local e3=_EntityService:GetEntityByPath("/maps/ep4_map2/esteregg_3")
counts.coin=0 l:OnObjectTouched(3,e3,userId) assert(not l.SummonUsed and counts.lastToast=="EP4M2_NO_COIN")
counts.coin=1 roll=1 l:OnObjectTouched(3,e3,userId) l:OnObjectTouched(3,e3,userId)
assert(l.SummonUsed and counts.coin==0 and isvalid(a._summon) and a._remaining==60)
local wp=a._summon.TransformComponent.WorldPosition assert(math.abs(wp.x-61)<0.01)
local old=a._summon a:OnUpdate(0.1) assert(a._summon==old and a._remaining<60)
_GameManager.IsGamePaused=function() return true end
local remaining=a._remaining a:OnUpdate(10) assert(a._remaining==remaining)
_GameManager.IsGamePaused=function() return false end
_MapManager.CurrentMapIndex=149 realMap.CurrentMapIndex=149 a:OnUpdate(0.1)
assert(a._summon~=old and math.abs(a._summon.TransformComponent.WorldPosition.x-76.5)<0.01 and a._remaining>59)
_MapManager.CurrentMapIndex=134 realMap.CurrentMapIndex=134 a:OnUpdate(0.1)
assert(a._summon.CurrentMap.Name=="ep4_map1" and a._remaining>59)
a:OnUpdate(61) assert(a._summon==nil and a._remaining==0)
log("EP4M2_SUMMON_PASS coinConsumed=true duration60=true sameZoneNoRespawn=true crossZone=true crossMap=true pause=true expiry=true")
-- Both native packs resolve into visible clips.
for _,pack in ipairs(a.Packs) do
 for _,ruid in ipairs({pack.stand,pack.move,pack.attack,pack.die}) do
  local clip=_ResourceService:LoadAnimationClipAndWait(ruid) assert(clip~=nil and clip.Frames.Count>0,"missing " .. ruid)
 end
end
_MapManager.CurrentMapIndex=149 realMap.CurrentMapIndex=149
local e4=_EntityService:GetEntityByPath("/maps/ep4_map2/esteregg_4")
roll=60 l:OnObjectTouched(4,e4,userId) l:OnObjectTouched(4,e4,userId)
assert(#l._invaders==5 and l._used[4] and not e4.Enable)
local ais={}
for _,e in ipairs(l._invaders) do
 local ai=e:GetComponent("script.MonsterAI")
 assert(ai.MaxHp==200 and ai.CurrentHp==200 and ai._spawnZoneIndex==149,"invader hp=" .. ai.CurrentHp .. "/" .. ai.MaxHp .. " zone=" .. ai._spawnZoneIndex)
 assert(ai._standRUID=="36c9662683db4d0cb67c48627b080796" and ai._attackRUID=="b4a1ab38881847618788a82c13b38746")
 table.insert(ais,ai)
end
_CardManager.GetMonstersInCurrentZone=function() return ais end
-- Arrange three inside range and two outside; no death or persistent reward is possible.
local center=ais[1].Entity.TransformComponent.WorldPosition
for i,ai in ipairs(ais) do
 local p=Vector3(center.x+(i<=3 and (i-1)*0.5 or 8),center.y,center.z)
 ai.Entity.TransformComponent.Position=_MonsterSpawner:ToLocalSpawnPos(ai.Entity.Parent,p)
end
a._pack=a.Packs[2] a._damage=10 a._attackZone=149 a._hitCenter=center
a._summon=realCard:SpawnEffectWithModel(a._pack.stand,Vector3(0,-1.32,-2),0,1,1,1,"persistenteffect")
a:ResolveHit()
for i,ai in ipairs(ais) do assert(ai.CurrentHp==(i<=3 and 190 or 200),"aoe " .. i .. " hp=" .. ai.CurrentHp) end
a:EndSummon(false)
_MapManager.CurrentMapIndex=150 realMap.CurrentMapIndex=150 roll=61
local e5=_EntityService:GetEntityByPath("/maps/ep4_map2/esteregg_5")
l:OnObjectTouched(5,e5,userId) l:OnObjectTouched(5,e5,userId)
assert(counts.skill==2 and #l._invaders==5 and l._used[5])
_MapManager.CurrentMapIndex=153 realMap.CurrentMapIndex=153 pool={}
local e6=_EntityService:GetEntityByPath("/maps/ep4_map2/esteregg_6")
l:OnObjectTouched(6,e6,userId) assert(l._used[6] and counts.skill==2)
log("EP4M2_CHESTS_PASS roll60=5mobs roll61=1skill hpDouble=true duplicates=true emptySlotSafe=true AOE3Inside2Outside=true")
l:ResetForNewRun()
assert(not l.Placed and not l.Healed and not l.SummonUsed and #l._invaders==0)
for i=1,6 do
 local e=_EntityService:GetEntityByPath("/maps/ep4_map2/esteregg_" .. i)
 assert(e.Enable and e.SpriteRendererComponent.SpriteRUID==l._originalSprites[i])
end
realMap.CurrentMapIndex=initialZone
live:ResetForNewRun()
realGame:SetEasterEggPaused(false)
if isvalid(_Ep2Map1GiftNpcLogic._activeBubble) then _Ep2Map1GiftNpcLogic._activeBubble:Destroy() end
log("EP4M2_RESET_PASS restorePosition=true restoreSprite=true summonCleanup=true")
