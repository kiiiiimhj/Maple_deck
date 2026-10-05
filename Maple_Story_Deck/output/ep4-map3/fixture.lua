local live=_Ep4Map3EasterEggLogic
local realGame=_GameManager local realMap=_MapManager local realInv=_PlayerInventory
local user=nil for _,u in pairs(_UserService.UserEntities) do if isvalid(u) then user=u break end end
assert(isvalid(user)) local userId=user.PlayerComponent.UserId local senderUserId=userId
_TeleportService:TeleportToMapPosition(user,Vector3(30,-0.72,0),"ep4_map3") wait(1)
realGame:SetEasterEggPaused(true)
local paused=false local items={} local callbacks={} local rolls={}
local grants={standard=0,skill=0,achievement=0,show=0,hide=0} local lastToast=""
local _GameManager={GameStarted=true,GameOver=false,
 IsGamePaused=function() return paused end,SetEasterEggPaused=function(_,v) paused=v end,
 GetMonsterLootItemId=function(_,...) return realGame:GetMonsterLootItemId(...) end,
 GetGroundFallFor=function() return Vector2(0,-1.32) end,
 ScheduleLootDrop=function(_,p,icon,fall,ground,cb) table.insert(callbacks,cb) end}
local _MapManager={CurrentMapIndex=156,GetSpawnPositionForIndex=function(_,i) return realMap:GetSpawnPositionForIndex(i) end}
local _PlayerInventory={GetItemDef=function(_,id) return realInv:GetItemDef(id) end,
 GetItemCount=function(_,id) return items[id] or 0 end,
 RemoveItem=function(_,id,n) if (items[id] or 0)<n then return false end items[id]=items[id]-n return true end,
 ReserveAcquisitionOrder=function() end,AddItem=function(_,id,n) items[id]=(items[id] or 0)+n end}
local _CardManager={BuildActiveUpgradePool=function() return {3} end,
 GrantCardUpgradesFromPool=function(_,pool,p,f,g,scale,n) assert(n==1) grants.skill=grants.skill+1 end}
local _Ep4Map1EasterEggLogic={GrantStandardReward=function() grants.standard=grants.standard+1 end}
local _AchievementLogic={OnEasterEgg=function() grants.achievement=grants.achievement+1 end}
local _UIToast={ShowMessage=function(_,key) lastToast=key end}
local _TimerService={SetTimerOnce=function() end}
local _Ep4BalloonPuzzleUI={ShowPuzzle=function(_,session,rev,r1,r2,r3,wrong,uid)
 assert(uid==userId and r1~="" and r2~="") grants.show=grants.show+1 end,
 HidePuzzle=function() grants.hide=grants.hide+1 end}
