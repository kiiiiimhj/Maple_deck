// 베놈 스피어(241) 2차(유저 정정 2026-10-04): 포이즌 트랩과 같은 타겟(중독 몹 전부, 없으면 대기) + 속박, 1초 뒤 추가타 연출로 추가타
const fs = require('fs');
const p = 'RootDesk/MyDesk/Card/CardManager.mlua';
let s = fs.readFileSync(p, 'utf8');
function rep(a, b) { if (s.split(a).length !== 2) throw new Error('rep ' + a.slice(0, 80)); s = s.replace(a, b); }
const start = s.indexOf('\t-- ── 베노아 조합: 베놈 스피어(카드241)');
const end = s.indexOf('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관');
if (start < 0 || end < start) throw new Error('markers');
const block = `	-- ── 베노아 조합: 베놈 스피어(카드241) — 유저 지정 2026-10-04(2차 정정) ──
	-- 포이즌 트랩(227) Lv5 + 마나 웨이브(232) + 하이 위즈덤(235) 보유 시 선택지에 뜨고, 해금되면 포이즌 트랩 슬롯을 그대로 넘겨받는다. 3레벨까지.
	-- 200/220/240, 쿨 6초. 타겟 = 포이즌 트랩과 같음(중독된 몬스터 전부, 없으면 쿨타임을 돌리지 않고 대기).
	-- 맞으면 포이즌 트랩과 같은 타격 연출 + 대미지 + 속박(2/3/3초, 같은 넝쿨 연출). 속박 걸린 상태에서 1초 뒤 추가타 연출(skill/15001002 effect 5cd1f562)이 뜨며
	-- 추가타 — 기준 대미지의 30/40/50% + hit/0.
	-- 추가타 연출 클립 실측: 7프레임 0.84초, 4번째 프레임(0.36초)에 가장 큼. 기준점이 그림 오른쪽 아래 밖(원작 캐릭터 기준 배치)
	@Sync property integer VenomSpearLevel = 0
	property number Card241Cooldown = 6.0
	property string Card241SpearRUID = "5cd1f5621b774bcbaa84898f79e98772"
	property string Card241HitRUID = "2c2e5530dc0e4d15b89f4dae9a7cc1a9"
	property string Card241HitSoundRUID = "8e7b0c6fdc68437982d245033acaa1da"
	property number Card241SpearScale = 1.0
	property number Card241SpearOffsetX = 0.99  -- 기준점을 옮기는 양(1배, 유닛) — 그림 중심이 몸통에 오도록
	property number Card241SpearOffsetY = -0.53  -- 발밑 + 0.5(몸통) - 그림 중심 높이 1.03
	property number Card241SpearLifetime = 0.8  -- 클립 0.84초보다 살짝 짧게(같으면 첫 프레임이 다시 보임)
	property number Card241SpearDelay = 1.0  -- 속박 뒤 추가타 연출이 뜨기까지
	property number Card241SpearImpact = 0.36  -- 연출이 뜬 뒤 추가타까지(가장 큰 4번째 프레임)
	property number Card241HitScale = 0.8
	property number Card241HitLifetime = 0.56  -- 클립 0.6초보다 살짝 짧게
	property number Card241BodyYOffset = 0.5

	method number GetVenomSpearDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 200/220/240
		if level >= 3 then return 240
		elseif level >= 2 then return 220
		end
		return 200
	end

	method number GetVenomSpearRootSeconds(integer level)
		-- 속박 시간 — 2/3/3초
		if level >= 2 then return 3.0 end
		return 2.0
	end

	method number GetVenomSpearExtraRatio(integer level)
		-- 추가타 비율 — 30/40/50%
		if level >= 3 then return 0.5
		elseif level >= 2 then return 0.4
		end
		return 0.3
	end

	@ExecSpace("ServerOnly")
	method boolean VenomSpearAttack(number damage, boolean isCrit)
		-- 베놈 스피어 — 중독된 몬스터 전부에게 대미지 + 속박, 1초 뒤 추가타. 대상이 없으면 false(쿨타임을 돌리지 않고 대기)
		local map = self:GetCurrentMap()
		if map == nil then return false end
		local targets = {}
		for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
			---@type MonsterAI
			local m = mob
			if isvalid(m) and isvalid(m.Entity) and not m._dead and m:IsPoisoned() then table.insert(targets, m) end
		end
		if #targets == 0 then return false end
		self:PlayBreathSfx(self.Card227UseSoundRUID)
		self:PlayBreathSfx(self.Card227HitSoundRUID)
		local level = self.VenomSpearLevel
		local dur = self:GetVenomSpearRootSeconds(level)
		local vineDur = dur * _RelicInventory:GetAilmentDurationMult()
		for _, mob in ipairs(targets) do
			---@type MonsterAI
			local m = mob
			local ratio = self:GetEffectScaleRatio(m)
			local mp = self:WorldToCurrentMapLocal(m.Entity.TransformComponent.WorldPosition)
			local fx = self:SpawnEffect(self.Card227HitRUID, Vector3(mp.x, mp.y + self.Card227BodyYOffset * ratio, mp.z), 0, 1.0, self.Card227HitScale * ratio, 1)
			if fx ~= nil then fx:Destroy(self.Card227HitLifetime) end
			if isCrit then _DpsMeterLogic:Tag(241, m):TakeDamageCrit(damage * 2)
			else _DpsMeterLogic:Tag(241, m):TakeDamage(damage) end
			if not m._dead then
				m:ApplyStun(dur, false)
				m:ApplyLevitate(dur)
				m:ApplyPoisonTrapVine(vineDur)
			end
		end
		-- 1초 뒤 — 아직 살아 있는 대상마다 추가타 연출이 뜨고, 가장 커지는 순간 추가타
		local castZoneIndex = _MapManager.CurrentMapIndex
		local extraDamage = damage * self:GetVenomSpearExtraRatio(level)
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			for _, mob in ipairs(targets) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead then
					local ratio = self:GetEffectScaleRatio(m)
					local sScale = self.Card241SpearScale * ratio
					local mp = self:WorldToCurrentMapLocal(m.Entity.TransformComponent.WorldPosition)
					local spear = self:SpawnEffect(self.Card241SpearRUID, Vector3(mp.x + self.Card241SpearOffsetX * sScale, mp.y + self.Card241BodyYOffset * ratio + self.Card241SpearOffsetY * sScale - self.Card241BodyYOffset * sScale + self.Card241BodyYOffset * sScale, mp.z), 0, 1.0, sScale, 1)
					if spear ~= nil then spear:Destroy(self.Card241SpearLifetime) end
				end
			end
			_TimerService:SetTimerOnce(function()
				if not isvalid(self) then return end
				if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
				self:PlayBreathSfx(self.Card241HitSoundRUID)
				local hitCount = 0
				for _, mob in ipairs(targets) do
					---@type MonsterAI
					local m = mob
					if isvalid(m) and isvalid(m.Entity) and not m._dead then
						hitCount = hitCount + 1
						local mr = self:GetEffectScaleRatio(m)
						local mp = self:WorldToCurrentMapLocal(m.Entity.TransformComponent.WorldPosition)
						local hfx = self:SpawnEffect(self.Card241HitRUID, Vector3(mp.x, mp.y + self.Card241BodyYOffset * mr, mp.z), 0, 1.0, self.Card241HitScale * mr, 1)
						if hfx ~= nil then hfx:Destroy(self.Card241HitLifetime) end
						if isCrit then _DpsMeterLogic:Tag(241, m):TakeDamageCrit(extraDamage * 2)
						else _DpsMeterLogic:Tag(241, m):TakeDamage(extraDamage) end
					end
				end
				log("VenomSpearExtra: hit=" .. hitCount .. " dmg=" .. math.floor(extraDamage))
			end, self.Card241SpearImpact)
		end, self.Card241SpearDelay)
		log("VenomSpearAttack: lv=" .. level .. " targets=" .. #targets .. " dmg=" .. math.floor(isCrit and damage * 2 or damage) .. " root=" .. dur .. "s")
		return true
	end

`;
s = s.slice(0, start) + block + s.slice(end);
rep('\t\t\t\telseif cardIndex == 241 then\n\t\t\t\t\tself:VenomSpearAttack(damage, isCrit)\n',
    '\t\t\t\telseif cardIndex == 241 then\n\t\t\t\t\t-- 중독된 대상이 없으면 쿨타임을 돌리지 않고 대기(포이즌 트랩과 같은 경로)\n\t\t\t\t\tif not self:VenomSpearAttack(damage, isCrit) then skipCooldownReset = true end\n');
