// 베노아 조합 카드242(이그나이트 월) = 이그나이트(228) Lv5 + 하이 위즈덤(235) + 엘리멘탈 어뎁팅(236). 이그나이트 슬롯 승계. 재실행 안전.
const fs = require('fs');
const NL = '\n';
function count(h, n) { let c = 0, i = 0; while ((i = h.indexOf(n, i)) >= 0) { c++; i += n.length; } return c; }
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
if (src.includes('@Sync property integer IgniteWallLevel')) { console.log('already applied'); process.exit(0); }
function after(anchorLine, add, expected = 1) {
  const needle = anchorLine + NL; const c = count(src, needle);
  if (c !== expected) throw new Error(`anchor ${c} != ${expected}: ${anchorLine}`);
  src = src.split(needle).join(needle + add + NL);
}
function before(anchor, add) { const c = count(src, anchor); if (c !== 1) throw new Error(`before ${c}: ${anchor.slice(0, 70)}`); src = src.replace(anchor, add + NL + anchor); }
function rep(a, b) { const c = count(src, a); if (c !== 1) throw new Error(`rep ${c}: ${a.slice(0, 70)}`); src = src.replace(a, b); }

const block = `	-- ── 베노아 조합: 이그나이트 월(카드242) — 유저 지정 2026-10-04 ──
	-- 이그나이트(228) Lv5 + 하이 위즈덤(235) + 엘리멘탈 어뎁팅(236) 보유 시 선택지에 뜨고, 해금되면 이그나이트 슬롯을 그대로 넘겨받는다. 3레벨까지.
	-- 200/230/250, 쿨 5초, 타겟 3명. 타겟마다 불벽(skill/400011060 effect + effect0 겹침)이 솟고, 그 연출 범위 안 몬스터 전부에게
	-- 대미지 + 화상 100%(3초, 1초마다 기준 대미지의 50%). 화상은 솔라 플레어(239) 대상 표시(MarkBurned)도 갱신.
	-- 클립 실측: effect 23프레임 2.07초 ~700x670(불벽, 기준점 = 그림 아래 가운데) / effect0 23프레임 2.07초 ~660x300(바닥 불길, 같은 기준점)
	--   / hit/0 8프레임 0.72초 ~330px 가운데 기준점
	@Sync property integer IgniteWallLevel = 0
	property number Card242Cooldown = 5.0
	property integer Card242TargetCount = 3
	property string Card242WallRUID = "83f92e05693144cd8131be07871f87c6"
	property string Card242FloorRUID = "3b57fdfa4609496abc1bd79da98cf3f5"
	property string Card242HitRUID = "da1932b89fcd4c2195c8dc507a599e68"
	property string Card242UseSoundRUID = "9a5710b3fccb42bc8b52cd5af8156948"
	property string Card242HitSoundRUID = "0def90ae632f4c91beb50913f5f4a45f"
	property number Card242WallScale = 0.4
	property number Card242WallLifetime = 2.0  -- 클립 2.07초보다 살짝 짧게(같으면 첫 프레임이 다시 보임)
	property number Card242WallYOffset = -0.5  -- 기준점(그림 아래에서 약 0.55 위)을 발밑보다 조금 내려 불벽 바닥이 땅에 붙게(1배, 유닛)
	property number Card242ImpactDelay = 0.18  -- 불벽이 다 솟는 2번째 프레임
	property number Card242HalfW = 1.4  -- 불벽 판정 가로 반폭(1배) — 700px × 0.4배 ÷ 2
	property number Card242HalfH = 0.5  -- 판정 세로 반폭(발밑 기준, 1배)
	property number Card242HitScale = 0.5
	property number Card242HitLifetime = 0.68  -- 클립 0.72초보다 살짝 짧게
	property number Card242HitYOffset = 0.5
	property number Card242BurnRatio = 0.5
	property integer Card242BurnSeconds = 3
	property number Card242ShotInterval = 0.1

	method number GetIgniteWallDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 200/230/250
		if level >= 3 then return 250
		elseif level >= 2 then return 230
		end
		return 200
	end

	@ExecSpace("ServerOnly")
	method void IgniteWallAttack(number damage, boolean isCrit)
		-- 이그나이트 월 시전 — 가까운 3명 자리마다 불벽
		local map = self:GetCurrentMap()
		if map == nil then return end
		self:PlayBreathSfx(self.Card242UseSoundRUID)
		local targets = self:GetClosestTargets(self.Card242TargetCount)
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
					self:CastIgniteWall(map, tp, ratio, band, damage, isCrit, castZoneIndex)
				end, (shotIndex - 1) * self.Card242ShotInterval)
			end
		end
		log("IgniteWallAttack: lv=" .. self.IgniteWallLevel .. " targets=" .. #targets .. " dmg=" .. math.floor(damage))
	end

	@ExecSpace("ServerOnly")
	method void CastIgniteWall(Entity map, Vector3 tp, number ratio, boolean band, number damage, boolean isCrit, integer castZoneIndex)
		-- 불벽 1개 — 바닥 불길(effect0) 위에 불벽(effect)을 겹쳐 띄우고, 다 솟는 순간 범위 안 전부 타격 + 화상
		local scale = self.Card242WallScale * ratio
		local pos = Vector3(tp.x, tp.y + self.Card242WallYOffset * scale, tp.z)
		local floor = self:SpawnEffectWithModel(self.Card242FloorRUID, pos, 0, 1.0, scale, 1, "skilleffectlong")
		if floor ~= nil then floor:Destroy(self.Card242WallLifetime) end
		local wall = self:SpawnEffectWithModel(self.Card242WallRUID, pos, 0, 1.0, scale, 1, "skilleffectlong")
		if wall ~= nil then wall:Destroy(self.Card242WallLifetime) end
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			self:PlayBreathSfx(self.Card242HitSoundRUID)
			local halfW = self.Card242HalfW * ratio
			local halfH = self.Card242HalfH * ratio
			local burnPerTick = damage * self.Card242BurnRatio
			local hitCount = 0
			for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead then
					local mp = m.Entity.TransformComponent.Position
					if math.abs(mp.x - tp.x) <= halfW and math.abs(mp.y - tp.y) <= halfH and self:IsInDepthBand(m, band) then
						hitCount = hitCount + 1
						local mr = self:GetEffectScaleRatio(m)
						local hfx = self:SpawnEffect(self.Card242HitRUID, Vector3(mp.x, mp.y + self.Card242HitYOffset * mr, mp.z), 0, 1.0, self.Card242HitScale * mr, 1)
						if hfx ~= nil then hfx:Destroy(self.Card242HitLifetime) end
						if isCrit then _DpsMeterLogic:Tag(242, m):TakeDamageCrit(damage * 2)
						else _DpsMeterLogic:Tag(242, m):TakeDamage(damage) end
						-- 화상 100% — 1초마다 기준 대미지(치명타 전)의 50% + 솔라 플레어 대상 표시
						if not m._dead then m:ApplyDot(burnPerTick, self.Card242BurnSeconds, 1.0); m:MarkBurned(self.Card242BurnSeconds) end
					end
				end
			end
			log("IgniteWallHit: hit=" .. hitCount .. " halfW=" .. string.format("%.2f", halfW) .. " burn=" .. math.floor(burnPerTick) .. "x" .. self.Card242BurnSeconds)
		end, self.Card242ImpactDelay)
	end

`;
before('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

after('\t\tif cardIdx == 241 then return self.VenomSpearLevel > 0 end', '\t\tif cardIdx == 242 then return self.IgniteWallLevel > 0 end');
after('\t\telseif cardIdx == 241 then base = self:GetVenomSpearDamage(self.VenomSpearLevel)', '\t\telseif cardIdx == 242 then base = self:GetIgniteWallDamage(self.IgniteWallLevel)');
after('\t\telseif cardIdx == 241 then return self.Card241Cooldown', '\t\telseif cardIdx == 242 then return self.Card242Cooldown');
after('\t\telseif cardIdx == 241 then return "venomspear_up"', '\t\telseif cardIdx == 242 then return "ignitewall_up"', 2);
after('\t\telseif cardIdx == 241 then self.VenomSpearLevel = 1', '\t\telseif cardIdx == 242 then self.IgniteWallLevel = 1');
after('\t\telseif cardIdx == 241 then return self.VenomSpearLevel', '\t\telseif cardIdx == 242 then return self.IgniteWallLevel');
after('\t\telseif cardIdx == 241 then self.VenomSpearLevel = level', '\t\telseif cardIdx == 242 then self.IgniteWallLevel = level');
after('\t\telseif name == "VenomSpearLevel" then self:RefreshSlotIfHoldsCard(241)', '\t\telseif name == "IgniteWallLevel" then self:RefreshSlotIfHoldsCard(242)');
after('\t\t\t\t\tif not self:VenomSpearAttack(damage, isCrit) then skipCooldownReset = true end', '\t\t\t\telseif cardIndex == 242 then\n\t\t\t\t\tself:IgniteWallAttack(damage, isCrit)');

before(`		elseif cardIdx == 241 then
			return {`,
`		elseif cardIdx == 242 then
			return {
				"MLUA_CARDMANAGER_610",
				"MLUA_CARDMANAGER_604",
				"MLUA_CARDMANAGER_125",
			}`);
before(`		elseif cardIdx == 241 then
			local lv241`,
`		elseif cardIdx == 242 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_110", self.Card242TargetCount, self.Card242BurnSeconds, math.floor(self.Card242BurnRatio * 100 + 0.5))`);

const ig = `			if self.IgniteLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 228, type = "unlock" }) end
			elseif self.IgniteLevel < 5 then
				table.insert(pool, { card = 228, type = "ignite_up" })
			end
`;
if (count(src, ig) !== 1) throw new Error('ignite choice anchor ' + count(src, ig));
src = src.replace(ig, `			-- 이그나이트(228) — 이그나이트 월로 조합된 뒤에는 더 이상 등장하지 않음
			if self.IgniteWallLevel == 0 then
				if self.IgniteLevel == 0 then
					if hasEmptySlot then table.insert(pool, { card = 228, type = "unlock" }) end
				elseif self.IgniteLevel < 5 then
					table.insert(pool, { card = 228, type = "ignite_up" })
				end
			end
			-- 이그나이트 월(242, 조합) — 이그나이트 Lv5 + 하이 위즈덤(235) + 엘리멘탈 어뎁팅(236). 이그나이트 슬롯 승계
			if self.IgniteLevel >= 5 and self:IsCardUnlocked(235) and self:IsCardUnlocked(236) and self.IgniteWallLevel == 0 then
				table.insert(pool, { card = 242, type = "unlock" })
			elseif self.IgniteWallLevel > 0 and self.IgniteWallLevel < 3 then
				table.insert(pool, { card = 242, type = "ignitewall_up" })
			end
`);

before(`		if cardIdx == 241 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.VenomSpearLevel + 1)`,
`		if cardIdx == 242 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.IgniteWallLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(242)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(242))
			return
		end
`);

before('\t\t-- VenomSpear(베노아 조합',
`		-- IgniteWall(베노아 조합 — 이그나이트 슬롯을 그대로 넘겨받는다)
		if cardIdx == 242 then
			if upgradeType == "unlock" then
				self.IgniteWallLevel = 1
				local igSlot = self:GetSlotForCard(228)
				if igSlot > 0 then
					self:AssignCardToSlot(igSlot, 242)
					self:ResetSlotTimer(igSlot)
					self:PlayThunderStormFusionEffect(igSlot)
					log("Card242(IgniteWall) fused into Slot" .. igSlot .. " (was Ignite)")
				else
					log_warning("IgniteWall: Ignite not found in any slot — fusion could not place the card")
				end
			elseif upgradeType == "ignitewall_up" and self.IgniteWallLevel < 3 then
				self.IgniteWallLevel = self.IgniteWallLevel + 1
			end
			log("IgniteWall L" .. self.IgniteWallLevel .. " (dmg=" .. math.floor(self:GetIgniteWallDamage(self.IgniteWallLevel)) .. ")")
			return
		end
`);

rep('\t\t\tif self:IsCardUnlocked(228) and self.IgniteLevel < 5 then table.insert(pool, 228) end',
'\t\t\tif self:IsCardUnlocked(228) and self.IgniteLevel < 5 and self.IgniteWallLevel == 0 then table.insert(pool, 228) end\n\t\t\tif self:IsCardUnlocked(242) and self.IgniteWallLevel < 3 then table.insert(pool, 242) end');
after('\t\tself.VenomSpearLevel = 0', '\t\tself.IgniteWallLevel = 0');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
