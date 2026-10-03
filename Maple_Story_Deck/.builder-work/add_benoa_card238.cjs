// 베노아 조합 카드238(미스트 이럽션) = 포이즌 브레스(224) Lv5 + 마나 웨이브(232). 포이즌 브레스 슬롯 승계.
// CardManager.mlua 의 각 연결 지점에 삽입한다(카드237 줄을 앵커로 씀). 재실행 안전.
const fs = require('fs');
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
const NL = '\n';
if (src.includes('@Sync property integer MistEruptionLevel')) { console.log('already applied'); process.exit(0); }
function count(h, n) { let c = 0, i = 0; while ((i = h.indexOf(n, i)) >= 0) { c++; i += n.length; } return c; }
function after(anchorLine, add, expected = 1) {
  const needle = anchorLine + NL; const c = count(src, needle);
  if (c !== expected) throw new Error(`anchor ${c} != ${expected}: ${anchorLine}`);
  src = src.split(needle).join(needle + add + NL);
}
function before(anchor, add) { const c = count(src, anchor); if (c !== 1) throw new Error(`before ${c}: ${anchor.slice(0, 70)}`); src = src.replace(anchor, add + NL + anchor); }
function rep(a, b) { const c = count(src, a); if (c !== 1) throw new Error(`rep ${c}: ${a.slice(0, 70)}`); src = src.replace(a, b); }

