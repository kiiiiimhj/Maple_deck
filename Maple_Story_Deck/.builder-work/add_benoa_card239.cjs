// 베노아 조합 카드239(솔라 플레어) = 익스플로젼(225) Lv5 + 하이 위즈덤(235). 익스플로젼 슬롯 승계.
// 화상 걸린 몬스터 전부를 노린다(포이즌 트랩(227)의 화상판) — 화상 상태 추적(MonsterAI _burnedUntil)도 같이 넣는다. 재실행 안전.
const fs = require('fs');
const NL = '\n';
function count(h, n) { let c = 0, i = 0; while ((i = h.indexOf(n, i)) >= 0) { c++; i += n.length; } return c; }

// ── MonsterAI: 화상 상태 추적 ──
{
  const p = 'RootDesk/MyDesk/MonsterAI.mlua';
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('property number _burnedUntil')) {
    const a1 = '\tproperty number _poisonedUntil = 0\n';
    if (count(s, a1) !== 1) throw new Error('mai a1');
    s = s.replace(a1, a1 + '\t-- 솔라 플레어(239)는 "화상 걸린 애들"만 노린다 — 같은 이유로 화상이 끝나는 시각을 따로 든다(베노아 화상 스킬들이 갱신)\n\tproperty number _burnedUntil = 0\n');
    const a2 = '\t@ExecSpace("ServerOnly")\n\tmethod boolean IsPoisoned()\n';
    if (count(s, a2) !== 1) throw new Error('mai a2');
    s = s.replace(a2, `	-- 서버 — 화상 상태 갱신(베노아 화상 스킬들). 더 늦게 끝나는 쪽으로만 늘린다
	@ExecSpace("ServerOnly")
	method void MarkBurned(number seconds)
		if self._dead then return end
		local untilT = _UtilLogic.ElapsedSeconds + seconds
		if untilT > self._burnedUntil then self._burnedUntil = untilT end
	end

	@ExecSpace("ServerOnly")
	method boolean IsBurned()
		-- 지금 화상 상태인지(솔라 플레어 타겟 조건)
		if self._dead then return false end
		return _UtilLogic.ElapsedSeconds < self._burnedUntil
	end

` + a2);
    const a3 = '\t\tself._poisonedUntil = 0\n\t\tlog("Monster died")\n';
    if (count(s, a3) !== 1) throw new Error('mai a3');
    s = s.replace(a3, '\t\tself._poisonedUntil = 0\n\t\tself._burnedUntil = 0\n\t\tlog("Monster died")\n');
    fs.writeFileSync(p, s, 'utf8');
    console.log('MonsterAI OK');
  }
}

const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
if (src.includes('@Sync property integer SolarFlareLevel')) { console.log('already applied'); process.exit(0); }
function after(anchorLine, add, expected = 1) {
  const needle = anchorLine + NL; const c = count(src, needle);
  if (c !== expected) throw new Error(`anchor ${c} != ${expected}: ${anchorLine}`);
  src = src.split(needle).join(needle + add + NL);
}
function before(anchor, add) { const c = count(src, anchor); if (c !== 1) throw new Error(`before ${c}: ${anchor.slice(0, 70)}`); src = src.replace(anchor, add + NL + anchor); }
function rep(a, b) { const c = count(src, a); if (c !== 1) throw new Error(`rep ${c}: ${a.slice(0, 70)}`); src = src.replace(a, b); }

// 기존 베노아 화상 5곳(223/225/228/230/237)에 화상 상태 표시를 붙인다
rep('\t\t\ttarget:ApplyDot(burnPerTick, self.Card223BurnSeconds, 1.0)\n', '\t\t\ttarget:ApplyDot(burnPerTick, self.Card223BurnSeconds, 1.0)\n\t\t\ttarget:MarkBurned(self.Card223BurnSeconds)\n');
rep('\t\t\ttarget:ApplyDot(burnPerTick, burnSeconds, 1.0)\n', '\t\t\ttarget:ApplyDot(burnPerTick, burnSeconds, 1.0)\n\t\t\ttarget:MarkBurned(burnSeconds)\n');
for (const c of ['228', '230', '237']) {
  rep(`if not m._dead then m:ApplyDot(burnPerTick, self.Card${c}BurnSeconds, 1.0) end`, `if not m._dead then m:ApplyDot(burnPerTick, self.Card${c}BurnSeconds, 1.0); m:MarkBurned(self.Card${c}BurnSeconds) end`);
}

