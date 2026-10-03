// 베노아 조합 카드240(베놈 버스트) = 포이즌 미스트(226) Lv5 + 엘리멘탈 드레인(233) + 매직 가드(234) + 엘리멘탈 어뎁팅(236). 포이즌 미스트 슬롯 승계.
// 시전: 타겟 2명 자리에 포이즌 미스트 타격 연출 + 범위 대미지 → 그 자리에 바로 독무 3초(틱당 100%).
// 시전/독무에 맞은 몬스터는 3초 동안 "베놈" 상태 — 그 사이 죽으면 그 자리에 독무 3초(틱당 50%, 연쇄 없음).
// 독무 공용화: SpawnPoisonMist → SpawnPoisonMistEx(카드 태그·틱 비율·베놈 표시 여부). 재실행 안전.
const fs = require('fs');
const NL = '\n';
function count(h, n) { let c = 0, i = 0; while ((i = h.indexOf(n, i)) >= 0) { c++; i += n.length; } return c; }

// ── MonsterAI: 베놈 상태 ──
{
  const p = 'RootDesk/MyDesk/MonsterAI.mlua';
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('property number _venomDamage')) {
    const a1 = '\tproperty number _burnedUntil = 0\n';
    if (count(s, a1) !== 1) throw new Error('mai a1');
    s = s.replace(a1, a1 + '\t-- 베놈 버스트(240) — 시전/독무에 맞은 뒤 이 시각 전에 죽으면 그 자리에 독무(틱당 50%)가 생긴다\n\tproperty number _venomDamage = 0\n\tproperty number _venomUntil = 0\n');
    const a2 = '\t@ExecSpace("ServerOnly")\n\tmethod boolean IsPoisoned()\n';
    if (count(s, a2) !== 1) throw new Error('mai a2');
    s = s.replace(a2, `	-- 서버 — 베놈 상태 갱신(베놈 버스트 시전·독무 틱). 기준 대미지는 큰 쪽, 끝나는 시각은 늦은 쪽으로
	@ExecSpace("ServerOnly")
	method void MarkVenom(number damage, number seconds)
		if self._dead then return end
		if damage > self._venomDamage then self._venomDamage = damage end
		local untilT = _UtilLogic.ElapsedSeconds + seconds
		if untilT > self._venomUntil then self._venomUntil = untilT end
	end

` + a2);
    const a3 = '\t\t-- 포이즌 미스트(카드226) 표식이 붙은 채로 죽으면 그 자리에 독무가 생긴다(위치·크기·깊이는 지금 값으로 캡처)\n';
    if (count(s, a3) !== 1) throw new Error('mai a3');
    s = s.replace(a3, `		-- 베놈 버스트(카드240) 상태로 죽으면 그 자리에 독무(틱당 50%, 연쇄 없음)
		if self._venomDamage > 0 and _UtilLogic.ElapsedSeconds < self._venomUntil then
			local venomPos = _CardManager:WorldToCurrentMapLocal(self.Entity.TransformComponent.WorldPosition)
			_CardManager:SpawnVenomDeathMist(venomPos, self._venomDamage, _CardManager:GetEffectScaleRatio(self), _CardManager:GetDepthBand(self), self._spawnZoneIndex)
		end
		self._venomDamage = 0
		self._venomUntil = 0
` + a3);
    fs.writeFileSync(p, s, 'utf8');
    console.log('MonsterAI OK');
  }
}

const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
if (src.includes('@Sync property integer VenomBurstLevel')) { console.log('already applied'); process.exit(0); }
function after(anchorLine, add, expected = 1) {
  const needle = anchorLine + NL; const c = count(src, needle);
  if (c !== expected) throw new Error(`anchor ${c} != ${expected}: ${anchorLine}`);
  src = src.split(needle).join(needle + add + NL);
}
function before(anchor, add) { const c = count(src, anchor); if (c !== 1) throw new Error(`before ${c}: ${anchor.slice(0, 70)}`); src = src.replace(anchor, add + NL + anchor); }
function rep(a, b) { const c = count(src, a); if (c !== 1) throw new Error(`rep ${c}: ${a.slice(0, 70)}`); src = src.replace(a, b); }