local _UtilLogic={RandomIntegerRange=function(_,min,max)
 local v=#rolls>0 and table.remove(rolls,1) or min assert(v>=min and v<=max) return v end}
local l={Collected=false,PuzzleComplete=false,CollectAmount=50,PrizeItemId=live.PrizeItemId,CoinItemId=live.CoinItemId,
 BalloonRUIDs=live.BalloonRUIDs,_pickedItem="",_bubble=nil,_balloonCounts={},_terms={},_answer=0,
 _session=0,_revision=0,_generation=0,_open=false,_busy=false,_wrong=false,_object=nil,_userId="",_zone=0,_modalRemaining=0}
l.ValidObject=function(self,egg,obj,userId)
		-- 다른 맵/존에서 보내거나 오브젝트를 바꿔 보낸 요청은 받지 않는다.
		if egg<1 or egg>2 or not isvalid(obj) then return false end
		if obj~=_EntityService:GetEntityByPath("/maps/ep4_map3/esteregg_" .. egg) then return false end
		if not _GameManager.GameStarted or _GameManager.GameOver then return false end
		local user=_UserService:GetUserEntityByUserId(userId)
		if not isvalid(user) or user.CurrentMap~=obj.CurrentMap then return false end
		local zone=_MapManager.CurrentMapIndex
		if zone<154 or zone>163 then return false end
		local spawn=_MapManager:GetSpawnPositionForIndex(zone)
		return math.abs(obj.TransformComponent.WorldPosition.x-spawn.x)<8
end
l.OnObjectTouched=function(self,egg,obj,userId)
		if self._open or _GameManager:IsGamePaused() or not self:ValidObject(egg,obj,userId) then return end
		if egg==1 then self:Collect(obj,userId) return end
		if self.PuzzleComplete then _UIToast:ShowMessage("EP4_EGG_DONE",userId) return end
		if #self._terms==0 and not self:BuildQuestion(obj.CurrentMap) then
			_UIToast:ShowMessage("EP4M3_NOT_READY",userId) return
		end
		self._session=self._session+1 self._revision=self._revision+1
		self._open=true self._object=obj self._userId=userId
		self._zone=_MapManager.CurrentMapIndex self._modalRemaining=300
		_GameManager:SetEasterEggPaused(true)
		self:ShowQuestion()
		log("Ep4Map3: puzzle open session=" .. self._session .. " terms=" .. #self._terms)
end
l.GetLootPool=function(self)
		-- map3의 실제 몬스터 드롭표에 있는 잡템 한 종류를 목표로 선택한다.
		local pool={} local seen={}
		for zone=154,163 do
			for species=1,4 do
				local id=_GameManager:GetMonsterLootItemId(zone,species)
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
			local pool=self:GetLootPool()
			if #pool==0 then return end
			self._pickedItem=pool[_UtilLogic:RandomIntegerRange(1,#pool)]
		end
		local have=_PlayerInventory:GetItemCount(self._pickedItem)
		if have<self.CollectAmount then
			self:ClearBubble()
			local p=obj.TransformComponent.WorldPosition
			local bubble=_CollectBubbleLogic:SpawnItemQuestBubble(obj.CurrentMap,Vector3(p.x-1.25,p.y+1.25,p.z-0.5),"Ep4Map3CollectBubble",self._pickedItem,"X" .. (self.CollectAmount-have),false)
			self._bubble=bubble
			_TimerService:SetTimerOnce(function()
				if isvalid(bubble) then bubble:Destroy() end
				if self._bubble==bubble then self._bubble=nil end
			end,2)
			log("Ep4Map3: collect " .. self._pickedItem .. " " .. have .. "/50")
			return
		end
		if not _PlayerInventory:RemoveItem(self._pickedItem,self.CollectAmount) then return end
		self.Collected=true self:ClearBubble()
		_Ep4Map1EasterEggLogic:GrantStandardReward(obj)
		_UIToast:ShowMessage("EP4_COLLECT_SUCCESS",userId)
		log("Ep4Map3: collection complete item=" .. self._pickedItem)
end
l.ClearBubble=function(self)
		if isvalid(self._bubble) then self._bubble:Destroy() end
		self._bubble=nil
end
l.CountBalloons=function(self,parent,counts)
		-- 이름이 balloon_N인 실제 배치만 센다. 번호가 늘거나 중간 번호가 빠져도 모두 반영한다.
		for _,child in pairs(parent.Children) do
			if string.match(child.Name,"^balloon_%d+$") and child.Enable and child.Visible then
				local sprite=child.SpriteRendererComponent
				if sprite~=nil then
					for color,ruid in ipairs(self.BalloonRUIDs) do
						if sprite.SpriteRUID==ruid then counts[color]=counts[color]+1 break end
					end
				end
			end
			self:CountBalloons(child,counts)
		end
end
l.BuildQuestion=function(self,map)
		local counts={0,0,0,0} self:CountBalloons(map,counts)
		local colors={}
		for color,n in ipairs(counts) do if n>0 then table.insert(colors,color) end end
		if #colors<2 then return false end
		local first=table.remove(colors,_UtilLogic:RandomIntegerRange(1,#colors))
		local second=table.remove(colors,_UtilLogic:RandomIntegerRange(1,#colors))
		local terms={first,second}
		local kind=_UtilLogic:RandomIntegerRange(1,4)
		if kind==3 and #colors>0 then table.insert(terms,colors[_UtilLogic:RandomIntegerRange(1,#colors)]) end
		if kind==4 then table.insert(terms,first) end
		local answer=0
		for _,color in ipairs(terms) do answer=answer+counts[color]*3 end
		self._balloonCounts=counts self._terms=terms self._answer=answer self._wrong=false
		log("Ep4Map3: counted objects=" .. (counts[1]+counts[2]+counts[3]+counts[4]) .. " colors=" .. counts[1] .. "," .. counts[2] .. "," .. counts[3] .. "," .. counts[4])
		return true
end
l.ShowQuestion=function(self)
		-- 정답/색깔별 개수는 서버에만 두고 문제에 필요한 그림만 내려준다.
		local third=#self._terms==3 and self.BalloonRUIDs[self._terms[3]] or ""
		_Ep4BalloonPuzzleUI:ShowPuzzle(self._session,self._revision,self.BalloonRUIDs[self._terms[1]],self.BalloonRUIDs[self._terms[2]],third,self._wrong,self._userId)
end
l.ValidSession=function(self,session,revision,userId)
		return self._open and not self._busy and not self.PuzzleComplete and session==self._session and revision==self._revision and userId==self._userId and self._zone==_MapManager.CurrentMapIndex and self:ValidObject(2,self._object,userId)
end
l.RequestAnswer=function(self,session,revision,answer)
		if not self:ValidSession(session,revision,senderUserId) then return end
		self._revision=self._revision+1 self._modalRemaining=300
		if answer<0 or answer>9999 or answer~=self._answer then
			self._wrong=true self:ShowQuestion()
			log("Ep4Map3: wrong answer; same question retained")
			return
		end
		self._busy=true self.PuzzleComplete=true
		local obj=self._object local userId=self._userId
		self:EndModal()
		self:GrantPuzzleReward(obj)
		_UIToast:ShowMessage("EP4M3_SUCCESS",userId)
		self._busy=false
		log("Ep4Map3: puzzle complete key=1 coin=1 slotSkill=1")
end
l.DropRunItem=function(self,obj,itemId,xOffset)
		-- 낙하 연출 중 새 게임으로 바뀌면 지난 판 아이템이 새 가방에 들어오지 않게 한다.
		local generation=self._generation
		local p=obj.TransformComponent.WorldPosition
		p=Vector3(p.x+xOffset,p.y,p.z)
		local f=_GameManager:GetGroundFallFor(obj,p)
		local def=_PlayerInventory:GetItemDef(itemId)
		if def==nil then return end
		_PlayerInventory:ReserveAcquisitionOrder(itemId)
		_GameManager:ScheduleLootDrop(p,def.icon,f.x,f.y,function()
			if generation==self._generation and not _GameManager.GameOver then _PlayerInventory:AddItem(itemId,1) end
		end,1)
end
l.GrantPuzzleReward=function(self,obj)
		if not isvalid(obj) then return end
		self:DropRunItem(obj,self.PrizeItemId,-0.25)
		self:DropRunItem(obj,self.CoinItemId,0.25)
		local p=obj.TransformComponent.WorldPosition local f=_GameManager:GetGroundFallFor(obj,p)
		local pool=_CardManager:BuildActiveUpgradePool()
		if #pool>0 then _CardManager:GrantCardUpgradesFromPool(pool,p,f.x,f.y,1,1,0) end
		_AchievementLogic:OnEasterEgg()
end
l.RequestCancel=function(self,session)
		if not self._open or session~=self._session or senderUserId~=self._userId then return end
		self:EndModal()
end
l.EndModal=function(self)
		-- 닫기/오답은 문제를 초기화하지 않는다. 이 모달이 걸었던 정지만 해제한다.
		if not self._open then return end
		local session=self._session local userId=self._userId
		self._open=false self._object=nil self._userId="" self._modalRemaining=0
		_GameManager:SetEasterEggPaused(false)
		_Ep4BalloonPuzzleUI:HidePuzzle(session,userId)
end
l.OnUpdate=function(self,delta)
		if not self._open then return end
		self._modalRemaining=self._modalRemaining-delta
		if self._modalRemaining<=0 or self._zone~=_MapManager.CurrentMapIndex or not self:ValidObject(2,self._object,self._userId) then self:EndModal() end
end
l.ResetForNewRun=function(self)
		self:EndModal() self:ClearBubble()
		self._generation=self._generation+1 self._session=self._session+1 self._revision=self._revision+1
		self.Collected=false self.PuzzleComplete=false self._busy=false self._wrong=false
		self._pickedItem="" self._balloonCounts={} self._terms={} self._answer=0
end
local e1=_EntityService:GetEntityByPath("/maps/ep4_map3/esteregg_1")
local e2=_EntityService:GetEntityByPath("/maps/ep4_map3/esteregg_2")
assert(l:ValidObject(1,e1,userId) and not l:ValidObject(2,e1,userId))
for i,e in ipairs({e1,e2}) do assert(e:GetComponent("script.Ep4Map3EasterEggTrigger").EggNumber==i and e.TouchReceiveComponent.AutoFitToSize) end
local pool=l:GetLootPool() assert(#pool==9,"pool=" .. #pool)
for _,id in ipairs(pool) do
 l._pickedItem=id l:Collect(e1,userId)
 local b=l._bubble assert(isvalid(b) and b.SpriteRendererComponent.OrderInLayer==1000)
 assert(b:GetChildByName("Icon1").SpriteRendererComponent.SpriteRUID~="")
 assert(b:GetChildByName("Icon2").SpriteRendererComponent.SpriteRUID==realInv:GetItemDef(id).icon)
 assert(b:GetChildByName("Count2").TextRendererComponent.Text=="X50") l:ClearBubble()
end
l._pickedItem=pool[1] items[pool[1]]=49 l:Collect(e1,userId)
assert(not l.Collected and l._bubble:GetChildByName("Count2").TextRendererComponent.Text=="X1")
items[pool[1]]=50 l:Collect(e1,userId) l:Collect(e1,userId)
assert(l.Collected and items[pool[1]]==0 and grants.standard==1 and l._bubble==nil)
log("EP4M3_COLLECT_PASS targets9=true remaining=true consume50=true foreground=true duplicate=true")
l:ResetForNewRun() assert(l._pickedItem=="" and not l.Collected)
local counts={0,0,0,0} l:CountBalloons(e2.CurrentMap,counts)
assert(counts[1]==6 and counts[2]==4 and counts[3]==6 and counts[4]==6)
rolls={1,1,1} assert(l:BuildQuestion(e2.CurrentMap)) assert(l._answer==30 and #l._terms==2)
rolls={1,1,3,1} l:BuildQuestion(e2.CurrentMap) assert(l._answer==48 and #l._terms==3)
rolls={1,1,4} l:BuildQuestion(e2.CurrentMap) assert(l._answer==48 and l._terms[1]==l._terms[3])
rolls={1,2,2} l:BuildQuestion(e2.CurrentMap) assert(l._answer==36)
local extra=_EntityService:GetEntityByPath("/maps/ep4_map3/balloon_22") local old=extra.SpriteRendererComponent.SpriteRUID
extra.SpriteRendererComponent.SpriteRUID=l.BalloonRUIDs[2]
rolls={1,1,1} l:BuildQuestion(e2.CurrentMap) assert(l._balloonCounts[1]==5 and l._balloonCounts[2]==5 and l._answer==30)
extra.SpriteRendererComponent.SpriteRUID=old
log("EP4M3_BALLOON_PASS objects22=true colors6_4_6_6=true changedSpriteRecount=true times3=true variants=true")
l:ResetForNewRun() _MapManager.CurrentMapIndex=163 rolls={1,1,1}
l:OnObjectTouched(2,e2,userId) assert(l._open and paused and l._answer==30)
local session=l._session local revision=l._revision
l:RequestAnswer(session,revision,0) assert(l._open and l._wrong and l._answer==30 and l._revision==revision+1)
l:RequestAnswer(session,revision,30) assert(not l.PuzzleComplete and #callbacks==0)
senderUserId="other" l:RequestAnswer(session,l._revision,30) assert(not l.PuzzleComplete)
senderUserId=userId l:RequestCancel(session) assert(not l._open and not paused and #l._terms==2)
l:OnObjectTouched(2,e2,userId) assert(l._session>session and l._answer==30 and l._wrong)
session=l._session revision=l._revision l:RequestAnswer(session,revision,30)
assert(l.PuzzleComplete and not l._open and not paused and #callbacks==2 and grants.skill==1 and grants.achievement==1)
for _,cb in ipairs(callbacks) do cb() end
assert(items[l.PrizeItemId]==1 and items[l.CoinItemId]==1 and lastToast=="EP4M3_SUCCESS")
l:RequestAnswer(session,revision,30) l:OnObjectTouched(2,e2,userId)
assert(#callbacks==2 and grants.skill==1)
assert(realInv:GetItemDef(l.PrizeItemId).icon=="50c3b884e0e14298916632fcc6c334ce")
log("EP4M3_PUZZLE_PASS pause=true wrongKeepsQuestion=true staleReply=true owner=true reopenSame=true rewardsEach1=true duplicate=true")
l:DropRunItem(e2,l.PrizeItemId,0) local pending=callbacks[#callbacks]
l:ResetForNewRun() pending() assert(items[l.PrizeItemId]==1 and #l._terms==0 and not l.PuzzleComplete)
paused=true l:EndModal() assert(paused) paused=false
l:OnObjectTouched(2,e2,userId) _MapManager.CurrentMapIndex=162 l:OnUpdate(.1)
assert(not l._open and not paused and #l._terms>0)
_MapManager.CurrentMapIndex=163 l:OnObjectTouched(2,e2,userId) l:OnUpdate(301)
assert(not l._open and not paused and #l._terms>0)
l:OnObjectTouched(2,e2,userId) _GameManager.GameOver=true l:OnUpdate(.1)
assert(not l._open and not paused)
l:ResetForNewRun() assert(l._pickedItem=="" and #l._terms==0)
log("EP4M3_RESET_PASS newRun=true staleLootBlocked=true idlePreservesOtherPause=true zoneCleanup=true timeout=true gameOver=true")
realGame:SetEasterEggPaused(false)
