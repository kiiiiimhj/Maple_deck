// 2026-09-23: RaidLogic 레이드 2종 요일 교대(월~수 발록 / 목~일 자쿰) 적용 스크립트(1회용)
const fs = require('fs');
const p = 'RootDesk/MyDesk/Raid/RaidLogic.mlua';
let s = fs.readFileSync(p, 'utf8');
const crlf = s.includes('\r\n');
s = s.replace(/\r\n/g, '\n');
function rep(a, b) {
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error('count ' + n + ': ' + a.slice(0, 80));
  s = s.replace(a, () => b);
}

rep(`	-- 저장: 유저별 저장소 1개 키("Raid")에 JSON으로 모아 담는다(계정 데이터는 전역 저장소 금지).
`, `	-- 저장: 유저별 저장소 1개 키("Raid")에 JSON으로 모아 담는다(계정 데이터는 전역 저장소 금지).
	--
	-- ── 2026-09-23 유저 지정: 레이드 2종 요일 교대 ─────────────────────────────────
	--   · **월·화·수 = 마왕 발록(Raid_1, 3일)**, **목·금·토·일 = 자쿰(Raid_2, 4일)**. 한 번에 하나만 열린다(선택 없음).
	--     로비 레이드 버튼도 하나이고, 요일에 따라 발록/자쿰으로 보인다(RaidUI).
	--   · 정산 구간이 따로 없다 — 한 레이드가 끝나는 순간 다음 레이드가 시작된다. 끝난 레이드의 최종 등급은
	--     기존 "지난 시즌 미수령 보상" 규칙 그대로 Pending으로 옮겨지고, **그 보상을 받아야 다음 레이드 시계가 돈다**.
	--   · 기간 번호(SeasonIndex) = 주 번호 × 2 + (발록 0 / 자쿰 1). 옛 저장분(주 번호)은 번호가 달라서 로드 때
	--     한 번 "기간이 넘어갔다"로 처리된다(그 판의 등급이 발록 미수령 보상으로 남는다).
	--   · 화력은 레이드마다 따로 — 기간이 바뀌면 누적 DPS가 0부터 다시 쌓인다(자쿰은 목 0시부터 새로).
	--   · 체력: 발록은 3일에 하루 7판 = S, 자쿰은 하루 더 길어 4일에 하루 7판 = S(= 하루치를 더 때려야 한다).
	--       3일 누적 = 10D·86400 + 20D·86400 + 30D·43200 = 45 × 86400·D  (4일은 80 × 86400·D)
	--       → 발록 HpPerRefDps = 6,451,200 × 45/80 = 3,628,800, 자쿰 = 6,451,200(예전 4일 값 그대로)
	--   · 보상: 발록 = 반지(110002)+반지 강화 주문서(510006), 자쿰 = 목걸이(100002)+목걸이 강화 주문서(510007).
	--     등급→장비 등급·다이아·주문서 수 표는 공용이다.
`);

rep(`	@Sync
	property integer PendingGrade = -1
`, `	@Sync
	property integer PendingGrade = -1

	-- 지금 열려 있는 레이드(1 = 마왕 발록 / 2 = 자쿰)와, 미수령 보상이 어느 레이드 것인지(-1 = 없음)
	@Sync
	property integer RaidId = 1

	@Sync
	property integer PendingRaidId = -1

	property integer RaidBalrog = 1

	property integer RaidZakum = 2
`);