// 독무 공용화
rep('\t@ExecSpace("ServerOnly")\n\tmethod void SpawnPoisonMist(Vector3 pos, number damage, number ratio, boolean band, integer zoneIndex)\n',
`	@ExecSpace("ServerOnly")
	method void SpawnPoisonMist(Vector3 pos, number damage, number ratio, boolean band, integer zoneIndex)
		-- 포이즌 미스트(226) 표식 사망 독무 — 공용 독무(틱당 Card226MistRatio)
		self:SpawnPoisonMistEx(pos, damage, ratio, band, zoneIndex, 226, self.Card226MistRatio, false)
	end

	-- 공용 독무 — cardTag: DPS 미터 카드 번호 / mistRatio: 틱당 기준 대미지 비율 / markVenom: 틱에 맞은 몬스터를 베놈 상태로(베놈 버스트 1차 독무만)
	@ExecSpace("ServerOnly")
	method void SpawnPoisonMistEx(Vector3 pos, number damage, number ratio, boolean band, integer zoneIndex, integer cardTag, number mistRatio, boolean markVenom)
`);
rep('\t\tlocal tickDamage = damage * self.Card226MistRatio * self:GetElementalDrainMult()\n', '\t\tlocal tickDamage = damage * mistRatio * self:GetElementalDrainMult()\n');
rep('\t\t\t\t\t\t\t_DpsMeterLogic:Tag(226, m):TakeDamage(tickDamage)\n\t\t\t\t\t\t\t-- 독무 안에 있는 동안은 중독 상태(다음 틱까지 + 여유) — 포이즌 트랩(227) 타겟 조건\n\t\t\t\t\t\t\tif not m._dead then m:MarkPoisoned(self.Card226MistTickInterval + 0.2) end\n',
'\t\t\t\t\t\t\t-- 베놈 표시는 대미지보다 먼저 — 이 틱에 바로 죽어도 사망 독무가 나가야 한다\n\t\t\t\t\t\t\tif markVenom then m:MarkVenom(damage, self.Card240MarkDuration) end\n\t\t\t\t\t\t\t_DpsMeterLogic:Tag(cardTag, m):TakeDamage(tickDamage)\n\t\t\t\t\t\t\t-- 독무 안에 있는 동안은 중독 상태(다음 틱까지 + 여유) — 포이즌 트랩(227) 타겟 조건\n\t\t\t\t\t\t\tif not m._dead then m:MarkPoisoned(self.Card226MistTickInterval + 0.2) end\n');
rep('\t\t\t\tlog("PoisonMistTick: #" .. thisTick .. " hit=" .. hitCount .. " dmg=" .. math.floor(tickDamage))\n',
'\t\t\t\tlog("PoisonMistTick: card=" .. cardTag .. " #" .. thisTick .. " hit=" .. hitCount .. " dmg=" .. math.floor(tickDamage))\n');