const block = `	-- ── 베노아 조합: 미스트 이럽션(카드238) — 유저 지정 2026-10-03 ──
	-- 포이즌 브레스(224) Lv5 + 마나 웨이브(232) 보유 시 선택지에 뜨고, 해금되면 포이즌 브레스 슬롯을 그대로 넘겨받는다
	-- (플레임 스윕(237)과 같은 구조). 조합 스킬 관례대로 3레벨까지만.
	-- 200/220/260, 쿨 4초, 타겟 3명 고정. 타겟 자리마다 원작 불독 아크메이지 "미스트 이럽션"(skill/2121003) 독 폭발이 터지고,
	-- 그 연출 범위(타원) 안 몬스터 전부에게 대미지 + 중독 100%(2초, 1초마다 기준 대미지의 30%, 포이즌 트랩 대상 표시 포함).
	-- 클립 실측: effect 17프레임 1.11초(기준점 = 그림 아래쪽 가운데 근처) — 12번째 프레임(0.57초)에 큰 폭발로 커짐
	--   effect2 첫 프레임 0.57초 빈 그림 + 420x424 큰 폭발 10프레임(총 1.47초) → 둘을 겹쳐 띄우고 0.57초에 타격 / hit/0 5프레임 0.45초
	@Sync property integer MistEruptionLevel = 0
	property number Card238Cooldown = 4.0
	property string Card238EffectRUID = "f43c822abfc34d75992c59de8587f1b7"
	property string Card238Effect2RUID = "54523c8be0af4a3d87b4575b6dac3c8a"
	property string Card238HitRUID = "f8f7074a8f924c99b7243905e1dc1677"
	property string Card238UseSoundRUID = "24480b90f4b549ea8b7fa8b0868a5d9b"
	property string Card238HitSoundRUID = "46a96145676f407ab3a7c4e8d7fb11d7"
	property number Card238EffectScale = 1.0
	property number Card238Effect2Scale = 0.6
	property number Card238EffectLifetime = 1.11
	property number Card238Effect2Lifetime = 1.47
	property number Card238EffectYOffset = 0.0
	property number Card238ImpactDelay = 0.57  -- 두 클립 모두 큰 폭발로 바뀌는 순간
	property number Card238HalfW = 1.2  -- 폭발 범위 타원(발밑 기준, 1배) — effect2 큰 폭발 폭(420px × 0.6배 ≈ 2.5유닛)에 맞춤
	property number Card238HalfH = 0.7
	property number Card238HitScale = 0.6
	property number Card238HitLifetime = 0.45
	property number Card238HitYOffset = 0.4
	property number Card238PoisonRatio = 0.3
	property integer Card238PoisonSeconds = 2
	property integer Card238TargetCount = 3
	property number Card238ShotInterval = 0.08

	method number GetMistEruptionDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 200/220/260
		if level >= 3 then return 260
		elseif level >= 2 then return 220
		end
		return 200
	end

	@ExecSpace("ServerOnly")
	method void MistEruptionAttack(number damage, boolean isCrit)
		-- 미스트 이럽션 시전 — 가까운 3명 자리마다 독 폭발 1개
		local map = self:GetCurrentMap()
		if map == nil then return end
		self:PlayBreathSfx(self.Card238UseSoundRUID)
		local targets = self:GetClosestTargets(self.Card238TargetCount)
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
					self:CastMistEruption(map, tp, ratio, band, damage, isCrit, castZoneIndex)
				end, (shotIndex - 1) * self.Card238ShotInterval)
			end
		end
		log("MistEruptionAttack: lv=" .. self.MistEruptionLevel .. " targets=" .. #targets .. " dmg=" .. math.floor(damage))
	end

	@ExecSpace("ServerOnly")
	method void CastMistEruption(Entity map, Vector3 tp, number ratio, boolean band, number damage, boolean isCrit, integer castZoneIndex)
		-- 폭발 1개 — 타겟 발밑에 effect + effect2를 겹쳐 띄우고, 큰 폭발로 바뀌는 순간 타원 안 전부 타격 + 중독
		local pos = Vector3(tp.x, tp.y + self.Card238EffectYOffset * ratio, tp.z)
		local fx = self:SpawnEffectWithModel(self.Card238EffectRUID, pos, 0, 1.0, self.Card238EffectScale * ratio, 1, "skilleffectlong")
		if fx ~= nil then fx:Destroy(self.Card238EffectLifetime) end
		local fx2 = self:SpawnEffectWithModel(self.Card238Effect2RUID, pos, 0, 1.0, self.Card238Effect2Scale * ratio, 1, "skilleffectlong")
		if fx2 ~= nil then fx2:Destroy(self.Card238Effect2Lifetime) end
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			self:PlayBreathSfx(self.Card238HitSoundRUID)
			local halfW = self.Card238HalfW * ratio
			local halfH = self.Card238HalfH * ratio
			local poisonPerTick = damage * self.Card238PoisonRatio
			local hitCount = 0
			for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead then
					local mp = m.Entity.TransformComponent.Position
					if self:InEllipse(mp.x - tp.x, mp.y - tp.y, halfW, halfH) and self:IsInDepthBand(m, band) then
						hitCount = hitCount + 1
						local mr = self:GetEffectScaleRatio(m)
						local hfx = self:SpawnEffect(self.Card238HitRUID, Vector3(mp.x, mp.y + self.Card238HitYOffset * mr, mp.z), 0, 1.0, self.Card238HitScale * mr, 1)
						if hfx ~= nil then hfx:Destroy(self.Card238HitLifetime) end
						if isCrit then _DpsMeterLogic:Tag(238, m):TakeDamageCrit(damage * 2)
						else _DpsMeterLogic:Tag(238, m):TakeDamage(damage) end
						if not m._dead then
							-- 중독 100% — 1초마다 기준 대미지(치명타 전)의 30% + 포이즌 트랩(227) 대상 표시
							m:ApplyDot(poisonPerTick, self.Card238PoisonSeconds, 1.0)
							m:MarkPoisoned(self.Card238PoisonSeconds)
						end
					end
				end
			end
			log("MistEruptionHit: hit=" .. hitCount .. " halfW=" .. string.format("%.2f", halfW) .. " poison=" .. math.floor(poisonPerTick) .. "x" .. self.Card238PoisonSeconds)
		end, self.Card238ImpactDelay)
	end
`;
before('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

after('\t\tif cardIdx == 237 then return self.FlameSweepLevel > 0 end', '\t\tif cardIdx == 238 then return self.MistEruptionLevel > 0 end');
after('\t\telseif cardIdx == 237 then base = self:GetFlameSweepDamage(self.FlameSweepLevel)', '\t\telseif cardIdx == 238 then base = self:GetMistEruptionDamage(self.MistEruptionLevel)');
after('\t\telseif cardIdx == 237 then return self.Card237Cooldown', '\t\telseif cardIdx == 238 then return self.Card238Cooldown');
after('\t\telseif cardIdx == 237 then return "flamesweep_up"', '\t\telseif cardIdx == 238 then return "misteruption_up"', 2);
after('\t\telseif cardIdx == 237 then self.FlameSweepLevel = 1', '\t\telseif cardIdx == 238 then self.MistEruptionLevel = 1');
after('\t\telseif cardIdx == 237 then return self.FlameSweepLevel', '\t\telseif cardIdx == 238 then return self.MistEruptionLevel');
after('\t\telseif cardIdx == 237 then self.FlameSweepLevel = level', '\t\telseif cardIdx == 238 then self.MistEruptionLevel = level');
after('\t\telseif name == "FlameSweepLevel" then self:RefreshSlotIfHoldsCard(237)', '\t\telseif name == "MistEruptionLevel" then self:RefreshSlotIfHoldsCard(238)');
after('\t\t\t\t\tself:FlameSweepAttack(damage, isCrit)', '\t\t\t\telseif cardIndex == 238 then\n\t\t\t\t\tself:MistEruptionAttack(damage, isCrit)');

before(`		elseif cardIdx == 237 then
			return {`,
`		elseif cardIdx == 238 then
			return {
				"MLUA_CARDMANAGER_602",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_601",
			}`);
before(`		elseif cardIdx == 237 then
			extraStr = `,
`		elseif cardIdx == 238 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_114", self.Card238TargetCount, self.Card238PoisonSeconds, math.floor(self.Card238PoisonRatio * 100 + 0.5))`);

// 레벨업 선택지 — 포이즌 브레스는 조합 뒤 사라지고, 조합 조건이 맞으면 미스트 이럽션이 뜬다
const pb = `			if self.PoisonBreathLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 224, type = "unlock" }) end
			elseif self.PoisonBreathLevel < 5 then
				table.insert(pool, { card = 224, type = "poisonbreath_up" })
			end
`;
if (count(src, pb) !== 1) throw new Error('poison breath choice anchor');
src = src.replace(pb, `			-- 포이즌 브레스(224) — 미스트 이럽션으로 조합된 뒤에는 더 이상 등장하지 않음
			if self.MistEruptionLevel == 0 then
				if self.PoisonBreathLevel == 0 then
					if hasEmptySlot then table.insert(pool, { card = 224, type = "unlock" }) end
				elseif self.PoisonBreathLevel < 5 then
					table.insert(pool, { card = 224, type = "poisonbreath_up" })
				end
			end
			-- 미스트 이럽션(238, 조합) — 포이즌 브레스 Lv5 + 마나 웨이브(232). 포이즌 브레스 슬롯을 넘겨받아 hasEmptySlot 불필요
			if self.PoisonBreathLevel >= 5 and self:IsCardUnlocked(232) and self.MistEruptionLevel == 0 then
				table.insert(pool, { card = 238, type = "unlock" })
			elseif self.MistEruptionLevel > 0 and self.MistEruptionLevel < 3 then
				table.insert(pool, { card = 238, type = "misteruption_up" })
			end
`);

before(`		if cardIdx == 237 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.FlameSweepLevel + 1)`,
`		if cardIdx == 238 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.MistEruptionLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(238)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(238))
			return
		end
`);

before('\t\t-- FlameSweep(베노아 조합',
`		-- MistEruption(베노아 조합 — 포이즌 브레스 슬롯을 그대로 넘겨받는다)
		if cardIdx == 238 then
			if upgradeType == "unlock" then
				self.MistEruptionLevel = 1
				local breathSlot = self:GetSlotForCard(224)
				if breathSlot > 0 then
					self:AssignCardToSlot(breathSlot, 238)
					self:ResetSlotTimer(breathSlot)
					self:PlayThunderStormFusionEffect(breathSlot)
					log("Card238(MistEruption) fused into Slot" .. breathSlot .. " (was PoisonBreath)")
				else
					log_warning("MistEruption: PoisonBreath not found in any slot — fusion could not place the card")
				end
			elseif upgradeType == "misteruption_up" and self.MistEruptionLevel < 3 then
				self.MistEruptionLevel = self.MistEruptionLevel + 1
			end
			log("MistEruption L" .. self.MistEruptionLevel .. " (dmg=" .. math.floor(self:GetMistEruptionDamage(self.MistEruptionLevel)) .. " targets=" .. self.Card238TargetCount .. ")")
			return
		end
`);

// 드롭/상자 강화 풀 — 포이즌 브레스는 조합 뒤 빠지고, 조합 카드는 Lv3까지
rep('\t\t\tif self:IsCardUnlocked(224) and self.PoisonBreathLevel < 5 then table.insert(pool, 224) end',
'\t\t\tif self:IsCardUnlocked(224) and self.PoisonBreathLevel < 5 and self.MistEruptionLevel == 0 then table.insert(pool, 224) end\n\t\t\tif self:IsCardUnlocked(238) and self.MistEruptionLevel < 3 then table.insert(pool, 238) end');
after('\t\tself.FlameSweepLevel = 0', '\t\tself.MistEruptionLevel = 0');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
