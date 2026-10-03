// 베노아 조합 카드237(플레임 스윕) = 플레임 오브(223) Lv5 + 매직 액셀레이션(231) + 매직 가드(234). 플레임 오브 슬롯 승계.
// CardManager.mlua 의 각 연결 지점에 삽입한다(카드230 줄을 앵커로 씀). 재실행 안전.
const fs = require('fs');
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
const NL = '\n';
if (src.includes('@Sync property integer FlameSweepLevel')) { console.log('already applied'); process.exit(0); }
function count(h, n) { let c = 0, i = 0; while ((i = h.indexOf(n, i)) >= 0) { c++; i += n.length; } return c; }
function after(anchorLine, add, expected = 1) {
  const needle = anchorLine + NL; const c = count(src, needle);
  if (c !== expected) throw new Error(`anchor ${c} != ${expected}: ${anchorLine}`);
  src = src.split(needle).join(needle + add + NL);
}
function before(anchor, add) { const c = count(src, anchor); if (c !== 1) throw new Error(`before ${c}: ${anchor.slice(0, 70)}`); src = src.replace(anchor, add + NL + anchor); }
function rep(a, b) { const c = count(src, a); if (c !== 1) throw new Error(`rep ${c}: ${a.slice(0, 70)}`); src = src.replace(a, b); }

