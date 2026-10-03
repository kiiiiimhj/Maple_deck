// 베노아 카드229(포이즌 버스트)을 CardManager.mlua 의 각 연결 지점에 삽입한다(카드228 줄을 앵커로 씀).
// 재실행 안전: 이미 "PoisonBurstLevel" 프로퍼티가 있으면 아무것도 안 한다.
const fs = require('fs');
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
const NL = '\n';
if (src.includes('@Sync property integer PoisonBurstLevel')) { console.log('already applied'); process.exit(0); }

function count(hay, needle) { let n = 0, i = 0; while ((i = hay.indexOf(needle, i)) >= 0) { n++; i += needle.length; } return n; }
function insertAfterLine(anchorLine, add, expected = 1) {
  const needle = anchorLine + NL;
  const c = count(src, needle);
  if (c !== expected) throw new Error(`anchor count ${c} != ${expected}: ${anchorLine}`);
  src = src.split(needle).join(needle + add + NL);
}
function insertBefore(anchor, add) {
  const c = count(src, anchor);
  if (c !== 1) throw new Error(`anchor count ${c} != 1: ${anchor.slice(0, 80)}`);
  src = src.replace(anchor, add + NL + anchor);
}

const block = `	-- ── 베노아: 포이즌 버스트(카드229) — 유저 지정 2026-10-03 ──
	-- 100/120/140/160/180, 쿨 5초, 타겟 1/1/2/2/2. 타겟(몹) 중앙에 독 폭발(猛毒爆裂 팩 hit/1 = 05a16838, 유저 지정)이 뜨고,
	-- 그 연출 범위(타원) 안 몬스터 전부를 2번 때린다(각 기준 대미지의 50%). 맞을 때마다 중독 100%(2초, 1초마다 30%).
	-- 중독은 포이즌 트랩(227) 대상 조건(MarkPoisoned)도 갱신한다. 맞은 몬스터마다 같은 팩 hit/0을 작게 띄운다.
	-- 클립 실측: hit/1 9프레임 0.81초, 약 364x336px 가운데 피벗 / hit/0 9프레임 0.81초(첫 프레임 빈 그림), 약 232px
	@Sync property integer PoisonBurstLevel = 0
	property number Card229Cooldown = 5.0
	property string Card229BurstRUID = "05a16838b67f41f5a6a1e88ea86c1630"
	property string Card229HitRUID = "184e2d63e2e64864b20c6a402be410f7"
	property string Card229UseSoundRUID = "b3028cd6eb8f48e68ee9ac3ddb14df32"
	property string Card229HitSound1RUID = "324b142a94fb46b59aefe8f523efae13"
	property string Card229HitSound2RUID = "113886ee859c4542ae1eec3304b59547"
	property number Card229BurstScale = 0.5
	property number Card229BurstLifetime = 0.81
	property number Card229BodyYOffset = 0.5  -- 몹 중앙 = 발밑 + 이 값
	-- 폭발 범위 판정(반축, 1배 기준) — 0.5배 그림이 약 1.7유닛
	property number Card229HalfW = 0.8
	property number Card229HalfH = 0.5
	property number Card229Hit1Delay = 0.18  -- 폭발이 크게 퍼지는 프레임(2~3번째)
	property number Card229Hit2Delay = 0.45
	property number Card229HitPercent = 0.5  -- 타당 기준 대미지 비율(유저 표 50%, 50%)
	property number Card229HitScale = 0.4
	property number Card229HitLifetime = 0.81
	property number Card229PoisonRatio = 0.3
	property integer Card229PoisonSeconds = 2
	property number Card229ShotInterval = 0.1

	method number GetPoisonBurstDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 100/120/140/160/180
		if level >= 5 then return 180
		elseif level >= 4 then return 160
		elseif level >= 3 then return 140
		elseif level >= 2 then return 120
		end
		return 100
	end

	method integer GetPoisonBurstTargetCount(integer level)
		-- 타겟 수 — Lv1~2:1 / Lv3~5:2
		if level >= 3 then return 2 end
		return 1
	end

	@ExecSpace("ServerOnly")
	method void PoisonBurstAttack(number damage, boolean isCrit)
		-- 포이즌 버스트 시전 — 타겟마다 몹 중앙에 독 폭발 1개, 범위 2타
		local map = self:GetCurrentMap()
		if map == nil then return end
		self:PlayBreathSfx(self.Card229UseSoundRUID)
		local targets = self:GetClosestTargets(self:GetPoisonBurstTargetCount(self.PoisonBurstLevel))
		for shotIndex, mob in ipairs(targets) do
			---@type MonsterAI
			local target = mob
			if isvalid(target) and isvalid(target.Entity) then
				local ratio = self:GetEffectScaleRatio(target)
				local tp = self:WorldToCurrentMapLocal(target.Entity.TransformComponent.WorldPosition)
				local band = self:GetDepthBand(target)
				local castZoneIndex = target._spawnZoneIndex
				local delay = (shotIndex - 1) * self.Card229ShotInterval
				_TimerService:SetTimerOnce(function()
					if not isvalid(self) then return end
					if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
					local center = Vector3(tp.x, tp.y + self.Card229BodyYOffset * ratio, tp.z)
					local fx = self:SpawnEffect(self.Card229BurstRUID, center, 0, 1.0, self.Card229BurstScale * ratio, 1)
					if fx ~= nil then fx:Destroy(self.Card229BurstLifetime) end
					for hitNo = 1, 2 do
						local thisHit = hitNo
						local hitDelay = self.Card229Hit1Delay
						if thisHit == 2 then hitDelay = self.Card229Hit2Delay end
						_TimerService:SetTimerOnce(function()
							if not isvalid(self) then return end
							if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
							self:ResolvePoisonBurstHit(map, tp, ratio, band, damage, isCrit, thisHit)
						end, hitDelay)
					end
				end, delay)
			end
		end
		log("PoisonBurstAttack: lv=" .. self.PoisonBurstLevel .. " targets=" .. #targets .. " dmg=" .. math.floor(damage))
	end

	@ExecSpace("ServerOnly")
	method void ResolvePoisonBurstHit(Entity map, Vector3 tp, number ratio, boolean band, number damage, boolean isCrit, integer hitNo)
		-- 독 폭발 1타 — 범위(타원, 중심 = 몹 발밑) 안 같은 깊이 구간 몬스터 전부에게 기준 대미지의 50% + 중독
		if hitNo == 1 then self:PlayBreathSfx(self.Card229HitSound1RUID) else self:PlayBreathSfx(self.Card229HitSound2RUID) end
		local halfW = self.Card229HalfW * ratio
		local halfH = self.Card229HalfH * ratio
		local hitDamage = damage * self.Card229HitPercent
		local poisonPerTick = damage * self.Card229PoisonRatio
		local hitCount = 0
		for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
			---@type MonsterAI
			local m = mob
			if isvalid(m) and isvalid(m.Entity) and not m._dead then
				local mp = m.Entity.TransformComponent.Position
				if self:InEllipse(mp.x - tp.x, mp.y - tp.y, halfW, halfH) and self:IsInDepthBand(m, band) then
					hitCount = hitCount + 1
					local mr = self:GetEffectScaleRatio(m)
					local hfx = self:SpawnEffect(self.Card229HitRUID, Vector3(mp.x, mp.y + self.Card229BodyYOffset * mr, mp.z), 0, 1.0, self.Card229HitScale * mr, 1)
					if hfx ~= nil then hfx:Destroy(self.Card229HitLifetime) end
					if isCrit then _DpsMeterLogic:Tag(229, m):TakeDamageCrit(hitDamage * 2)
					else _DpsMeterLogic:Tag(229, m):TakeDamage(hitDamage) end
					if not m._dead then
						-- 중독 100% — 1초마다 기준 대미지(치명타 전)의 30%. 포이즌 트랩(227) 대상 조건도 갱신
						m:ApplyDot(poisonPerTick, self.Card229PoisonSeconds, 1.0)
						m:MarkPoisoned(self.Card229PoisonSeconds)
					end
				end
			end
		end
		log("PoisonBurstHit: #" .. hitNo .. " hit=" .. hitCount .. " dmg=" .. math.floor(isCrit and hitDamage * 2 or hitDamage) .. " poison=" .. math.floor(poisonPerTick) .. "x" .. self.Card229PoisonSeconds)
	end
`;
insertBefore('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

insertAfterLine('\t\tif cardIdx == 228 then return self.IgniteLevel > 0 end',
'\t\tif cardIdx == 229 then return self.PoisonBurstLevel > 0 end');
insertAfterLine('\t\telseif cardIdx == 228 then base = self:GetIgniteDamage(self.IgniteLevel)',
'\t\telseif cardIdx == 229 then base = self:GetPoisonBurstDamage(self.PoisonBurstLevel)');
insertAfterLine('\t\telseif cardIdx == 228 then return self.Card228Cooldown',
'\t\telseif cardIdx == 229 then return self.Card229Cooldown');
insertAfterLine('\t\telseif cardIdx == 228 then return "ignite_up"',
'\t\telseif cardIdx == 229 then return "poisonburst_up"', 2);
insertAfterLine('\t\telseif cardIdx == 228 then self.IgniteLevel = 1',
'\t\telseif cardIdx == 229 then self.PoisonBurstLevel = 1');
insertAfterLine('\t\telseif cardIdx == 228 then return self.IgniteLevel',
'\t\telseif cardIdx == 229 then return self.PoisonBurstLevel');
insertAfterLine('\t\telseif cardIdx == 228 then self.IgniteLevel = level',
'\t\telseif cardIdx == 229 then self.PoisonBurstLevel = level');
insertAfterLine('\t\telseif name == "IgniteLevel" then self:RefreshSlotIfHoldsCard(228)',
'\t\telseif name == "PoisonBurstLevel" then self:RefreshSlotIfHoldsCard(229)');
insertAfterLine('\t\t\t\t\tself:IgniteAttack(damage, isCrit)',
`				elseif cardIndex == 229 then
					self:PoisonBurstAttack(damage, isCrit)`);

insertBefore(`		elseif cardIdx == 228 then
			return {`,
`		elseif cardIdx == 229 then
			return {
				"MLUA_CARDMANAGER_593",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_180",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_125",
			}`);

insertBefore(`		elseif cardIdx == 228 then
			extraStr = `,
`		elseif cardIdx == 229 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_118", self:GetPoisonBurstTargetCount(self.PoisonBurstLevel), math.floor(self.Card229HitPercent * 100 + 0.5), self.Card229PoisonSeconds, math.floor(self.Card229PoisonRatio * 100 + 0.5))`);

const lvAnchor = `			elseif self.IgniteLevel < 5 then
				table.insert(pool, { card = 228, type = "ignite_up" })
			end
`;
if (count(src, lvAnchor) !== 1) throw new Error('levelup anchor');
src = src.replace(lvAnchor, lvAnchor + `			if self.PoisonBurstLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 229, type = "unlock" }) end
			elseif self.PoisonBurstLevel < 5 then
				table.insert(pool, { card = 229, type = "poisonburst_up" })
			end
`);

insertBefore(`		if cardIdx == 228 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.IgniteLevel + 1)`,
`		if cardIdx == 229 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.PoisonBurstLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(229)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(229))
			return
		end
`);

insertBefore('\t\t-- Ignite(베노아 전용, 슬롯형 액티브)',
`		-- PoisonBurst(베노아 전용, 슬롯형 액티브)
		if cardIdx == 229 then
			if upgradeType == "unlock" then
				self.PoisonBurstLevel = 1
				local slotIdx = self:GetNextEmptySlot()
				if slotIdx > 0 then
					self:AssignCardToSlot(slotIdx, 229)
					self:ResetSlotTimer(slotIdx)
					log("Card229(PoisonBurst) -> Slot" .. slotIdx)
				end
			elseif upgradeType == "poisonburst_up" and self.PoisonBurstLevel < 5 then
				self.PoisonBurstLevel = self.PoisonBurstLevel + 1
			end
			log("PoisonBurst L" .. self.PoisonBurstLevel .. " (dmg=" .. math.floor(self:GetPoisonBurstDamage(self.PoisonBurstLevel)) .. " targets=" .. self:GetPoisonBurstTargetCount(self.PoisonBurstLevel) .. ")")
			return
		end
`);

insertAfterLine('\t\t\tif self:IsCardUnlocked(228) and self.IgniteLevel < 5 then table.insert(pool, 228) end',
'\t\t\tif self:IsCardUnlocked(229) and self.PoisonBurstLevel < 5 then table.insert(pool, 229) end');
insertAfterLine('\t\tself.IgniteLevel = 0',
'\t\tself.PoisonBurstLevel = 0');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
