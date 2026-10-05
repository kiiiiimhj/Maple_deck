local live=_Ep4Map4EasterEggLogic local game=_GameManager local mapMgr=_MapManager local inv=_PlayerInventory
local realLog=log local log=function() end
local user=nil for _,e in pairs(_UserService.UserEntities) do if isvalid(e) then user=e break end end
assert(isvalid(user)) local uid=user.PlayerComponent.UserId
local items={} local callbacks={} local rolls={} local now=0 local paused=false local lastToast=""
local counts={standard=0,skill=0,achievement=0,potion=0,portal=0,found=0,miss=0}
local lastPotion=0
local _GameManager={GameStarted=true,GameOver=false,IsGamePaused=function() return paused end,
 GetEp4MonsterCount=function(_,z) return game:GetEp4MonsterCount(z) end,
 GetMapStandRUID=function(_,z,i) return game:GetMapStandRUID(z,i) end,
 GetGroundFallFor=function() return Vector2(0,-1.32) end,
 ScheduleLootDrop=function(_,p,icon,f,g,cb) table.insert(callbacks,cb) end,
 ApplyPotionDrop=function(_,n) lastPotion=n counts.potion=counts.potion+1 end}
local _MapManager={CurrentMapIndex=168,GetSpawnPositionForIndex=function(_,z) return mapMgr:GetSpawnPositionForIndex(z) end,
 MoveToMap=function(_,from,to) assert(from>=164 and from<=173 and to==174) counts.portal=counts.portal+1 end}
local _PlayerInventory={GetItemDef=function(_,id) return inv:GetItemDef(id) end,GetItemCount=function(_,id) return items[id] or 0 end,
 RemoveItem=function(_,id,n) if (items[id] or 0)<n then return false end items[id]=items[id]-n return true end,
 AddItem=function(_,id,n) items[id]=(items[id] or 0)+n end,ReserveAcquisitionOrder=function() end}