rep(`	-- BossHp = RefRunDps × 이 값. 최초 9,216,000(하루 10판 S) × 0.7 = 6,451,200(하루 7판 S, 2026-09-23 유저 지정)
	property number HpPerRefDps = 6451200

	-- 시즌 길이(일) — 유저 지정 2026-09-21 "월~목 4일"
	property integer SeasonDays = 4
`, `	-- BossHp = RefRunDps × 이 값. 4일 기준 최초 9,216,000(하루 10판 S) × 0.7 = 6,451,200(하루 7판 S, 2026-09-23 유저 지정).
	-- 2026-09-23 레이드 교대: 발록은 3일이라 45/80로 줄인다(헤더 계산식), 자쿰은 4일이라 그대로
	property number HpPerRefDpsBalrog = 3628800

	property number HpPerRefDpsZakum = 6451200

	-- 발록이 열리는 날 수(월~수). 나머지(목~일)는 자쿰이다
	property integer BalrogDays = 3

	-- 테스트 전용: 0이 아니면 요일과 상관없이 이 레이드가 열린 것으로 친다(DebugForceRaid)
	property integer _debugForceRaidId = 0
`);

rep(`	property integer RewardScrollItemId = 510006
`, `	property integer RewardScrollItemId = 510006

	-- 자쿰 보상 = 목걸이 라인 + 목걸이 강화 주문서(2026-09-23 유저 지정 — 옵션 구조는 반지와 같다)
	property integer ZakumRewardItemId = 100002

	property integer ZakumRewardScrollItemId = 510007
`);

rep(`				self.PendingGrade = math.floor(tonumber(t["pgrade"]) or -1)
`, `				self.PendingGrade = math.floor(tonumber(t["pgrade"]) or -1)
				-- 레이드 종류가 생기기 전(발록만 있던) 저장분은 전부 발록이다
				self.RaidId = math.floor(tonumber(t["raid"]) or self.RaidBalrog)
				self.PendingRaidId = math.floor(tonumber(t["praid"]) or self.RaidBalrog)
				if self.PendingGrade < 0 then self.PendingRaidId = -1 end
				self.RaidMapName = self:GetRaidMapName(self.RaidId)
`);
rep(`		t["pgrade"] = self.PendingGrade
`, `		t["pgrade"] = self.PendingGrade
		t["raid"] = self.RaidId
		t["praid"] = self.PendingRaidId
`);

rep(`	-- ── 시각 / 시즌(월~목 4일) ────────────────────────────────────────────────`,
  `	-- ── 시각 / 시즌(월~수 발록 · 목~일 자쿰) ─────────────────────────────────────`);

