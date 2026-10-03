// 베노아 카드228(이그나이트)을 CardManager.mlua 의 각 연결 지점에 삽입한다(카드227 줄을 앵커로 씀).
// 재실행 안전: 이미 "IgniteLevel" 프로퍼티가 있으면 아무것도 안 한다.
const fs = require('fs');
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
const NL = '\n';
if (src.includes('@Sync property integer IgniteLevel')) { console.log('already applied'); process.exit(0); }

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

const block = `	-- ── 베노아: 이그나이트(카드228) — 유저 지정 2026-10-03 ──
	-- 80/100/120/150/180, 쿨 5초, 타겟 1/1/2/2/2. 타겟마다 불꽃 띠(유저 지정 클립 cb8af58d)가 깔리는데, 불꽃이 기준점 쪽에서
	-- 바깥으로 차례로 솟아오르므로 대미지도 그 순서대로 들어간다(유저 지정 "연출이 순차적으로 올라오니 대미지도 그렇게").
	-- 띠는 타겟을 가운데에 두고 플레이어 쪽 끝에서 바깥쪽으로 번진다. 맞은 몬스터는 타격 연출(skill/2100010 hit/0) + 화상 100%(3초, 틱당 50%).
	-- 클립 실측: 첫 프레임 0.6초 빈 그림 → 15프레임 × 0.06초. 그림 548x416px, 기준점(476,28) = 오른쪽 아래 끝(원작 캐릭터 자리, 왼쪽으로 번짐)
	@Sync property integer IgniteLevel = 0
	property number Card228Cooldown = 5.0
	property string Card228FlameRUID = "cb8af58ded2d47bfaaf6c149931dca0b"
	property string Card228HitRUID = "8241b88b21fb4e638ed9bfc3824d866f"  -- 6프레임 0.72초
	property string Card228SoundRUID = "571d4dbbba8c46b7b6d8ca25a3102add"
	property number Card228FlameScale = 0.45
	property number Card228FlameLength = 4.76  -- 기준점에서 그림 반대쪽 끝까지(1배, 유닛) — 이 길이를 기준으로 띠를 타겟 가운데에 둔다
	property number Card228FlameLifetime = 1.5
	property number Card228FlameYOffset = -0.05  -- 기준점(그림 바닥)을 발밑보다 살짝 아래로
	property number Card228SweepStart = 0.6  -- 빈 첫 프레임이 끝나고 불꽃이 처음 솟는 시점
	property number Card228SweepDuration = 0.36  -- 불꽃이 띠 끝까지 번지는 데 걸리는 시간(프레임 2~8)
	property number Card228SweepTick = 0.03
	property number Card228HalfH = 0.45  -- 띠 판정 세로 반폭(발밑 기준, 1배)
	property number Card228HitScale = 1.0
	property number Card228HitLifetime = 0.72
	property number Card228HitYOffset = 0.3
	property number Card228BurnRatio = 0.5
	property integer Card228BurnSeconds = 3
	property boolean Card228FlipDefault = true  -- 원본은 왼쪽으로 번짐 — 오른쪽으로 번질 때 FlipX
	property number Card228ShotInterval = 0.1

	method number GetIgniteDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 80/100/120/150/180
		if level >= 5 then return 180
		elseif level >= 4 then return 150
		elseif level >= 3 then return 120
		elseif level >= 2 then return 100
		end
		return 80
	end

	method integer GetIgniteTargetCount(integer level)
		-- 타겟 수 — Lv1~2:1 / Lv3~5:2
		if level >= 3 then return 2 end
		return 1
	end

	@ExecSpace("ServerOnly")
	method void IgniteAttack(number damage, boolean isCrit)
		-- 이그나이트 시전 — 타겟마다 불꽃 띠 1개
		local map = self:GetCurrentMap()
		if map == nil then return end
		self:PlayBreathSfx(self.Card228SoundRUID)
		local targets = self:GetClosestTargets(self:GetIgniteTargetCount(self.IgniteLevel))
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
					self:CastIgniteStrip(map, tp, ratio, band, damage, isCrit, castZoneIndex)
				end, (shotIndex - 1) * self.Card228ShotInterval)
			end
		end
		log("IgniteAttack: lv=" .. self.IgniteLevel .. " targets=" .. #targets .. " dmg=" .. math.floor(damage))
	end

	@ExecSpace("ServerOnly")
	method void CastIgniteStrip(Entity map, Vector3 tp, number ratio, boolean band, number damage, boolean isCrit, integer castZoneIndex)
		-- 불꽃 띠 1개 — 타겟(tp, 발밑)을 띠 가운데에 두고 플레이어 쪽 끝(기준점)에서 바깥쪽으로 번진다.
		-- 번지는 앞머리를 매 틱 따라가며, 앞머리가 지나간 띠 안의 몬스터를 한 번씩 때린다
		local side = self:GetBenoaSideSign(tp.x)  -- 플레이어가 있는 쪽(-1 왼쪽 / 1 오른쪽)
		local dir = -side  -- 번지는 방향 = 플레이어 반대쪽
		local scale = self.Card228FlameScale * ratio
		local len = self.Card228FlameLength * scale
		local startX = tp.x - dir * len * 0.5
		local baseY = tp.y + self.Card228FlameYOffset * ratio
		local fx = self:SpawnEffectWithModel(self.Card228FlameRUID, Vector3(startX, baseY, tp.z), 0, 1.0, scale, 1, "skilleffectlong")
		if fx ~= nil then
			local renderer = fx.SpriteRendererComponent
			if renderer ~= nil then
				if dir > 0 then renderer.FlipX = self.Card228FlipDefault else renderer.FlipX = not self.Card228FlipDefault end
			end
			fx:Destroy(self.Card228FlameLifetime)
		end
		local halfH = self.Card228HalfH * ratio
		local hitSet = {}
		local hitCount = 0
		local elapsed = 0
		local tickId = 0
		local burnPerTick = damage * self.Card228BurnRatio
		tickId = _TimerService:SetTimerRepeat(function()
			if not isvalid(self) then _TimerService:ClearTimer(tickId) return end
			elapsed = elapsed + self.Card228SweepTick
			if castZoneIndex ~= _MapManager.CurrentMapIndex then _TimerService:ClearTimer(tickId) return end
			local sweepT = (elapsed - self.Card228SweepStart) / self.Card228SweepDuration
			if sweepT < 0 then return end
			if sweepT > 1 then sweepT = 1 end
			local frontDist = len * sweepT
			for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead and hitSet[m] == nil then
					local mp = m.Entity.TransformComponent.Position
					local along = (mp.x - startX) * dir
					if along >= -0.15 * scale and along <= frontDist and math.abs(mp.y - tp.y) <= halfH and self:IsInDepthBand(m, band) then
						hitSet[m] = true
						hitCount = hitCount + 1
						local mr = self:GetEffectScaleRatio(m)
						local hfx = self:SpawnEffect(self.Card228HitRUID, Vector3(mp.x, mp.y + self.Card228HitYOffset * mr, mp.z), 0, 1.0, self.Card228HitScale * mr, 1)
						if hfx ~= nil then hfx:Destroy(self.Card228HitLifetime) end
						if isCrit then _DpsMeterLogic:Tag(228, m):TakeDamageCrit(damage * 2)
						else _DpsMeterLogic:Tag(228, m):TakeDamage(damage) end
						-- 화상 100% — 1초마다 기준 대미지(치명타 전)의 50%
						if not m._dead then m:ApplyDot(burnPerTick, self.Card228BurnSeconds, 1.0) end
					end
				end
			end
			if sweepT >= 1 then
				_TimerService:ClearTimer(tickId)
				log("IgniteStrip: hit=" .. hitCount .. " len=" .. string.format("%.2f", len) .. " dir=" .. dir .. " burn=" .. math.floor(burnPerTick) .. "x" .. self.Card228BurnSeconds)
			end
		end, self.Card228SweepTick)
	end
`;
insertBefore('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

insertAfterLine('\t\tif cardIdx == 227 then return self.PoisonTrapLevel > 0 end',
'\t\tif cardIdx == 228 then return self.IgniteLevel > 0 end');
insertAfterLine('\t\telseif cardIdx == 227 then base = self:GetPoisonTrapDamage(self.PoisonTrapLevel)',
'\t\telseif cardIdx == 228 then base = self:GetIgniteDamage(self.IgniteLevel)');
insertAfterLine('\t\telseif cardIdx == 227 then return self.Card227Cooldown',
'\t\telseif cardIdx == 228 then return self.Card228Cooldown');
insertAfterLine('\t\telseif cardIdx == 227 then return "poisontrap_up"',
'\t\telseif cardIdx == 228 then return "ignite_up"', 2);
insertAfterLine('\t\telseif cardIdx == 227 then self.PoisonTrapLevel = 1',
'\t\telseif cardIdx == 228 then self.IgniteLevel = 1');
insertAfterLine('\t\telseif cardIdx == 227 then return self.PoisonTrapLevel',
'\t\telseif cardIdx == 228 then return self.IgniteLevel');
insertAfterLine('\t\telseif cardIdx == 227 then self.PoisonTrapLevel = level',
'\t\telseif cardIdx == 228 then self.IgniteLevel = level');
insertAfterLine('\t\telseif name == "PoisonTrapLevel" then self:RefreshSlotIfHoldsCard(227)',
'\t\telseif name == "IgniteLevel" then self:RefreshSlotIfHoldsCard(228)');
insertAfterLine('\t\t\t\t\tif not self:PoisonTrapAttack(damage, isCrit) then skipCooldownReset = true end',
`				elseif cardIndex == 228 then
					self:IgniteAttack(damage, isCrit)`);

insertBefore(`		elseif cardIdx == 227 then
			return {`,
`		elseif cardIdx == 228 then
			return {
				"MLUA_CARDMANAGER_592",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_180",
				"MLUA_CARDMANAGER_181",
				"MLUA_CARDMANAGER_181",
			}`);

insertBefore(`		elseif cardIdx == 227 then
			extraStr = `,
`		elseif cardIdx == 228 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_110", self:GetIgniteTargetCount(self.IgniteLevel), self.Card228BurnSeconds, math.floor(self.Card228BurnRatio * 100 + 0.5))`);

const lvAnchor = `			elseif self.PoisonTrapLevel < 5 then
				table.insert(pool, { card = 227, type = "poisontrap_up" })
			end
`;
if (count(src, lvAnchor) !== 1) throw new Error('levelup anchor');
src = src.replace(lvAnchor, lvAnchor + `			if self.IgniteLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 228, type = "unlock" }) end
			elseif self.IgniteLevel < 5 then
				table.insert(pool, { card = 228, type = "ignite_up" })
			end
`);

insertBefore(`		if cardIdx == 227 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.PoisonTrapLevel + 1)`,
`		if cardIdx == 228 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.IgniteLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(228)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(228))
			return
		end
`);

insertBefore('\t\t-- PoisonTrap(베노아 전용, 슬롯형 액티브)',
`		-- Ignite(베노아 전용, 슬롯형 액티브)
		if cardIdx == 228 then
			if upgradeType == "unlock" then
				self.IgniteLevel = 1
				local slotIdx = self:GetNextEmptySlot()
				if slotIdx > 0 then
					self:AssignCardToSlot(slotIdx, 228)
					self:ResetSlotTimer(slotIdx)
					log("Card228(Ignite) -> Slot" .. slotIdx)
				end
			elseif upgradeType == "ignite_up" and self.IgniteLevel < 5 then
				self.IgniteLevel = self.IgniteLevel + 1
			end
			log("Ignite L" .. self.IgniteLevel .. " (dmg=" .. math.floor(self:GetIgniteDamage(self.IgniteLevel)) .. " targets=" .. self:GetIgniteTargetCount(self.IgniteLevel) .. ")")
			return
		end
`);

insertAfterLine('\t\t\tif self:IsCardUnlocked(227) and self.PoisonTrapLevel < 5 then table.insert(pool, 227) end',
'\t\t\tif self:IsCardUnlocked(228) and self.IgniteLevel < 5 then table.insert(pool, 228) end');
insertAfterLine('\t\tself.PoisonTrapLevel = 0',
'\t\tself.IgniteLevel = 0');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