local _CardManager={BuildActiveUpgradePool=function() return {3} end,GrantCardUpgradesFromPool=function(_,pool,p,f,g,sc,n) assert(n==1) counts.skill=counts.skill+1 end}
local _Ep4Map1EasterEggLogic={GrantStandardReward=function() counts.standard=counts.standard+1 end}
local _AchievementLogic={OnEasterEgg=function() counts.achievement=counts.achievement+1 end}
local _UIToast={ShowMessage=function(_,key) lastToast=key end}
local _EasterEggMessageLogic={Found=function() counts.found=counts.found+1 end,Miss=function() counts.miss=counts.miss+1 end}
local _UtilLogic={ElapsedSeconds=0,RandomIntegerRange=function(_,min,max) local n=#rolls>0 and table.remove(rolls,1) or min assert(n>=min and n<=max) return n end}
local l={QuestActive=false,QuestComplete=false,KillCount=0,KillGoal=100,CoinItemId=live.CoinItemId,ScrewItemId=live.ScrewItemId,
 KeyItemId=live.KeyItemId,PortalTargetIndex=live.PortalTargetIndex,_rewardEgg=0,_targetMonster="",_questUserId="",
 _touchCounts={},_used={},_lastTouches={},_generation=0,_bubble=nil,MonsterBounds=live.MonsterBounds,
 QuestIconCenter=live.QuestIconCenter,QuestIconBoxSize=live.QuestIconBoxSize,QuestCountPosition=live.QuestCountPosition}
l.GetEgg=function(self,egg)
		return _EntityService:GetEntityByPath("/maps/ep4_map4/esteregg_" .. egg)
end
l.ValidObject=function(self,egg,obj,userId)
		if egg<1 or egg>24 or not isvalid(obj) or not obj.Enable then return false end
		if obj~=self:GetEgg(egg) then return false end
		if not _GameManager.GameStarted or _GameManager.GameOver or _GameManager:IsGamePaused() then return false end
		local user=_UserService:GetUserEntityByUserId(userId)
		if not isvalid(user) or user.CurrentMap~=obj.CurrentMap then return false end
		local zone=_MapManager.CurrentMapIndex
		if zone<164 or zone>173 then return false end
		return math.abs(obj.TransformComponent.WorldPosition.x-_MapManager:GetSpawnPositionForIndex(zone).x)<8
end
l.OnObjectTouched=function(self,egg,obj,userId)
		if not self:ValidObject(egg,obj,userId) then return end
		local now=_UtilLogic.ElapsedSeconds
		if self._lastTouches[egg]~=nil and now-self._lastTouches[egg]<0.08 then return end
		self._lastTouches[egg]=now
		if egg<=13 then
			if self._used[egg] then return end
			self._touchCounts[egg]=(self._touchCounts[egg] or 0)+1
			if self._touchCounts[egg]<2 then return end
			self._used[egg]=true
			if egg==self._rewardEgg then
				_Ep4Map1EasterEggLogic:GrantStandardReward(obj)
				_EasterEggMessageLogic:Found()
				log("Ep4Map4: hidden reward egg=" .. egg)
			else _EasterEggMessageLogic:Miss() end
		elseif egg==14 then
			if self._used[egg] then return end
			if not _PlayerInventory:RemoveItem(self.CoinItemId,1) then
				_UIToast:ShowMessage("EP4M2_NO_COIN",userId)
				self:ShowRequirement(obj,"ecfe24412de04eaf98b1dd188bbb21b8",{2,31,1,30}) return
			end
			self._used[egg]=true
			self:GrantSkill(obj) self:GrantItem(obj,self.ScrewItemId)
			_AchievementLogic:OnEasterEgg()
			log("Ep4Map4: coin exchanged for screw and slot skill")
		elseif egg==15 then
			self:ShowKillQuest(obj,userId)
		elseif egg==16 then
			if not self.QuestComplete then return end
			if _PlayerInventory:GetItemCount(self.KeyItemId)<1 then
				_UIToast:ShowMessage("EP4M4_NO_KEY",userId) return
			end
			-- 소지한 열쇠로 이용한다. 재방문 시에도 열쇠는 유지한다.
			_MapManager:MoveToMap(_MapManager.CurrentMapIndex,self.PortalTargetIndex)
			log("Ep4Map4: keyed portal to zone174")
		elseif egg==17 then
			if self._used[egg] then return end
			if not _PlayerInventory:RemoveItem(self.ScrewItemId,1) then
				_UIToast:ShowMessage("EP4M4_NO_SCREW",userId)
				self:ShowRequirement(obj,"bd52be01464f42d0b76a8e96509bf39f",{3,28,4,28}) return
			end
			self._used[egg]=true self:GrantSkill(obj)
			local p=obj.TransformComponent.WorldPosition local f=_GameManager:GetGroundFallFor(obj,p)
			_GameManager:ApplyPotionDrop(2,p,f.x,f.y,1) _AchievementLogic:OnEasterEgg()
			log("Ep4Map4: screw exchanged for potion and slot skill")
		elseif egg==18 then
			if self._used[egg] or not self:IsTreasureUncovered() then return end
			self._used[egg]=true
			local p=obj.TransformComponent.WorldPosition local f=_GameManager:GetGroundFallFor(obj,p)
			_GameManager:ApplyPotionDrop(3,p,f.x,f.y,1)
			obj.Enable=false _AchievementLogic:OnEasterEgg() _EasterEggMessageLogic:Found()
			log("Ep4Map4: uncovered treasure granted elixir")
		else
			if self._used[egg] then return end
			self._used[egg]=true obj.Enable=false
			_UIToast:ShowMessage("EP4M4_FOG_CLEARED",userId)
			self:UpdateTreasureTouch()
			log("Ep4Map4: cleared fog=" .. egg)
		end
end
l.GrantSkill=function(self,obj)
		local p=obj.TransformComponent.WorldPosition local f=_GameManager:GetGroundFallFor(obj,p)
		local pool=_CardManager:BuildActiveUpgradePool()
		if #pool>0 then _CardManager:GrantCardUpgradesFromPool(pool,p,f.x,f.y,1,1,0) end
end
l.GrantItem=function(self,obj,id)
		local def=_PlayerInventory:GetItemDef(id) if def==nil then return end
		local p=obj.TransformComponent.WorldPosition local f=_GameManager:GetGroundFallFor(obj,p)
		local generation=self._generation
		_PlayerInventory:ReserveAcquisitionOrder(id)
		_GameManager:ScheduleLootDrop(p,def.icon,f.x,f.y,function()
			if generation==self._generation then _PlayerInventory:AddItem(id,1) end
		end,1)
end
l.GetMonsterPool=function(self)
		local pool={} local seen={}
		for z=164,173 do
			for species=1,_GameManager:GetEp4MonsterCount(z) do
				local ruid=_GameManager:GetMapStandRUID(z,species)
				if ruid~="" and not seen[ruid] and self.MonsterBounds[ruid]~=nil then
					seen[ruid]=true table.insert(pool,ruid)
				end
			end
		end
		return pool
end
l.ShowKillQuest=function(self,obj,userId)
		if self.QuestComplete then _UIToast:ShowMessage("EP4M4_QUEST_COMPLETE",userId) return end
		if not self.QuestActive then
			local pool=self:GetMonsterPool() if #pool==0 then return end
			self._targetMonster=pool[_UtilLogic:RandomIntegerRange(1,#pool)]
			self.QuestActive=true self.KillCount=0 self._questUserId=userId
			log("Ep4Map4: quest accepted target=" .. self._targetMonster .. " goal=100")
		end
		self:ShowRequirement(obj,self._targetMonster,self.MonsterBounds[self._targetMonster])
		if isvalid(self._bubble) then
			_CollectBubbleLogic:FillText(self._bubble,"Count","X" .. (self.KillGoal-self.KillCount),self.QuestCountPosition,2)
		end
end
l.OnMonsterKilled=function(self,zone,standRuid)
		-- 잡템 획득량이 아닌 실제 사망 시점만 센다. 다른 맵/종은 목표에 포함하지 않는다.
		if not self.QuestActive or self.QuestComplete or zone<164 or zone>173 then return end
		if not _GameManager.GameStarted or _GameManager.GameOver then return end
		if standRuid~=self._targetMonster then return end
		self.KillCount=math.min(self.KillGoal,self.KillCount+1)
		if self.KillCount>=self.KillGoal then
			self.QuestComplete=true self:ClearBubble()
			local portal=self:GetEgg(16) if isvalid(portal) then portal.Enable=true end
			_AchievementLogic:OnEasterEgg()
			_UIToast:ShowMessage("EP4M4_QUEST_COMPLETE",self._questUserId)
			log("Ep4Map4: quest complete kills=100 portal enabled")
		elseif isvalid(self._bubble) then
			_CollectBubbleLogic:FillText(self._bubble,"Count","X" .. (self.KillGoal-self.KillCount),self.QuestCountPosition,2)
		end
end
l.ShowRequirement=function(self,obj,icon,bounds)
		self:ClearBubble()
		local p=obj.TransformComponent.WorldPosition
		_Ep2Map1GiftNpcLogic:SpawnBubble(obj.CurrentMap,Vector3(p.x-0.765297,p.y+0.9155867,p.z-0.5),icon,"",false,1,_Ep2Map1GiftNpcLogic.DefaultIconPosition,_Ep2Map1GiftNpcLogic.DefaultIconScale)
		local bubble=_Ep2Map1GiftNpcLogic._activeBubble self._bubble=bubble
		if isvalid(bubble) then
			_CollectBubbleLogic:ApplyForegroundDepth(bubble)
			_CollectBubbleLogic:FitIcon(bubble,"Icon",icon,bounds[1],bounds[2],bounds[3],bounds[4],self.QuestIconCenter,self.QuestIconBoxSize,0)
		end
end
l.IsTreasureUncovered=function(self)
		-- 23/24번은 18번 바로 앞에 겹친 안개다. 다른 존의 안개는 각자 독립적으로 걷힌다.
		return self._used[23]==true and self._used[24]==true
end
l.UpdateTreasureTouch=function(self)
		local obj=self:GetEgg(18)
		if isvalid(obj) and obj.TouchReceiveComponent~=nil then
			obj.TouchReceiveComponent.Enable=self:IsTreasureUncovered() and not self._used[18]
		end
end
l.ClearBubble=function(self)
		if isvalid(self._bubble) then self._bubble:Destroy() end
		self._bubble=nil
end
l.ResetForNewRun=function(self)
		self._generation=self._generation+1 self:ClearBubble()
		local previous=self._rewardEgg
		self._rewardEgg=_UtilLogic:RandomIntegerRange(1,13)
		if self._rewardEgg==previous then self._rewardEgg=(previous+_UtilLogic:RandomIntegerRange(1,12)-1)%13+1 end
		self._touchCounts={} self._used={} self._lastTouches={}
		self.QuestActive=false self.QuestComplete=false self.KillCount=0 self._targetMonster="" self._questUserId=""
		for egg=1,24 do local obj=self:GetEgg(egg) if isvalid(obj) then obj.Enable=egg~=16 end end
		self:UpdateTreasureTouch()
		log("Ep4Map4: reset hidden reward location=" .. self._rewardEgg)
end
local function touch(n)
 local obj=l:GetEgg(n) assert(isvalid(obj))
 local x=obj.TransformComponent.WorldPosition.x local best=164 local distance=10000
 for z=164,173 do local d=math.abs(x-mapMgr:GetSpawnPositionForIndex(z).x) if d<distance then best=z distance=d end end
 _MapManager.CurrentMapIndex=best now=now+1 _UtilLogic.ElapsedSeconds=now
 l:OnObjectTouched(n,obj,uid)
end
for n=1,24 do
 local obj=l:GetEgg(n) assert(isvalid(obj) and obj:GetComponent("script.Ep4Map4EasterEggTrigger").EggNumber==n)
 assert(obj.TouchReceiveComponent.TouchArea.x>0 and not obj.TouchReceiveComponent.RelayEventToBehind)
end
for _,winner in ipairs({1,7,13}) do
 l._rewardEgg=0 rolls={winner} l:ResetForNewRun()
 local before=counts.standard
 for n=1,13 do touch(n) end assert(counts.standard==before)
 for n=1,13 do touch(n) touch(n) end
 assert(counts.standard==before+1 and l._touchCounts[winner]==2)
 rolls={winner,1} l:ResetForNewRun() assert(l._rewardEgg~=winner)
end
realLog("EP4M4_HIDDEN_PASS firstTouchNoReward=true exactlyOne=true doubleTouch=true duplicateBlocked=true nextRunChanges=true")
l:ResetForNewRun()
local skill=counts.skill touch(14) assert(not l._used[14] and lastToast=="EP4M2_NO_COIN")
assert(isvalid(l._bubble))
items[l.CoinItemId]=1 touch(14) touch(14)
assert(items[l.CoinItemId]==0 and l._used[14] and #callbacks==1 and counts.skill==skill+1)
callbacks[1]() assert(items[l.ScrewItemId]==1)
touch(17) touch(17) assert(items[l.ScrewItemId]==0 and counts.skill==skill+2 and lastPotion==2)
l:ResetForNewRun() touch(17) assert(not l._used[17] and lastToast=="EP4M4_NO_SCREW")
items[l.CoinItemId]=1 touch(14) local stale=callbacks[#callbacks] l:ResetForNewRun() stale() assert(items[l.ScrewItemId]==0)
realLog("EP4M4_EXCHANGE_PASS coin1=true screwIcon=true slotSkill1=true screw1=true potion=true absentItemNoConsumption=true staleDropBlocked=true")
local pool=l:GetMonsterPool() assert(#pool==8)
touch(15) assert(l.QuestActive and l.KillCount==0 and not l:GetEgg(16).Enable)
local target=l._targetMonster local bubble=l._bubble assert(isvalid(bubble))
local icon=bubble:GetChildByName("Icon") local count=bubble:GetChildByName("Count")
assert(count.TextRendererComponent.Text=="X100" and count.Enable and icon.Enable)
assert(icon.SpriteRendererComponent.OrderInLayer==1001 and count.TextRendererComponent.OrderInLayer==1002)
local b=l.MonsterBounds[target] local sc=icon.TransformComponent.Scale.x local p=icon.TransformComponent.Position
assert(math.abs(p.x+(b[1]+b[2])/200*sc-l.QuestIconCenter.x)<0.0001)
assert(math.abs(p.y+(b[3]+b[4])/200*sc-l.QuestIconCenter.y)<0.0001)
l:OnMonsterKilled(163,target) l:OnMonsterKilled(174,target) l:OnMonsterKilled(164,"not-target") assert(l.KillCount==0)
for i=1,99 do l:OnMonsterKilled(164,target) end
assert(l.KillCount==99 and not l.QuestComplete and count.TextRendererComponent.Text=="X1")
l:OnMonsterKilled(173,target) l:OnMonsterKilled(173,target)
assert(l.KillCount==100 and l.QuestComplete and l:GetEgg(16).Enable and lastToast=="EP4M4_QUEST_COMPLETE")
touch(16) assert(counts.portal==0 and lastToast=="EP4M4_NO_KEY")
items[l.KeyItemId]=1 touch(16) assert(counts.portal==1 and items[l.KeyItemId]==1)
for _,r in ipairs(pool) do
 l._targetMonster=r l.QuestActive=true l.QuestComplete=false l.KillCount=99
 l:OnMonsterKilled(168,r) assert(l.QuestComplete and l.KillCount==100)
end
l:ResetForNewRun() assert(not l.QuestActive and not l.QuestComplete and l.KillCount==0 and not l:GetEgg(16).Enable)
realLog("EP4M4_QUEST_PASS targets8=true centered=true overlayX100=true matchingDeathsOnly=true 99Locked=true 100Portal=true keyGate=true destination174=true reset=true")
local before=counts.potion
touch(18) assert(counts.potion==before and not l:GetEgg(18).TouchReceiveComponent.Enable)
touch(23) touch(18) assert(counts.potion==before and not l:GetEgg(18).TouchReceiveComponent.Enable)
touch(24) assert(l:IsTreasureUncovered() and l:GetEgg(18).TouchReceiveComponent.Enable)
touch(18) touch(18) assert(counts.potion==before+1 and lastPotion==3 and not l:GetEgg(18).Enable)
for n=19,22 do touch(n) assert(not l:GetEgg(n).Enable) end
l:ResetForNewRun()
for n=19,24 do assert(l:GetEgg(n).Enable) end
assert(l:GetEgg(18).Enable and not l:GetEgg(18).TouchReceiveComponent.Enable)
realLog("EP4M4_FOG_PASS allSixClickable=true coveringTwoRequired=true blockedBeforeClear=true elixirOnce=true restartRestores=true")
local valid=l.ValidObject local obj=l:GetEgg(15)
_MapManager.CurrentMapIndex=168 assert(valid(l,15,obj,uid))
assert(not valid(l,14,obj,uid) and not valid(l,15,obj,"wrong-user"))
paused=true assert(not valid(l,15,obj,uid)) paused=false _GameManager.GameOver=true assert(not valid(l,15,obj,uid))
_GameManager.GameOver=false _MapManager.CurrentMapIndex=164 assert(not valid(l,15,obj,uid))
live:ResetForNewRun()
log=realLog
