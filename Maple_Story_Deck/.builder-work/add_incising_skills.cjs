// 레이온 신규 4종 — 인사이징(192) / 인사이징:관(193) / 인사이징:폭(194) / 아이언 바디(195, 패시브)를
// CardManager.mlua · CardRegistry.mlua · ShadowShopUI.mlua · FusionDiscoveryLogic.mlua · GameText.csv에 끼워 넣는 1회성 패치(2026-10-01).
// 앵커가 정확히 1번씩 있어야만 쓴다. 이미 적용돼 있으면 중단.
const fs = require("fs");
const F = JSON.parse(fs.readFileSync(".builder-work/incising_frames.json", "utf8"));
const q = (arr) => arr.map((r) => `"${r}"`).join(", ");
if (F.incising.frames.length !== 13 || F.incHit.frames.length !== 6 || F.gwan.frames.length !== 6 || F.pok.frames.length !== 5) throw new Error("frame count");

function patchFile(file, fn) {
  const raw = fs.readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  const ctx = { s: raw.replace(/\r\n/g, "\n") };
  const count = (needle) => ctx.s.split(needle).length - 1;
  const check = (a) => { if (count(a) !== 1) throw new Error(file + " anchor x" + count(a) + ": " + a.slice(0, 110)); };
  const api = {
    has: (t) => ctx.s.includes(t),
    after: (a, t) => { check(a); ctx.s = ctx.s.replace(a, () => a + t); },
    before: (a, t) => { check(a); ctx.s = ctx.s.replace(a, () => t + a); },
    swap: (a, t) => { check(a); ctx.s = ctx.s.replace(a, () => t); },
  };
  fn(api);
  return () => fs.writeFileSync(file, crlf ? ctx.s.replace(/\n/g, "\r\n") : ctx.s);
}

