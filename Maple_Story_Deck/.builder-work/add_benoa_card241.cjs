// 베노아 조합 카드241(베놈 스피어) = 포이즌 트랩(227) Lv5 + 마나 웨이브(232) + 하이 위즈덤(235). 포이즌 트랩 슬롯 승계. 재실행 안전.
const fs = require('fs');
const NL = '\n';
function count(h, n) { let c = 0, i = 0; while ((i = h.indexOf(n, i)) >= 0) { c++; i += n.length; } return c; }
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
if (src.includes('@Sync property integer VenomSpearLevel')) { console.log('already applied'); process.exit(0); }
function after(anchorLine, add, expected = 1) {
  const needle = anchorLine + NL; const c = count(src, needle);
  if (c !== expected) throw new Error(`anchor ${c} != ${expected}: ${anchorLine}`);
  src = src.split(needle).join(needle + add + NL);
}
function before(anchor, add) { const c = count(src, anchor); if (c !== 1) throw new Error(`before ${c}: ${anchor.slice(0, 70)}`); src = src.replace(anchor, add + NL + anchor); }
function rep(a, b) { const c = count(src, a); if (c !== 1) throw new Error(`rep ${c}: ${a.slice(0, 70)}`); src = src.replace(a, b); }

const block = `	-- ── 베노아 조합: 베놈 스피어(카드241) — 유저 지정 2026-10-04 ──
	-- 포이즌 트랩(227) Lv5 + 마나 웨이브(232) + 하이 위즈덤(235) 보유 시 선택지에 뜨고, 해금되면 포이즌 트랩 슬롯을 그대로 넘겨받는다. 3레벨까지.
	-- 160/180/200, 쿨 10초, 타겟 1명(중독된 몬스터 우선, 없으면 가장 가까운 몬스터).
	-- 타겟에 표창(skill/15001002 effect)이 꽂히며 대미지 + 타격(hit/0) + 속박 3초(포이즌 트랩과 같은 연출 — 살짝 뜨고 넝쿨이 감음).
	-- 표창이 사라질 때 그 자리 범위(타원) 안 몬스터 전부에게 기준 대미지의 40/50/60%.
	-- 클립 실측: effect 7프레임 0.84초 — 기준점이 그림 오른쪽 아래 밖(그림 중심이 기준점에서 왼쪽 0.99·위 1.03, 원작 캐릭터 기준 배치)
	--   → 그만큼 되돌려 그림 중심을 몸통에 둔다. 4번째 프레임(0.36초)에 가장 큼 / hit/0 5프레임 0.6초
	@Sync property integer VenomSpearLevel = 0
	property number Card241Cooldown = 10.0
	property string Card241SpearRUID = "5cd1f5621b774bcbaa84898f79e98772"
	property string Card241HitRUID = "2c2e5530dc0e4d15b89f4dae9a7cc1a9"
	property string Card241UseSoundRUID = "6010e41f9225432e9e5dd0d0ed4cb276"
	property string Card241HitSoundRUID = "8e7b0c6fdc68437982d245033acaa1da"
	property number Card241SpearScale = 1.0
	property number Card241SpearCenterLeft = 0.99  -- 그림 중심이 기준점보다 왼쪽에 있는 양(1배, 유닛)
	property number Card241SpearCenterUp = 1.03  -- 그림 중심이 기준점보다 위에 있는 양(1배, 유닛)
	property number Card241SpearLifetime = 0.8  -- 클립 0.84초보다 살짝 짧게(같으면 첫 프레임이 다시 보임)
	property number Card241ImpactDelay = 0.36  -- 표창이 가장 크게 꽂히는 4번째 프레임 — 단일 대미지 + 속박
	property number Card241BurstDelay = 0.8  -- 표창이 사라지는 순간 — 범위 대미지
	property number Card241HitScale = 0.8
	property number Card241HitLifetime = 0.56  -- 클립 0.6초보다 살짝 짧게
	property number Card241BodyYOffset = 0.5
	property number Card241RootDuration = 3.0
	property number Card241BurstHalfW = 1.2  -- 범위 타원(발밑 기준, 1배)
	property number Card241BurstHalfH = 0.6

	method number GetVenomSpearDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 160/180/200
		if level >= 3 then return 200
		elseif level >= 2 then return 180
		end
		return 160
	end

	method number GetVenomSpearBurstRatio(integer level)
		-- 표창이 사라질 때 범위 대미지 비율 — 40/50/60%
		if level >= 3 then return 0.6
		elseif level >= 2 then return 0.5
		end
		return 0.4
	end

	@ExecSpace("ServerOnly")
	method void VenomSpearAttack(number damage, boolean isCrit)
		-- 베놈 스피어 시전 — 중독된 몬스터 중 가장 가까운 1명(없으면 가장 가까운 몬스터)
		local map = self:GetCurrentMap()
		if map == nil then return end
		local candidates = self:GetClosestTargets(8)
		---@type MonsterAI
		local target = nil
		for _, mob in ipairs(candidates) do
			---@type MonsterAI
			local m = mob
			if target == nil and isvalid(m) and isvalid(m.Entity) and not m._dead and m:IsPoisoned() then target = m end
		end
		if target == nil then target = candidates[1] end
		if not isvalid(target) or not isvalid(target.Entity) then return end
		self:PlayBreathSfx(self.Card241UseSoundRUID)
		local ratio = self:GetEffectScaleRatio(target)
		local tp = self:WorldToCurrentMapLocal(target.Entity.TransformComponent.WorldPosition)
		local band = self:GetDepthBand(target)
		local castZoneIndex = target._spawnZoneIndex
		local sScale = self.Card241SpearScale * ratio
		local spear = self:SpawnEffect(self.Card241SpearRUID, Vector3(tp.x + self.Card241SpearCenterLeft * sScale, tp.y + self.Card241BodyYOffset * ratio - self.Card241SpearCenterUp * sScale, tp.z), 0, 1.0, sScale, 1)
		if spear ~= nil then spear:Destroy(self.Card241SpearLifetime) end
		-- 꽂히는 순간 — 단일 대미지 + 타격 + 속박(포이즌 트랩과 같은 연출)
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			if not isvalid(target) or not isvalid(target.Entity) or target._dead then return end
			self:PlayBreathSfx(self.Card241HitSoundRUID)
			local mp = self:WorldToCurrentMapLocal(target.Entity.TransformComponent.WorldPosition)
			local hfx = self:SpawnEffect(self.Card241HitRUID, Vector3(mp.x, mp.y + self.Card241BodyYOffset * ratio, mp.z), 0, 1.0, self.Card241HitScale * ratio, 1)
			if hfx ~= nil then hfx:Destroy(self.Card241HitLifetime) end
			if isCrit then _DpsMeterLogic:Tag(241, target):TakeDamageCrit(damage * 2)
			else _DpsMeterLogic:Tag(241, target):TakeDamage(damage) end
			if not target._dead then
				local dur = self.Card241RootDuration
				target:ApplyStun(dur, false)
				target:ApplyLevitate(dur)
				target:ApplyPoisonTrapVine(dur * _RelicInventory:GetAilmentDurationMult())
			end
		end, self.Card241ImpactDelay)
		-- 표창이 사라지는 순간 — 그 자리 범위 대미지
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			local burstDamage = damage * self:GetVenomSpearBurstRatio(self.VenomSpearLevel)
			local halfW = self.Card241BurstHalfW * ratio
			local halfH = self.Card241BurstHalfH * ratio
			local hitCount = 0
			for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead then
					local mp = m.Entity.TransformComponent.Position
					if self:InEllipse(mp.x - tp.x, mp.y - tp.y, halfW, halfH) and self:IsInDepthBand(m, band) then
						hitCount = hitCount + 1
						local mr = self:GetEffectScaleRatio(m)
						local hfx = self:SpawnEffect(self.Card241HitRUID, Vector3(mp.x, mp.y + self.Card241BodyYOffset * mr, mp.z), 0, 1.0, self.Card241HitScale * mr, 1)
						if hfx ~= nil then hfx:Destroy(self.Card241HitLifetime) end
						if isCrit then _DpsMeterLogic:Tag(241, m):TakeDamageCrit(burstDamage * 2)
						else _DpsMeterLogic:Tag(241, m):TakeDamage(burstDamage) end
					end
				end
			end
			log("VenomSpearBurst: hit=" .. hitCount .. " dmg=" .. math.floor(burstDamage) .. " ratio=" .. self:GetVenomSpearBurstRatio(self.VenomSpearLevel))
		end, self.Card241BurstDelay)
		log("VenomSpearAttack: lv=" .. self.VenomSpearLevel .. " dmg=" .. math.floor(damage) .. " poisonedTarget=" .. tostring(target:IsPoisoned()))
	end
`;
before('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

after('\t\tif cardIdx == 240 then return self.VenomBurstLevel > 0 end', '\t\tif cardIdx == 241 then return self.VenomSpearLevel > 0 end');
after('\t\telseif cardIdx == 240 then base = self:GetVenomBurstDamage(self.VenomBurstLevel)', '\t\telseif cardIdx == 241 then base = self:GetVenomSpearDamage(self.VenomSpearLevel)');
after('\t\telseif cardIdx == 240 then return self.Card240Cooldown', '\t\telseif cardIdx == 241 then return self.Card241Cooldown');
after('\t\telseif cardIdx == 240 then return "venomburst_up"', '\t\telseif cardIdx == 241 then return "venomspear_up"', 2);
after('\t\telseif cardIdx == 240 then self.VenomBurstLevel = 1', '\t\telseif cardIdx == 241 then self.VenomSpearLevel = 1');
after('\t\telseif cardIdx == 240 then return self.VenomBurstLevel', '\t\telseif cardIdx == 241 then return self.VenomSpearLevel');
after('\t\telseif cardIdx == 240 then self.VenomBurstLevel = level', '\t\telseif cardIdx == 241 then self.VenomSpearLevel = level');
after('\t\telseif name == "VenomBurstLevel" then self:RefreshSlotIfHoldsCard(240)', '\t\telseif name == "VenomSpearLevel" then self:RefreshSlotIfHoldsCard(241)');
after('\t\t\t\t\tself:VenomBurstAttack(damage, isCrit)', '\t\t\t\telseif cardIndex == 241 then\n\t\t\t\t\tself:VenomSpearAttack(damage, isCrit)');

before(`		elseif cardIdx == 240 then
			return {`,
`		elseif cardIdx == 241 then
			return {
				"MLUA_CARDMANAGER_607",
				"MLUA_CARDMANAGER_608",
				"MLUA_CARDMANAGER_608",
			}`);
before(`		elseif cardIdx == 240 then
			extraStr = `,
`		elseif cardIdx == 241 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_123", math.floor(self.Card241RootDuration + 0.5), math.floor(self:GetVenomSpearBurstRatio(math.max(1, self.VenomSpearLevel)) * 100 + 0.5))`);

const pt = `			if self.PoisonTrapLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 227, type = "unlock" }) end
			elseif self.PoisonTrapLevel < 5 then
				table.insert(pool, { card = 227, type = "poisontrap_up" })
			end
`;
if (count(src, pt) !== 1) throw new Error('poison trap choice anchor');
src = src.replace(pt, `			-- 포이즌 트랩(227) — 베놈 스피어로 조합된 뒤에는 더 이상 등장하지 않음
			if self.VenomSpearLevel == 0 then
				if self.PoisonTrapLevel == 0 then
					if hasEmptySlot then table.insert(pool, { card = 227, type = "unlock" }) end
				elseif self.PoisonTrapLevel < 5 then
					table.insert(pool, { card = 227, type = "poisontrap_up" })
				end
			end
			-- 베놈 스피어(241, 조합) — 포이즌 트랩 Lv5 + 마나 웨이브(232) + 하이 위즈덤(235). 포이즌 트랩 슬롯 승계
			if self.PoisonTrapLevel >= 5 and self:IsCardUnlocked(232) and self:IsCardUnlocked(235) and self.VenomSpearLevel == 0 then
				table.insert(pool, { card = 241, type = "unlock" })
			elseif self.VenomSpearLevel > 0 and self.VenomSpearLevel < 3 then
				table.insert(pool, { card = 241, type = "venomspear_up" })
			end
`);

before(`		if cardIdx == 240 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.VenomBurstLevel + 1)`,
`		if cardIdx == 241 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.VenomSpearLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(241)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(241))
			return
		end
`);

before('\t\t-- VenomBurst(베노아 조합',
`		-- VenomSpear(베노아 조합 — 포이즌 트랩 슬롯을 그대로 넘겨받는다)
		if cardIdx == 241 then
			if upgradeType == "unlock" then
				self.VenomSpearLevel = 1
				local trapSlot = self:GetSlotForCard(227)
				if trapSlot > 0 then
					self:AssignCardToSlot(trapSlot, 241)
					self:ResetSlotTimer(trapSlot)
					self:PlayThunderStormFusionEffect(trapSlot)
					log("Card241(VenomSpear) fused into Slot" .. trapSlot .. " (was PoisonTrap)")
				else
					log_warning("VenomSpear: PoisonTrap not found in any slot — fusion could not place the card")
				end
			elseif upgradeType == "venomspear_up" and self.VenomSpearLevel < 3 then
				self.VenomSpearLevel = self.VenomSpearLevel + 1
			end
			log("VenomSpear L" .. self.VenomSpearLevel .. " (dmg=" .. math.floor(self:GetVenomSpearDamage(self.VenomSpearLevel)) .. ")")
			return
		end
`);

rep('\t\t\tif self:IsCardUnlocked(227) and self.PoisonTrapLevel < 5 then table.insert(pool, 227) end',
'\t\t\tif self:IsCardUnlocked(227) and self.PoisonTrapLevel < 5 and self.VenomSpearLevel == 0 then table.insert(pool, 227) end\n\t\t\tif self:IsCardUnlocked(241) and self.VenomSpearLevel < 3 then table.insert(pool, 241) end');
after('\t\tself.VenomBurstLevel = 0', '\t\tself.VenomSpearLevel = 0');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
