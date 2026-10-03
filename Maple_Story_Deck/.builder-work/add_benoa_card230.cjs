// 베노아 카드230(블레이즈 샷)을 CardManager.mlua 의 각 연결 지점에 삽입한다(카드229 줄을 앵커로 씀).
// 재실행 안전: 이미 "BlazeShotLevel" 프로퍼티가 있으면 아무것도 안 한다.
const fs = require('fs');
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
const NL = '\n';
if (src.includes('@Sync property integer BlazeShotLevel')) { console.log('already applied'); process.exit(0); }

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

const block = `	-- ── 베노아: 블레이즈 샷(카드230) — 유저 지정 2026-10-03 ──
	-- 100/120/140/160/200, 쿨 6초, 타겟 1/1/2/2/2. 불덩이(팩 skill/400021004 shootobj b1)가 플레이어 쪽 위 대각선에서 타겟으로
	-- 떨어진다. 날아오는 길에 걸리는 몬스터를 관통하며 맞는 순서대로 기준 대미지의 100% → 50% → 25%(최대 3마리), 타겟에서 끝난다
	-- (유저 지정 "대각선에서 떨어져야 함, 관통, 타겟까지"). 맞으면 화상 100%(1초마다 기준 대미지의 50%, 지속은 유저 표에 없어 2초로 잡음).
	-- 클립 실측: b1 8프레임 0.72초 약 450x304px, 원본은 왼쪽으로 날아가는 그림 + 기준점(161,150)이 머리 쪽 /
	--   e1(착탄 폭발) 8프레임 0.75초 약 370px / hit/0 8프레임 0.24초
	@Sync property integer BlazeShotLevel = 0
	property number Card230Cooldown = 6.0
	property string Card230BallRUID = "01ff04d0222e4c4db8774904b53dc363"
	property string Card230ImpactRUID = "92fc0068a33d4bc8aaae5d671519ae5e"
	property string Card230HitRUID = "bdda404393594c7d8f4e05a029f141dc"
	property string Card230UseSoundRUID = "74a0158f76774dc19f19db3a9ca420ad"
	property string Card230HitSoundRUID = "a48ed9de073d4887849766bd6fcb9bcc"
	property string Card230ImpactSoundRUID = "502ff02d8c834fbfb7f4ca40c49e87c0"
	property number Card230BallScale = 0.35
	property number Card230StartDX = 4.0  -- 타겟에서 플레이어 쪽으로 출발점까지 가로 거리(1배)
	property number Card230StartDY = 1.6  -- 출발점 높이(타겟 몸통 기준, 1배) — 낮은 대각선이라 타겟 앞 몬스터도 관통한다
	property number Card230FlightDuration = 0.35
	property number Card230Tick = 0.03
	property number Card230BodyYOffset = 0.5  -- 몸통 = 발밑 + 이 값(불덩이가 노리는 높이)
	property number Card230HitRadiusX = 0.45  -- 불덩이 머리 판정 타원(1배)
	property number Card230HitRadiusY = 0.45
	property number Card230ImpactScale = 0.5
	property number Card230ImpactLifetime = 0.75
	property number Card230HitScale = 0.4
	property number Card230HitLifetime = 0.24
	property number Card230BurnRatio = 0.5
	property integer Card230BurnSeconds = 2
	property number Card230ShotInterval = 0.15

	method table GetBlazeShotPiercePercents()
		-- 관통 순서별 대미지 비율(유저 표) — 100% → 50% → 25%
		return { 1.0, 0.5, 0.25 }
	end

	method number GetBlazeShotDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 100/120/140/160/200
		if level >= 5 then return 200
		elseif level >= 4 then return 160
		elseif level >= 3 then return 140
		elseif level >= 2 then return 120
		end
		return 100
	end

	method integer GetBlazeShotTargetCount(integer level)
		-- 타겟 수 — Lv1~2:1 / Lv3~5:2
		if level >= 3 then return 2 end
		return 1
	end

	@ExecSpace("ServerOnly")
	method void BlazeShotAttack(number damage, boolean isCrit)
		-- 블레이즈 샷 시전 — 타겟마다 불덩이 1발
		local map = self:GetCurrentMap()
		if map == nil then return end
		self:PlayBreathSfx(self.Card230UseSoundRUID)
		local targets = self:GetClosestTargets(self:GetBlazeShotTargetCount(self.BlazeShotLevel))
		for shotIndex, mob in ipairs(targets) do
			---@type MonsterAI
			local target = mob
			if isvalid(target) and isvalid(target.Entity) then
				local castZoneIndex = target._spawnZoneIndex
				local capturedTarget = target
				_TimerService:SetTimerOnce(function()
					if not isvalid(self) then return end
					if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
					self:FireBlazeShot(map, capturedTarget, damage, isCrit, castZoneIndex)
				end, (shotIndex - 1) * self.Card230ShotInterval)
			end
		end
		log("BlazeShotAttack: lv=" .. self.BlazeShotLevel .. " targets=" .. #targets .. " dmg=" .. math.floor(damage))
	end

	@ExecSpace("ServerOnly")
	method void FireBlazeShot(Entity map, MonsterAI target, number damage, boolean isCrit, integer castZoneIndex)
		-- 불덩이 1발 — 플레이어 쪽 위에서 타겟 몸통까지 직선으로 떨어지며, 머리에 닿는 몬스터를 순서대로 관통한다
		if not isvalid(target) or not isvalid(target.Entity) then return end
		local ratio = self:GetEffectScaleRatio(target)
		local tp = self:WorldToCurrentMapLocal(target.Entity.TransformComponent.WorldPosition)
		local band = self:GetDepthBand(target)
		local side = self:GetBenoaSideSign(tp.x)  -- 플레이어 쪽(-1 왼쪽 / 1 오른쪽)
		local endPos = Vector3(tp.x, tp.y + self.Card230BodyYOffset * ratio, tp.z)
		local startPos = Vector3(tp.x + side * self.Card230StartDX * ratio, endPos.y + self.Card230StartDY * ratio, tp.z)
		local vx = endPos.x - startPos.x
		local vy = endPos.y - startPos.y
		local deg = math.deg(math.atan(vy, vx))
		-- 원본은 왼쪽을 보는 그림 — 오른쪽으로 날아가면 좌우 반전 후 진행 각도만큼, 왼쪽이면 (각도 - 180)만큼 돌린다
		local movingRight = (vx > 0)
		local rot = deg - 180
		if movingRight then rot = deg end
		local fx = self:SpawnEffectWithModel(self.Card230BallRUID, startPos, rot, 1.0, self.Card230BallScale * ratio, 1, "skilleffectlong")
		if fx ~= nil and movingRight and fx.SpriteRendererComponent ~= nil then fx.SpriteRendererComponent.FlipX = true end
		local z = startPos.z
		if fx ~= nil then z = fx.TransformComponent.Position.z end
		local duration = self.Card230FlightDuration
		local percents = self:GetBlazeShotPiercePercents()
		local rx = self.Card230HitRadiusX * ratio
		local ry = self.Card230HitRadiusY * ratio
		local burnPerTick = damage * self.Card230BurnRatio
		local hitSet = {}
		local hitCount = 0
		local elapsed = 0
		local tickId = 0
		local finished = false
		local hitMonster = function(m)
			hitCount = hitCount + 1
			hitSet[m] = true
			local pct = percents[hitCount]
			local applied = damage * pct
			local mp = m.Entity.TransformComponent.Position
			local mr = self:GetEffectScaleRatio(m)
			local hfx = self:SpawnEffect(self.Card230HitRUID, Vector3(mp.x, mp.y + self.Card230BodyYOffset * mr, mp.z), 0, 1.0, self.Card230HitScale * mr, 1)
			if hfx ~= nil then hfx:Destroy(self.Card230HitLifetime) end
			if isCrit then _DpsMeterLogic:Tag(230, m):TakeDamageCrit(applied * 2)
			else _DpsMeterLogic:Tag(230, m):TakeDamage(applied) end
			-- 화상 100% — 1초마다 기준 대미지(치명타·관통 감소 전)의 50%
			if not m._dead then m:ApplyDot(burnPerTick, self.Card230BurnSeconds, 1.0) end
			log("BlazeShotHit: #" .. hitCount .. " pct=" .. math.floor(pct * 100) .. " t=" .. string.format("%.2f", elapsed))
		end
		tickId = _TimerService:SetTimerRepeat(function()
			if finished then return end
			if not isvalid(self) then _TimerService:ClearTimer(tickId) return end
			if castZoneIndex ~= _MapManager.CurrentMapIndex then
				finished = true
				_TimerService:ClearTimer(tickId)
				if isvalid(fx) then fx:Destroy() end
				return
			end
			elapsed = elapsed + self.Card230Tick
			local t = math.min(1.0, elapsed / duration)
			local hx = startPos.x + vx * t
			local hy = startPos.y + vy * t
			if isvalid(fx) then fx.TransformComponent.Position = Vector3(hx, hy, z) end
			if hitCount < #percents then
				local hitAny = false
				for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
					---@type MonsterAI
					local m = mob
					if hitCount < #percents and isvalid(m) and isvalid(m.Entity) and not m._dead and hitSet[m] == nil and self:IsInDepthBand(m, band) then
						local mp = m.Entity.TransformComponent.Position
						local mr = self:GetEffectScaleRatio(m)
						if self:InEllipse(mp.x - hx, mp.y + self.Card230BodyYOffset * mr - hy, rx, ry) then
							hitMonster(m)
							hitAny = true
						end
					end
				end
				if hitAny then self:PlayBreathSfx(self.Card230HitSoundRUID) end
			end
			if t >= 1.0 then
				finished = true
				_TimerService:ClearTimer(tickId)
				-- 타겟까지 — 도착했는데 타겟을 아직 못 맞혔고 관통 횟수가 남았으면 타겟을 마지막으로 맞힌다
				if hitCount < #percents and isvalid(target) and isvalid(target.Entity) and not target._dead and hitSet[target] == nil then
					hitMonster(target)
				end
				if isvalid(fx) then fx:Destroy() end
				local ifx = self:SpawnEffect(self.Card230ImpactRUID, Vector3(endPos.x, endPos.y, endPos.z), 0, 1.0, self.Card230ImpactScale * ratio, 1)
				if ifx ~= nil then ifx:Destroy(self.Card230ImpactLifetime) end
				self:PlayBreathSfx(self.Card230ImpactSoundRUID)
				log("BlazeShot: pierced=" .. hitCount .. " dir=" .. (movingRight and "R" or "L") .. " rot=" .. math.floor(rot))
			end
		end, self.Card230Tick)
	end
`;
insertBefore('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

insertAfterLine('\t\tif cardIdx == 229 then return self.PoisonBurstLevel > 0 end',
'\t\tif cardIdx == 230 then return self.BlazeShotLevel > 0 end');
insertAfterLine('\t\telseif cardIdx == 229 then base = self:GetPoisonBurstDamage(self.PoisonBurstLevel)',
'\t\telseif cardIdx == 230 then base = self:GetBlazeShotDamage(self.BlazeShotLevel)');
insertAfterLine('\t\telseif cardIdx == 229 then return self.Card229Cooldown',
'\t\telseif cardIdx == 230 then return self.Card230Cooldown');
insertAfterLine('\t\telseif cardIdx == 229 then return "poisonburst_up"',
'\t\telseif cardIdx == 230 then return "blazeshot_up"', 2);
insertAfterLine('\t\telseif cardIdx == 229 then self.PoisonBurstLevel = 1',
'\t\telseif cardIdx == 230 then self.BlazeShotLevel = 1');
insertAfterLine('\t\telseif cardIdx == 229 then return self.PoisonBurstLevel',
'\t\telseif cardIdx == 230 then return self.BlazeShotLevel');
insertAfterLine('\t\telseif cardIdx == 229 then self.PoisonBurstLevel = level',
'\t\telseif cardIdx == 230 then self.BlazeShotLevel = level');
insertAfterLine('\t\telseif name == "PoisonBurstLevel" then self:RefreshSlotIfHoldsCard(229)',
'\t\telseif name == "BlazeShotLevel" then self:RefreshSlotIfHoldsCard(230)');
insertAfterLine('\t\t\t\t\tself:PoisonBurstAttack(damage, isCrit)',
`				elseif cardIndex == 230 then
					self:BlazeShotAttack(damage, isCrit)`);

insertBefore(`		elseif cardIdx == 229 then
			return {`,
`		elseif cardIdx == 230 then
			return {
				"MLUA_CARDMANAGER_594",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_180",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_070",
			}`);

insertBefore(`		elseif cardIdx == 229 then
			extraStr = `,
`		elseif cardIdx == 230 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_119", self:GetBlazeShotTargetCount(self.BlazeShotLevel), self.Card230BurnSeconds, math.floor(self.Card230BurnRatio * 100 + 0.5))`);

const lvAnchor = `			elseif self.PoisonBurstLevel < 5 then
				table.insert(pool, { card = 229, type = "poisonburst_up" })
			end
`;
if (count(src, lvAnchor) !== 1) throw new Error('levelup anchor');
src = src.replace(lvAnchor, lvAnchor + `			if self.BlazeShotLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 230, type = "unlock" }) end
			elseif self.BlazeShotLevel < 5 then
				table.insert(pool, { card = 230, type = "blazeshot_up" })
			end
`);

insertBefore(`		if cardIdx == 229 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.PoisonBurstLevel + 1)`,
`		if cardIdx == 230 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.BlazeShotLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(230)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(230))
			return
		end
`);

insertBefore('\t\t-- PoisonBurst(베노아 전용, 슬롯형 액티브)',
`		-- BlazeShot(베노아 전용, 슬롯형 액티브)
		if cardIdx == 230 then
			if upgradeType == "unlock" then
				self.BlazeShotLevel = 1
				local slotIdx = self:GetNextEmptySlot()
				if slotIdx > 0 then
					self:AssignCardToSlot(slotIdx, 230)
					self:ResetSlotTimer(slotIdx)
					log("Card230(BlazeShot) -> Slot" .. slotIdx)
				end
			elseif upgradeType == "blazeshot_up" and self.BlazeShotLevel < 5 then
				self.BlazeShotLevel = self.BlazeShotLevel + 1
			end
			log("BlazeShot L" .. self.BlazeShotLevel .. " (dmg=" .. math.floor(self:GetBlazeShotDamage(self.BlazeShotLevel)) .. " targets=" .. self:GetBlazeShotTargetCount(self.BlazeShotLevel) .. ")")
			return
		end
`);

insertAfterLine('\t\t\tif self:IsCardUnlocked(229) and self.PoisonBurstLevel < 5 then table.insert(pool, 229) end',
'\t\t\tif self:IsCardUnlocked(230) and self.BlazeShotLevel < 5 then table.insert(pool, 230) end');
insertAfterLine('\t\tself.PoisonBurstLevel = 0',
'\t\tself.BlazeShotLevel = 0');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