// ───────────────────────── CardManager ─────────────────────────
const BLOCK = `	-- ── 레이온: 인사이징 (Card 192) / 인사이징:관 (Card 193) / 인사이징:폭 (Card 194)
	--          + 패시브 아이언 바디 (Card 195) — 유저 지정 2026-10-01 ──
	-- 인사이징: 슬롯형 액티브(Lv1~5). 가까운 몬스터 N명을 골라 각각 불꽃 베기 연출을 띄우고, 그 연출 범위(타원) 안의
	--   몬스터 전부에게 대미지 + 화상(100%, 1초마다 기준 대미지의 20%). 120/140/160/180/200, 타겟 1명, 화상 2초(Lv5는 3초). 쿨타임 5초.
	-- 인사이징:관(관통) = 인사이징 Lv5 + 콤보 어택 + 아이언 바디. 230/250/270, 타겟 2명, 화상 3초(틱당 30%), 콤보스택 +1.
	--   인사이징이 나간 뒤 타겟마다 불꽃 검기(용)가 좌/우로 날아가며 연출이 끝날 때까지 경로의 몬스터를 관통, 추가타 30/40/50%.
	-- 인사이징:폭(폭발) = 인사이징 Lv5 + 찬스 어택 + 아이언 바디. 250/280/310, 타겟 2명, 화상 3초(틱당 30%).
	--   인사이징이 나간 뒤 타겟마다 아래에서 위로 솟는 폭발이 터져 범위 안 몬스터에게 추가타 30/40/50% + 스턴 2초(보스·엘리트는 절반).
	-- 두 조합 모두 인사이징의 슬롯을 그대로 넘겨받는다(패시브는 그대로 남는다). 하나를 만들면 인사이징이 사라지므로
	-- 나머지 하나는 그 판에서 못 만든다(프리징 브레스 / 윈드 오브 프레이와 같은 양자택일).
	-- 아이언 바디: 슬롯 없는 패시브. 최대 체력 3/6/9/12/15% 증가(영구). 이름/아이콘/태그는 CardRegistry(192~195).
	@Sync property integer IncisingLevel = 0
	@Sync property integer IncisingPierceLevel = 0
	@Sync property integer IncisingBurstLevel = 0
	@Sync property integer IronBodyLevel = 0
	property integer _ironBodyBonusHp = 0  -- 아이언 바디가 지금 최대 체력에 올려 둔 몫(레벨이 오르면 빼고 다시 계산)
	property number Card192Cooldown = 5.0  -- 세 카드 공통, 레벨 무관 고정
	-- 사운드: 인사이징 팩 audio/Use · audio/Hit, 관/폭은 유저 지정
	property string Card192SoundRUID = "1595d17f21e54eb4ac1eb88c8344c8b7"
	property string Card192HitSoundRUID = "e3dedc59193f4ca586a1248794391ece"
	property string Card193SpearSoundRUID = "90f0479557b149669c6af261c71ee671"
	property string Card194BurstSoundRUID = "99e90c076dba4ba79c618cade2699ab6"
	-- 불꽃 베기(인사이징 팩 "effect" 13프레임). 큰 불꽃 프레임(6번째부터, 약 3.9x3.2유닛)의 가운데가 몬스터 몸통에 오게 세운다
	property number Card192EffectScale = 0.7
	property number Card192FrameDuration = 0.05
	property number Card192ImpactDelay = 0.3  -- 큰 불꽃이 뜨는 시점에 대미지
	-- 판정 범위(타원 반축, 유닛)와 그 중심 높이(발밑 기준)
	property number Card192AreaHalfW = 1.35
	property number Card192AreaHalfH = 1.0
	property number Card192AreaYOffset = 0.6
	property number Card192HitScale = 0.8
	property number Card192HitFrameDuration = 0.05
	property number Card192BurnTickInterval = 1.0
	-- 관: 불꽃 검기(skill/61001207 "effect" 6프레임, 위를 향한 그림을 ±90도 돌려 좌/우로 쏜다)
	property number Card193SpearDelay = 0.15  -- 인사이징 대미지 뒤 검기가 나가기까지
	property number Card193SpearScale = 0.6
	property number Card193SpearDuration = 0.5  -- 이 시간 동안 날아가며 관통(연출이 끝나면 판정도 끝)
	property number Card193SpearSpeed = 9.0
	property number Card193SpearStartBack = 1.0  -- 타겟 뒤쪽에서 출발
	property number Card193SpearYOffset = 0.6
	property number Card193SpearHalfW = 1.0
	property number Card193SpearHalfH = 0.8
	property number Card193SpearTick = 0.033
	-- 폭: 폭발(캐논 점프 팩 "effect" 5프레임)을 발밑에서 위로 솟구치며 커지게 재생
	property number Card194BurstDelay = 0.15
	property number Card194BurstScale = 1.1
	property number Card194BurstGrowFrom = 0.55  -- 시작 크기 비율
	property number Card194BurstFrameDuration = 0.08
	property number Card194BurstStartY = 0.2  -- 발밑 기준 시작 높이
	property number Card194BurstEndY = 1.8
	property number Card194BurstHitDelay = 0.2
	property number Card194BurstHalfW = 1.3
	property number Card194BurstHalfH = 1.3
	property number Card194StunDuration = 2.0  -- 보스·엘리트는 절반

	method table GetIncisingFrames()
		-- 인사이징 팩 "effect"
		return { ${q(F.incising.frames)} }
	end

	method table GetIncisingHitFrames()
		-- 인사이징 팩 "hit/0"
		return { ${q(F.incHit.frames)} }
	end

	method table GetIncisingSpearFrames()
		-- skill/61001207 팩 "effect"
		return { ${q(F.gwan.frames)} }
	end

	method table GetIncisingBurstFrames()
		-- 캐논 점프 팩 "effect"(13f1d57e…)
		return { ${q(F.pok.frames)} }
	end

	method number GetIncisingDamage()
		if self.IncisingLevel >= 5 then return 200
		elseif self.IncisingLevel >= 4 then return 180
		elseif self.IncisingLevel >= 3 then return 160
		elseif self.IncisingLevel >= 2 then return 140
		end
		return 120
	end

	method number GetIncisingPierceDamage(integer level)
		if level >= 3 then return 270
		elseif level >= 2 then return 250
		end
		return 230
	end

	method number GetIncisingBurstDamage(integer level)
		if level >= 3 then return 310
		elseif level >= 2 then return 280
		end
		return 250
	end

	method integer GetIncisingTargetCount(integer cardIdx)
		if cardIdx == 192 then return 1 end
		return 2
	end

	method integer GetIncisingBurnSeconds(integer cardIdx)
		-- 화상 지속(초) = 틱 수. 인사이징 2초(Lv5는 3초), 관/폭 3초
		if cardIdx == 192 and self.IncisingLevel < 5 then return 2 end
		return 3
	end

	method number GetIncisingBurnRatio(integer cardIdx)
		-- 화상 1틱 대미지 비율(기준 대미지 대비). 인사이징 20%, 관/폭 30%
		if cardIdx == 192 then return 0.2 end
		return 0.3
	end

	method number GetIncisingExtraPercent(integer level)
		-- 관통/폭발 추가타 비율 — 30/40/50%
		if level >= 3 then return 0.5
		elseif level >= 2 then return 0.4
		end
		return 0.3
	end

	-- 아이언 바디 — 최대 체력 % 증가. Lv1:3 / Lv2:6 / Lv3:9 / Lv4:12 / Lv5:15
	method integer GetIronBodyPercent()
		if self.IronBodyLevel >= 5 then return 15
		elseif self.IronBodyLevel >= 4 then return 12
		elseif self.IronBodyLevel >= 3 then return 9
		elseif self.IronBodyLevel >= 2 then return 6
		elseif self.IronBodyLevel >= 1 then return 3
		end
		return 0
	end

	@ExecSpace("ServerOnly")
	method void ApplyIronBodyHp()
		-- 지금까지 올려 둔 몫을 빼고 현재 레벨 몫으로 다시 올린다. 늘어난 만큼 현재 체력도 같이 채운다
		local base = _GameManager.PlayerMaxHp - self._ironBodyBonusHp
		local bonus = math.floor(base * self:GetIronBodyPercent() / 100)
		local gained = bonus - self._ironBodyBonusHp
		_GameManager.PlayerMaxHp = base + bonus
		if gained > 0 then
			_GameManager.PlayerHp = math.min(_GameManager.PlayerHp + gained, _GameManager.PlayerMaxHp)
		end
		self._ironBodyBonusHp = bonus
		log("IronBody: maxHp " .. base .. " -> " .. _GameManager.PlayerMaxHp .. " (+" .. self:GetIronBodyPercent() .. "%)")
	end

	@ExecSpace("ServerOnly")
	method void IncisingAttack(number damage, boolean isCrit)
		self:PlayBreathSfx(self.Card192SoundRUID)
		self:IncisingCast(192, damage, isCrit, 0)
	end

	@ExecSpace("ServerOnly")
	method void IncisingPierceAttack(number damage, boolean isCrit)
		self:PlayBreathSfx(self.Card192SoundRUID)
		self:IncisingCast(193, damage, isCrit, 1)
	end

	@ExecSpace("ServerOnly")
	method void IncisingBurstAttack(number damage, boolean isCrit)
		self:PlayBreathSfx(self.Card192SoundRUID)
		self:IncisingCast(194, damage, isCrit, 2)
	end

	@ExecSpace("ServerOnly")
	method void IncisingCast(integer cardIdx, number damage, boolean isCrit, integer kind)
		-- 인사이징 3종 공용 본체. kind: 0 = 추가타 없음(인사이징) / 1 = 관통 검기(관) / 2 = 폭발(폭)
		local targetCount = self:GetIncisingTargetCount(cardIdx)
		local targets = self:GetClosestTargets(targetCount)
		local map = self:GetCurrentMap()
		local castZoneIndex = _MapManager.CurrentMapIndex
		local frames = self:GetIncisingFrames()
		-- 판정 중심과 조준 대상의 깊이 구간을 시전 시점에 값으로 잡아 둔다(대상이 도중에 죽어도 판정·연출은 그대로)
		local anchors = {}
		for _, mob in ipairs(targets) do
			---@type MonsterAI
			local target = mob
			if isvalid(target) and isvalid(target.Entity) then
				local p = target.Entity.TransformComponent.Position
				local ratio = self:GetEffectScaleRatio(target)
				local scale = self.Card192EffectScale * ratio
				local center = Vector3(p.x, p.y + self.Card192AreaYOffset, p.z)
				self:PlayFrameEffect(frames, self:OffsetByPivot(center, 0.80, 0.24, 3.9, 3.2, scale), scale, self.Card192FrameDuration, 1)
				table.insert(anchors, { x = p.x, y = center.y, z = p.z, footY = p.y, ratio = ratio, target = target, band = self:GetDepthBand(target) })
			end
		end
		log("IncisingCast: card=" .. cardIdx .. " anchors=" .. #anchors .. "/" .. targetCount .. " dmg=" .. math.floor(damage))
		if #anchors == 0 or map == nil then return end

		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			-- 존을 넘어간 뒤에 실행되면 다음 존 몬스터가 맞는다 — 시전 시점 존과 다르면 버린다
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			local burnTicks = self:GetIncisingBurnSeconds(cardIdx)
			local burnPerTick = damage * self:GetIncisingBurnRatio(cardIdx)
			local hitFrames = self:GetIncisingHitFrames()
			local hitCount = 0
			for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead then
					local mp = m.Entity.TransformComponent.Position
					local inArea = false
					for _, a in ipairs(anchors) do
						if m == a.target then
							inArea = true
						elseif self:InEllipse(mp.x - a.x, mp.y + self.Card192AreaYOffset - a.y, self.Card192AreaHalfW, self.Card192AreaHalfH) and self:IsInDepthBand(m, a.band) then
							inArea = true
						end
						if inArea then break end
					end
					if inArea then
						local applied = damage
						if isCrit then
							applied = damage * 2
							_DpsMeterLogic:Tag(cardIdx, m):TakeDamageCrit(applied)
						else
							_DpsMeterLogic:Tag(cardIdx, m):TakeDamage(applied)
						end
						hitCount = hitCount + 1
						self:PlayFrameEffect(hitFrames, Vector3(mp.x, mp.y + self.Card192AreaYOffset, mp.z), self.Card192HitScale * self:GetEffectScaleRatio(m), self.Card192HitFrameDuration, 1)
						if not m._dead then
							-- 화상 100% — 1초마다 기준 대미지(치명타 전)의 일정 비율
							m:ApplyDot(burnPerTick, burnTicks, self.Card192BurnTickInterval)
							if kind == 1 then m:AddComboStack(applied) end
						end
					end
				end
			end
			if hitCount > 0 then self:PlayBreathSfx(self.Card192HitSoundRUID) end
			log("IncisingCast: card=" .. cardIdx .. " impact hit=" .. hitCount .. " burn=" .. math.floor(burnPerTick) .. "x" .. burnTicks)
			if kind == 0 then return end
			local secondDelay = self.Card193SpearDelay
			if kind == 2 then secondDelay = self.Card194BurstDelay end
			for _, a in ipairs(anchors) do
				local anchor = a
				_TimerService:SetTimerOnce(function()
					if not isvalid(self) then return end
					if kind == 1 then self:LaunchIncisingSpear(cardIdx, anchor, damage, isCrit, castZoneIndex)
					else self:SpawnIncisingBurst(cardIdx, anchor, damage, isCrit, castZoneIndex) end
				end, secondDelay)
			end
		end, self.Card192ImpactDelay)
	end

	@ExecSpace("ServerOnly")
	method void LaunchIncisingSpear(integer cardIdx, table anchor, number damage, boolean isCrit, integer castZoneIndex)
		-- 관: 타겟 자리에서 불꽃 검기가 좌/우로 날아가며, 연출이 끝날 때까지 경로의 몬스터를 한 번씩 관통한다
		if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
		local map = self:GetCurrentMap()
		if map == nil then return end
		-- 몬스터가 더 많은 쪽으로 쏜다(같으면 무작위)
		local left = 0
		local right = 0
		for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
			---@type MonsterAI
			local m = mob
			if isvalid(m) and isvalid(m.Entity) and not m._dead and m ~= anchor.target and self:IsInDepthBand(m, anchor.band) then
				local mx = m.Entity.TransformComponent.Position.x
				if mx < anchor.x then left = left + 1 elseif mx > anchor.x then right = right + 1 end
			end
		end
		local dir = 1
		if left > right then
			dir = -1
		elseif left == right and _UtilLogic:RandomDouble() < 0.5 then
			dir = -1
		end
		local frames = self:GetIncisingSpearFrames()
		local startX = anchor.x - dir * self.Card193SpearStartBack
		-- 원본 그림은 머리가 위를 향한다 — 오른쪽으로 쏠 땐 -90도, 왼쪽은 +90도
		local rot = -90
		if dir < 0 then rot = 90 end
		local fx = self:SpawnEffectWithModel(frames[1], Vector3(startX, anchor.footY + self.Card193SpearYOffset, anchor.z), rot, 1.0, self.Card193SpearScale * anchor.ratio, 1.0, "skilleffectlong")
		if fx == nil then return end
		self:PlayBreathSfx(self.Card193SpearSoundRUID)
		local extra = damage * self:GetIncisingExtraPercent(self.IncisingPierceLevel)
		local hitFrames = self:GetIncisingHitFrames()
		local hitSet = {}
		local hitCount = 0
		local elapsed = 0
		local lastFrame = 1
		local tickId = 0
		tickId = _TimerService:SetTimerRepeat(function()
			if not isvalid(self) or not isvalid(fx) then
				_TimerService:ClearTimer(tickId)
				return
			end
			elapsed = elapsed + self.Card193SpearTick
			local t = math.min(elapsed / self.Card193SpearDuration, 1)
			local curX = startX + dir * self.Card193SpearSpeed * elapsed
			local fp = fx.TransformComponent.Position
			fx.TransformComponent.Position = Vector3(curX, fp.y, fp.z)
			-- 앞 40%는 온전한 첫 그림으로 날고, 나머지 구간에 흩어지는 프레임을 넘긴다
			local idx = 1
			if t >= 0.4 then idx = math.min(2 + math.floor((t - 0.4) / 0.6 * (#frames - 1)), #frames) end
			if idx ~= lastFrame then
				lastFrame = idx
				fx.SpriteRendererComponent.SpriteRUID = frames[idx]
			end
			if castZoneIndex == _MapManager.CurrentMapIndex then
				for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
					---@type MonsterAI
					local m = mob
					if isvalid(m) and isvalid(m.Entity) and not m._dead and not hitSet[m] then
						local mp = m.Entity.TransformComponent.Position
						if self:InRect(mp.x - curX, mp.y - anchor.footY, self.Card193SpearHalfW, self.Card193SpearHalfH) and self:IsInDepthBand(m, anchor.band) then
							hitSet[m] = true
							hitCount = hitCount + 1
							if isCrit then _DpsMeterLogic:Tag(cardIdx, m):TakeDamageCrit(extra * 2)
							else _DpsMeterLogic:Tag(cardIdx, m):TakeDamage(extra) end
							self:PlayFrameEffect(hitFrames, Vector3(mp.x, mp.y + self.Card192AreaYOffset, mp.z), self.Card192HitScale * self:GetEffectScaleRatio(m), self.Card192HitFrameDuration, 1)
						end
					end
				end
			end
			if t >= 1 then
				_TimerService:ClearTimer(tickId)
				fx:Destroy()
				log("LaunchIncisingSpear: card=" .. cardIdx .. " dir=" .. dir .. " pierced=" .. hitCount .. " dmg=" .. math.floor(isCrit and extra * 2 or extra))
			end
		end, self.Card193SpearTick)
	end

	@ExecSpace("ServerOnly")
	method void SpawnIncisingBurst(integer cardIdx, table anchor, number damage, boolean isCrit, integer castZoneIndex)
		-- 폭: 타겟 발밑에서 폭발이 위로 솟구치고, 범위 안 몬스터에게 추가타 + 스턴
		if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
		local map = self:GetCurrentMap()
		if map == nil then return end
		local frames = self:GetIncisingBurstFrames()
		local scale = self.Card194BurstScale * anchor.ratio
		local fromPos = Vector3(anchor.x, anchor.footY + self.Card194BurstStartY, anchor.z)
		local toPos = Vector3(anchor.x, anchor.footY + self.Card194BurstEndY, anchor.z)
		self:PlayMovingFrameEffect(frames, fromPos, toPos, scale * self.Card194BurstGrowFrom, scale, #frames * self.Card194BurstFrameDuration)
		self:PlayBreathSfx(self.Card194BurstSoundRUID)
		local extra = damage * self:GetIncisingExtraPercent(self.IncisingBurstLevel)
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			local hitCount = 0
			for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead then
					local mp = m.Entity.TransformComponent.Position
					local inArea = (m == anchor.target)
					if not inArea and self:InEllipse(mp.x - anchor.x, mp.y + self.Card192AreaYOffset - anchor.y, self.Card194BurstHalfW, self.Card194BurstHalfH) and self:IsInDepthBand(m, anchor.band) then
						inArea = true
					end
					if inArea then
						hitCount = hitCount + 1
						if isCrit then _DpsMeterLogic:Tag(cardIdx, m):TakeDamageCrit(extra * 2)
						else _DpsMeterLogic:Tag(cardIdx, m):TakeDamage(extra) end
						if not m._dead then
							local stunDur = self.Card194StunDuration
							if m._isBoss or m._isElite then stunDur = stunDur * 0.5 end
							m:ApplyStun(stunDur, true)
						end
					end
				end
			end
			log("SpawnIncisingBurst: card=" .. cardIdx .. " hit=" .. hitCount .. " dmg=" .. math.floor(isCrit and extra * 2 or extra))
		end, self.Card194BurstHitDelay)
	end

	@ExecSpace("ServerOnly")
	method void PlayMovingFrameEffect(table frames, Vector3 fromPos, Vector3 toPos, number scaleFrom, number scaleTo, number duration)
		-- 프레임을 넘기면서 위치·크기를 같이 옮기는 연출(처음에 빠르고 끝에서 느려진다)
		local fx = self:SpawnEffectWithModel(frames[1], fromPos, 0, 1.0, scaleFrom, 1.0, "skilleffectlong")
		if fx == nil then return end
		local z = fx.TransformComponent.Position.z
		local tick = 0.033
		local elapsed = 0
		local lastFrame = 1
		local tickId = 0
		tickId = _TimerService:SetTimerRepeat(function()
			if not isvalid(self) or not isvalid(fx) then
				_TimerService:ClearTimer(tickId)
				return
			end
			elapsed = elapsed + tick
			local t = math.min(elapsed / duration, 1)
			local e = 1 - (1 - t) * (1 - t)
			fx.TransformComponent.Position = Vector3(fromPos.x + (toPos.x - fromPos.x) * e, fromPos.y + (toPos.y - fromPos.y) * e, z)
			local s = scaleFrom + (scaleTo - scaleFrom) * e
			fx.TransformComponent.Scale = Vector3(s, s, 1)
			local idx = math.min(math.floor(t * #frames) + 1, #frames)
			if idx ~= lastFrame then
				lastFrame = idx
				fx.SpriteRendererComponent.SpriteRUID = frames[idx]
			end
			if t >= 1 then
				_TimerService:ClearTimer(tickId)
				fx:Destroy()
			end
		end, tick)
	end

`;