rep(`	method integer GetCurrentSeason()
		-- 시즌 번호 = KST 월요일 기준 주 번호(JDN//7)
		local kst = DateTime.UtcNow + TimeSpan.FromHours(9)
		local a = (14 - kst.Month) // 12
		local y = kst.Year + 4800 - a
		local m = kst.Month + 12 * a - 3
		local jdn = kst.Day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045
		return jdn // 7
	end

	@ExecSpace("ServerOnly")
	method integer GetSeasonEndSec()
		-- 이번 시즌이 끝나는 시각(KST 금요일 0시)을 NowSec과 같은 기준으로 돌려준다.
		-- KST 보정(+9h)은 "주 시작 시각"을 구할 때 서로 상쇄되므로 그대로 빼면 된다.
		return self:NowSec() - self:GetKstWeekElapsed() + self.SeasonDays * 86400
	end

	-- 이번 시즌 종료까지 남은 초(레이드 화면의 "남은시간"). 끝났으면 0 — 서버/클라 공용
	method integer GetSeasonRemainSeconds()
		local remain = self.SeasonDays * 86400 - self:GetKstWeekElapsed()
		if remain < 0 then return 0 end
		return remain
	end

	-- 지금이 공격 가능한 구간인가(월~목). 금~일은 정산 구간이라 누적도 피해도 멈춘다
	method boolean IsSeasonActive()
		return self:GetKstWeekElapsed() < self.SeasonDays * 86400
	end
`, `	method integer GetCurrentRaidId()
		-- 지금 요일에 열리는 레이드 — 월~수 발록 / 목~일 자쿰(테스트 강제값이 있으면 그걸 쓴다)
		if self._debugForceRaidId ~= 0 then return self._debugForceRaidId end
		if self:GetKstWeekElapsed() < self.BalrogDays * 86400 then return self.RaidBalrog end
		return self.RaidZakum
	end

	method integer GetCurrentSeason()
		-- 기간 번호 = KST 월요일 기준 주 번호(JDN//7) × 2 + (발록 0 / 자쿰 1)
		local kst = DateTime.UtcNow + TimeSpan.FromHours(9)
		local a = (14 - kst.Month) // 12
		local y = kst.Year + 4800 - a
		local m = kst.Month + 12 * a - 3
		local jdn = kst.Day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045
		return (jdn // 7) * 2 + (self:GetCurrentRaidId() - 1)
	end

	method integer GetPeriodEndWeekSec()
		-- 지금 기간이 끝나는 시각을 "이번 주 월요일 0시부터 몇 초"로 — 발록 목 0시 / 자쿰 다음 주 월 0시
		if self:GetCurrentRaidId() == self.RaidBalrog then return self.BalrogDays * 86400 end
		return 7 * 86400
	end

	@ExecSpace("ServerOnly")
	method integer GetSeasonEndSec()
		-- 이번 기간이 끝나는 시각을 NowSec과 같은 기준으로 돌려준다.
		-- KST 보정(+9h)은 "주 시작 시각"을 구할 때 서로 상쇄되므로 그대로 빼면 된다.
		return self:NowSec() - self:GetKstWeekElapsed() + self:GetPeriodEndWeekSec()
	end

	-- 이번 기간 종료까지 남은 초(레이드 화면의 "남은시간"). 끝났으면 0 — 서버/클라 공용
	method integer GetSeasonRemainSeconds()
		local remain = self:GetPeriodEndWeekSec() - self:GetKstWeekElapsed()
		if remain < 0 then return 0 end
		return remain
	end

	-- 지금이 공격 가능한 구간인가. 2026-09-23 레이드 교대로 정산 구간이 없어져 항상 어떤 레이드든 열려 있다
	-- (예전엔 금~일이 정산 구간이었다). 호출부 호환을 위해 메서드는 남겨 둔다
	method boolean IsSeasonActive()
		return true
	end

	method string GetRaidMapName(integer raidId)
		-- 레이드별 전투 맵
		if raidId == self.RaidZakum then return "Raid_2" end
		return "Raid_1"
	end

	method number GetHpPerRefDps(integer raidId)
		if raidId == self.RaidZakum then return self.HpPerRefDpsZakum end
		return self.HpPerRefDpsBalrog
	end

	method integer GetRewardItemIdFor(integer raidId)
		-- 레이드별 보상 장비(발록 반지 / 자쿰 목걸이)
		if raidId == self.RaidZakum then return self.ZakumRewardItemId end
		return self.RewardItemId
	end

	method integer GetRewardScrollItemIdFor(integer raidId)
		-- 레이드별 보상 강화 주문서(발록 반지용 / 자쿰 목걸이용)
		if raidId == self.RaidZakum then return self.ZakumRewardScrollItemId end
		return self.RewardScrollItemId
	end
`);

rep(`			self.PendingSeason = self.SeasonIndex
			self.PendingGrade = grade
			log("RaidLogic: season " .. self.SeasonIndex .. " closed, pending reward grade=" .. self:GetGradeName(grade))
		end
		self.SeasonIndex = now`,
  `			self.PendingSeason = self.SeasonIndex
			self.PendingGrade = grade
			self.PendingRaidId = self.RaidId
			log("RaidLogic: season " .. self.SeasonIndex .. " (raid " .. self.RaidId .. ") closed, pending reward grade=" .. self:GetGradeName(grade))
		end
		self.SeasonIndex = now
		self.RaidId = self:GetCurrentRaidId()
		self.RaidMapName = self:GetRaidMapName(self.RaidId)`);

rep(`		log("RaidLogic: new season " .. now .. " started (accumulation reset)")`,
  `		log("RaidLogic: new season " .. now .. " (raid " .. self.RaidId .. ") started (accumulation reset)")`);