rep('\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_123", math.floor(self.Card241RootDuration + 0.5), math.floor(self:GetVenomSpearBurstRatio(math.max(1, self.VenomSpearLevel)) * 100 + 0.5))',
    '\t\t\tlocal lv241 = math.max(1, self.VenomSpearLevel)\n\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_123", math.floor(self:GetVenomSpearRootSeconds(lv241) + 0.5), math.floor(self:GetVenomSpearExtraRatio(lv241) * 100 + 0.5))');
rep('\t\t\t\t"MLUA_CARDMANAGER_607",\n\t\t\t\t"MLUA_CARDMANAGER_608",\n\t\t\t\t"MLUA_CARDMANAGER_608",\n',
    '\t\t\t\t"MLUA_CARDMANAGER_607",\n\t\t\t\t"MLUA_CARDMANAGER_608",\n\t\t\t\t"MLUA_CARDMANAGER_609",\n');
fs.writeFileSync(p, s, 'utf8');

// 아이콘 교체(유저 리소스)
const rp = 'RootDesk/MyDesk/Card/CardRegistry.mlua';
let r = fs.readFileSync(rp, 'utf8');
const ra = '\t\t\t\tname = "MLUA_CARDREGISTRY_119",\n\t\t\t\ticon = "2c78fea1f8ea46df94a19aeb5de5976b",\n';
if (r.split(ra).length !== 2) throw new Error('icon');
r = r.replace(ra, '\t\t\t\tname = "MLUA_CARDREGISTRY_119",\n\t\t\t\ticon = "063e373286c2430d8515c677a28ad241",  -- 유저 리소스 아이콘(2026-10-04 교체)\n');
fs.writeFileSync(rp, r, 'utf8');