const writeCM = patchFile("RootDesk/MyDesk/Card/CardManager.mlua", (p) => {
  if (p.has("IncisingLevel")) throw new Error("already applied");
  p.before("\t-- ── 레이온 전용 조합 스킬: 버닝 러시 (카드 166) — 돌진(155) Lv5 + 워리어 마스터리(164) +\n", BLOCK);

  p.after("\t\tif cardIdx == 170 then return self.FuriousBlowLevel > 0 end\n",
    "\t\tif cardIdx == 192 then return self.IncisingLevel > 0 end\n\t\tif cardIdx == 193 then return self.IncisingPierceLevel > 0 end\n\t\tif cardIdx == 194 then return self.IncisingBurstLevel > 0 end\n\t\tif cardIdx == 195 then return self.IronBodyLevel > 0 end\n");
  p.after("\t\telseif cardIdx == 170 then base = self:GetFuriousBlowDamage(self.FuriousBlowLevel)\n",
    "\t\telseif cardIdx == 192 then base = self:GetIncisingDamage()\n\t\telseif cardIdx == 193 then base = self:GetIncisingPierceDamage(self.IncisingPierceLevel)\n\t\telseif cardIdx == 194 then base = self:GetIncisingBurstDamage(self.IncisingBurstLevel)\n");
  p.after("\t\telseif cardIdx == 170 then return self.Card170Cooldown\n",
    "\t\telseif cardIdx == 192 or cardIdx == 193 or cardIdx == 194 then return self.Card192Cooldown\n");
  p.after("\t\telseif cardIdx == 170 then return self.FuriousBlowLevel\n",
    "\t\telseif cardIdx == 192 then return self.IncisingLevel\n\t\telseif cardIdx == 193 then return self.IncisingPierceLevel\n\t\telseif cardIdx == 194 then return self.IncisingBurstLevel\n\t\telseif cardIdx == 195 then return self.IronBodyLevel\n");
  p.after("\t\telseif cardIdx == 170 then self.FuriousBlowLevel = level\n",
    "\t\telseif cardIdx == 192 then self.IncisingLevel = level\n\t\telseif cardIdx == 193 then self.IncisingPierceLevel = level\n\t\telseif cardIdx == 194 then self.IncisingBurstLevel = level\n\t\telseif cardIdx == 195 then self.IronBodyLevel = level\n");
  // 강화 선택지 설명
  p.before('\t\telseif cardIdx == 163 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_193",\n',
    '\t\telseif cardIdx == 192 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_577",\n\t\t\t\t"MLUA_CARDMANAGER_125",\n\t\t\t\t"MLUA_CARDMANAGER_125",\n\t\t\t\t"MLUA_CARDMANAGER_125",\n\t\t\t\t"MLUA_CARDMANAGER_578",\n\t\t\t}\n' +
    '\t\telseif cardIdx == 193 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_579",\n\t\t\t\t"MLUA_CARDMANAGER_580",\n\t\t\t\t"MLUA_CARDMANAGER_580",\n\t\t\t}\n' +
    '\t\telseif cardIdx == 194 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_581",\n\t\t\t\t"MLUA_CARDMANAGER_582",\n\t\t\t\t"MLUA_CARDMANAGER_582",\n\t\t\t}\n' +
    '\t\telseif cardIdx == 195 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_583",\n\t\t\t\t"MLUA_CARDMANAGER_584",\n\t\t\t\t"MLUA_CARDMANAGER_584",\n\t\t\t\t"MLUA_CARDMANAGER_584",\n\t\t\t\t"MLUA_CARDMANAGER_584",\n\t\t\t}\n');
  p.after('\t\telseif name == "SelfRecoveryLevel" then\n\t\t\tif self.SelfRecoveryLevel > 0 then self:NotifySelfRecoveryOnPermanent() end\n',
    '\t\telseif name == "IronBodyLevel" then\n\t\t\tif self.IronBodyLevel > 0 then self:NotifyIronBodyOnPermanent() end\n' +
    '\t\telseif name == "IncisingLevel" then self:RefreshSlotIfHoldsCard(192)\n\t\telseif name == "IncisingPierceLevel" then self:RefreshSlotIfHoldsCard(193)\n\t\telseif name == "IncisingBurstLevel" then self:RefreshSlotIfHoldsCard(194)\n');
  // 툴팁 대미지 줄
  p.after('\t\telseif cardIdx == 170 then\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_006", math.floor(self:GetCardDamage(cardIdx)))\n',
    '\t\telseif cardIdx == 192 then\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_006", math.floor(self:GetCardDamage(cardIdx)))\n' +
    '\t\telseif cardIdx == 193 then\n\t\t\t-- 본 대미지 + 관통 추가타를 합산한 숫자 1개로 보여준다(다단타 표기 통일 규칙). 화상은 아래 줄에 따로\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_006", math.floor(self:GetCardDamage(cardIdx) * (1 + self:GetIncisingExtraPercent(self.IncisingPierceLevel))))\n' +
    '\t\telseif cardIdx == 194 then\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_006", math.floor(self:GetCardDamage(cardIdx) * (1 + self:GetIncisingExtraPercent(self.IncisingBurstLevel))))\n' +
    '\t\telseif cardIdx == 195 then\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_109", self:GetIronBodyPercent())\n');
  p.swap("\t\t\tor cardIdx == 151 or cardIdx == 161 or cardIdx == 162 or cardIdx == 163 or cardIdx == 164\n",
    "\t\t\tor cardIdx == 151 or cardIdx == 161 or cardIdx == 162 or cardIdx == 163 or cardIdx == 164 or cardIdx == 195\n");
  p.after('\t\telseif cardIdx == 170 then\n\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_065", self:GetFuriousBlowTargetCount(self.FuriousBlowLevel), math.floor(self:GetFuriousBlowEnhanceChance(self.FuriousBlowLevel) * 100))\n',
    '\t\telseif cardIdx == 192 then\n\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_110", self:GetIncisingTargetCount(192), self:GetIncisingBurnSeconds(192), math.floor(self:GetIncisingBurnRatio(192) * 100 + 0.5))\n' +
    '\t\telseif cardIdx == 193 then\n\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_111", self:GetIncisingTargetCount(193), self:GetIncisingBurnSeconds(193), math.floor(self:GetIncisingBurnRatio(193) * 100 + 0.5), math.floor(self:GetIncisingExtraPercent(self.IncisingPierceLevel) * 100 + 0.5))\n' +
    '\t\telseif cardIdx == 194 then\n\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_112", self:GetIncisingTargetCount(194), self:GetIncisingBurnSeconds(194), math.floor(self:GetIncisingBurnRatio(194) * 100 + 0.5), math.floor(self:GetIncisingExtraPercent(self.IncisingBurstLevel) * 100 + 0.5), string.format("%.0f", self.Card194StunDuration))\n');
  p.after("\t\t\t\telseif cardIndex == 170 then\n\t\t\t\t\tself:FuriousBlowAttack(damage, isCrit)\n",
    "\t\t\t\telseif cardIndex == 192 then\n\t\t\t\t\tself:IncisingAttack(damage, isCrit)\n\t\t\t\telseif cardIndex == 193 then\n\t\t\t\t\tself:IncisingPierceAttack(damage, isCrit)\n\t\t\t\telseif cardIndex == 194 then\n\t\t\t\t\tself:IncisingBurstAttack(damage, isCrit)\n");
  p.swap("self:GetSnareCastFrames(), self:GetSnareBindFrames() }\n",
    "self:GetSnareCastFrames(), self:GetSnareBindFrames(),\n\t\t\tself:GetIncisingFrames(), self:GetIncisingHitFrames(), self:GetIncisingSpearFrames(), self:GetIncisingBurstFrames() }\n");

  // 버프 아이콘(하단 패시브 줄)
  p.after('\tproperty SpriteGUIRendererComponent selfRecoveryFill = "a8d5703c-5977-4518-b37e-5cdcc3a8edc3"\n',
    '\tproperty Entity ironBodyBuff = ""\n\tproperty SpriteGUIRendererComponent ironBodyFill = ""\n');
  p.after("\t\tself:ShowBuffIconPermanent(self.selfRecoveryBuff, self.selfRecoveryFill)\n\tend\n",
    '\n\t@ExecSpace("Multicast")\n\tmethod void NotifyIronBodyOnPermanent()\n\t\tif self:IsServer() then return end\n\t\tself:ShowBuffIconPermanent(self.ironBodyBuff, self.ironBodyFill)\n\tend\n');
  p.after('\t\telseif panel == self.selfRecoveryBuff then return "selfrecovery"\n', '\t\telseif panel == self.ironBodyBuff then return "ironbody"\n');
  p.after('\t\telseif buffName == "selfrecovery" then return self.selfRecoveryBuff\n', '\t\telseif buffName == "ironbody" then return self.ironBodyBuff\n');
  p.after("\t\tself:HideBuffIcon(self.selfRecoveryBuff, self.selfRecoveryFill)\n", "\t\tself:HideBuffIcon(self.ironBodyBuff, self.ironBodyFill)\n");
  p.swap("selfrecovery = 163, warriormastery = 164,\n", "selfrecovery = 163, warriormastery = 164, ironbody = 195,\n");
  p.swap('"coma", "selfrecovery", "warriormastery",\n', '"coma", "selfrecovery", "warriormastery", "ironbody",\n');

  // 레벨업 선택지(레이온 블록)
  p.before("\t\t\t-- 슬래시(Card152, 슬롯형 액티브) — 미해금이면 슬롯 여유 있을 때만 해금\n",
`			-- 아이언 바디(Card195, 패시브 — 슬롯 없이 레벨만 증가)
			if self.IronBodyLevel == 0 then
				table.insert(pool, { card = 195, type = "unlock" })
			elseif self.IronBodyLevel < 5 then
				table.insert(pool, { card = 195, type = "ironbody_up" })
			end

			-- 인사이징(Card192, 슬롯형 액티브) — 미해금이면 슬롯 여유 있을 때만 해금
			-- (인사이징:관/폭으로 조합된 뒤에는 더 이상 등장하지 않음 — 그 슬롯을 이미 떠났으므로)
			if self.IncisingPierceLevel == 0 and self.IncisingBurstLevel == 0 then
				if self.IncisingLevel == 0 then
					if hasEmptySlot then table.insert(pool, { card = 192, type = "unlock" }) end
				elseif self.IncisingLevel < 5 then
					table.insert(pool, { card = 192, type = "incising_up" })
				end
			end

			-- 인사이징:관(Card193) / 인사이징:폭(Card194) — 인사이징의 두 갈래 조합(유저 지정 2026-10-01).
			-- 인사이징 Lv5 + 아이언 바디 + 콤보 어택 → 관 / + 찬스 어택 → 폭.
			-- 슬롯을 넘겨받으므로 새 슬롯이 필요 없고, 하나를 만들면 나머지는 그 판에서 등장하지 않는다.
			if self.IncisingPierceLevel == 0 and self.IncisingBurstLevel == 0 and self.IncisingLevel >= 5 and self:IsCardUnlocked(195) then
				if self:IsCardUnlocked(151) then table.insert(pool, { card = 193, type = "unlock" }) end
				if self:IsCardUnlocked(161) then table.insert(pool, { card = 194, type = "unlock" }) end
			end
			if self.IncisingPierceLevel > 0 and self.IncisingPierceLevel < 3 then
				table.insert(pool, { card = 193, type = "incisingpierce_up" })
			end
			if self.IncisingBurstLevel > 0 and self.IncisingBurstLevel < 3 then
				table.insert(pool, { card = 194, type = "incisingburst_up" })
			end

`);
  const choice = (idx, lvProp) => `		if cardIdx == ${idx} then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.${lvProp} + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(${idx})
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(${idx}))
			return
		end

`;
  p.before('\t\tif cardIdx == 163 then\n\t\t\tlocal nextLevel = (upgradeType == "unlock") and 1 or (self.SelfRecoveryLevel + 1)\n',
    choice(192, "IncisingLevel") + choice(193, "IncisingPierceLevel") + choice(194, "IncisingBurstLevel") + choice(195, "IronBodyLevel"));

  const fuseApply = (idx, lvProp, other, tag, name) => `		if cardIdx == ${idx} then
			if upgradeType == "unlock" then
				if self.${other} > 0 then
					log_warning("${name}: the other Incising fusion is already made — ignored")
					return
				end
				self.${lvProp} = 1
				local incisingSlot = self:GetSlotForCard(192)
				if incisingSlot > 0 then
					self:AssignCardToSlot(incisingSlot, ${idx})
					self:ResetSlotTimer(incisingSlot)
					self:PlayThunderStormFusionEffect(incisingSlot)
					log("Card${idx}(${name}) fused into Slot" .. incisingSlot .. " (was Incising)")
				else
					log_warning("${name}: Incising not found in any slot — fusion could not place the card")
				end
			elseif upgradeType == "${tag}" and self.${lvProp} < 3 then
				self.${lvProp} = self.${lvProp} + 1
			end
			log("${name} L" .. self.${lvProp})
			return
		end

`;
  p.before("\t\t-- 셀프 리커버리(패시브 — 슬롯 없이 레벨만 증가)\n",
`		-- 인사이징 (슬롯 해금 또는 레벨 강화)
		if cardIdx == 192 then
			if upgradeType == "unlock" then
				self.IncisingLevel = 1
				local slotIdx = self:GetNextEmptySlot()
				if slotIdx > 0 then
					self:AssignCardToSlot(slotIdx, 192)
					self:ResetSlotTimer(slotIdx)
					log("Card192(Incising) -> Slot" .. slotIdx)
				end
			elseif upgradeType == "incising_up" and self.IncisingLevel < 5 then
				self.IncisingLevel = self.IncisingLevel + 1
			end
			log("Incising L" .. self.IncisingLevel)
			return
		end

		-- 인사이징:관 / 인사이징:폭 (조합 스킬 — 인사이징(Card192) 슬롯을 그대로 넘겨받는다. 둘 중 하나만 만들 수 있다.
		-- 재료 패시브(아이언 바디/콤보 어택/찬스 어택)는 슬롯이 없어 그대로 남는다)
` + fuseApply(193, "IncisingPierceLevel", "IncisingBurstLevel", "incisingpierce_up", "IncisingPierce") + fuseApply(194, "IncisingBurstLevel", "IncisingPierceLevel", "incisingburst_up", "IncisingBurst") +
`		-- 아이언 바디(패시브 — 슬롯 없이 레벨만 증가, 최대 체력 %)
		if cardIdx == 195 then
			if upgradeType == "unlock" then
				self.IronBodyLevel = 1
			elseif upgradeType == "ironbody_up" and self.IronBodyLevel < 5 then
				self.IronBodyLevel = self.IronBodyLevel + 1
			end
			self:ApplyIronBodyHp()
			self:NotifyIronBodyOnPermanent()
			log("IronBody L" .. self.IronBodyLevel .. " (최대 체력 +" .. self:GetIronBodyPercent() .. "%)")
			return
		end

`);

  // 런 리셋 / 드롭 강화 풀 / 치트
  p.after("\t\tself.FuriousBlowLevel = 0\n", "\t\tself.IncisingLevel = 0\n\t\tself.IncisingPierceLevel = 0\n\t\tself.IncisingBurstLevel = 0\n\t\tself.IronBodyLevel = 0\n\t\tself._ironBodyBonusHp = 0\n");
  p.after("\t\tif self:IsCardUnlocked(163) and self.SelfRecoveryLevel < 5 then table.insert(pool, 163) end\n",
    "\t\tif self:IsCardUnlocked(195) and self.IronBodyLevel < 5 then table.insert(pool, 195) end\n");
  p.after("\t\t\tif self:IsCardUnlocked(170) and self.FuriousBlowLevel < 3 then table.insert(pool, 170) end\n",
    "\t\t\t-- 인사이징은 관/폭으로 조합되면 슬롯을 떠나므로 그 뒤엔 풀에서 뺀다\n" +
    "\t\t\tif self:IsCardUnlocked(192) and self.IncisingLevel < 5 and self.IncisingPierceLevel == 0 and self.IncisingBurstLevel == 0 then table.insert(pool, 192) end\n" +
    "\t\t\tif self:IsCardUnlocked(193) and self.IncisingPierceLevel < 3 then table.insert(pool, 193) end\n" +
    "\t\t\tif self:IsCardUnlocked(194) and self.IncisingBurstLevel < 3 then table.insert(pool, 194) end\n");
  p.after('\t\telseif cardIdx == 164 then return "warriormastery_up"\n',
    '\t\telseif cardIdx == 192 then return "incising_up"\n\t\telseif cardIdx == 195 then return "ironbody_up"\n');
  p.after('\t\telseif cardIdx == 170 then return "furiousblow_up"\n',
    '\t\telseif cardIdx == 193 then return "incisingpierce_up"\n\t\telseif cardIdx == 194 then return "incisingburst_up"\n');
  p.swap('\t\telseif cardIdx == 159 then return "scarringsword_up"\n\t\telseif cardIdx == 171 then return "doublestep_up"\n',
    '\t\telseif cardIdx == 159 then return "scarringsword_up"\n\t\telseif cardIdx == 192 then return "incising_up"\n\t\telseif cardIdx == 171 then return "doublestep_up"\n');
  p.after("\t\telseif cardIdx == 159 then self.ScarringSwordLevel = 1\n", "\t\telseif cardIdx == 192 then self.IncisingLevel = 1\n");
});

