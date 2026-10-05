-- Isolated in-memory fixture: ALL mutation services below are local fakes.
local tally={gold=0,diamond=0,items=0,scrolls=0,gear=0,saves=0,persist=0,success=0,failure=0,skins=0,collected=0}
local room=true
local factoryCode=0
local skinReady=true
local skinGrant=true
local skinKey="fixture-skin"
local today=20261004
local senderUserId="fixture-user"
local writeCalls=0
local stored=""
local storeCode=0
local injectMutation=false
local accountFixture=nil
local retry=nil
local _DataStorageService={GetUserDataStorage=function(self,profile)
 assert(profile=="fixture-profile")
 return {SetAndWait=function(self,key,payload)
  assert(key=="Attendance")
  writeCalls=writeCalls+1
  if storeCode~=0 then return storeCode end
  stored=payload
  if injectMutation then injectMutation=false accountFixture.FreeSkillPulls=accountFixture.FreeSkillPulls+2 end
  return 0
 end}
end}
local _TimerService={SetTimerOnce=function(self,fn,delay) retry=fn return 77 end,ClearTimer=function() end}
local _GameManager={}
_GameManager.AddCoins=function(self,n) tally.gold=tally.gold+n end
_GameManager.AddDiamond=function(self,n) tally.diamond=tally.diamond+n end
_GameManager.PersistRewardNow=function(self,id) assert(id=="fixture-user") tally.persist=tally.persist+1 end
_GameManager.BuildGearCreateParamForGrade=function(self,id,grade) return {ItemId=id,ItemCount=1,Grade=grade} end
local _DamageSkinLogic={}
_DamageSkinLogic.IsReadyForAttendance=function() return skinReady end
_DamageSkinLogic.TryGrantAttendanceSkin=function(self,key) assert(key=="fixture-skin") if skinGrant then tally.skins=tally.skins+1 end return skinGrant end
local _LevelRewardLogic={GetGearPool=function(self,kind) return {101,102} end}
local _UtilLogic={RandomIntegerRange=function(self,low,high) return low end}
local _InventoryExpandLogic={HasRoomFor=function(self,id,itemId) assert(id=="fixture-user") return room end}
local _ItemFactoryLogic={TryAddItem=function(self,id,param,result)
 assert(id=="fixture-user" and param.IsIgnoreInvenCapacity==false)
 if factoryCode==0 then
 tally.items=tally.items+1
 if param.ItemId >= 510001 then tally.scrolls=tally.scrolls+param.ItemCount else tally.gear=tally.gear+1 assert(param.Grade==1 or param.Grade==2) end
 end
 return factoryCode
end}
local _CharacterUnlockLogic={AddGearCollected=function(self,n) tally.collected=tally.collected+n end}
local _ErrorCodeEnum={Success=0}
local ItemCreateParamStruct=function()
 return {Set=function(self,id,count,expiry) self.ItemId=id self.ItemCount=count assert(expiry==0) end}
end
local ItemCreateResultStruct=function() return {} end
local _MonthlyAttendanceUI={}
_MonthlyAttendanceUI.OnClaimFailed=function(self,key,id) tally.failure=tally.failure+1 end
_MonthlyAttendanceUI.OnClaimed=function(self,day,id) tally.success=tally.success+1 end
local a={MonthlyClaimedCount=0,MonthlyCanClaimToday=true,MonthlyTotalDays=30,MonthlySkinDuplicateDiamonds=500,_monthlyLastClaimDayKey=0,_claimBusy=false,Loaded=true,ClaimedCount=0,TotalDays=7,_lastClaimDayKey=0,FreeRelicPulls=0,FreeSkillPulls=0}
a.MonthlyKinds={"gold","diamond","scroll","gold","diamond","gearArmor","relicPull",
		"gold","diamond","scroll","gold","diamond","gearWeapon","skillPull",
		"gold","diamond","scroll","gold","diamond","gearArmor","relicPull",
		"gold","diamond","scroll","gold","diamond","gearWeapon","skillPull","scroll","damageSkin"}
