local actual=_Ep4Map5EasterEggLogic local realGame=_GameManager local realInv=_PlayerInventory local realMap=_MapManager
local originalIsValid=isvalid local isvalid=function(e) if type(e)=="table" and e.fake then return true end return originalIsValid(e) end
local map={fake=true} local uid="fixture-owner" local user={fake=true,CurrentMap=map}
local objects={} local items={} local awards=0 local achievements=0 local toast="" local now=0 local roll=1 local paused=false
local u={}
for i=1,9 do
 local real=actual:GetEgg(i) assert(originalIsValid(real)) local p=real.TransformComponent.Position
 local tr={Placed=false,ResetPreview=function() end}
 objects[i]={fake=true,Enable=true,CurrentMap=map,Path=real.Path,TransformComponent={Position=p,WorldPosition=p},TouchReceiveComponent={Enable=true},GetComponent=function() return tr end}
 u[i]=p
end
local rewards={}
for _,path in ipairs(actual.RewardObjects) do
 local real=_EntityService:GetEntityByPath(path) assert(originalIsValid(real))
 rewards[path]={fake=true,Enable=true,CurrentMap=map,Path=path,TransformComponent={WorldPosition=real.TransformComponent.WorldPosition}}
end
local _EntityService={GetEntityByPath=function(_,path) local n=tonumber(string.match(path,"esteregg_(%d+)$")) return n and objects[n] or rewards[path] end}
local _UserService={GetUserEntityByUserId=function(_,id) return id==uid and user or nil end}
local _MapManager={CurrentMapIndex=183,GetSpawnPositionForIndex=function(_,z) return realMap:GetSpawnPositionForIndex(z) end}
local _GameManager={GameStarted=true,GameOver=false,IsGamePaused=function() return paused end,
 GetEp4MonsterCount=function(_,z) return realGame:GetEp4MonsterCount(z) end,
 GetMonsterLootItemId=function(_,z,i) return realGame:GetMonsterLootItemId(z,i) end}
local _PlayerInventory={GetItemDef=function(_,id) return realInv:GetItemDef(id) end,GetItemCount=function(_,id) return items[id] or 0 end,
 RemoveItem=function(_,id,n) if (items[id] or 0)<n then return false end items[id]=items[id]-n return true end}
local _Ep4Map1EasterEggLogic={GrantStandardReward=function() awards=awards+1 end}
local _AchievementLogic={OnEasterEgg=function() achievements=achievements+1 end}
local _UIToast={ShowMessage=function(_,key) toast=key end,ShowTimedMessage=function(_,key,seconds) assert(seconds==5) toast=key end}
local bubbleCount=0 local lastCount=""
local _CollectBubbleLogic={SpawnItemQuestBubble=function(_,m,p,n,id,count) bubbleCount=bubbleCount+1 lastCount=count return {fake=true,Destroy=function() end} end}
local _TimerService={SetTimerOnce=function() end}
local _UtilLogic={ElapsedSeconds=now,RandomIntegerRange=function(_,min,max) return min==1 and max==2 and roll or min end}
local fixtureLog=function() end
local l={Collected=false,PuzzleComplete=false,RunRevision=0,PlacedCount=0,CollectAmount=30,
PlacementTolerance=actual.PlacementTolerance,TargetXs=actual.TargetXs,TargetY=actual.TargetY,RewardObjects=actual.RewardObjects,
_originalPositions=u,_occupied={},_placed={},_used={},_touchCounts={},_lastTouches={},_pickedItem="",_bubble=nil}

l.GetEgg=function(self,egg)
		return _EntityService:GetEntityByPath("/maps/ep4_map5/esteregg_" .. egg)
end
l.ValidUser=function(self,obj,userId)
		if not isvalid(obj) or not obj.Enable or not _GameManager.GameStarted or _GameManager.GameOver or _GameManager:IsGamePaused() then return false end
		local user=_UserService:GetUserEntityByUserId(userId)
		if not isvalid(user) or user.CurrentMap~=obj.CurrentMap then return false end
		local zone=_MapManager.CurrentMapIndex
		if zone<174 or zone>183 then return false end
		-- map5 존 간격은 일정하지 않다. 고정 반경 대신 가장 가까운 존으로 소속을 판정한다.
		local x=obj.TransformComponent.WorldPosition.x local nearest=174 local best=math.huge
		for z=174,183 do
			local distance=math.abs(x-_MapManager:GetSpawnPositionForIndex(z).x)
			if distance<best then nearest=z best=distance end
		end
		return nearest==zone