// ───────────────────────── CardRegistry ─────────────────────────
const writeReg = patchFile("RootDesk/MyDesk/Card/CardRegistry.mlua", (p) => {
  p.after('\t\t\t\ttags = "MLUA_CARDREGISTRY_031",\n\t\t\t},\n',
`			-- 인사이징(Card192, 슬롯형 액티브) — 타겟 자리에 불꽃 베기 연출을 띄우고 그 범위 안 몬스터 전부에게
			-- 대미지 + 화상(100%). 실제 로직은 CardManager.IncisingCast에서 관리(레지스트리는 이름/아이콘/태그만).
			[192] = {
				name = "MLUA_CARDMANAGER_569",
				icon = "69acc0a1482143d5a25f80da945e0f22",
				tags = "MLUA_CARDMANAGER_573",
			},
			-- 인사이징:관(Card193, 조합) — 인사이징(192) Lv5 + 콤보 어택(151) + 아이언 바디(195). 인사이징 뒤에
			-- 불꽃 검기가 좌/우로 날아가며 관통 추가타. 인사이징 슬롯을 그대로 넘겨받는다.
			[193] = {
				name = "MLUA_CARDMANAGER_570",
				icon = "b507f575ffb9478d9d98a6ff3c727954",
				tags = "MLUA_CARDMANAGER_574",
			},
			-- 인사이징:폭(Card194, 조합) — 인사이징(192) Lv5 + 찬스 어택(161) + 아이언 바디(195). 인사이징 뒤에
			-- 폭발이 솟아 범위 추가타 + 스턴. 193과 양자택일. 아이콘은 인사이징 팩의 iconMouseOver(전용 아이콘 미지정).
			[194] = {
				name = "MLUA_CARDMANAGER_571",
				icon = "f3d5426ad86b40c6bc134753d3939145",
				tags = "MLUA_CARDMANAGER_575",
			},
			-- 아이언 바디(Card195, 패시브·슬롯 없음) — 최대 체력 3/6/9/12/15% 증가(CardManager.ApplyIronBodyHp).
			[195] = {
				name = "MLUA_CARDMANAGER_572",
				icon = "52162587bc534b9385af8c77513d93d4",
				tags = "MLUA_CARDMANAGER_576",
			},
`);
});