rep(`		if not self:IsSeasonActive() then
			log("RaidLogic: run ignored — season closed (Fri~Sun)")
			return
		end
`, ``);

rep(`		-- 역산 결과(헤더 주석 참고). RefRunDps만 바꾸면 전부 따라온다
		return self.RefRunDps * self.HpPerRefDps`,
  `		-- 역산 결과(헤더 주석 참고). RefRunDps만 바꾸면 전부 따라온다. 레이드마다 기간 길이가 달라 계수가 다르다
		return self.RefRunDps * self:GetHpPerRefDps(self.RaidId)`);

rep(`		local grade = self.PendingGrade
		local fromPending = self:HasPendingReward()
		if not fromPending then grade = self:GetGradeIndex() end
		local failKey = self:GrantReward(grade, senderUserId)`,
  `		local grade = self.PendingGrade
		local fromPending = self:HasPendingReward()
		local raidId = self.PendingRaidId
		if not fromPending then
			grade = self:GetGradeIndex()
			raidId = self.RaidId
		end
		if raidId ~= self.RaidZakum then raidId = self.RaidBalrog end
		local failKey = self:GrantReward(grade, raidId, senderUserId)`);
rep(`			self.PendingSeason = -1
			self.PendingGrade = -1
			-- 지난 시즌 보상을 받는 순간`, `			self.PendingSeason = -1
			self.PendingGrade = -1
			self.PendingRaidId = -1
			-- 지난 시즌 보상을 받는 순간`);
rep(`		self:NotifyClaimResult(true, grade, "")`, `		self:NotifyClaimResult(true, grade, raidId, "")`);
rep(`			self:NotifyClaimResult(false, grade, failKey)`, `			self:NotifyClaimResult(false, grade, raidId, failKey)`);
rep(`			self:NotifyClaimResult(false, -1, "MLUA_RAIDLOGIC_005")`, `			self:NotifyClaimResult(false, -1, self.RaidId, "MLUA_RAIDLOGIC_005")`);

rep(`	method string GrantReward(integer gradeIndex, string userId)`, `	method string GrantReward(integer gradeIndex, integer raidId, string userId)`);
rep(`		local gearGrade = self:GetRewardGearGrade(gradeIndex)
		-- 반지도`, `		local gearGrade = self:GetRewardGearGrade(gradeIndex)
		-- 레이드별 보상(발록 반지 / 자쿰 목걸이) — 둘 다 장신구 탭, 주문서는 기타 탭
		local rewardItemId = self:GetRewardItemIdFor(raidId)
		local scrollItemId = self:GetRewardScrollItemIdFor(raidId)
		-- 반지도`);
rep(`		if not _InventoryExpandLogic:HasRoomFor(userId, self.RewardItemId) then
			log("RaidLogic: reward blocked — inventory tab full (ring)")`, `		if not _InventoryExpandLogic:HasRoomFor(userId, rewardItemId) then
			log("RaidLogic: reward blocked — inventory tab full (item " .. rewardItemId .. ")")`);
rep(`		if not _InventoryExpandLogic:HasRoomFor(userId, self.RewardScrollItemId) then
			log("RaidLogic: reward blocked — etc tab full (ring scroll)")`, `		if not _InventoryExpandLogic:HasRoomFor(userId, scrollItemId) then
			log("RaidLogic: reward blocked — etc tab full (scroll " .. scrollItemId .. ")")`);
rep(`_GameManager:BuildGearCreateParamForGradeQuality(self.RewardItemId, gearGrade, quality)`,
  `_GameManager:BuildGearCreateParamForGradeQuality(rewardItemId, gearGrade, quality)`);
