local realLog=log local log=function() end
local live=_Ep4Map3EasterEggLogic local realGame=_GameManager local realMap=_MapManager local realInv=_PlayerInventory
local user=nil for _,u in pairs(_UserService.UserEntities) do if isvalid(u) then user=u break end end
local uid=user.PlayerComponent.UserId local senderUserId=uid
local map=_EntityService:GetEntityByPath("/maps/ep4_map3") local obj=map:GetChildByName("esteregg_2")
local rolls={} local forcedKind=0 local rollCall=0 local last={} local paused=false local rewards=0 local callbacks={}
local _UtilLogic={RandomIntegerRange=function(_,min,max)
 rollCall=rollCall+1
 if forcedKind>0 then
  local v=rollCall==3 and forcedKind or min assert(v>=min and v<=max) return v
 end
 local v=#rolls>0 and table.remove(rolls,1) or min assert(v>=min and v<=max,"roll range") return v
end}
local _GameManager={GameStarted=true,GameOver=false,IsGamePaused=function() return paused end,SetEasterEggPaused=function(_,v) paused=v end,
 GetGroundFallFor=function() return Vector2(0,-1.32) end,ScheduleLootDrop=function(_,p,i,f,g,cb) table.insert(callbacks,cb) end}
local _MapManager={CurrentMapIndex=163,GetSpawnPositionForIndex=function(_,i) return realMap:GetSpawnPositionForIndex(i) end}
local _PlayerInventory={GetItemDef=function(_,id) return realInv:GetItemDef(id) end,ReserveAcquisitionOrder=function() end,
 AddItem=function() rewards=rewards+1 end}