// ───────────────────────── ShadowShopUI / FusionDiscovery ─────────────────────────
const writeShop = patchFile("RootDesk/MyDesk/UI/ShadowShopUI.mlua", (p) => {
  p.swap("\t\t\treturn { 151, 152, 153, 154, 155, 156, 157, 158, 159, 161, 162, 163, 164 }\n",
    "\t\t\t-- 192(인사이징)·195(아이언 바디)는 일반 카드라 포함, 193/194(인사이징:관/폭)는 조합 결과라 제외(2026-10-01)\n\t\t\treturn { 151, 152, 153, 154, 155, 156, 157, 158, 159, 161, 162, 163, 164, 192, 195 }\n");
  p.after('\t\telseif cardIdx == 164 then upgradeType = "warriormastery_up"\n',
    '\t\telseif cardIdx == 192 then upgradeType = "incising_up"\n\t\telseif cardIdx == 195 then upgradeType = "ironbody_up"\n');
});
const writeFusion = patchFile("RootDesk/MyDesk/Card/FusionDiscoveryLogic.mlua", (p) => {
  p.after("\t\t\t{ result = 170, mats = { 157, 163, 164 } },\n",
    "\t\t\t-- 인사이징의 두 갈래 조합(2026-10-01) — 하나를 만들면 나머지는 그 판에서 못 만든다\n\t\t\t{ result = 193, mats = { 192, 151, 195 } },\n\t\t\t{ result = 194, mats = { 192, 161, 195 } },\n");
});