a.MonthlyAmounts={2000,30,1,2500,40,1,5,3000,40,2,3500,50,1,5,4000,50,3,4500,60,1,10,5000,60,4,5500,70,1,10,5,1}
a.MonthlyGrades={0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,2,0,0,0,0,0,0,2,0,0,0}
a.MonthlyScrollIds={[3]=510001,[10]=510002,[17]=510003,[24]=510004,[29]=510005}
a.GetMonthlyRewardKind=function(self,day)
		-- 유효하지 않은 날짜는 보상 없음.
		return self.MonthlyKinds[day] or ""

end
a.GetMonthlyRewardAmount=function(self,day)
		-- 지급량의 서버/클라이언트 공통 원본.
		return self.MonthlyAmounts[day] or 0

end
a.GetMonthlyRewardGrade=function(self,day)
		-- 매직1 / 레어2. 장비 상자를 받을 때 즉시 같은 등급의 장비를 생성한다.
		return self.MonthlyGrades[day] or 0

end
a.GetMonthlyScrollId=function(self,day)
		-- 반지/목걸이는 레이드 전용이므로 일반 출석에 넣지 않는다.
		return self.MonthlyScrollIds[day] or 0

end
a.RefreshCanClaim=function(self)
		-- 같은 한국 날짜에 뉴비/30일 출석을 각각 한 번씩 받을 수 있다.
		local today = self:GetTodayKey()
		self.CanClaimToday = self.Loaded and self.ClaimedCount < self.TotalDays and self._lastClaimDayKey ~= today
		self.MonthlyCanClaimToday = self.Loaded and self.MonthlyClaimedCount < self.MonthlyTotalDays and self._monthlyLastClaimDayKey ~= today

