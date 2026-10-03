// 베노아 카드226(포이즌 미스트)을 CardManager.mlua 의 각 연결 지점에 삽입한다(카드225 줄을 앵커로 씀).
// 재실행 안전: 이미 "PoisonMistLevel" 프로퍼티가 있으면 아무것도 안 한다.
const fs = require('fs');
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
const NL = '\n';
if (src.includes('@Sync property integer PoisonMistLevel')) { console.log('already applied'); process.exit(0); }

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

// ── 1) 구현 블록 — 베노아 블록 끝(ResolveExplosionHit 다음, 인사이징 앞)에 넣는다 ──
const block = `	-- ── 베노아: 포이즌 미스트(카드226) — 유저 지정 2026-10-03 ──
	-- 80/100/120/150/180, 쿨 6초, 타겟 1. 타겟 자리에 시전 연출(effect)이 뜨고 그 연출 범위(타원) 안 몬스터에게 대미지 +
	-- 머리 위 표식(MonsterAI.ApplyPoisonMistMark). 표식이 붙은 몬스터가 죽으면 그 자리에 독무가 3초 깔리고,
	-- 1초마다 범위 안 몬스터 전부에게 기준 대미지(치명타 전)의 100%. 독무로 죽은 몬스터는 표식이 없으면 독무를 다시 만들지 않는다.
	-- 표식은 Card226MarkDuration 안에 안 죽으면 저절로 사라진다(유저 표에 표식 시간이 없어 쿨타임과 같게 잡음).
	@Sync property integer PoisonMistLevel = 0
	property number Card226Cooldown = 6.0
	property string Card226CastRUID = "b0d47a8948314a5ea04a00690d921fc3"  -- effect, 18프레임 1.62초 170x170, pivot (88,-86) — 그림이 기준점 1.71 위
	property string Card226UseSoundRUID = "eb7f504670a14802a48cc94f4eb66848"
	property string Card226HitSoundRUID = "fbc82c9f2524497c81aea0a647043ab9"  -- 독무가 생길 때
	property number Card226CastScale = 1.0
	property number Card226CastCenterUp = 1.71  -- 원본 그림 중심이 기준점보다 위에 있는 양(1배, 유닛) — 이만큼 내려 놓아야 그림 중심이 몸통에 온다
	property number Card226CastLifetime = 1.62
	property number Card226BodyYOffset = 0.5  -- 시전 연출·판정 중심 = 발밑 + 이 값
	property number Card226ImpactDelay = 0.45
	-- 시전 판정 타원(반축, 1배 기준) — 시전 그림(170px = 1.7유닛) 크기
	property number Card226HalfW = 0.85
	property number Card226HalfH = 0.55
	property number Card226MarkDuration = 6.0
	-- 독무: 타일 클립(팩 tile/2~8, 0.72~0.96초 루프)을 범위 안에 흩뿌린다. 판정은 발밑 기준 타원
	property number Card226MistDuration = 3.0
	property number Card226MistTickInterval = 1.0
	property number Card226MistFirstTick = 0.5
	property number Card226MistRatio = 1.0  -- 틱당 기준 대미지 비율(유저 표 100%)
	property number Card226MistHalfW = 1.1
	property number Card226MistHalfH = 0.55
	property integer Card226MistPuffCount = 7
	property number Card226MistPuffScale = 1.3
	property number Card226MistYOffset = 0.2
	property number Card226MistFade = 0.3

	method table GetPoisonMistTileRUIDs()
		-- 팩 "포이즌 미스트" tile/2~8 (작은 tile/0~1은 뺀다)
		return { "302b1c7f241b400b8544f3b7378eacce", "550d34dd449242c9b3df7daebac8f259", "8bfddf0644494979ba02ef5a59b5a336", "53f3500a48814dd0b97b2825d781583c", "ce9db043ed324af5865e8fa21ce41dc1", "92f82ee141f24246b462856f3ecd1493", "3a6509634ee24b789f5446afb10fe357" }
	end

	method number GetPoisonMistDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 80/100/120/150/180
		if level >= 5 then return 180
		elseif level >= 4 then return 150
		elseif level >= 3 then return 120
		elseif level >= 2 then return 100
		end
		return 80
	end

	@ExecSpace("ServerOnly")
	method void PoisonMistAttack(number damage, boolean isCrit)
		-- 포이즌 미스트 시전 — 가장 가까운 1명 자리에 시전 연출, 잠시 뒤 연출 범위 안 몬스터 전부에게 대미지 + 표식
		local map = self:GetCurrentMap()
		if map == nil then return end
		local targets = self:GetClosestTargets(1)
		local target = targets[1]
		if not isvalid(target) or not isvalid(target.Entity) then return end
		self:PlayBreathSfx(self.Card226UseSoundRUID)
		local ratio = self:GetEffectScaleRatio(target)
		local tp = self:WorldToCurrentMapLocal(target.Entity.TransformComponent.WorldPosition)
		local center = Vector3(tp.x, tp.y + self.Card226BodyYOffset * ratio, tp.z)
		local scale = self.Card226CastScale * ratio
		local fx = self:SpawnEffectWithModel(self.Card226CastRUID, Vector3(center.x, center.y - self.Card226CastCenterUp * scale, center.z), 0, 1.0, scale, 1, "skilleffectlong")
		if fx ~= nil then fx:Destroy(self.Card226CastLifetime) end
		local band = self:GetDepthBand(target)
		local castZoneIndex = target._spawnZoneIndex
		local baseDamage = damage
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			local halfW = self.Card226HalfW * ratio
			local halfH = self.Card226HalfH * ratio
			local hitCount = 0
			for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead then
					local mp = m.Entity.TransformComponent.Position
					if self:InEllipse(mp.x - center.x, mp.y + self.Card226BodyYOffset * ratio - center.y, halfW, halfH) and self:IsInDepthBand(m, band) then
						hitCount = hitCount + 1
						-- 표식을 대미지보다 먼저 붙인다 — 이번 타격에 바로 죽어도 독무가 나가야 한다
						m:ApplyPoisonMistMark(baseDamage, self.Card226MarkDuration)
						if isCrit then _DpsMeterLogic:Tag(226, m):TakeDamageCrit(baseDamage * 2)
						else _DpsMeterLogic:Tag(226, m):TakeDamage(baseDamage) end
					end
				end
			end
			log("PoisonMistHit: hit=" .. hitCount .. " dmg=" .. math.floor(isCrit and baseDamage * 2 or baseDamage))
		end, self.Card226ImpactDelay)
		log("PoisonMistAttack: lv=" .. self.PoisonMistLevel .. " dmg=" .. math.floor(damage))
	end

	-- 표식 몬스터가 죽은 자리에 독무 3초 — MonsterAI.Die가 부른다. pos는 맵 로컬 발밑 좌표
	@ExecSpace("ServerOnly")
	method void SpawnPoisonMist(Vector3 pos, number damage, number ratio, boolean band, integer zoneIndex)
		if zoneIndex ~= _MapManager.CurrentMapIndex then return end
		local map = self:GetCurrentMap()
		if map == nil then return end
		self:PlayBreathSfx(self.Card226HitSoundRUID)
		local halfW = self.Card226MistHalfW * ratio
		local halfH = self.Card226MistHalfH * ratio
		local duration = self.Card226MistDuration
		local fade = self.Card226MistFade
		-- 연출: 타일 클립을 타원 안에 흩뿌리고 알파로 페이드 인/아웃(클립은 루프라 지속 동안 계속 일렁인다)
		local tiles = self:GetPoisonMistTileRUIDs()
		for i = 1, self.Card226MistPuffCount do
			local ang = _UtilLogic:RandomDouble() * math.pi * 2
			local r = math.sqrt(_UtilLogic:RandomDouble()) * 0.8
			local px = pos.x + math.cos(ang) * halfW * r
			local py = pos.y + self.Card226MistYOffset * ratio + math.sin(ang) * halfH * r
			local ruid = tiles[_UtilLogic:RandomIntegerRange(1, #tiles)]
			local puff = self:SpawnEffectWithModel(ruid, Vector3(px, py, pos.z), 0, 1.0, self.Card226MistPuffScale * ratio, 0, "persistenteffect")
			if puff ~= nil then
				local renderer = puff.SpriteRendererComponent
				_TweenLogic:PlayTween(0.0, 1.0, duration, EaseType.Linear, function(t)
					if not isvalid(puff) or not isvalid(renderer) then return end
					local el = t * duration
					local a = 1.0
					if el < fade then a = el / fade
					elseif el > duration - fade then a = math.max(0, (duration - el) / fade) end
					renderer.Color = Color(1, 1, 1, a)
				end)
				puff:Destroy(duration)
			end
		end
		-- 판정: 첫 틱 Card226MistFirstTick, 이후 1초마다 — 지속 안에 들어가는 만큼(3초면 0.5/1.5/2.5초 3회)
		local tick = self.Card226MistFirstTick
		local tickDamage = damage * self.Card226MistRatio
		local tickNo = 0
		while tick < duration do
			tickNo = tickNo + 1
			local thisTick = tickNo
			_TimerService:SetTimerOnce(function()
				if not isvalid(self) then return end
				if zoneIndex ~= _MapManager.CurrentMapIndex then return end
				local hitCount = 0
				for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
					---@type MonsterAI
					local m = mob
					if isvalid(m) and isvalid(m.Entity) and not m._dead then
						local mp = m.Entity.TransformComponent.Position
						if self:InEllipse(mp.x - pos.x, mp.y - pos.y, halfW, halfH) and self:IsInDepthBand(m, band) then
							hitCount = hitCount + 1
							_DpsMeterLogic:Tag(226, m):TakeDamage(tickDamage)
						end
					end
				end
				log("PoisonMistTick: #" .. thisTick .. " hit=" .. hitCount .. " dmg=" .. math.floor(tickDamage))
			end, tick)
			tick = tick + self.Card226MistTickInterval
		end
		log("PoisonMistSpawn: pos=(" .. string.format("%.2f", pos.x) .. "," .. string.format("%.2f", pos.y) .. ") dmg=" .. math.floor(tickDamage) .. " ticks=" .. tickNo)
	end
`;
insertBefore('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

// ── 2) 단일 줄 체인 ──
insertAfterLine('\t\tif cardIdx == 225 then return self.ExplosionLevel > 0 end',
'\t\tif cardIdx == 226 then return self.PoisonMistLevel > 0 end');
insertAfterLine('\t\telseif cardIdx == 225 then base = self:GetExplosionDamage(self.ExplosionLevel)',
'\t\telseif cardIdx == 226 then base = self:GetPoisonMistDamage(self.PoisonMistLevel)');
insertAfterLine('\t\telseif cardIdx == 225 then return self.Card225Cooldown',
'\t\telseif cardIdx == 226 then return self.Card226Cooldown');
insertAfterLine('\t\telseif cardIdx == 225 then return "explosion_up"',
'\t\telseif cardIdx == 226 then return "poisonmist_up"', 2);
insertAfterLine('\t\telseif cardIdx == 225 then self.ExplosionLevel = 1',
'\t\telseif cardIdx == 226 then self.PoisonMistLevel = 1');
insertAfterLine('\t\telseif cardIdx == 225 then return self.ExplosionLevel',
'\t\telseif cardIdx == 226 then return self.PoisonMistLevel');
insertAfterLine('\t\telseif cardIdx == 225 then self.ExplosionLevel = level',
'\t\telseif cardIdx == 226 then self.PoisonMistLevel = level');
insertAfterLine('\t\telseif name == "ExplosionLevel" then self:RefreshSlotIfHoldsCard(225)',
'\t\telseif name == "PoisonMistLevel" then self:RefreshSlotIfHoldsCard(226)');
insertAfterLine('\t\t\t\t\tself:ExplosionAttack(damage, isCrit)',
`				elseif cardIndex == 226 then
					self:PoisonMistAttack(damage, isCrit)`);

// ── 3) 변경내역 ──
insertBefore(`		elseif cardIdx == 225 then
			return {`,
`		elseif cardIdx == 226 then
			return {
				"MLUA_CARDMANAGER_590",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_181",
				"MLUA_CARDMANAGER_181",
			}`);

// ── 4) 툴팁 ──
insertBefore(`		elseif cardIdx == 225 then
			local lv225 = self.ExplosionLevel`,
`		elseif cardIdx == 226 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_116", 1, string.format("%.0f", self.Card226MistDuration), math.floor(self.Card226MistRatio * 100 + 0.5))`);

// ── 5) 레벨업 선택지(베노아 블록 끝) ──
if (count(src, `			elseif self.ExplosionLevel < 5 then
				table.insert(pool, { card = 225, type = "explosion_up" })
			end
`) !== 1) throw new Error('levelup anchor');
src = src.replace(`			elseif self.ExplosionLevel < 5 then
				table.insert(pool, { card = 225, type = "explosion_up" })
			end
`, `			elseif self.ExplosionLevel < 5 then
				table.insert(pool, { card = 225, type = "explosion_up" })
			end
			if self.PoisonMistLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 226, type = "unlock" }) end
			elseif self.PoisonMistLevel < 5 then
				table.insert(pool, { card = 226, type = "poisonmist_up" })
			end
`);

// ── 6) 선택 카드 텍스트 ──
insertBefore(`		if cardIdx == 225 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.ExplosionLevel + 1)`,
`		if cardIdx == 226 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.PoisonMistLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(226)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(226))
			return
		end
`);

// ── 7) 강화 적용 ──
insertBefore('\t\t-- Explosion(베노아 전용, 슬롯형 액티브)',
`		-- PoisonMist(베노아 전용, 슬롯형 액티브)
		if cardIdx == 226 then
			if upgradeType == "unlock" then
				self.PoisonMistLevel = 1
				local slotIdx = self:GetNextEmptySlot()
				if slotIdx > 0 then
					self:AssignCardToSlot(slotIdx, 226)
					self:ResetSlotTimer(slotIdx)
					log("Card226(PoisonMist) -> Slot" .. slotIdx)
				end
			elseif upgradeType == "poisonmist_up" and self.PoisonMistLevel < 5 then
				self.PoisonMistLevel = self.PoisonMistLevel + 1
			end
			log("PoisonMist L" .. self.PoisonMistLevel .. " (dmg=" .. math.floor(self:GetPoisonMistDamage(self.PoisonMistLevel)) .. ")")
			return
		end
`);

// ── 8) 드롭 풀 ──
insertAfterLine('\t\t\tif self:IsCardUnlocked(225) and self.ExplosionLevel < 5 then table.insert(pool, 225) end',
'\t\t\tif self:IsCardUnlocked(226) and self.PoisonMistLevel < 5 then table.insert(pool, 226) end');

// ── 9) 다시하기 초기화 ──
insertAfterLine('\t\tself.ExplosionLevel = 0',
'\t\tself.PoisonMistLevel = 0');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