const block = `	-- ── 베노아 조합: 베놈 버스트(카드240) — 유저 지정 2026-10-03 ──
	-- 포이즌 미스트(226) Lv5 + 엘리멘탈 드레인(233) + 매직 가드(234) + 엘리멘탈 어뎁팅(236) 보유 시 선택지에 뜨고, 해금되면
	-- 포이즌 미스트 슬롯을 그대로 넘겨받는다. 3레벨까지. 200/220/240, 쿨 6초, 타겟 2명.
	-- 타겟마다 포이즌 미스트 타격 연출(a5c78ee8) + 그 범위 대미지 → 그 자리에 포이즌 미스트 독무(연출 동일) 3초, 틱당 100%.
	-- 시전/독무에 맞은 몬스터는 3초 동안 베놈 상태 — 그 사이 죽으면 그 자리에 독무 3초, 틱당 50%(사망 독무는 베놈을 다시 걸지 않음 = 연쇄 없음)
	@Sync property integer VenomBurstLevel = 0
	property number Card240Cooldown = 6.0
	property integer Card240TargetCount = 2
	property number Card240HitHalfW = 1.0  -- 시전 타격 범위 타원(발밑 기준, 1배) — 타격 연출 크기에 맞춤
	property number Card240HitHalfH = 0.6
	property number Card240MistRatio = 1.0  -- 시전 독무 틱당 100%
	property number Card240DeathMistRatio = 0.5  -- 사망 독무 틱당 50%
	property number Card240MarkDuration = 3.0
	property number Card240ShotInterval = 0.1

	method number GetVenomBurstDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 200/220/240
		if level >= 3 then return 240
		elseif level >= 2 then return 220
		end
		return 200
	end

	@ExecSpace("ServerOnly")
	method void VenomBurstAttack(number damage, boolean isCrit)
		-- 베놈 버스트 시전 — 가까운 2명 자리마다 타격 + 독무
		local map = self:GetCurrentMap()
		if map == nil then return end
		self:PlayBreathSfx(self.Card226UseSoundRUID)
		local targets = self:GetClosestTargets(self.Card240TargetCount)
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
					self:CastVenomBurst(map, tp, ratio, band, damage, isCrit, castZoneIndex)
				end, (shotIndex - 1) * self.Card240ShotInterval)
			end
		end
		log("VenomBurstAttack: lv=" .. self.VenomBurstLevel .. " targets=" .. #targets .. " dmg=" .. math.floor(damage))
	end

	@ExecSpace("ServerOnly")
	method void CastVenomBurst(Entity map, Vector3 tp, number ratio, boolean band, number damage, boolean isCrit, integer castZoneIndex)
		-- 1곳 — 포이즌 미스트 타격 연출 + 범위 대미지(맞은 몬스터 베놈 상태) → 같은 자리에 독무
		local center = Vector3(tp.x, tp.y + self.Card226BodyYOffset * ratio, tp.z)
		local fx = self:SpawnEffect(self.Card226HitRUID, center, 0, 1.0, self.Card226HitScale * ratio, 1)
		if fx ~= nil then fx:Destroy(self.Card226HitLifetime) end
		local halfW = self.Card240HitHalfW * ratio
		local halfH = self.Card240HitHalfH * ratio
		local hitCount = 0
		for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
			---@type MonsterAI
			local m = mob
			if isvalid(m) and isvalid(m.Entity) and not m._dead then
				local mp = m.Entity.TransformComponent.Position
				if self:InEllipse(mp.x - tp.x, mp.y - tp.y, halfW, halfH) and self:IsInDepthBand(m, band) then
					hitCount = hitCount + 1
					-- 베놈 표시를 대미지보다 먼저 — 이번 타격에 바로 죽어도 사망 독무가 나가야 한다
					m:MarkVenom(damage, self.Card240MarkDuration)
					if isCrit then _DpsMeterLogic:Tag(240, m):TakeDamageCrit(damage * 2)
					else _DpsMeterLogic:Tag(240, m):TakeDamage(damage) end
				end
			end
		end
		self:SpawnPoisonMistEx(tp, damage, ratio, band, castZoneIndex, 240, self.Card240MistRatio, true)
		log("VenomBurstHit: hit=" .. hitCount .. " dmg=" .. math.floor(isCrit and damage * 2 or damage))
	end

	-- 베놈 상태 몬스터가 죽은 자리 독무 — MonsterAI.Die가 부른다(틱당 50%, 베놈 재부여 없음)
	@ExecSpace("ServerOnly")
	method void SpawnVenomDeathMist(Vector3 pos, number damage, number ratio, boolean band, integer zoneIndex)
		self:SpawnPoisonMistEx(pos, damage, ratio, band, zoneIndex, 240, self.Card240DeathMistRatio, false)
		log("VenomDeathMist: dmg=" .. math.floor(damage) .. " ratio=" .. self.Card240DeathMistRatio)
	end
`;
before('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

after('\t\tif cardIdx == 239 then return self.SolarFlareLevel > 0 end', '\t\tif cardIdx == 240 then return self.VenomBurstLevel > 0 end');
after('\t\telseif cardIdx == 239 then base = self:GetSolarFlareDamage(self.SolarFlareLevel)', '\t\telseif cardIdx == 240 then base = self:GetVenomBurstDamage(self.VenomBurstLevel)');
after('\t\telseif cardIdx == 239 then return self.Card239Cooldown', '\t\telseif cardIdx == 240 then return self.Card240Cooldown');
after('\t\telseif cardIdx == 239 then return "solarflare_up"', '\t\telseif cardIdx == 240 then return "venomburst_up"', 2);
after('\t\telseif cardIdx == 239 then self.SolarFlareLevel = 1', '\t\telseif cardIdx == 240 then self.VenomBurstLevel = 1');
after('\t\telseif cardIdx == 239 then return self.SolarFlareLevel', '\t\telseif cardIdx == 240 then return self.VenomBurstLevel');
after('\t\telseif cardIdx == 239 then self.SolarFlareLevel = level', '\t\telseif cardIdx == 240 then self.VenomBurstLevel = level');
after('\t\telseif name == "SolarFlareLevel" then self:RefreshSlotIfHoldsCard(239)', '\t\telseif name == "VenomBurstLevel" then self:RefreshSlotIfHoldsCard(240)');
after('\t\t\t\t\tif not self:SolarFlareAttack(damage, isCrit) then skipCooldownReset = true end', '\t\t\t\telseif cardIndex == 240 then\n\t\t\t\t\tself:VenomBurstAttack(damage, isCrit)');

before(`		elseif cardIdx == 239 then
			return {`,
`		elseif cardIdx == 240 then
			return {
				"MLUA_CARDMANAGER_606",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_125",
			}`);
before(`		elseif cardIdx == 239 then
			extraStr = `,
`		elseif cardIdx == 240 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_122", self.Card240TargetCount, math.floor(self.Card226MistDuration + 0.5), math.floor(self.Card240MistRatio * 100 + 0.5), math.floor(self.Card240DeathMistRatio * 100 + 0.5))`);

const pm = `			if self.PoisonMistLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 226, type = "unlock" }) end
			elseif self.PoisonMistLevel < 5 then
				table.insert(pool, { card = 226, type = "poisonmist_up" })
			end
`;
if (count(src, pm) !== 1) throw new Error('poison mist choice anchor');
src = src.replace(pm, `			-- 포이즌 미스트(226) — 베놈 버스트로 조합된 뒤에는 더 이상 등장하지 않음
			if self.VenomBurstLevel == 0 then
				if self.PoisonMistLevel == 0 then
					if hasEmptySlot then table.insert(pool, { card = 226, type = "unlock" }) end
				elseif self.PoisonMistLevel < 5 then
					table.insert(pool, { card = 226, type = "poisonmist_up" })
				end
			end
			-- 베놈 버스트(240, 조합) — 포이즌 미스트 Lv5 + 엘리멘탈 드레인(233) + 매직 가드(234) + 엘리멘탈 어뎁팅(236). 포이즌 미스트 슬롯 승계
			if self.PoisonMistLevel >= 5 and self:IsCardUnlocked(233) and self:IsCardUnlocked(234) and self:IsCardUnlocked(236) and self.VenomBurstLevel == 0 then
				table.insert(pool, { card = 240, type = "unlock" })
			elseif self.VenomBurstLevel > 0 and self.VenomBurstLevel < 3 then
				table.insert(pool, { card = 240, type = "venomburst_up" })
			end
`);

before(`		if cardIdx == 239 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.SolarFlareLevel + 1)`,
`		if cardIdx == 240 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.VenomBurstLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(240)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(240))
			return
		end
`);

before('\t\t-- SolarFlare(베노아 조합',
`		-- VenomBurst(베노아 조합 — 포이즌 미스트 슬롯을 그대로 넘겨받는다)
		if cardIdx == 240 then
			if upgradeType == "unlock" then
				self.VenomBurstLevel = 1
				local mistSlot = self:GetSlotForCard(226)
				if mistSlot > 0 then
					self:AssignCardToSlot(mistSlot, 240)
					self:ResetSlotTimer(mistSlot)
					self:PlayThunderStormFusionEffect(mistSlot)
					log("Card240(VenomBurst) fused into Slot" .. mistSlot .. " (was PoisonMist)")
				else
					log_warning("VenomBurst: PoisonMist not found in any slot — fusion could not place the card")
				end
			elseif upgradeType == "venomburst_up" and self.VenomBurstLevel < 3 then
				self.VenomBurstLevel = self.VenomBurstLevel + 1
			end
			log("VenomBurst L" .. self.VenomBurstLevel .. " (dmg=" .. math.floor(self:GetVenomBurstDamage(self.VenomBurstLevel)) .. ")")
			return
		end
`);

rep('\t\t\tif self:IsCardUnlocked(226) and self.PoisonMistLevel < 5 then table.insert(pool, 226) end',
'\t\t\tif self:IsCardUnlocked(226) and self.PoisonMistLevel < 5 and self.VenomBurstLevel == 0 then table.insert(pool, 226) end\n\t\t\tif self:IsCardUnlocked(240) and self.VenomBurstLevel < 3 then table.insert(pool, 240) end');
after('\t\tself.SolarFlareLevel = 0', '\t\tself.VenomBurstLevel = 0');

// 솔라 플레어 첫 연출 0.4 위로(유저 지정 2026-10-03)
rep('\tproperty number Card239EffectYOffset = 0.0\n', '\tproperty number Card239EffectYOffset = 0.4  -- 유저 지정 2026-10-03 "첫 연출 위로 0.4"\n');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