const block = `	-- ── 베노아 조합: 플레임 스윕(카드237) — 유저 지정 2026-10-03 ──
	-- 플레임 오브(223) Lv5 + 매직 액셀레이션(231) + 매직 가드(234) 보유 시 선택지에 뜨고, 해금되면 플레임 오브 슬롯을 그대로
	-- 넘겨받는다(블러드 스로우(222)와 같은 구조 — 두 패시브는 슬롯이 없어 비울 슬롯 없음). 조합 스킬 관례대로 3레벨까지만.
	-- 200/220/260, 쿨 4초, 타겟 3명 고정. 타겟마다 원작 불독 아크메이지 "플레임 스윕"(skill/2121006) 불길이 깔리고, 그 연출 범위 안
	-- 몬스터 전부에게 대미지 + 화상 100%(2초, 1초마다 기준 대미지의 30%).
	-- 클립 실측: effect 13프레임 × 0.06초, 6번째 프레임(0.3초)부터 548x231px로 커지며 기준점(464,~50) = 오른쪽 끝(원본은 왼쪽으로 쓸어나감)
	--   → 이그나이트(228)처럼 타겟을 띠 가운데에 두고 플레이어 쪽 끝에서 바깥으로 쓸게 놓는다 / hit/0 7프레임 0.42초
	@Sync property integer FlameSweepLevel = 0
	property number Card237Cooldown = 4.0
	property string Card237EffectRUID = "e1ad69415a744b6caf217bbaa61eb7bd"
	property string Card237HitRUID = "055e78f61a2f42739d7d6e00e656abe4"
	property string Card237HitSoundRUID = "1489f839309e4ca49d435af0df25c612"
	property number Card237EffectScale = 0.45
	property number Card237EffectLength = 4.64  -- 기준점에서 그림 반대쪽 끝까지(1배, 유닛)
	property number Card237EffectLifetime = 0.78
	property number Card237EffectYOffset = 0.0
	property number Card237ImpactDelay = 0.3  -- 불길이 띠 전체로 커지는 6번째 프레임
	property number Card237HalfH = 0.5  -- 띠 판정 세로 반폭(발밑 기준, 1배)
	property number Card237HitScale = 0.5
	property number Card237HitLifetime = 0.42
	property number Card237HitYOffset = 0.3
	property number Card237BurnRatio = 0.3
	property integer Card237BurnSeconds = 2
	property boolean Card237FlipDefault = true  -- 원본은 왼쪽으로 쓸어나감 — 오른쪽으로 쓸 때 FlipX
	property integer Card237TargetCount = 3
	property number Card237ShotInterval = 0.08

	method number GetFlameSweepDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 200/220/260
		if level >= 3 then return 260
		elseif level >= 2 then return 220
		end
		return 200
	end

	@ExecSpace("ServerOnly")
	method void FlameSweepAttack(number damage, boolean isCrit)
		-- 플레임 스윕 시전 — 가까운 3명마다 불길 1개
		local map = self:GetCurrentMap()
		if map == nil then return end
		self:PlayBreathSfx(self.Card237HitSoundRUID)
		local targets = self:GetClosestTargets(self.Card237TargetCount)
		for shotIndex, mob in ipairs(targets) do
			---@type MonsterAI
			local target = mob
			if isvalid(target) and isvalid(target.Entity) then
				local ratio = self:GetEffectScaleRatio(target)
				local tp = self:WorldToCurrentMapLocal(target.Entity.TransformComponent.WorldPosition)
				local band = self:GetDepthBand(target)
				local castZoneIndex = target._spawnZoneIndex
				_TimerService:SetTimerOnce(function()
					if not isvalid(self) then return end
					if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
					self:CastFlameSweep(map, tp, ratio, band, damage, isCrit, castZoneIndex)
				end, (shotIndex - 1) * self.Card237ShotInterval)
			end
		end
		log("FlameSweepAttack: lv=" .. self.FlameSweepLevel .. " targets=" .. #targets .. " dmg=" .. math.floor(damage))
	end

	@ExecSpace("ServerOnly")
	method void CastFlameSweep(Entity map, Vector3 tp, number ratio, boolean band, number damage, boolean isCrit, integer castZoneIndex)
		-- 불길 1개 — 타겟을 띠 가운데에 두고 플레이어 쪽 끝(기준점)에서 바깥으로 쓸어나간다. 불길이 다 퍼지는 순간 띠 안 전부 타격
		local side = self:GetBenoaSideSign(tp.x)
		local dir = -side
		local scale = self.Card237EffectScale * ratio
		local len = self.Card237EffectLength * scale
		local startX = tp.x - dir * len * 0.5
		local fx = self:SpawnEffect(self.Card237EffectRUID, Vector3(startX, tp.y + self.Card237EffectYOffset * ratio, tp.z), 0, 1.0, scale, 1)
		if fx ~= nil then
			local renderer = fx.SpriteRendererComponent
			if renderer ~= nil then
				if dir > 0 then renderer.FlipX = self.Card237FlipDefault else renderer.FlipX = not self.Card237FlipDefault end
			end
			fx:Destroy(self.Card237EffectLifetime)
		end
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			local halfH = self.Card237HalfH * ratio
			local burnPerTick = damage * self.Card237BurnRatio
			local hitCount = 0
			for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead then
					local mp = m.Entity.TransformComponent.Position
					local along = (mp.x - startX) * dir
					if along >= -0.1 * scale and along <= len and math.abs(mp.y - tp.y) <= halfH and self:IsInDepthBand(m, band) then
						hitCount = hitCount + 1
						local mr = self:GetEffectScaleRatio(m)
						local hfx = self:SpawnEffect(self.Card237HitRUID, Vector3(mp.x, mp.y + self.Card237HitYOffset * mr, mp.z), 0, 1.0, self.Card237HitScale * mr, 1)
						if hfx ~= nil then hfx:Destroy(self.Card237HitLifetime) end
						if isCrit then _DpsMeterLogic:Tag(237, m):TakeDamageCrit(damage * 2)
						else _DpsMeterLogic:Tag(237, m):TakeDamage(damage) end
						-- 화상 100% — 1초마다 기준 대미지(치명타 전)의 30%
						if not m._dead then m:ApplyDot(burnPerTick, self.Card237BurnSeconds, 1.0) end
					end
				end
			end
			log("FlameSweepHit: hit=" .. hitCount .. " len=" .. string.format("%.2f", len) .. " dir=" .. dir .. " burn=" .. math.floor(burnPerTick) .. "x" .. self.Card237BurnSeconds)
		end, self.Card237ImpactDelay)
	end
`;
before('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

after('\t\tif cardIdx == 230 then return self.BlazeShotLevel > 0 end', '\t\tif cardIdx == 237 then return self.FlameSweepLevel > 0 end');
after('\t\telseif cardIdx == 230 then base = self:GetBlazeShotDamage(self.BlazeShotLevel)', '\t\telseif cardIdx == 237 then base = self:GetFlameSweepDamage(self.FlameSweepLevel)');
after('\t\telseif cardIdx == 230 then return self.Card230Cooldown', '\t\telseif cardIdx == 237 then return self.Card237Cooldown');
after('\t\telseif cardIdx == 230 then return "blazeshot_up"', '\t\telseif cardIdx == 237 then return "flamesweep_up"', 2);
after('\t\telseif cardIdx == 230 then self.BlazeShotLevel = 1', '\t\telseif cardIdx == 237 then self.FlameSweepLevel = 1');
after('\t\telseif cardIdx == 230 then return self.BlazeShotLevel', '\t\telseif cardIdx == 237 then return self.FlameSweepLevel');
after('\t\telseif cardIdx == 230 then self.BlazeShotLevel = level', '\t\telseif cardIdx == 237 then self.FlameSweepLevel = level');
after('\t\telseif name == "BlazeShotLevel" then self:RefreshSlotIfHoldsCard(230)', '\t\telseif name == "FlameSweepLevel" then self:RefreshSlotIfHoldsCard(237)');
after('\t\t\t\t\tself:BlazeShotAttack(damage, isCrit)', '\t\t\t\telseif cardIndex == 237 then\n\t\t\t\t\tself:FlameSweepAttack(damage, isCrit)');

before(`		elseif cardIdx == 230 then
			return {`,
`		elseif cardIdx == 237 then
			return {
				"MLUA_CARDMANAGER_600",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_601",
			}`);
before(`		elseif cardIdx == 230 then
			extraStr = `,
`		elseif cardIdx == 237 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_110", self.Card237TargetCount, self.Card237BurnSeconds, math.floor(self.Card237BurnRatio * 100 + 0.5))`);

// 레벨업 선택지 — 플레임 오브는 조합 뒤 사라지고, 조합 조건이 맞으면 플레임 스윕이 뜬다
const fo = `			if self.FlameOrbLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 223, type = "unlock" }) end
			elseif self.FlameOrbLevel < 5 then
				table.insert(pool, { card = 223, type = "flameorb_up" })
			end
`;
if (count(src, fo) !== 1) throw new Error('flame orb choice anchor');
src = src.replace(fo, `			-- 플레임 오브(223) — 플레임 스윕으로 조합된 뒤에는 더 이상 등장하지 않음(그 슬롯을 이미 떠났으므로)
			if self.FlameSweepLevel == 0 then
				if self.FlameOrbLevel == 0 then
					if hasEmptySlot then table.insert(pool, { card = 223, type = "unlock" }) end
				elseif self.FlameOrbLevel < 5 then
					table.insert(pool, { card = 223, type = "flameorb_up" })
				end
			end
			-- 플레임 스윕(237, 조합) — 플레임 오브 Lv5 + 매직 액셀레이션(231) + 매직 가드(234). 플레임 오브 슬롯을 넘겨받아 hasEmptySlot 불필요
			if self.FlameOrbLevel >= 5 and self:IsCardUnlocked(231) and self:IsCardUnlocked(234) and self.FlameSweepLevel == 0 then
				table.insert(pool, { card = 237, type = "unlock" })
			elseif self.FlameSweepLevel > 0 and self.FlameSweepLevel < 3 then
				table.insert(pool, { card = 237, type = "flamesweep_up" })
			end
`);

before(`		if cardIdx == 230 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.BlazeShotLevel + 1)`,
`		if cardIdx == 237 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.FlameSweepLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(237)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(237))
			return
		end
`);

before('\t\t-- BlazeShot(베노아 전용, 슬롯형 액티브)',
`		-- FlameSweep(베노아 조합 — 플레임 오브 슬롯을 그대로 넘겨받는다)
		if cardIdx == 237 then
			if upgradeType == "unlock" then
				self.FlameSweepLevel = 1
				local orbSlot = self:GetSlotForCard(223)
				if orbSlot > 0 then
					self:AssignCardToSlot(orbSlot, 237)
					self:ResetSlotTimer(orbSlot)
					self:PlayThunderStormFusionEffect(orbSlot)
					log("Card237(FlameSweep) fused into Slot" .. orbSlot .. " (was FlameOrb)")
				else
					log_warning("FlameSweep: FlameOrb not found in any slot — fusion could not place the card")
				end
			elseif upgradeType == "flamesweep_up" and self.FlameSweepLevel < 3 then
				self.FlameSweepLevel = self.FlameSweepLevel + 1
			end
			log("FlameSweep L" .. self.FlameSweepLevel .. " (dmg=" .. math.floor(self:GetFlameSweepDamage(self.FlameSweepLevel)) .. " targets=" .. self.Card237TargetCount .. ")")
			return
		end
`);

// 드롭/상자 강화 풀 — 플레임 오브는 조합 뒤 빠지고, 조합 카드는 Lv3까지
rep('\t\t\tif self:IsCardUnlocked(223) and self.FlameOrbLevel < 5 then table.insert(pool, 223) end',
'\t\t\tif self:IsCardUnlocked(223) and self.FlameOrbLevel < 5 and self.FlameSweepLevel == 0 then table.insert(pool, 223) end\n\t\t\tif self:IsCardUnlocked(237) and self.FlameSweepLevel < 3 then table.insert(pool, 237) end');
after('\t\tself.BlazeShotLevel = 0', '\t\tself.FlameSweepLevel = 0');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