// ───────────────────────── GameText.csv ─────────────────────────
const SRC = "RootDesk/MyDesk/Card/CardManager.mlua";
const c = (v) => (/[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
const rows = [
  ["MLUA_CARDMANAGER_569", "인사이징", "Incising", "烈焰斬", "インサイジング"],
  ["MLUA_CARDMANAGER_570", "인사이징:관", "Incising: Pierce", "烈焰斬：貫", "インサイジング：貫"],
  ["MLUA_CARDMANAGER_571", "인사이징:폭", "Incising: Burst", "烈焰斬：爆", "インサイジング：爆"],
  ["MLUA_CARDMANAGER_572", "아이언 바디", "Iron Body", "鋼鐵之軀", "アイアンボディ"],
  ["MLUA_CARDMANAGER_573", "범위,화상", "Area,Burn", "範圍,灼燒", "範囲,火傷"],
  ["MLUA_CARDMANAGER_574", "조합,화상,관통,콤보스택", "Fusion,Burn,Pierce,Combo Stack", "組合,灼燒,貫穿,連擊層數", "組み合わせ,火傷,貫通,コンボスタック"],
  ["MLUA_CARDMANAGER_575", "조합,화상,범위폭발,스턴", "Fusion,Burn,AoE Explosion,Stun", "組合,灼燒,範圍爆炸,暈眩", "組み合わせ,火傷,範囲爆発,スタン"],
  ["MLUA_CARDMANAGER_576", "패시브,체력", "Passive,HP", "被動,體力", "パッシブ,HP"],
  ["MLUA_CARDMANAGER_577", "해금! (대미지 120, 타겟 1명, 범위 공격, 화상 2초)", "Unlocked! (Damage 120, 1 target, area attack, Burn 2s)", "解鎖！(傷害 120，目標 1名，範圍攻擊，灼燒 2秒)", "解放！(ダメージ 120、ターゲット 1体、範囲攻撃、火傷 2秒)"],
  ["MLUA_CARDMANAGER_578", "피해량 +20, 화상 +1초", "Damage +20, Burn +1s", "傷害 +20，灼燒 +1秒", "ダメージ +20、火傷 +1秒"],
  ["MLUA_CARDMANAGER_579", "해금! (대미지 230, 타겟 2명, 화상 3초, 관통 추가타 30%, 콤보스택 +1)", "Unlocked! (Damage 230, 2 targets, Burn 3s, piercing extra hit 30%, Combo Stack +1)", "解鎖！(傷害 230，目標 2名，灼燒 3秒，貫穿追加攻擊 30%，連擊層數 +1)", "解放！(ダメージ 230、ターゲット 2体、火傷 3秒、貫通追加攻撃 30%、コンボスタック +1)"],
  ["MLUA_CARDMANAGER_580", "피해량 +20, 관통 추가타 +10%", "Damage +20, piercing extra hit +10%", "傷害 +20，貫穿追加攻擊 +10%", "ダメージ +20、貫通追加攻撃 +10%"],
  ["MLUA_CARDMANAGER_581", "해금! (대미지 250, 타겟 2명, 화상 3초, 폭발 추가타 30%, 스턴 2초)", "Unlocked! (Damage 250, 2 targets, Burn 3s, explosion extra hit 30%, Stun 2s)", "解鎖！(傷害 250，目標 2名，灼燒 3秒，爆炸追加攻擊 30%，暈眩 2秒)", "解放！(ダメージ 250、ターゲット 2体、火傷 3秒、爆発追加攻撃 30%、スタン 2秒)"],
  ["MLUA_CARDMANAGER_582", "피해량 +30, 폭발 추가타 +10%", "Damage +30, explosion extra hit +10%", "傷害 +30，爆炸追加攻擊 +10%", "ダメージ +30、爆発追加攻撃 +10%"],
  ["MLUA_CARDMANAGER_583", "해금! (최대 체력 +3%)", "Unlocked! (Max HP +3%)", "解鎖！(最大體力 +3%)", "解放！(最大HP +3%)"],
  ["MLUA_CARDMANAGER_584", "최대 체력 +3%", "Max HP +3%", "最大體力 +3%", "最大HP +3%"],
  ["FMT_CARDMANAGER_109", "최대 체력 : +{0}%", "Max HP: +{0}%", "最大體力：+{0}%", "最大HP：+{0}%"],
  ["FMT_CARDMANAGER_110", "타겟 {0}명  |  범위 공격  |  화상 {1}초(1초마다 {2}%)", "Targets {0}  |  Area attack  |  Burn {1}s ({2}% per sec)", "目標 {0}名  |  範圍攻擊  |  灼燒 {1}秒(每秒 {2}%)", "ターゲット {0}体  |  範囲攻撃  |  火傷 {1}秒(毎秒 {2}%)"],
  ["FMT_CARDMANAGER_111", "타겟 {0}명  |  화상 {1}초(1초마다 {2}%)  |  관통 추가타 {3}%  |  콤보스택 +1", "Targets {0}  |  Burn {1}s ({2}% per sec)  |  Piercing extra hit {3}%  |  Combo Stack +1", "目標 {0}名  |  灼燒 {1}秒(每秒 {2}%)  |  貫穿追加攻擊 {3}%  |  連擊層數 +1", "ターゲット {0}体  |  火傷 {1}秒(毎秒 {2}%)  |  貫通追加攻撃 {3}%  |  コンボスタック +1"],
  ["FMT_CARDMANAGER_112", "타겟 {0}명  |  화상 {1}초(1초마다 {2}%)  |  폭발 추가타 {3}%  |  스턴 {4}초", "Targets {0}  |  Burn {1}s ({2}% per sec)  |  Explosion extra hit {3}%  |  Stun {4}s", "目標 {0}名  |  灼燒 {1}秒(每秒 {2}%)  |  爆炸追加攻擊 {3}%  |  暈眩 {4}秒", "ターゲット {0}体  |  火傷 {1}秒(毎秒 {2}%)  |  爆発追加攻撃 {3}%  |  スタン {4}秒"],
];
const CSV = "RootDesk/MyDesk/Localization/GameText.csv";
let csv = fs.readFileSync(CSV, "utf8");
if (csv.includes("MLUA_CARDMANAGER_569,")) throw new Error("csv already has rows");
if (!csv.endsWith("\r\n")) csv += "\r\n";
csv += rows.map((r) => [r[0], c(r[1]), SRC, c(r[1]), c(r[2]), c(r[3]), c(r[4])].join(",")).join("\r\n") + "\r\n";

// 전부 통과했을 때만 쓴다
writeCM(); writeReg(); writeShop(); writeFusion();
fs.writeFileSync(CSV, csv);
console.log("patched all. csv rows +" + rows.length);