end
l.ValidEgg=function(self,egg,obj,userId)
		return egg>=1 and egg<=9 and obj==self:GetEgg(egg) and self:ValidUser(obj,userId)
end
l.OnObjectTouched=function(self,egg,obj,revision,userId)
		if revision~=self.RunRevision or not self:ValidEgg(egg,obj,userId) then return end
		if egg==1 then self:Collect(obj,userId)
		elseif egg==2 then _UIToast:ShowTimedMessage("EP4M5_RIDDLE",5,userId) end
end
l.GetLootPool=function(self)
		local pool={} local seen={}
		for z=174,183 do
			for species=1,_GameManager:GetEp4MonsterCount(z) do
				local id=_GameManager:GetMonsterLootItemId(z,species)
				if id~="" and not seen[id] and _PlayerInventory:GetItemDef(id)~=nil then
					seen[id]=true table.insert(pool,id)
				end
			end
		end
		return pool
end
l.Collect=function(self,obj,userId)
		if self.Collected then return end
		if self._pickedItem=="" then
			local pool=self:GetLootPool() if #pool==0 then return end
			self._pickedItem=pool[_UtilLogic:RandomIntegerRange(1,#pool)]
		end
		local have=_PlayerInventory:GetItemCount(self._pickedItem)
		if have<self.CollectAmount then
			self:ClearBubble()
			local p=obj.TransformComponent.WorldPosition
			local bubble=_CollectBubbleLogic:SpawnItemQuestBubble(obj.CurrentMap,Vector3(p.x-1.25,p.y+1.25,p.z-0.5),"Ep4Map5CollectBubble",self._pickedItem,"X" .. (self.CollectAmount-have),false)
			self._bubble=bubble
			_TimerService:SetTimerOnce(function()
				if isvalid(bubble) then bubble:Destroy() end
				if self._bubble==bubble then self._bubble=nil end
			end,2)
			fixtureLog("Ep4Map5: collect " .. self._pickedItem .. " " .. have .. "/" .. self.CollectAmount)
			return
		end
		if not _PlayerInventory:RemoveItem(self._pickedItem,self.CollectAmount) then return end
		self.Collected=true self:ClearBubble()
		_Ep4Map1EasterEggLogic:GrantStandardReward(obj)
		_AchievementLogic:OnEasterEgg()
		_UIToast:ShowMessage("EP4_COLLECT_SUCCESS",userId)
		fixtureLog("Ep4Map5: collection complete amount=" .. self.CollectAmount)
end
l.CheckPlacement=function(self,egg,obj,x,y,revision,userId)
		if revision~=self.RunRevision or egg<4 or egg>9 or self.PuzzleComplete or self._placed[egg] then return end
		if not self:ValidEgg(egg,obj,userId) then return end
		if x~=x or y~=y then return end
		local slot=0 local best=self.PlacementTolerance*self.PlacementTolerance
		for i,tx in ipairs(self.TargetXs) do
			local dx=x-tx local dy=y-self.TargetY local distance=dx*dx+dy*dy
			if distance<=best then best=distance slot=i end
		end
		local trigger=obj:GetComponent("script.Ep4Map5EasterEggTrigger")
		if slot==0 or self._occupied[slot] then
			local p=self._originalPositions[egg]
			obj.TransformComponent.Position=p
			if trigger~=nil then trigger:ResetPreview(p) end
			if slot~=0 then _UIToast:ShowMessage("EP4M5_OCCUPIED",userId) end
			return
		end
		self._occupied[slot]=egg self._placed[egg]=slot self.PlacedCount=self.PlacedCount+1
		local p=Vector3(self.TargetXs[slot],self.TargetY,self._originalPositions[egg].z)
		obj.TransformComponent.Position=p
		if trigger~=nil then trigger.Placed=true trigger:ResetPreview(p) end
		obj.TouchReceiveComponent.Enable=false
		fixtureLog("Ep4Map5: light=" .. egg .. " slot=" .. slot .. " placed=" .. self.PlacedCount)
		if self.PlacedCount==6 then
			self.PuzzleComplete=true
			local portal=self:GetEgg(3) if isvalid(portal) then portal.Enable=true end
			_AchievementLogic:OnEasterEgg()
			_UIToast:ShowMessage("EP4M5_LIGHT_SUCCESS",userId)
			fixtureLog("Ep4Map5: six lights placed, portal revealed")
		end
end
l.OnRewardTouched=function(self,obj,revision,userId)
		-- 모든 map5 두 번 터치 보상을 합쳐 한 판에 두 번까지만 지급한다.
		if self._rewardCount>=2 then return end
		if revision~=self.RunRevision or not self:ValidUser(obj,userId) then return end
		local approved=false
		for _,path in ipairs(self.RewardObjects) do if obj==_EntityService:GetEntityByPath(path) then approved=true break end end
		if not approved then return end
		local key=obj.Path if self._used[key] then return end
		local now=_UtilLogic.ElapsedSeconds
		if self._lastTouches[key]~=nil and now-self._lastTouches[key]<0.15 then return end
		self._lastTouches[key]=now self._touchCounts[key]=(self._touchCounts[key] or 0)+1
		if self._touchCounts[key]<2 then return end
		self._used[key]=true self._rewardCount=self._rewardCount+1
		_Ep4Map1EasterEggLogic:GrantStandardReward(obj)
		_AchievementLogic:OnEasterEgg()
		fixtureLog("Ep4Map5: two-touch reward " .. key .. " total=" .. self._rewardCount .. "/2")
end
l.ClearBubble=function(self)
		if isvalid(self._bubble) then self._bubble:Destroy() end self._bubble=nil
end
l.ResetForNewRun=function(self)
		-- 새로 시작과 다시하기에서만 한 판의 보상 횟수를 초기화한다.
		self._rewardCount=0
		self:ClearBubble() self.RunRevision=self.RunRevision+1
		self.Collected=false self.PuzzleComplete=false self.PlacedCount=0
		self.CollectAmount=_UtilLogic:RandomIntegerRange(1,2)==1 and 30 or 50
		self._pickedItem="" self._occupied={} self._placed={} self._used={} self._touchCounts={} self._lastTouches={}
		for i=1,9 do
			local e=self:GetEgg(i)
			if isvalid(e) then
				e.Enable=i~=3
				local p=self._originalPositions[i]
				if p~=nil then e.TransformComponent.Position=p end
				if i~=3 then
					e.TouchReceiveComponent.Enable=true
					local trigger=e:GetComponent("script.Ep4Map5EasterEggTrigger")
					if trigger~=nil then trigger.Placed=false if p~=nil then trigger:ResetPreview(p) end end
				end
			end
		end
		fixtureLog("Ep4Map5: new run amount=" .. self.CollectAmount)
end
local function zoneFor(obj)
 local nearest=174 local best=math.huge
 for z=174,183 do local d=math.abs(obj.TransformComponent.WorldPosition.x-realMap:GetSpawnPositionForIndex(z).x) if d<best then nearest=z best=d end end
 return nearest
end
local function touch(obj)
 _MapManager.CurrentMapIndex=zoneFor(obj) now=now+1 _UtilLogic.ElapsedSeconds=now
 l:OnRewardTouched(obj,l.RunRevision,uid)
end
for round=1,2 do
 l:ResetForNewRun() assert(l._rewardCount==0 and next(l._used)==nil)
 local before=awards local visited=0
 for _,path in ipairs(l.RewardObjects) do
  local obj=rewards[path] local count=l._rewardCount touch(obj)
  assert(l._rewardCount==count)
  touch(obj) visited=visited+1
  assert(l._rewardCount==math.min(visited,2) and awards==before+math.min(visited,2))
  touch(obj) assert(awards==before+math.min(visited,2))
 end
 assert(visited==33 and awards==before+2 and l._rewardCount==2)
 log("EP4M5_CAP_ROUND_PASS "..round.." objects=33 awards=2")
end
l:ResetForNewRun()
local obj=rewards[l.RewardObjects[1]] _MapManager.CurrentMapIndex=zoneFor(obj)
paused=true l:OnRewardTouched(obj,l.RunRevision,uid) paused=false
l:OnRewardTouched(obj,l.RunRevision-1,uid)
l:OnRewardTouched(obj,l.RunRevision,"wrong-owner")
assert(l._rewardCount==0)
touch(obj) local count=l._rewardCount l:OnRewardTouched(obj,l.RunRevision,uid) assert(l._rewardCount==count)
touch(obj) assert(l._rewardCount==1)
log("EP4M5_CAP_GUARDS_PASS invalid touches do not spend the allowance")