const block = `	-- ── 베노아 조합: 솔라 플레어(카드239) — 유저 지정 2026-10-03 ──
	-- 익스플로젼(225) Lv5 + 하이 위즈덤(235) 보유 시 선택지에 뜨고, 해금되면 익스플로젼 슬롯을 그대로 넘겨받는다. 3레벨까지.
	-- 250/280/330, 쿨 5초. 타겟 = 화상 걸린 몬스터 전부(포이즌 트랩의 화상판 — 대상이 없으면 쿨타임을 돌리지 않고 대기).
	-- 맞으면 화상 100%(2초, 1초마다 기준 대미지의 50%) + 스턴 100%(2초).
	-- 리소스 skill/400011048(유저 지정). 클립 실측: effect 9프레임 0.81초 ~410x380(시전 — 플레이어 몸에) /
	--   special 13프레임 0.78초 ~800x800(폭발 — 타겟마다, 3번째 프레임(0.12초)에 거의 최대) / hit/0 10프레임 0.3초
	@Sync property integer SolarFlareLevel = 0
	property number Card239Cooldown = 5.0
	property string Card239CastRUID = "4e6e26d7be6a46cf93024bc4db32c5cd"
	property string Card239BurstRUID = "35d5be60ac384195a191e8a66537a4f8"
	property string Card239HitRUID = "91fff66c36364d4e9597f757345cefe0"
	property string Card239UseSoundRUID = "5dd41e286f98427fba3c269d9a011dd0"
	property string Card239HitSoundRUID = "597148b8050a479795d5ff19b57d0d73"
	property number Card239CastScale = 0.6
	property number Card239CastLifetime = 0.81
	property number Card239CastYOffset = 0.5
	property number Card239BurstScale = 0.3
	property number Card239BurstLifetime = 0.78
	property number Card239BurstYOffset = 0.4
	property number Card239BurstDelay = 0.3  -- 시전 뒤 폭발이 뜨기까지
	property number Card239ImpactDelay = 0.12  -- 폭발이 뜬 뒤 대미지까지(거의 최대 크기가 되는 3번째 프레임)
	property number Card239HitScale = 0.5
	property number Card239HitLifetime = 0.3
	property number Card239HitYOffset = 0.4
	property number Card239BurnRatio = 0.5
	property integer Card239BurnSeconds = 2
	property number Card239StunSeconds = 2.0

	method number GetSolarFlareDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 250/280/330
		if level >= 3 then return 330
		elseif level >= 2 then return 280
		end
		return 250
	end

	@ExecSpace("ServerOnly")
	method boolean SolarFlareAttack(number damage, boolean isCrit)
		-- 솔라 플레어 — 화상 걸린 몬스터 전부 자리에서 폭발. 대상이 없으면 false(쿨타임을 돌리지 않고 대기)
		local map = self:GetCurrentMap()
		if map == nil then return false end
		local targets = {}
		for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
			---@type MonsterAI
			local m = mob
			if isvalid(m) and isvalid(m.Entity) and not m._dead and m:IsBurned() then table.insert(targets, m) end
		end
		if #targets == 0 then return false end
		self:PlayBreathSfx(self.Card239UseSoundRUID)
		-- 시전 연출 — 플레이어 몸에
		local pp = self:WorldToCurrentMapLocal(Vector3(self:GetPlayerCenterX(), self:GetPlayerCenterY(), 0))
		local cast = self:SpawnEffectWithModel(self.Card239CastRUID, Vector3(pp.x, pp.y + self.Card239CastYOffset, pp.z), 0, 1.0, self.Card239CastScale, 1, "skilleffectlong")
		if cast ~= nil then cast:Destroy(self.Card239CastLifetime) end
		local castZoneIndex = _MapManager.CurrentMapIndex
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			self:PlayBreathSfx(self.Card239HitSoundRUID)
			for _, mob in ipairs(targets) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead then
					local ratio = self:GetEffectScaleRatio(m)
					local mp = self:WorldToCurrentMapLocal(m.Entity.TransformComponent.WorldPosition)
					local fx = self:SpawnEffect(self.Card239BurstRUID, Vector3(mp.x, mp.y + self.Card239BurstYOffset * ratio, mp.z), 0, 1.0, self.Card239BurstScale * ratio, 1)
					if fx ~= nil then fx:Destroy(self.Card239BurstLifetime) end
				end
			end
			_TimerService:SetTimerOnce(function()
				if not isvalid(self) then return end
				if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
				local burnPerTick = damage * self.Card239BurnRatio
				local hitCount = 0
				for _, mob in ipairs(targets) do
					---@type MonsterAI
					local m = mob
					if isvalid(m) and isvalid(m.Entity) and not m._dead then
						hitCount = hitCount + 1
						local mr = self:GetEffectScaleRatio(m)
						local mp = self:WorldToCurrentMapLocal(m.Entity.TransformComponent.WorldPosition)
						local hfx = self:SpawnEffect(self.Card239HitRUID, Vector3(mp.x, mp.y + self.Card239HitYOffset * mr, mp.z), 0, 1.0, self.Card239HitScale * mr, 1)
						if hfx ~= nil then hfx:Destroy(self.Card239HitLifetime) end
						if isCrit then _DpsMeterLogic:Tag(239, m):TakeDamageCrit(damage * 2)
						else _DpsMeterLogic:Tag(239, m):TakeDamage(damage) end
						if not m._dead then
							-- 화상 100%(1초마다 기준 대미지의 50%) + 스턴 100%
							m:ApplyDot(burnPerTick, self.Card239BurnSeconds, 1.0)
							m:MarkBurned(self.Card239BurnSeconds)
							m:ApplyStun(self.Card239StunSeconds, true)
						end
					end
				end
				log("SolarFlareHit: hit=" .. hitCount .. " burn=" .. math.floor(burnPerTick) .. "x" .. self.Card239BurnSeconds .. " stun=" .. self.Card239StunSeconds)
			end, self.Card239ImpactDelay)
		end, self.Card239BurstDelay)
		log("SolarFlareAttack: lv=" .. self.SolarFlareLevel .. " targets=" .. #targets .. " dmg=" .. math.floor(damage))
		return true
	end
`;
before('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

after('\t\tif cardIdx == 238 then return self.MistEruptionLevel > 0 end', '\t\tif cardIdx == 239 then return self.SolarFlareLevel > 0 end');
after('\t\telseif cardIdx == 238 then base = self:GetMistEruptionDamage(self.MistEruptionLevel)', '\t\telseif cardIdx == 239 then base = self:GetSolarFlareDamage(self.SolarFlareLevel)');
after('\t\telseif cardIdx == 238 then return self.Card238Cooldown', '\t\telseif cardIdx == 239 then return self.Card239Cooldown');
after('\t\telseif cardIdx == 238 then return "misteruption_up"', '\t\telseif cardIdx == 239 then return "solarflare_up"', 2);
after('\t\telseif cardIdx == 238 then self.MistEruptionLevel = 1', '\t\telseif cardIdx == 239 then self.SolarFlareLevel = 1');
after('\t\telseif cardIdx == 238 then return self.MistEruptionLevel', '\t\telseif cardIdx == 239 then return self.SolarFlareLevel');
after('\t\telseif cardIdx == 238 then self.MistEruptionLevel = level', '\t\telseif cardIdx == 239 then self.SolarFlareLevel = level');
after('\t\telseif name == "MistEruptionLevel" then self:RefreshSlotIfHoldsCard(238)', '\t\telseif name == "SolarFlareLevel" then self:RefreshSlotIfHoldsCard(239)');
after('\t\t\t\t\tself:MistEruptionAttack(damage, isCrit)', '\t\t\t\telseif cardIndex == 239 then\n\t\t\t\t\t-- 화상 걸린 대상이 없으면 쿨타임을 돌리지 않고 대기(포이즌 트랩과 같은 경로)\n\t\t\t\t\tif not self:SolarFlareAttack(damage, isCrit) then skipCooldownReset = true end');

before(`		elseif cardIdx == 238 then
			return {`,
`		elseif cardIdx == 239 then
			return {
				"MLUA_CARDMANAGER_603",
				"MLUA_CARDMANAGER_604",
				"MLUA_CARDMANAGER_605",
			}`);
before(`		elseif cardIdx == 238 then
			extraStr = `,
`		elseif cardIdx == 239 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_121", self.Card239BurnSeconds, math.floor(self.Card239BurnRatio * 100 + 0.5), math.floor(self.Card239StunSeconds + 0.5))`);

const ex = `			if self.ExplosionLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 225, type = "unlock" }) end
			elseif self.ExplosionLevel < 5 then
				table.insert(pool, { card = 225, type = "explosion_up" })
			end
`;
if (count(src, ex) !== 1) throw new Error('explosion choice anchor');
src = src.replace(ex, `			-- 익스플로젼(225) — 솔라 플레어로 조합된 뒤에는 더 이상 등장하지 않음
			if self.SolarFlareLevel == 0 then
				if self.ExplosionLevel == 0 then
					if hasEmptySlot then table.insert(pool, { card = 225, type = "unlock" }) end
				elseif self.ExplosionLevel < 5 then
					table.insert(pool, { card = 225, type = "explosion_up" })
				end
			end
			-- 솔라 플레어(239, 조합) — 익스플로젼 Lv5 + 하이 위즈덤(235). 익스플로젼 슬롯을 넘겨받아 hasEmptySlot 불필요
			if self.ExplosionLevel >= 5 and self:IsCardUnlocked(235) and self.SolarFlareLevel == 0 then
				table.insert(pool, { card = 239, type = "unlock" })
			elseif self.SolarFlareLevel > 0 and self.SolarFlareLevel < 3 then
				table.insert(pool, { card = 239, type = "solarflare_up" })
			end
`);

before(`		if cardIdx == 238 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.MistEruptionLevel + 1)`,
`		if cardIdx == 239 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.SolarFlareLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(239)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(239))
			return
		end
`);

before('\t\t-- MistEruption(베노아 조합',
`		-- SolarFlare(베노아 조합 — 익스플로젼 슬롯을 그대로 넘겨받는다)
		if cardIdx == 239 then
			if upgradeType == "unlock" then
				self.SolarFlareLevel = 1
				local exSlot = self:GetSlotForCard(225)
				if exSlot > 0 then
					self:AssignCardToSlot(exSlot, 239)
					self:ResetSlotTimer(exSlot)
					self:PlayThunderStormFusionEffect(exSlot)
					log("Card239(SolarFlare) fused into Slot" .. exSlot .. " (was Explosion)")
				else
					log_warning("SolarFlare: Explosion not found in any slot — fusion could not place the card")
				end
			elseif upgradeType == "solarflare_up" and self.SolarFlareLevel < 3 then
				self.SolarFlareLevel = self.SolarFlareLevel + 1
			end
			log("SolarFlare L" .. self.SolarFlareLevel .. " (dmg=" .. math.floor(self:GetSolarFlareDamage(self.SolarFlareLevel)) .. ")")
			return
		end
`);

rep('\t\t\tif self:IsCardUnlocked(225) and self.ExplosionLevel < 5 then table.insert(pool, 225) end',
'\t\t\tif self:IsCardUnlocked(225) and self.ExplosionLevel < 5 and self.SolarFlareLevel == 0 then table.insert(pool, 225) end\n\t\t\tif self:IsCardUnlocked(239) and self.SolarFlareLevel < 3 then table.insert(pool, 239) end');
after('\t\tself.MistEruptionLevel = 0', '\t\tself.SolarFlareLevel = 0');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
