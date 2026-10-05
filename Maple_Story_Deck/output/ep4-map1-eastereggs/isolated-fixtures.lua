
-- ALL services, rewards, user state and currency below are LOCAL in-memory fakes.
-- This script never claims, spends, saves or grants against the live account.
local senderUserId="fixture"
local isvalid=function(v) return v~=nil and not v.dead end
local map={}
local objs={}
for i=1,5 do objs["/maps/ep4_map1/esteregg_" .. i]={CurrentMap=map,Enable=i~=5,TransformComponent={WorldPosition=Vector3(62,0,0)}} end
local _EntityService={GetEntityByPath=function(self,p) return objs[p] end}
local _UserService={GetUserEntityByUserId=function(self,id) return id=="fixture" and {CurrentMap=map} or nil end}
local _MapManager={CurrentMapIndex=138,GetSpawnPositionForIndex=function() return Vector3(62,0,0) end}
local tally={skill=0,white=0,red=0,loot=0,bonus=0,ui=0}
local _GameManager={GameStarted=true,GameOver=false,TotalCoins=10000,EasterEggPaused=false,OptionPaused=false}
function _GameManager:IsGamePaused() return self.EasterEggPaused or self.OptionPaused end
function _GameManager:SetEasterEggPaused(v) self.EasterEggPaused=v end
function _GameManager:SpendCoins(n) if n>self.TotalCoins then return false end self.TotalCoins=self.TotalCoins-n return true end
function _GameManager:GetGroundFallFor() return Vector3(0,0,0) end
function _GameManager:GetMonsterLootItemId(zone,species) return zone<144 and (species%2==0 and "teddy_cotton" or "ratz_trap") or (species%2==0 and "robotoy_battery" or "toy_drum") end
function _GameManager:ApplyPotionDrop(kind) if kind==2 then tally.white=tally.white+1 else tally.red=tally.red+1 end end
function _GameManager:GrantLootItemDrop() tally.loot=tally.loot+1 end
local _Ep4EasterEggUI={}
function _Ep4EasterEggUI:ShowQuiz(...) tally.ui=tally.ui+1 end
function _Ep4EasterEggUI:ShowDonation(...) tally.ui=tally.ui+1 end
function _Ep4EasterEggUI:HideModal(...) tally.ui=tally.ui+1 end
local _UIToast={ShowMessage=function() end}
local _AchievementLogic={OnEasterEgg=function() end}
local _CardManager={BuildActiveUpgradePool=function() return {1} end,GrantCardUpgradesFromPool=function() tally.skill=tally.skill+1 end}
local _EasterEggBonusLogic={RollBonus=function() tally.bonus=tally.bonus+1 end}
local items={}
local _PlayerInventory={GetItemDef=function() return {icon="fake"} end}
function _PlayerInventory:GetItemCount(id) return items[id] or 0 end
function _PlayerInventory:RemoveItem(id,n) if self:GetItemCount(id)<n then return false end items[id]=items[id]-n return true end
local _SpawnService={SpawnByModelId=function()
 local icon={Enable=true,SpriteRendererComponent={},TransformComponent={}}
 local count={Enable=true,TextRendererComponent={}}
 return {GetChildByName=function(self,n) return n=="Icon" and icon or count end,Destroy=function(self) self.dead=true end}
end}
local _TimerService={SetTimerOnce=function() return 1 end}
local tape={}
local _UtilLogic={RandomIntegerRange=function(self,l,h) return l end,RandomDouble=function() return #tape>0 and table.remove(tape,1) or .99 end}
local _Ep4QuizBank={}
local a={QuizComplete=false,DonationCount=0,DonationSkillRewards=0,PortalActive=false,CollectAmount=50,_pickedItems={},_collected={},_bubbles={},_costs={100,200,400,600,800,1000},_quizIds={},_step=0,_session=0,_revision=0,_mode="",_userId="",_zone=0,_failed=false,_busy=false,_modalRemaining=0}

function _Ep4QuizBank:GetAnswer(question)
		-- 범위 검사는 질문 목록을 만드는 서버가 보장한다.
		local answers={true,false,true,true,false,true,false,true,false,true,false,false,true,false,true,true,true,true,true,false}
		return answers[question]==true
end

function a:ValidObject(egg,obj,userId)
		-- 화면 밖/다른 맵/로비 요청은 서버에서 차단한다. 현재 존 안에 있는 오브젝트만 허용한다.
		if egg < 1 or egg > 4 or not isvalid(obj) then return false end
		if obj ~= _EntityService:GetEntityByPath("/maps/ep4_map1/esteregg_" .. egg) then return false end
		if not _GameManager.GameStarted or _GameManager.GameOver then return false end
		local user=_UserService:GetUserEntityByUserId(userId)
		if not isvalid(user) or user.CurrentMap ~= obj.CurrentMap then return false end
		local zone=_MapManager.CurrentMapIndex
		if zone < 134 or zone > 143 then return false end
		local spawn=_MapManager:GetSpawnPositionForIndex(zone)
		return math.abs(obj.TransformComponent.WorldPosition.x-spawn.x) < 8
end

function a:OnObjectTouched(egg,obj,userId)
		-- 월드 터치의 단일 진입점. 모달 중에는 다른 이스터에그를 중복으로 열지 않는다.
		if self._mode ~= "" or _GameManager:IsGamePaused() or not self:ValidObject(egg,obj,userId) then return end
		if egg == 1 then
			if self.QuizComplete then _UIToast:ShowMessage("EP4_EGG_DONE",userId) return end
			self:BeginModal("quiz",obj,userId)
			self:StartQuestions()
		elseif egg == 2 or egg == 3 then
			self:Collect(egg,obj,userId)
		else
			if self.DonationCount >= #self._costs then _UIToast:ShowMessage("EP4_DONATE_DONE",userId) return end
			self:BeginModal("donate",obj,userId)
			self:ShowDonation()
		end
end

function a:BeginModal(mode,obj,userId)
		-- 모달 전용 정지 소유권을 사용해 옵션/튜토리얼 정지를 해제하지 않는다.
		self._session=self._session+1
		self._revision=self._revision+1
		self._mode=mode self._object=obj self._userId=userId
		self._zone=_MapManager.CurrentMapIndex self._modalRemaining=300
		_GameManager:SetEasterEggPaused(true)
		log("Ep4Egg: open " .. mode .. " session=" .. self._session)
end

function a:StartQuestions()
		-- 스무 문제에서 중복 없는 세 문제를 추첨한다. 재시도도 첫 문제부터 새로 시작한다.
		local pool={}
		for i=1,20 do table.insert(pool,i) end
		self._quizIds={}
		for i=1,3 do
			local pick=_UtilLogic:RandomIntegerRange(1,#pool)
			table.insert(self._quizIds,table.remove(pool,pick))
		end
		self._step=1 self._failed=false self._revision=self._revision+1
		self:ShowQuestion()
end

function a:ShowQuestion()
		-- 정답은 서버가 보관하고 클라이언트에는 문제 번호와 진행도만 보낸다.
		_Ep4EasterEggUI:ShowQuiz(self._session,self._revision,self._quizIds[self._step],self._step,self._failed,self._userId)
end

function a:ValidSession(session,revision,userId,mode)
		-- 지난 문제 답변/중복 클릭/다른 사용자/맵 이탈을 차단한다.
		return not self._busy and self._mode==mode and self._session==session and self._revision==revision and self._userId==userId and self:ValidObject(mode=="quiz" and 1 or 4,self._object,userId) and self._zone==_MapManager.CurrentMapIndex
end

function a:RequestAnswer(session,revision,answer)
		-- 클라이언트의 성공 통보는 사용하지 않고 세 답변 모두 서버에서 판정한다.
		if not self:ValidSession(session,revision,senderUserId,"quiz") or self._failed then return end
		self._revision=self._revision+1 self._modalRemaining=300
		if answer ~= _Ep4QuizBank:GetAnswer(self._quizIds[self._step]) then
			self._failed=true self:ShowQuestion()
			log("Ep4Egg: quiz wrong; retry from question 1")
			return
		end
		if self._step < 3 then self._step=self._step+1 self:ShowQuestion() return end
		self.QuizComplete=true
		local obj=self._object local userId=self._userId
		self:EndModal()
		self:GrantStandardReward(obj)
		_UIToast:ShowMessage("EP4_QUIZ_SUCCESS",userId)
		log("Ep4Egg: quiz success 3/3; reward once per run")
end

function a:RequestRetry(session,revision)
		-- 실패한 세트만 재시도할 수 있고 이미 맞힌 개수는 남기지 않는다.
		if not self:ValidSession(session,revision,senderUserId,"quiz") or not self._failed then return end
		self._modalRemaining=300 self:StartQuestions()
end

function a:RequestCancel(session)
		-- 닫기/아니오는 비용이나 시도 횟수를 소모하지 않는다.
		if self._mode=="" or self._session~=session or self._userId~=senderUserId then return end
		self:EndModal()
end

function a:EndModal()
		-- 모든 종료 경로에서 모달만 닫고 자신의 일시정지만 해제한다.
		local userId=self._userId local session=self._session
		self._mode="" self._object=nil self._userId="" self._modalRemaining=0
		_GameManager:SetEasterEggPaused(false)
		if userId~="" then _Ep4EasterEggUI:HideModal(session,userId) end
end

function a:OnUpdate(delta)
		-- 게임오버/맵 이탈/접속 종료/장시간 방치로 정지가 남지 않게 정리한다.
		if self._mode=="" then return end
		self._modalRemaining=self._modalRemaining-delta
		if self._modalRemaining<=0 or self._zone~=_MapManager.CurrentMapIndex or not self:ValidObject(self._mode=="quiz" and 1 or 4,self._object,self._userId) then self:EndModal() end
end

function a:GetLootPool(mapNumber)
		-- 실제 ep4 몬스터 정의표의 잡템을 모아 중복 제거한다. 맵 밖 잡템은 목표에 섞지 않는다.
		local first=mapNumber==1 and 134 or 144
		local seen={} local pool={}
		for zone=first,first+9 do
			for species=1,4 do
				local id=_GameManager:GetMonsterLootItemId(zone,species)
				if id~="" and not seen[id] and _PlayerInventory:GetItemDef(id)~=nil then seen[id]=true table.insert(pool,id) end
			end
		end
		return pool
end

function a:Collect(egg,obj,userId)
		-- 2번은 맵1, 3번은 맵2 잡템 한 종류 50개. 완료는 런당 한 번이다.
		if self._collected[egg] then return end
		local id=self._pickedItems[egg]
		if id==nil then
			local pool=self:GetLootPool(egg-1)
			if #pool==0 then log_error("Ep4Egg: no collection loot pool") return end
			id=pool[_UtilLogic:RandomIntegerRange(1,#pool)] self._pickedItems[egg]=id
		end
		local have=_PlayerInventory:GetItemCount(id)
		if have < self.CollectAmount then
			self:ShowCollectBubble(egg,obj,id,self.CollectAmount-have)
			log("Ep4Egg: collect " .. egg .. " " .. id .. " " .. have .. "/50")
			return
		end
		if not _PlayerInventory:RemoveItem(id,self.CollectAmount) then return end
		self._collected[egg]=true self:ClearBubble(egg)
		self:GrantStandardReward(obj)
		_UIToast:ShowMessage("EP4_COLLECT_SUCCESS",userId)
		log("Ep4Egg: collection completed egg=" .. egg .. " item=" .. id)
end

function a:ShowCollectBubble(egg,obj,id,remaining)
		-- 공용 잡템 말풍선의 실측 아이콘 칸을 사용한다. 몬스터가 비지 않도록 아이템만 표시한다.
		self:ClearBubble(egg)
		local p=obj.TransformComponent.WorldPosition
		local bubble=_SpawnService:SpawnByModelId("giftbubble","Ep4CollectBubble" .. egg,Vector3(p.x-0.76,p.y+0.92,p.z-0.5),obj.CurrentMap)
		if not isvalid(bubble) then return end
		self._bubbles[egg]=bubble
		local def=_PlayerInventory:GetItemDef(id)
		local icon=bubble:GetChildByName("Icon")
		icon.SpriteRendererComponent.SpriteRUID=def.icon
		icon.TransformComponent.Position=Vector3(-0.7126,-0.2924,0)
		icon.TransformComponent.Scale=Vector3(2.73173356,2.73173332,1)
		icon.Enable=true
		local count=bubble:GetChildByName("Count")
		count.Enable=true count.TextRendererComponent.Text="X" .. remaining
		count.TextRendererComponent.Font="Maple" count.TextRendererComponent.FontSize=3
		count.TextRendererComponent.FaceDilate=0.3590512 count.TextRendererComponent.OutlineWidth=0.4188931
		_TimerService:SetTimerOnce(function()
			if isvalid(bubble) then bubble:Destroy() end
			if self._bubbles[egg]==bubble then self._bubbles[egg]=nil end
		end,2)
end

function a:ClearBubble(egg)
		-- 재터치/새 게임에 지난 진행 말풍선을 남기지 않는다.
		local bubble=self._bubbles[egg]
		if isvalid(bubble) then bubble:Destroy() end
		self._bubbles[egg]=nil
end

function a:GrantStandardReward(obj)
		-- 기존 수집형과 같은 하얀 포션 + 장착 스킬 한 번 강화 + 다이아/뽑기권/버프 포션 공용 덤.
		if not isvalid(obj) then return end
		local p=obj.TransformComponent.WorldPosition
		local f=_GameManager:GetGroundFallFor(obj,p)
		_GameManager:ApplyPotionDrop(2,p,f.x,f.y,1)
		local pool=_CardManager:BuildActiveUpgradePool()
		if #pool>0 then _CardManager:GrantCardUpgradesFromPool(pool,p,f.x,f.y,1,1,0) end
		_EasterEggBonusLogic:RollBonus(p,f.x,f.y)
end

function a:ShowDonation()
		-- 현재 단계 비용과 실제 보유 골드를 보여준다. 부족해도 회색 버튼은 눌러 안내할 수 있다.
		_Ep4EasterEggUI:ShowDonation(self._session,self._revision,self.DonationCount+1,self._costs[self.DonationCount+1],_GameManager.TotalCoins,self._userId)
end

function a:RequestDonate(session,revision)
		-- 서버에서 비용/시도/보유량을 다시 검사한다. 결제 실패는 단계나 보상을 바꾸지 않는다.
		if not self:ValidSession(session,revision,senderUserId,"donate") or self.DonationCount>=#self._costs then return end
		self._busy=true
		local cost=self._costs[self.DonationCount+1]
		if not _GameManager:SpendCoins(cost) then
			self._busy=false self:ShowDonation()
			_UIToast:ShowMessage("EP4_GOLD_SHORT",self._userId)
			return
		end
		self.DonationCount=self.DonationCount+1
		local obj=self._object local userId=self._userId
		self:EndModal()
		local p=obj.TransformComponent.WorldPosition local f=_GameManager:GetGroundFallFor(obj,p)
		local roll=_UtilLogic:RandomDouble()
		local pool=_CardManager:BuildActiveUpgradePool()
		if roll>=0.9 and self.DonationSkillRewards<2 and #pool>0 then
			self.DonationSkillRewards=self.DonationSkillRewards+1
			_CardManager:GrantCardUpgradesFromPool(pool,p,f.x,f.y,1,1,0)
		elseif roll>=0.6 and roll<0.9 then
			_GameManager:ApplyPotionDrop(1,p,f.x,f.y,1)
		else
			local loot=self:GetLootPool(1)
			if #loot>0 then _GameManager:GrantLootItemDrop(p,f.x,f.y,loot[_UtilLogic:RandomIntegerRange(1,#loot)],1) end
		end
		-- 포탈은 보상과 별도 추첨: 매 기부 10%, 여섯 번째는 확정. 이미 열렸으면 유지한다.
		if self.DonationCount==#self._costs or _UtilLogic:RandomDouble()<0.1 then self:RevealPortal() end
		_AchievementLogic:OnEasterEgg()
		_UIToast:ShowMessage("EP4_DONATE_THANKS",userId)
		self._busy=false
		log("Ep4Egg: donated step=" .. self.DonationCount .. " cost=" .. cost .. " skills=" .. self.DonationSkillRewards .. " portal=" .. tostring(self.PortalActive))
end

function a:RevealPortal()
		-- 포탈 목적지 이동은 이번 요청 범위에 없으므로 현재 오브젝트만 활성화한다.
		if self.PortalActive then return end
		self.PortalActive=true
		local portal=_EntityService:GetEntityByPath("/maps/ep4_map1/esteregg_5")
		if isvalid(portal) then portal.Enable=true end
		_UIToast:ShowMessage("EP4_PORTAL_OPEN")
		log("Ep4Egg: donation portal revealed")
end

function a:ResetForNewRun()
		-- 새 게임/다시하기에만 초기화한다. 이어하기는 퀴즈/수집/기부 진행을 유지한다.
		self:EndModal() self:ClearBubble(2) self:ClearBubble(3)
		self.QuizComplete=false self.DonationCount=0 self.DonationSkillRewards=0 self.PortalActive=false
		self._pickedItems={} self._collected={} self._quizIds={} self._step=0 self._failed=false self._busy=false
		local portal=_EntityService:GetEntityByPath("/maps/ep4_map1/esteregg_5")
		if isvalid(portal) then portal.Enable=false end
end

local quiz=objs["/maps/ep4_map1/esteregg_1"]
local collect2=objs["/maps/ep4_map1/esteregg_2"]
local collect3=objs["/maps/ep4_map1/esteregg_3"]
local donate=objs["/maps/ep4_map1/esteregg_4"]
local portal=objs["/maps/ep4_map1/esteregg_5"]
a:OnObjectTouched(1,quiz,"fixture")
assert(a._mode=="quiz" and _GameManager.EasterEggPaused and #a._quizIds==3)
assert(a._quizIds[1]~=a._quizIds[2] and a._quizIds[2]~=a._quizIds[3])
local rev=a._revision
a:RequestAnswer(a._session,rev,false)
assert(a._failed and not a.QuizComplete and tally.white==0)
a:RequestAnswer(a._session,rev,true)
assert(a._failed and a._step==1)
a:RequestRetry(a._session,a._revision)
assert(not a._failed and a._step==1)
senderUserId="intruder" a:RequestAnswer(a._session,a._revision,true) senderUserId="fixture"
assert(a._step==1)
for i=1,3 do
 local oldSession=a._session local oldRevision=a._revision
 a:RequestAnswer(oldSession,oldRevision,_Ep4QuizBank:GetAnswer(a._quizIds[a._step]))
 if i<3 then local step=a._step a:RequestAnswer(oldSession,oldRevision,true) assert(a._step==step) end
end
assert(a.QuizComplete and a._mode=="" and not _GameManager.EasterEggPaused and tally.white==1 and tally.skill==1 and tally.bonus==1)
a:OnObjectTouched(1,quiz,"fixture") assert(a._mode=="")
-- Independent collection objectives: 49 cannot redeem; 50 consumes exactly once.
assert(#a:GetLootPool(1)==2 and #a:GetLootPool(2)==2)
a:OnObjectTouched(2,collect2,"fixture")
local item2=a._pickedItems[2] assert(item2=="ratz_trap")
items[item2]=49 a:OnObjectTouched(2,collect2,"fixture") assert(not a._collected[2] and items[item2]==49)
items[item2]=51 a:OnObjectTouched(2,collect2,"fixture") assert(a._collected[2] and items[item2]==1)
local rewards=tally.white a:OnObjectTouched(2,collect2,"fixture") assert(tally.white==rewards)
a:OnObjectTouched(3,collect3,"fixture") local item3=a._pickedItems[3] assert(item3=="toy_drum" and item3~=item2)
items[item3]=50 a:OnObjectTouched(3,collect3,"fixture") assert(a._collected[3] and items[item3]==0)
-- Cancel and insufficient funds never charge or advance. Gray button still routes to rejection.
a:OnObjectTouched(4,donate,"fixture") local session=a._session
a:RequestCancel(session) assert(a.DonationCount==0 and _GameManager.TotalCoins==10000 and not _GameManager.EasterEggPaused)
_GameManager.TotalCoins=99 a:OnObjectTouched(4,donate,"fixture") a:RequestDonate(a._session,a._revision)
assert(a.DonationCount==0 and _GameManager.TotalCoins==99 and a._mode=="donate")
a:RequestCancel(a._session)
_GameManager.TotalCoins=10000
local beforeCoins=_GameManager.TotalCoins local beforeSkills=tally.skill
for i=1,6 do
 a:OnObjectTouched(4,donate,"fixture")
 local ss=a._session local rr=a._revision
 -- First three roll skill. Third must become loot because of the two-skill cap.
 tape={i<=3 and .95 or (i==4 and .7 or .4),.99}
 a:RequestDonate(ss,rr)
 assert(a.DonationCount==i and a._mode=="" and not _GameManager.EasterEggPaused)
 a:RequestDonate(ss,rr) assert(a.DonationCount==i)
 if i<6 then assert(not a.PortalActive and not portal.Enable) end
end
assert(beforeCoins-_GameManager.TotalCoins==3100 and a.DonationSkillRewards==2 and tally.skill-beforeSkills==2)
assert(a.PortalActive and portal.Enable and tally.red==1 and tally.loot==3)
a:OnObjectTouched(4,donate,"fixture") assert(a._mode=="")
-- Early 10% portal unlock, restart clearing and pause ownership.
a:ResetForNewRun() assert(not a.QuizComplete and a.DonationCount==0 and a.DonationSkillRewards==0 and not a.PortalActive and not portal.Enable)
a:OnObjectTouched(4,donate,"fixture") tape={.2,.099} a:RequestDonate(a._session,a._revision)
assert(a.DonationCount==1 and a.PortalActive and portal.Enable)
a:ResetForNewRun()
a:OnObjectTouched(1,quiz,"fixture") _GameManager.OptionPaused=true a:EndModal()
assert(not _GameManager.EasterEggPaused and _GameManager:IsGamePaused()) _GameManager.OptionPaused=false
a:OnObjectTouched(1,quiz,"fixture") a:OnUpdate(301) assert(a._mode=="" and not _GameManager.EasterEggPaused)
a:OnObjectTouched(1,quiz,"fixture") _MapManager.CurrentMapIndex=144 a:OnUpdate(.1) assert(a._mode=="" and not _GameManager.EasterEggPaused)
_MapManager.CurrentMapIndex=138
log("EP4_LOCAL_FIXTURES_PASS: quiz wrong/retry/3-correct/duplicate/owner, distinct 50-item pools, insufficient funds/cancel, six costs, two-skill cap, 10%/guaranteed portal, restart and pause cleanup; all services LOCAL")
