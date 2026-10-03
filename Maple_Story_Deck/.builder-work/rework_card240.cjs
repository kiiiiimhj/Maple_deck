// 베놈 버스트(240) 2차(유저 정정 2026-10-03): 포이즌 미스트와 같은 표식→사망 독무 구조 + 독무 안 몬스터마다 독 구슬 폭발 50%
const fs = require('fs');
const p = 'RootDesk/MyDesk/Card/CardManager.mlua';
let s = fs.readFileSync(p, 'utf8');
function rep(a, b) { if (s.split(a).length !== 2) throw new Error('rep ' + a.slice(0, 80)); s = s.replace(a, b); }
// 공용 독무에서 베놈 표시 제거
rep('\tmethod void SpawnPoisonMist(Vector3 pos, number damage, number ratio, boolean band, integer zoneIndex)\n\t\t-- 포이즌 미스트(226) 표식 사망 독무 — 공용 독무(틱당 Card226MistRatio)\n\t\tself:SpawnPoisonMistEx(pos, damage, ratio, band, zoneIndex, 226, self.Card226MistRatio, false)\n',
    '\tmethod void SpawnPoisonMist(Vector3 pos, number damage, number ratio, boolean band, integer zoneIndex)\n\t\t-- 포이즌 미스트(226) 표식 사망 독무 — 공용 독무(틱당 Card226MistRatio)\n\t\tself:SpawnPoisonMistEx(pos, damage, ratio, band, zoneIndex, 226, self.Card226MistRatio)\n');
rep('\t-- 공용 독무 — cardTag: DPS 미터 카드 번호 / mistRatio: 틱당 기준 대미지 비율 / markVenom: 틱에 맞은 몬스터를 베놈 상태로(베놈 버스트 1차 독무만)\n\t@ExecSpace("ServerOnly")\n\tmethod void SpawnPoisonMistEx(Vector3 pos, number damage, number ratio, boolean band, integer zoneIndex, integer cardTag, number mistRatio, boolean markVenom)\n',
    '\t-- 공용 독무 — cardTag: DPS 미터 카드 번호 / mistRatio: 틱당 기준 대미지 비율\n\t@ExecSpace("ServerOnly")\n\tmethod void SpawnPoisonMistEx(Vector3 pos, number damage, number ratio, boolean band, integer zoneIndex, integer cardTag, number mistRatio)\n');
rep('\t\t\t\t\t\t\t-- 베놈 표시는 대미지보다 먼저 — 이 틱에 바로 죽어도 사망 독무가 나가야 한다\n\t\t\t\t\t\t\tif markVenom then m:MarkVenom(damage, self.Card240MarkDuration) end\n', '');