end
a.GrantMonthlyReward=function(self,day,userId)
		-- 지급 성공은 빈 문자열, 실패는 클라이언트 번역 키. 실패하면 누적일과 날짜를 바꾸지 않는다.
		local kind = self:GetMonthlyRewardKind(day)
		local amount = self:GetMonthlyRewardAmount(day)
		if amount <= 0 then return "UI_MONTHLY_ATTENDANCE_RETRY" end
		if kind == "gold" then _GameManager:AddCoins(amount) return "" end
		if kind == "diamond" then _GameManager:AddDiamond(amount) return "" end
		if kind == "relicPull" then self.FreeRelicPulls = self.FreeRelicPulls + amount return "" end
		if kind == "skillPull" then self.FreeSkillPulls = self.FreeSkillPulls + amount return "" end
		if kind == "damageSkin" then
			if not _DamageSkinLogic:IsReadyForAttendance() then return "UI_MONTHLY_ATTENDANCE_RETRY" end
			local key = self:GetMonthlySkinKey()
			if key == "" then _GameManager:AddDiamond(self.MonthlySkinDuplicateDiamonds) return "" end
			if not _DamageSkinLogic:TryGrantAttendanceSkin(key) then return "UI_MONTHLY_ATTENDANCE_RETRY" end
			return ""
		end
		local itemId = self:GetMonthlyScrollId(day)
		local param = nil
		if kind == "gearArmor" or kind == "gearWeapon" then
			local pool = _LevelRewardLogic:GetGearPool(kind)
			if #pool == 0 then return "UI_MONTHLY_ATTENDANCE_RETRY" end
			itemId = pool[_UtilLogic:RandomIntegerRange(1, #pool)]
		elseif kind ~= "scroll" then return "UI_MONTHLY_ATTENDANCE_RETRY" end
		if not _InventoryExpandLogic:HasRoomFor(userId, itemId) then return "UI_MONTHLY_ATTENDANCE_INVENTORY_FULL" end
		if kind == "scroll" then
			param = ItemCreateParamStruct()
			param:Set(itemId, amount, 0)
		else param = _GameManager:BuildGearCreateParamForGrade(itemId, self:GetMonthlyRewardGrade(day)) end
		param.IsIgnoreInvenCapacity = false
		local code = _ItemFactoryLogic:TryAddItem(userId, param, ItemCreateResultStruct())
		if code ~= _ErrorCodeEnum.Success then
			log_warning("AttendanceLogic: monthly inventory reward rejected code=" .. tostring(code))
			return "UI_MONTHLY_ATTENDANCE_INVENTORY_FULL"
		end
		if kind ~= "scroll" then _CharacterUnlockLogic:AddGearCollected(1) end
		return ""

end
a.RequestClaimMonthly=function(self,requestedDay)
		-- 클라이언트 날짜를 믿지 않고 서버 누적일/한국 날짜/요청자를 검증한다. 연타와 중복 요청을 차단한다.
		if not self:IsRequestOwner(senderUserId) or self._claimBusy then
			_MonthlyAttendanceUI:OnClaimFailed("UI_MONTHLY_ATTENDANCE_RETRY", senderUserId)
			return
		end
		self:RefreshCanClaim()
		local day = self.MonthlyClaimedCount + 1
		if not self.MonthlyCanClaimToday or requestedDay ~= day then
			_MonthlyAttendanceUI:OnClaimFailed("MLUA_ATTENDANCEUI_002", senderUserId)
			return
		end
		self._claimBusy = true
		local today = self:GetTodayKey()
		local failure = self:GrantMonthlyReward(day, senderUserId)
		if failure ~= "" then
			self._claimBusy = false
			_MonthlyAttendanceUI:OnClaimFailed(failure, senderUserId)
			return
		end
		self.MonthlyClaimedCount = day
		self._monthlyLastClaimDayKey = today
		self.MonthlyCanClaimToday = false
		self:Save()
		_GameManager:PersistRewardNow(senderUserId)
		self._claimBusy = false
		_MonthlyAttendanceUI:OnClaimed(day, senderUserId)
		log("AttendanceLogic: monthly claimed day=" .. day .. " kind=" .. self:GetMonthlyRewardKind(day) .. " amount=" .. self:GetMonthlyRewardAmount(day))

end

a.IsRequestOwner=function(self,id) return self.Loaded and id=="fixture-user" end
a.GetTodayKey=function() return today end
a.GetMonthlySkinKey=function() return skinKey end
a.Save=function() tally.saves=tally.saves+1 end
-- Weekly grants and all 30 sequential rewards use the real method bodies, isolated from the game.
for day=1,30 do
 today=today+1
 a:RefreshCanClaim()
 a:RequestClaimMonthly(day)
 assert(a.MonthlyClaimedCount==day and not a.MonthlyCanClaimToday and not a._claimBusy)
 local successes=tally.success
 a:RequestClaimMonthly(day)
 assert(tally.success==successes and a.MonthlyClaimedCount==day)
end
assert(tally.gold==30000 and tally.diamond==400)
assert(a.FreeRelicPulls==15 and a.FreeSkillPulls==15)
assert(tally.scrolls==15 and tally.gear==4 and tally.collected==4)
assert(tally.skins==1 and tally.saves==30 and tally.persist==30 and tally.success==30)
-- Full inventory and factory failures leave the attendance day/date unchanged.
a.MonthlyClaimedCount=2 a._monthlyLastClaimDayKey=0 room=false
local saves=tally.saves local items=tally.items
a:RequestClaimMonthly(3)
assert(a.MonthlyClaimedCount==2 and a._monthlyLastClaimDayKey==0 and tally.items==items and tally.saves==saves and not a._claimBusy)
room=true factoryCode=1
a:RequestClaimMonthly(3)
assert(a.MonthlyClaimedCount==2 and tally.items==items and tally.saves==saves)
factoryCode=0
a:RequestClaimMonthly(4)
assert(a.MonthlyClaimedCount==2 and tally.saves==saves)
a._claimBusy=true a:RequestClaimMonthly(3) a._claimBusy=false
assert(a.MonthlyClaimedCount==2 and tally.saves==saves)
a.Loaded=false a:RequestClaimMonthly(3) a.Loaded=true
assert(a.MonthlyClaimedCount==2 and tally.saves==saves)
-- Skin storage readiness/failure and all-owned substitution.
a.MonthlyClaimedCount=29 a._monthlyLastClaimDayKey=0 skinReady=false
a:RequestClaimMonthly(30)
assert(a.MonthlyClaimedCount==29 and tally.saves==saves)
skinReady=true skinGrant=false
a:RequestClaimMonthly(30)
assert(a.MonthlyClaimedCount==29 and tally.saves==saves)
skinGrant=true skinKey=""
local diamonds=tally.diamond
a:RequestClaimMonthly(30)
assert(a.MonthlyClaimedCount==30 and tally.diamond==diamonds+500)
a.EncodeSavedData=function(self)
		-- 두 출석과 기존 무료권을 같은 유저 키에 함께 보관한다.
		return _HttpService:JSONEncode({c=self.ClaimedCount,d=self._lastClaimDayKey,fr=self.FreeRelicPulls,fs=self.FreeSkillPulls,mc=self.MonthlyClaimedCount,md=self._monthlyLastClaimDayKey})

end
a.Save=function(self)
		-- 한 저장 요청이 끝나기 전에 다른 보상이 들어오면 최신 스냅샷을 이어서 저장한다.
		if not self.Loaded or self._profileCode == "" then return end
		self._saveDirty = true
		self:FlushSave()

end
a.FlushSave=function(self)
		-- 대기 중 들어온 변경을 덮어쓰지 않도록 저장을 직렬화하고, 실패 시 메모리 상태를 유지해 재시도한다.
		if self._saveBusy or not self._saveDirty or not self.Loaded then return end
		self._saveBusy = true
		local ds = _DataStorageService:GetUserDataStorage(self._profileCode)
		while self._saveDirty do
			local payload = self:EncodeSavedData()
			if payload == self._lastSavedJson then self._saveDirty = false break end
			local code = ds:SetAndWait(self.StorageKey, payload)
			if code ~= 0 then
				self._saveBusy = false
				log_warning("AttendanceLogic: save pending code=" .. tostring(code))
				if not self._closing and self._saveRetryTimerId == 0 then
					self._saveRetryTimerId = _TimerService:SetTimerOnce(function()
						self._saveRetryTimerId = 0
						self:FlushSave()
					end, 3)
				end
				return
			end
			self._lastSavedJson = payload
			self._saveDirty = self:EncodeSavedData() ~= payload
		end
		self._saveBusy = false

end

-- Storage is a LOCAL fake. Verify latest-snapshot serialization, no-op writes and failure retry.
accountFixture=a
a.StorageKey="Attendance" a._profileCode="fixture-profile"
a._lastSavedJson="" a._saveBusy=false a._saveDirty=false a._closing=false a._saveRetryTimerId=0
injectMutation=true
a:Save()
assert(writeCalls==2 and stored==a:EncodeSavedData() and not a._saveDirty and not a._saveBusy)
a:Save()
assert(writeCalls==2)
storeCode=1 a.FreeRelicPulls=a.FreeRelicPulls+5
a:Save()
assert(writeCalls==3 and a._saveDirty and not a._saveBusy and a._saveRetryTimerId==77 and retry~=nil)
storeCode=0 retry()
assert(writeCalls==4 and stored==a:EncodeSavedData() and not a._saveDirty and a._saveRetryTimerId==0)
log("MONTHLY_LOCAL_FIXTURES_PASS: all 30 grants, duplicate/out-of-order/busy/unloaded requests, inventory failure, skin failure/fallback, serialized save/no-op/retry; no live mutation")