rep(`		_FirstWeaponGuaranteeLogic:OnGearGranted(self.RewardItemId)`, `		_FirstWeaponGuaranteeLogic:OnGearGranted(rewardItemId)`);
rep(`		scrollParam.ItemId = self.RewardScrollItemId`, `		scrollParam.ItemId = scrollItemId`);

rep(`	method void NotifyClaimResult(boolean success, integer gradeIndex, string reasonKey)`,
  `	method void NotifyClaimResult(boolean success, integer gradeIndex, integer raidId, string reasonKey)`);
rep(`			local dia = self:GetRewardDiamond(gradeIndex)
			if dia > 0 then
				_RaidUI:ShowClaimToast(_LocalizationService:GetTextFormat("FMT_RAIDLOGIC_002",
					self:GetGradeName(gradeIndex), dia, self:GetRewardScrollCount(gradeIndex)), true)
			else
				_RaidUI:ShowClaimToast(_LocalizationService:GetTextFormat("FMT_RAIDLOGIC_001",
					self:GetGradeName(gradeIndex), self:GetRewardScrollCount(gradeIndex)), true)
			end`,
  `			-- 자쿰 보상은 "목걸이 강화 주문서" 문구를 따로 쓴다(FMT_RAIDLOGIC_003/004)
			local dia = self:GetRewardDiamond(gradeIndex)
			local withDia = "FMT_RAIDLOGIC_002"
			local noDia = "FMT_RAIDLOGIC_001"
			if raidId == self.RaidZakum then
				withDia = "FMT_RAIDLOGIC_004"
				noDia = "FMT_RAIDLOGIC_003"
			end
			if dia > 0 then
				_RaidUI:ShowClaimToast(_LocalizationService:GetTextFormat(withDia,
					self:GetGradeName(gradeIndex), dia, self:GetRewardScrollCount(gradeIndex)), true)
			else
				_RaidUI:ShowClaimToast(_LocalizationService:GetTextFormat(noDia,
					self:GetGradeName(gradeIndex), self:GetRewardScrollCount(gradeIndex)), true)
			end`);

rep(`	property string RaidMapName = "Raid_1"`, `	-- 지금 열린 레이드의 전투 맵(발록 Raid_1 / 자쿰 Raid_2). EnsureSeason이 요일에 맞춰 바꾼다 — 클라(RaidUI)도 읽는다
	@Sync
	property string RaidMapName = "Raid_1"`);

rep(`		self.PendingSeason = self.SeasonIndex - 1
		self.PendingGrade = grade
		self:PushDamage()`, `		self.PendingSeason = self.SeasonIndex - 1
		self.PendingGrade = grade
		-- 지난 기간 = 지금과 다른 레이드
		if self.RaidId == self.RaidZakum then self.PendingRaidId = self.RaidBalrog else self.PendingRaidId = self.RaidZakum end
		self:PushDamage()`);
rep(`		self.PendingSeason = -1
		self.PendingGrade = -1
		self:PublishTotals()
		self:Save()
		log("RaidLogic: debug reset")`, `		self.PendingSeason = -1
		self.PendingGrade = -1
		self.PendingRaidId = -1
		self:PublishTotals()
		self:Save()
		log("RaidLogic: debug reset")`);
rep(`	@ExecSpace("Server")
	method void DebugResetSeason()`, `	@ExecSpace("Server")
	method void DebugForceRaid(integer raidId)
		-- 요일과 상관없이 이 레이드가 열린 것으로 만든다(0 = 요일대로). ⚠ 기간 번호가 바뀌므로 지금 레이드의
		-- 진행은 미수령 보상으로 넘어간다 — 개발 계정 테스트 전용
		self._debugForceRaidId = raidId
		self:EnsureSeason()
		self:PushDamage()
		log("RaidLogic: debug force raid=" .. raidId .. " -> raid " .. self.RaidId .. " map " .. self.RaidMapName)
	end

	@ExecSpace("Server")
	method void DebugResetSeason()`);

if (crlf) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync(p, s, 'utf8');
console.log('ok');