local _CardManager={BuildActiveUpgradePool=function() return {3} end,GrantCardUpgradesFromPool=function() rewards=rewards+1 end}
local _AchievementLogic={OnEasterEgg=function() end} local _UIToast={ShowMessage=function() end}
local _Ep4BalloonPuzzleUI={ShowPuzzle=function(_,session,revision,first,second,third,kind,factor,wrong,owner)
 assert(owner==uid and first~="" and kind>=1 and kind<=10)
 last={kind=kind,factor=factor,first=first,second=second,third=third,wrong=wrong}
end,HidePuzzle=function() end}
local l={Collected=false,PuzzleComplete=false,CollectAmount=50,PrizeItemId=live.PrizeItemId,CoinItemId=live.CoinItemId,
 BalloonRUIDs=live.BalloonRUIDs,_pickedItem="",_bubble=nil,_balloonCounts={},_terms={},_answer=0,_kind=1,_factor=2,
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
		-- 사칙연산/괄호 열 유형 중 하나를 고른다. 음수/소수 답은 만들지 않는다.
		local counts={0,0,0,0} self:CountBalloons(map,counts)
		local colors={}
		for color,n in ipairs(counts) do if n>0 then table.insert(colors,color) end end
		if #colors<2 then return false end
		local first=table.remove(colors,_UtilLogic:RandomIntegerRange(1,#colors))
		local second=table.remove(colors,_UtilLogic:RandomIntegerRange(1,#colors))
		local kind=_UtilLogic:RandomIntegerRange(1,10)
		local factor=2 local terms={first,second}
		if kind==2 or kind==10 then
			local third=#colors>0 and colors[_UtilLogic:RandomIntegerRange(1,#colors)] or first
			table.insert(terms,third)
		end
		if kind==3 and counts[first]<counts[second] then terms={second,first} end
		if kind>=5 and kind<=9 then
			if kind==5 or kind==7 then
				local numerator=(kind==5 and counts[first] or counts[first]+counts[second])*3
				local divisors={3}
				if numerator%2==0 then table.insert(divisors,2) end
				factor=divisors[_UtilLogic:RandomIntegerRange(1,#divisors)]
			else factor=_UtilLogic:RandomIntegerRange(2,3) end
			if kind==5 then terms={first,0}
			elseif kind==9 then
				if counts[first]<counts[second] then first,second=second,first end
				terms={first,0,second}
			else terms={first,second,0} end
		end
		local answer=self:ComputeQuestion(counts,terms,kind,factor)
		if kind==10 and answer<0 then
			terms[2],terms[3]=terms[3],terms[2]
			answer=self:ComputeQuestion(counts,terms,kind,factor)
		end
		if answer>9999 then
			kind=1 terms={first,second} answer=self:ComputeQuestion(counts,terms,kind,factor)
		end
		if answer<0 or answer>9999 or answer%1~=0 then return false end
		self._balloonCounts=counts self._terms=terms self._answer=answer
		self._kind=kind self._factor=factor self._wrong=false
		log("Ep4Map3: counted objects=" .. (counts[1]+counts[2]+counts[3]+counts[4]) .. " kind=" .. kind)
		return true
end
l.ComputeQuestion=function(self,counts,terms,kind,factor)
		-- 그림은 해당 색 오브젝트 수×3, 0번 항은 화면에 직접 표시하는 숫자다.
		local a=counts[terms[1]]*3
		local b=terms[2]==0 and factor or counts[terms[2]]*3
		local c=0
		if #terms==3 then c=terms[3]==0 and factor or counts[terms[3]]*3 end
		if kind==1 then return a+b end
		if kind==2 then return a+b+c end
		if kind==3 then return a-b end
		if kind==4 then return a*b end
		if kind==5 then return a/b end
		if kind==6 then return (a+b)*c end
		if kind==7 then return (a+b)/c end
		if kind==8 then return a+b*c end
		if kind==9 then return a*b-c end
		if kind==10 then return a+b-c end
		return -1
end
l.ShowQuestion=function(self)
		-- 연산 유형과 그림/숫자만 보낸다. 풍선 개수와 정답은 서버에 둔다.
		local first=self.BalloonRUIDs[self._terms[1]]
		local second=self._terms[2]==0 and "" or self.BalloonRUIDs[self._terms[2]]
		local third=#self._terms==3 and (self._terms[3]==0 and "" or self.BalloonRUIDs[self._terms[3]]) or ""
		_Ep4BalloonPuzzleUI:ShowPuzzle(self._session,self._revision,first,second,third,self._kind,self._factor,self._wrong,self._userId)
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
		self._pickedItem="" self._balloonCounts={} self._terms={} self._answer=0 self._kind=1 self._factor=2
end
local expected={30,48,6,216,6,60,10,42,24,12}
for kind=1,10 do
 l:ResetForNewRun() rolls={1,1,kind}
 if kind==2 or kind==10 or kind==5 or kind==7 then table.insert(rolls,1)
 elseif kind>=6 and kind<=9 then table.insert(rolls,2) end
 assert(l:BuildQuestion(map)) assert(l._kind==kind and l._answer==expected[kind],"kind=" .. kind .. " answer=" .. l._answer)
 l._userId=uid l:ShowQuestion()
 assert(last.kind==kind and last.factor==l._factor)
 if kind==5 then assert(last.second=="") end
 if kind==6 or kind==7 or kind==8 then assert(last.third=="" and #l._terms==3) end
 if kind==9 then assert(last.second=="" and last.third~="") end
 realLog("EP4M3_MATH_KIND_PASS " .. kind .. " answer=" .. l._answer)
end
local countBalloons=l.CountBalloons
-- Odd totals and uneven colors exercise safe division and subtraction after future map edits.
for _,counts in ipairs({{1,2,3,7},{9,1,4,2},{2,8,1,3}}) do
 l.CountBalloons=function(_,parent,c) for i=1,4 do c[i]=counts[i] end end
 for kind=1,10 do
  for pick1=1,4 do for pick2=1,1 do
   forcedKind=0 rolls={pick1,pick2,kind}
   if kind==2 or kind==10 or kind==5 or kind==7 then table.insert(rolls,1)
   elseif kind>=6 and kind<=9 then table.insert(rolls,3) end
   assert(l:BuildQuestion(map)) assert(l._kind==kind and l._answer>=0 and l._answer<=9999 and l._answer%1==0)
   local v={} for i,t in ipairs(l._terms) do v[i]=t==0 and l._factor or counts[t]*3 end
   local independent={v[1]+v[2],v[1]+v[2]+(v[3] or 0),v[1]-v[2],v[1]*v[2],v[1]/v[2],
    (v[1]+v[2])*(v[3] or 0),(v[1]+v[2])/(v[3] or 1),v[1]+v[2]*(v[3] or 0),v[1]*v[2]-(v[3] or 0),v[1]+v[2]-(v[3] or 0)}
   assert(l._answer==independent[kind],"arithmetic mismatch")
  end end
 end
end
l.CountBalloons=countBalloons
realLog("EP4M3_MATH_BOUNDARIES_PASS cases120=true integerDivision=true nonnegative=true priority=true")
-- Confirm every kind survives a wrong answer and close/reopen, and only run reset replaces it.
for kind=1,10 do
 realLog("MATH_STATE_START " .. kind)
 l:ResetForNewRun() forcedKind=kind rollCall=0
 l:OnObjectTouched(2,obj,uid) assert(l._open and paused)
 local answer=l._answer local factor=l._factor local terms=table.concat(l._terms,",")
 local session=l._session local revision=l._revision
 l:RequestAnswer(session,revision,9999)
 assert(l._open and l._wrong and l._kind==kind and l._factor==factor and l._answer==answer)
 l:RequestCancel(session) assert(not l._open and not paused)
 l:OnObjectTouched(2,obj,uid)
 assert(l._open and l._kind==kind and l._factor==factor and table.concat(l._terms,",")==terms and l._answer==answer)
 l:RequestAnswer(l._session,l._revision,answer)
 assert(l.PuzzleComplete and not l._open and not paused)
 local n=#callbacks l:RequestAnswer(l._session,l._revision,answer) assert(#callbacks==n)
 l:ResetForNewRun() assert(#l._terms==0 and l._kind==1 and l._factor==2)
 realLog("MATH_STATE_DONE " .. kind)
end
assert(#callbacks==20 and rewards==10)
realLog("EP4M3_MATH_STATE_PASS all10WrongRetained=true reopenSame=true correctRewards=true duplicateBlocked=true newRunReset=true")
log=realLog