const start = s.indexOf('\t-- ── 베노아 조합: 베놈 버스트(카드240)');
const end = s.indexOf('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관');
if (start < 0 || end < start) throw new Error('block markers');
const block = `	-- ── 베노아 조합: 베놈 버스트(카드240) — 유저 지정 2026-10-03(2차 정정) ──
	-- 포이즌 미스트(226) Lv5 + 엘리멘탈 드레인(233) + 매직 가드(234) + 엘리멘탈 어뎁팅(236) 보유 시 선택지에 뜨고, 해금되면
	-- 포이즌 미스트 슬롯을 그대로 넘겨받는다. 3레벨까지. 200/220/240, 쿨 6초, 타겟 2명.
	-- 포이즌 미스트와 같은 구조: 타겟마다 타격 연출(a5c78ee8) + 대미지 + 머리 위 표식(같은 표식) → 표식 몹이 죽으면 그 자리에 독무 3초(틱당 100%).
	-- 다른 점: 독무가 생길 때 그 안에 있는 몬스터마다 독 구슬(포이즌 미스트 팩 effect 2e4488bc)이 맺혔다 터지며 기준 대미지의 50%.
	-- 독 구슬: 18프레임 1.35초 — 구슬(184px) 0.6초 → 11번째 프레임에서 ~450px로 터짐. 원본 기준점이 그림 아래(그림 중심이 기준점 1.67 위)
	@Sync property integer VenomBurstLevel = 0
	property number Card240Cooldown = 6.0
	property integer Card240TargetCount = 2
	property number Card240MistRatio = 1.0  -- 독무 틱당 100%
	property number Card240OrbRatio = 0.5  -- 독무 안 몬스터 독 구슬 폭발 50%
	property string Card240OrbRUID = "2e4488bcb2a54be78efdc5947f70f1df"
	property number Card240OrbScale = 0.6
	property number Card240OrbCenterUp = 1.67
	property number Card240OrbLifetime = 1.3  -- 클립 1.35초보다 살짝 짧게
	property number Card240OrbImpactDelay = 0.6  -- 구슬이 터지는 11번째 프레임
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
		-- 베놈 버스트 시전 — 포이즌 미스트처럼 표식 없는 몬스터를 우선해 2명에게 타격 + 표식
		local map = self:GetCurrentMap()
		if map == nil then return end
		local candidates = self:GetClosestTargets(8)
		local targets = {}
		for _, mob in ipairs(candidates) do
			---@type MonsterAI
			local m = mob
			if #targets < self.Card240TargetCount and isvalid(m) and isvalid(m.Entity) and not m._dead and m._poisonMistDamage <= 0 then table.insert(targets, m) end
		end
		-- 표식 없는 몬스터가 모자라면 가까운 순으로 채운다
		for _, mob in ipairs(candidates) do
			---@type MonsterAI
			local m = mob
			if #targets >= self.Card240TargetCount then break end
			local already = false
			for _, t in ipairs(targets) do if t == m then already = true end end
			if not already and isvalid(m) and isvalid(m.Entity) and not m._dead then table.insert(targets, m) end
		end
		if #targets == 0 then return end
		self:PlayBreathSfx(self.Card226UseSoundRUID)
		for shotIndex, mob in ipairs(targets) do
			---@type MonsterAI
			local target = mob
			_TimerService:SetTimerOnce(function()
				if not isvalid(self) or not isvalid(target) or not isvalid(target.Entity) or target._dead then return end
				local ratio = self:GetEffectScaleRatio(target)
				local tp = self:WorldToCurrentMapLocal(target.Entity.TransformComponent.WorldPosition)
				local fx = self:SpawnEffect(self.Card226HitRUID, Vector3(tp.x, tp.y + self.Card226BodyYOffset * ratio, tp.z), 0, 1.0, self.Card226HitScale * ratio, 1)
				if fx ~= nil then fx:Destroy(self.Card226HitLifetime) end
				-- 표식을 대미지보다 먼저 — 이번 타격에 바로 죽어도 독무가 나가야 한다
				target:ApplyVenomMark(damage, self.Card226MarkDuration)
				if isCrit then _DpsMeterLogic:Tag(240, target):TakeDamageCrit(damage * 2)
				else _DpsMeterLogic:Tag(240, target):TakeDamage(damage) end
			end, (shotIndex - 1) * self.Card240ShotInterval)
		end
		log("VenomBurstAttack: lv=" .. self.VenomBurstLevel .. " targets=" .. #targets .. " dmg=" .. math.floor(isCrit and damage * 2 or damage))
	end

	-- 베놈 표식 몬스터가 죽은 자리 — MonsterAI.Die가 부른다. 독무(틱당 100%) + 그 순간 독무 안 몬스터마다 독 구슬 폭발(50%)
	@ExecSpace("ServerOnly")
	method void SpawnVenomMist(Vector3 pos, number damage, number ratio, boolean band, integer zoneIndex)
		if zoneIndex ~= _MapManager.CurrentMapIndex then return end
		local map = self:GetCurrentMap()
		if map == nil then return end
		self:SpawnPoisonMistEx(pos, damage, ratio, band, zoneIndex, 240, self.Card240MistRatio)
		local halfW = self.Card226MistHalfW * ratio
		local halfH = self.Card226MistHalfH * ratio
		local orbDamage = damage * self.Card240OrbRatio
		local victims = {}
		for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
			---@type MonsterAI
			local m = mob
			if isvalid(m) and isvalid(m.Entity) and not m._dead then
				local mp = m.Entity.TransformComponent.Position
				if self:InEllipse(mp.x - pos.x, mp.y - pos.y, halfW, halfH) and self:IsInDepthBand(m, band) then
					table.insert(victims, m)
					local mr = self:GetEffectScaleRatio(m)
					local oScale = self.Card240OrbScale * mr
					local wp = self:WorldToCurrentMapLocal(m.Entity.TransformComponent.WorldPosition)
					local ofx = self:SpawnEffectWithModel(self.Card240OrbRUID, Vector3(wp.x, wp.y + self.Card226BodyYOffset * mr - self.Card240OrbCenterUp * oScale, wp.z), 0, 1.0, oScale, 1, "skilleffectlong")
					if ofx ~= nil then ofx:Destroy(self.Card240OrbLifetime) end
				end
			end
		end
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if zoneIndex ~= _MapManager.CurrentMapIndex then return end
			local hitCount = 0
			for _, mob in ipairs(victims) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead then
					hitCount = hitCount + 1
					_DpsMeterLogic:Tag(240, m):TakeDamage(orbDamage)
				end
			end
			log("VenomOrbBurst: hit=" .. hitCount .. " dmg=" .. math.floor(orbDamage))
		end, self.Card240OrbImpactDelay)
		log("VenomMist: victims=" .. #victims .. " mistTick=" .. math.floor(damage * self.Card240MistRatio))
	end

`;
s = s.slice(0, start) + block + s.slice(end);
fs.writeFileSync(p, s, 'utf8');
console.log('rework OK');
