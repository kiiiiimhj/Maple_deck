// 베노아(SelectedCharacter 5) 카드 223~225를 CardManager.mlua 의 각 연결 지점에 삽입한다.
// 재실행 안전: 이미 "FlameOrbLevel" 프로퍼티가 있으면 아무것도 안 한다.
const fs = require('fs');
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
const NL = '\n';
if (src.includes('@Sync property integer FlameOrbLevel')) { console.log('already applied'); process.exit(0); }

const L = (s) => s.split('\n').join(NL);
function count(hay, needle) { let n = 0, i = 0; while ((i = hay.indexOf(needle, i)) >= 0) { n++; i += needle.length; } return n; }
function insertAfterLine(anchorLine, add, expected = 1) {
  const needle = anchorLine + NL;
  const c = count(src, needle);
  if (c !== expected) throw new Error(`anchor count ${c} != ${expected}: ${anchorLine}`);
  src = src.split(needle).join(needle + L(add) + NL);
}
function insertBefore(anchor, add) {
  const a = L(anchor);
  const c = count(src, a);
  if (c !== 1) throw new Error(`anchor count ${c} != 1: ${anchor.slice(0, 80)}`);
  src = src.replace(a, L(add) + NL + a);
}
function replaceOnce(from, to) {
  const c = count(src, from);
  if (c !== 1) throw new Error(`replace count ${c} != 1: ${from}`);
  src = src.replace(from, to);
}

// ── 1) 구현 블록 ──
const block = `	-- ── 베노아(6번째 캐릭터, SelectedCharacter == 5): 플레임 오브(223) / 포이즌 브레스(224) / 익스플로젼(225) — 유저 지정 2026-10-03 ──
	-- 기본공격은 아르카나 파이어샷(카드1)을 그대로 쓴다(유저 지정 "기본공격은 아르카나랑 똑같이") — OnUpdate의 기본공격 분기가
	-- 1~4 이외의 캐릭터를 전부 카드1로 보내므로 따로 만든 게 없다.
	-- 플레임 오브: 타겟 옆(플레이어 쪽)에서 시전 연출 → 불덩이가 날아가 꽂힌다. 단일 타격 + 화상 100%(2초, 1초마다 기준 대미지의 30%).
	--   80/100/120/150/180, 쿨 4초, 타겟 1/1/2/2/2, 발사 2/2/2/2/3발(발마다 공격력 100%). 발은 타겟들을 차례로 돌아가며 노린다.
	-- 포이즌 브레스: 타겟 옆에서 독 브레스가 날아가 독구름(hit/0)이 터지고, 그 연출 범위(타원) 안 몬스터 전부에게 대미지 +
	--   중독 100%(2초, 1초마다 30%). 80/100/120/150/180, 쿨 4초, 타겟 1/1/2/2/2(타겟마다 브레스 1발).
	-- 익스플로젼: 투사체 없이 타겟 자리에서 바로 폭발. 단일 타격 + 화상 100%(1/1/2/2/2초, 1초마다 50%).
	--   120/140/160/180/220, 쿨 5초, 타겟 2/2/3/3/3.
	-- ⚠ 화상/중독은 MonsterAI.ApplyDot 한 칸을 공유한다(나중에 걸린 도트가 앞 도트를 덮어쓴다 — 인사이징 화상·출혈과 같은 규칙).
	-- ⚠ 연출 클립의 프레임 간격은 리소스 정보에 없어 0.09초로 잡고 수명을 정했다 — 잘리거나 두 번 돌면 *Lifetime만 조정할 것.
	@Sync property integer FlameOrbLevel = 0
	@Sync property integer PoisonBreathLevel = 0
	@Sync property integer ExplosionLevel = 0
	property number Card223Cooldown = 4.0
	property number Card224Cooldown = 4.0
	property number Card225Cooldown = 5.0
	-- 플레임 오브(팩 "플레임 오브")
	property string Card223CastRUID = "d151372e94b14187a75456547d5618dc"  -- effect, 9프레임 101x102
	property string Card223BallRUID = "520a54db1a1f4c5a9ea65e93784763d1"  -- ball, 4프레임 137x51
	property string Card223HitRUID = "bd4b045ba925490d820b2e589e025c59"  -- hit/0, 7프레임 85x89
	property string Card223UseSoundRUID = "a70995b9142d41b5aa76586053bc49be"
	property string Card223HitSoundRUID = "7e62c74fe418413cb5b85d191fcc1f53"
	-- 배치(윈드 탈리스만과 같은 구도): 몬스터 ← 불덩이 출발점(SpawnOffsetX) ← 시전 연출(CastOffsetX). 전부 원근 배율(GetEffectScaleRatio)을 곱한다
	property number Card223CastOffsetX = 2.0
	property number Card223SpawnOffsetX = 1.2
	property number Card223CastScale = 0.8
	property number Card223CastLifetime = 0.8
	property number Card223CastLeadTime = 0.2  -- 시전 연출이 먼저 보이고 이만큼 뒤에 불덩이 출발
	property number Card223BallScale = 0.9
	property number Card223FlightDuration = 0.25
	property number Card223ShotInterval = 0.15
	property number Card223ShotYStep = 0.15  -- 같은 타겟에 여러 발이 갈 때 발마다 출발 높이를 조금씩 엇갈린다
	property number Card223HitScale = 0.9
	property number Card223HitLifetime = 0.63
	property number Card223HitYOffset = 0.3
	property boolean Card223FlipDefault = true  -- 원본이 왼쪽을 보는 그림 — 오른쪽으로 날아갈 때 FlipX
	property number Card223BurnRatio = 0.3
	property integer Card223BurnSeconds = 2
	-- 포이즌 브레스(팩 "포이즌 브레스") — 시전음이 팩에 없어 audio/Hit 하나만 착탄 때 울린다
	property string Card224CastRUID = "b152ea3e87b6417780828d1fa6ebe849"  -- effect, 5프레임 109x98
	property string Card224BallRUID = "5358aeab38b54e02819ce59329fd3469"  -- ball, 3프레임 96x40
	property string Card224HitRUID = "b9efd2b388aa464ba6fea3a6795934b4"  -- hit/0(독구름), 6프레임 135x137
	property string Card224MobRUID = "c3d148029c7b4f419086ba0990887af9"  -- mob(중독 표시), 5프레임 35x41
	property string Card224HitSoundRUID = "0cb1b8dc79d64442a4414266cde1ae36"
	property number Card224CastOffsetX = 2.0
	property number Card224SpawnOffsetX = 1.2
	property number Card224CastScale = 0.9
	property number Card224CastLifetime = 0.45
	property number Card224CastLeadTime = 0.2
	property number Card224BallScale = 1.0
	property number Card224FlightDuration = 0.25
	property number Card224ShotInterval = 0.12
	property number Card224HitScale = 1.0
	property number Card224HitLifetime = 0.54
	property number Card224HitYOffset = 0.3
	property boolean Card224FlipDefault = true
	-- 광역 판정 타원(반축, 1배 기준) — 독구름 그림(135x137px = 약 1.35유닛) 크기에 맞춤. 중심은 타겟 발밑
	property number Card224HalfW = 0.7
	property number Card224HalfH = 0.45
	property number Card224MobScale = 1.0
	property number Card224MobYOffset = 1.0
	property number Card224PoisonRatio = 0.3
	property integer Card224PoisonSeconds = 2
	-- 익스플로젼(팩 "익스플로젼") — prepare(모이는 불꽃) → effect(솟는 폭발) → special/0(타격)
	property string Card225PrepareRUID = "419e26654a5e470fa386a8a4e92e9eb3"  -- prepare, 10프레임 141x142
	property string Card225EffectRUID = "38f9aa42ec39406987a9fd92ba2c14ad"  -- effect, 8프레임 108x217
	property string Card225HitRUID = "154a7b585c474b07ae77d96a465756e6"  -- special/0, 7프레임 98x97
	property string Card225UseSoundRUID = "3edd6d189b9b4bf1ac48162339848e36"
	property number Card225PrepareScale = 0.7
	property number Card225PrepareYOffset = 0.3
	property number Card225PrepareLifetime = 0.5
	property number Card225PrepareLeadTime = 0.3  -- 모이는 불꽃 뒤 이만큼 있다가 폭발
	property number Card225EffectScale = 0.9
	property number Card225EffectYOffset = 0.0
	property number Card225EffectLifetime = 0.72
	property number Card225ImpactDelay = 0.2  -- 폭발 연출 시작 후 대미지까지
	property number Card225HitScale = 0.8
	property number Card225HitYOffset = 0.3
	property number Card225HitLifetime = 0.63
	property number Card225ShotInterval = 0.1
	property number Card225BurnRatio = 0.5

	method number GetFlameOrbDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 80/100/120/150/180
		if level >= 5 then return 180
		elseif level >= 4 then return 150
		elseif level >= 3 then return 120
		elseif level >= 2 then return 100
		end
		return 80
	end

	method number GetPoisonBreathDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 80/100/120/150/180
		if level >= 5 then return 180
		elseif level >= 4 then return 150
		elseif level >= 3 then return 120
		elseif level >= 2 then return 100
		end
		return 80
	end

	method number GetExplosionDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 120/140/160/180/220
		if level >= 5 then return 220
		elseif level >= 4 then return 180
		elseif level >= 3 then return 160
		elseif level >= 2 then return 140
		end
		return 120
	end

	method integer GetFlameOrbTargetCount(integer level)
		-- 타겟 수 — Lv1~2:1 / Lv3~5:2 (포이즌 브레스도 같은 표)
		if level >= 3 then return 2 end
		return 1
	end

	method integer GetFlameOrbShotCount(integer level)
		-- 발사 수 — Lv1~4:2발 / Lv5:3발
		if level >= 5 then return 3 end
		return 2
	end

	method integer GetExplosionTargetCount(integer level)
		-- 타겟 수 — Lv1~2:2 / Lv3~5:3
		if level >= 3 then return 3 end
		return 2
	end

	method integer GetExplosionBurnSeconds(integer level)
		-- 화상 지속(초) = 틱 수 — Lv1~2:1초 / Lv3~5:2초
		if level >= 3 then return 2 end
		return 1
	end

	@ExecSpace("ServerOnly")
	method number GetBenoaSideSign(number targetX)
		-- 시전 연출이 생길 옆자리 방향(-1 = 타겟 왼쪽, 1 = 오른쪽) — 플레이어가 있는 쪽. 플레이어 X는 월드 기준이라 맵 로컬로 맞춘다
		local playerLocalX = self:WorldToCurrentMapLocal(Vector3(self:GetPlayerCenterX(), 0, 0)).x
		if targetX >= playerLocalX then return -1.0 end
		return 1.0
	end

	@ExecSpace("ServerOnly")
	method void ApplyBenoaFlip(Entity fx, boolean movingRight, boolean flipDefault)
		-- 베노아 연출 좌우 반전 — flipDefault는 "오른쪽으로 날아갈 때" 쓸 FlipX 값
		if not isvalid(fx) then return end
		local renderer = fx.SpriteRendererComponent
		if renderer == nil then return end
		if movingRight then
			renderer.FlipX = flipDefault
		else
			renderer.FlipX = not flipDefault
		end
	end

	@ExecSpace("ServerOnly")
	method void FlyBenoaBall(string ruid, Vector3 startPos, Vector3 endPos, number scale, number duration, boolean movingRight, boolean flipDefault)
		-- 투사체 1발을 startPos → endPos로 직선 이동시키고 도착 시 지운다(판정은 호출부가 도착 시점에 따로 한다)
		local fx = self:SpawnEffect(ruid, startPos, 0, 1.0, scale, 1)
		if fx == nil then return end
		self:ApplyBenoaFlip(fx, movingRight, flipDefault)
		_TweenLogic:PlayTween(0.0, 1.0, duration, EaseType.Linear, function(t)
			if not isvalid(fx) then return end
			fx.TransformComponent.Position = Vector3(startPos.x + (endPos.x - startPos.x) * t, startPos.y + (endPos.y - startPos.y) * t, startPos.z)
		end)
		_TimerService:SetTimerOnce(function()
			if isvalid(fx) then fx:Destroy() end
		end, duration)
	end

	@ExecSpace("ServerOnly")
	method void FireBenoaCastAndBall(string castRuid, string ballRuid, Vector3 hitPos, number ratio, number yOff, number castOffsetX, number spawnOffsetX, number castScale, number castLifetime, number ballScale, number leadTime, number flight, boolean flipDefault)
		-- 타겟 옆(플레이어 쪽) 바깥에 시전 연출, 그 안쪽에서 leadTime 뒤 투사체가 생겨 타겟으로 날아간다(플레임 오브/포이즌 브레스 공용)
		local side = self:GetBenoaSideSign(hitPos.x)
		local castPos = Vector3(hitPos.x + side * castOffsetX * ratio, hitPos.y + yOff, hitPos.z)
		local startPos = Vector3(hitPos.x + side * spawnOffsetX * ratio, hitPos.y + yOff, hitPos.z)
		-- 옆자리가 몬스터 왼쪽(side < 0)이면 오른쪽으로 날아간다
		local movingRight = (side < 0)
		local cfx = self:SpawnEffect(castRuid, castPos, 0, 1.0, castScale * ratio, 1)
		if cfx ~= nil then
			self:ApplyBenoaFlip(cfx, movingRight, flipDefault)
			cfx:Destroy(castLifetime)
		end
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			self:FlyBenoaBall(ballRuid, startPos, hitPos, ballScale * ratio, flight, movingRight, flipDefault)
		end, leadTime)
	end

	@ExecSpace("ServerOnly")
	method void FlameOrbAttack(number damage, boolean isCrit)
		-- 플레임 오브 시전 — 레벨별 발 수만큼 불덩이를 쏘고, 발은 가까운 타겟들을 차례로 돌아가며 노린다
		self:PlayBreathSfx(self.Card223UseSoundRUID)
		local level = self.FlameOrbLevel
		local targets = self:GetClosestTargets(self:GetFlameOrbTargetCount(level))
		local shots = self:GetFlameOrbShotCount(level)
		local fired = 0
		if #targets > 0 then
			for shotIndex = 1, shots do
				---@type MonsterAI
				local target = targets[((shotIndex - 1) % #targets) + 1]
				if isvalid(target) and isvalid(target.Entity) then
					-- 연출 좌표·크기는 시전 시점에 값으로 잡아 둔다(대상이 도중에 죽어도 불덩이는 끝까지 날아간다)
					local ratio = self:GetEffectScaleRatio(target)
					local tp = self:WorldToCurrentMapLocal(target.Entity.TransformComponent.WorldPosition)
					local hitPos = Vector3(tp.x, tp.y + self.Card223HitYOffset * ratio, tp.z)
					local lane = math.floor((shotIndex - 1) / #targets)  -- 이 타겟에 몇 번째로 가는 발인지(0부터)
					local yOff = lane * self.Card223ShotYStep * ratio
					local castZoneIndex = target._spawnZoneIndex
					local capturedTarget = target
					fired = fired + 1
					_TimerService:SetTimerOnce(function()
						if not isvalid(self) then return end
						if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
						self:FireBenoaCastAndBall(self.Card223CastRUID, self.Card223BallRUID, hitPos, ratio, yOff, self.Card223CastOffsetX, self.Card223SpawnOffsetX, self.Card223CastScale, self.Card223CastLifetime, self.Card223BallScale, self.Card223CastLeadTime, self.Card223FlightDuration, self.Card223FlipDefault)
						_TimerService:SetTimerOnce(function()
							if not isvalid(self) then return end
							if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
							self:ResolveFlameOrbHit(capturedTarget, hitPos, ratio, damage, isCrit)
						end, self.Card223CastLeadTime + self.Card223FlightDuration)
					end, (shotIndex - 1) * self.Card223ShotInterval)
				end
			end
		end
		log("FlameOrbAttack: lv=" .. level .. " targets=" .. #targets .. " shots=" .. fired .. "/" .. shots .. " dmg=" .. math.floor(damage))
	end

	@ExecSpace("ServerOnly")
	method void ResolveFlameOrbHit(MonsterAI target, Vector3 hitPos, number ratio, number damage, boolean isCrit)
		-- 불덩이 착탄 — 타격 연출은 항상 띄우고, 대미지·화상은 노린 타겟이 아직 살아 있을 때만 준다(단일 타격)
		local fx = self:SpawnEffect(self.Card223HitRUID, hitPos, 0, 1.0, self.Card223HitScale * ratio, 1)
		if fx ~= nil then fx:Destroy(self.Card223HitLifetime) end
		self:PlayBreathSfx(self.Card223HitSoundRUID)
		if not isvalid(target) or not isvalid(target.Entity) or target._dead then
			log("FlameOrbHit: target gone")
			return
		end
		if isCrit then _DpsMeterLogic:Tag(223, target):TakeDamageCrit(damage * 2)
		else _DpsMeterLogic:Tag(223, target):TakeDamage(damage) end
		local burnPerTick = damage * self.Card223BurnRatio
		if not target._dead then
			-- 화상 100% — 1초마다 기준 대미지(치명타 전)의 30%
			target:ApplyDot(burnPerTick, self.Card223BurnSeconds, 1.0)
		end
		log("FlameOrbHit: dmg=" .. math.floor(isCrit and damage * 2 or damage) .. " burn=" .. math.floor(burnPerTick) .. "x" .. self.Card223BurnSeconds)
	end

	@ExecSpace("ServerOnly")
	method void PoisonBreathAttack(number damage, boolean isCrit)
		-- 포이즌 브레스 시전 — 가까운 순서로 레벨별 타겟 수만큼 뽑아, 타겟마다 브레스 1발을 보낸다
		local level = self.PoisonBreathLevel
		local map = self:GetCurrentMap()
		if map == nil then return end
		local targets = self:GetClosestTargets(self:GetFlameOrbTargetCount(level))
		for shotIndex, mob in ipairs(targets) do
			---@type MonsterAI
			local target = mob
			if isvalid(target) and isvalid(target.Entity) then
				local ratio = self:GetEffectScaleRatio(target)
				local tp = self:WorldToCurrentMapLocal(target.Entity.TransformComponent.WorldPosition)
				local hitPos = Vector3(tp.x, tp.y + self.Card224HitYOffset * ratio, tp.z)
				local footPos = Vector3(tp.x, tp.y, tp.z)
				local castZoneIndex = target._spawnZoneIndex
				-- 깊이 구간은 시전 시점에 캡처(브레스가 날아가는 사이 대상이 죽어도 앞/뒤 필터가 풀리지 않게)
				local band = self:GetDepthBand(target)
				_TimerService:SetTimerOnce(function()
					if not isvalid(self) then return end
					if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
					self:FireBenoaCastAndBall(self.Card224CastRUID, self.Card224BallRUID, hitPos, ratio, 0, self.Card224CastOffsetX, self.Card224SpawnOffsetX, self.Card224CastScale, self.Card224CastLifetime, self.Card224BallScale, self.Card224CastLeadTime, self.Card224FlightDuration, self.Card224FlipDefault)
					_TimerService:SetTimerOnce(function()
						if not isvalid(self) then return end
						if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
						self:ResolvePoisonBreathHit(map, hitPos, footPos, ratio, band, damage, isCrit)
					end, self.Card224CastLeadTime + self.Card224FlightDuration)
				end, (shotIndex - 1) * self.Card224ShotInterval)
			end
		end
		log("PoisonBreathAttack: lv=" .. level .. " targets=" .. #targets .. " dmg=" .. math.floor(damage))
	end

	@ExecSpace("ServerOnly")
	method void ResolvePoisonBreathHit(Entity map, Vector3 hitPos, Vector3 footPos, number ratio, boolean band, number damage, boolean isCrit)
		-- 브레스 착탄 — 독구름 연출 범위(타원) 안 같은 깊이 구간 몬스터 전부에게 대미지 + 중독, 맞은 몬스터 머리 위에 중독 표시
		local fx = self:SpawnEffect(self.Card224HitRUID, hitPos, 0, 1.0, self.Card224HitScale * ratio, 1)
		if fx ~= nil then fx:Destroy(self.Card224HitLifetime) end
		self:PlayBreathSfx(self.Card224HitSoundRUID)
		local halfW = self.Card224HalfW * ratio
		local halfH = self.Card224HalfH * ratio
		local poisonPerTick = damage * self.Card224PoisonRatio
		local hitCount = 0
		for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
			---@type MonsterAI
			local m = mob
			if isvalid(m) and isvalid(m.Entity) and not m._dead then
				local mp = m.Entity.TransformComponent.Position
				if self:InEllipse(mp.x - footPos.x, mp.y - footPos.y, halfW, halfH) and self:IsInDepthBand(m, band) then
					hitCount = hitCount + 1
					if isCrit then _DpsMeterLogic:Tag(224, m):TakeDamageCrit(damage * 2)
					else _DpsMeterLogic:Tag(224, m):TakeDamage(damage) end
					if not m._dead then
						-- 중독 100% — 1초마다 기준 대미지(치명타 전)의 30%
						m:ApplyDot(poisonPerTick, self.Card224PoisonSeconds, 1.0)
						local mr = self:GetEffectScaleRatio(m)
						local mark = self:SpawnEffectWithModel(self.Card224MobRUID, Vector3(mp.x, mp.y + self.Card224MobYOffset * mr, mp.z), 0, 1.0, self.Card224MobScale * mr, 1, "skilleffectlong")
						if mark ~= nil then mark:Destroy(self.Card224PoisonSeconds) end
					end
				end
			end
		end
		log("PoisonBreathHit: hit=" .. hitCount .. " dmg=" .. math.floor(isCrit and damage * 2 or damage) .. " poison=" .. math.floor(poisonPerTick) .. "x" .. self.Card224PoisonSeconds)
	end

	@ExecSpace("ServerOnly")
	method void ExplosionAttack(number damage, boolean isCrit)
		-- 익스플로젼 시전 — 가까운 타겟마다 자기 자리에서 불꽃이 모였다가 폭발한다(투사체 없음, 단일 타격 + 화상)
		self:PlayBreathSfx(self.Card225UseSoundRUID)
		local level = self.ExplosionLevel
		local targets = self:GetClosestTargets(self:GetExplosionTargetCount(level))
		local burnSeconds = self:GetExplosionBurnSeconds(level)
		for shotIndex, mob in ipairs(targets) do
			---@type MonsterAI
			local target = mob
			if isvalid(target) and isvalid(target.Entity) then
				local ratio = self:GetEffectScaleRatio(target)
				local tp = self:WorldToCurrentMapLocal(target.Entity.TransformComponent.WorldPosition)
				local footPos = Vector3(tp.x, tp.y, tp.z)
				local castZoneIndex = target._spawnZoneIndex
				local capturedTarget = target
				_TimerService:SetTimerOnce(function()
					if not isvalid(self) then return end
					if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
					local pfx = self:SpawnEffect(self.Card225PrepareRUID, Vector3(footPos.x, footPos.y + self.Card225PrepareYOffset * ratio, footPos.z), 0, 1.0, self.Card225PrepareScale * ratio, 1)
					if pfx ~= nil then pfx:Destroy(self.Card225PrepareLifetime) end
					_TimerService:SetTimerOnce(function()
						if not isvalid(self) then return end
						if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
						local efx = self:SpawnEffect(self.Card225EffectRUID, Vector3(footPos.x, footPos.y + self.Card225EffectYOffset * ratio, footPos.z), 0, 1.0, self.Card225EffectScale * ratio, 1)
						if efx ~= nil then efx:Destroy(self.Card225EffectLifetime) end
						_TimerService:SetTimerOnce(function()
							if not isvalid(self) then return end
							if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
							self:ResolveExplosionHit(capturedTarget, footPos, ratio, damage, isCrit, burnSeconds)
						end, self.Card225ImpactDelay)
					end, self.Card225PrepareLeadTime)
				end, (shotIndex - 1) * self.Card225ShotInterval)
			end
		end
		log("ExplosionAttack: lv=" .. level .. " targets=" .. #targets .. " dmg=" .. math.floor(damage) .. " burn=" .. burnSeconds .. "s")
	end

	@ExecSpace("ServerOnly")
	method void ResolveExplosionHit(MonsterAI target, Vector3 footPos, number ratio, number damage, boolean isCrit, integer burnSeconds)
		-- 폭발 착탄 — 타격 연출은 항상, 대미지·화상은 노린 타겟이 살아 있을 때만(단일 타격)
		local fx = self:SpawnEffect(self.Card225HitRUID, Vector3(footPos.x, footPos.y + self.Card225HitYOffset * ratio, footPos.z), 0, 1.0, self.Card225HitScale * ratio, 1)
		if fx ~= nil then fx:Destroy(self.Card225HitLifetime) end
		if not isvalid(target) or not isvalid(target.Entity) or target._dead then
			log("ExplosionHit: target gone")
			return
		end
		if isCrit then _DpsMeterLogic:Tag(225, target):TakeDamageCrit(damage * 2)
		else _DpsMeterLogic:Tag(225, target):TakeDamage(damage) end
		local burnPerTick = damage * self.Card225BurnRatio
		if not target._dead then
			-- 화상 100% — 1초마다 기준 대미지(치명타 전)의 50%
			target:ApplyDot(burnPerTick, burnSeconds, 1.0)
		end
		log("ExplosionHit: dmg=" .. math.floor(isCrit and damage * 2 or damage) .. " burn=" .. math.floor(burnPerTick) .. "x" .. burnSeconds)
	end
`;
insertBefore('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

// ── 2) 단일 줄 if/elseif 체인들 ──
insertAfterLine('\t\tif cardIdx == 222 then return self.BloodThrowLevel > 0 end',
`		if cardIdx == 223 then return self.FlameOrbLevel > 0 end
		if cardIdx == 224 then return self.PoisonBreathLevel > 0 end
		if cardIdx == 225 then return self.ExplosionLevel > 0 end`);
insertAfterLine('\t\telseif cardIdx == 222 then base = self:GetBloodThrowDamage(self.BloodThrowLevel)',
`		elseif cardIdx == 223 then base = self:GetFlameOrbDamage(self.FlameOrbLevel)
		elseif cardIdx == 224 then base = self:GetPoisonBreathDamage(self.PoisonBreathLevel)
		elseif cardIdx == 225 then base = self:GetExplosionDamage(self.ExplosionLevel)`);
insertAfterLine('\t\telseif cardIdx == 222 then return self.Card222Cooldown',
`		elseif cardIdx == 223 then return self.Card223Cooldown
		elseif cardIdx == 224 then return self.Card224Cooldown
		elseif cardIdx == 225 then return self.Card225Cooldown`);
// GetCheatUpgradeType + GetEliteUpgradeType(같은 문자열 2곳 모두)
insertAfterLine('\t\telseif cardIdx == 222 then return "bloodthrow_up"',
`		elseif cardIdx == 223 then return "flameorb_up"
		elseif cardIdx == 224 then return "poisonbreath_up"
		elseif cardIdx == 225 then return "explosion_up"`, 2);
insertAfterLine('\t\telseif cardIdx == 222 then self.BloodThrowLevel = 1',
`		elseif cardIdx == 223 then self.FlameOrbLevel = 1
		elseif cardIdx == 224 then self.PoisonBreathLevel = 1
		elseif cardIdx == 225 then self.ExplosionLevel = 1`);
insertAfterLine('\t\telseif cardIdx == 222 then return self.BloodThrowLevel',
`		elseif cardIdx == 223 then return self.FlameOrbLevel
		elseif cardIdx == 224 then return self.PoisonBreathLevel
		elseif cardIdx == 225 then return self.ExplosionLevel`);
insertAfterLine('\t\telseif cardIdx == 222 then self.BloodThrowLevel = level',
`		elseif cardIdx == 223 then self.FlameOrbLevel = level
		elseif cardIdx == 224 then self.PoisonBreathLevel = level
		elseif cardIdx == 225 then self.ExplosionLevel = level`);
insertAfterLine('\t\telseif name == "BloodThrowLevel" then self:RefreshSlotIfHoldsCard(222)',
`		elseif name == "FlameOrbLevel" then self:RefreshSlotIfHoldsCard(223)
		elseif name == "PoisonBreathLevel" then self:RefreshSlotIfHoldsCard(224)
		elseif name == "ExplosionLevel" then self:RefreshSlotIfHoldsCard(225)`);
insertAfterLine('\t\t\t\t\tself:BloodThrowAttack(damage, isCrit)',
`				elseif cardIndex == 223 then
					self:FlameOrbAttack(damage, isCrit)
				elseif cardIndex == 224 then
					self:PoisonBreathAttack(damage, isCrit)
				elseif cardIndex == 225 then
					self:ExplosionAttack(damage, isCrit)`);

// ── 3) 변경내역(changelog) ──
insertBefore(`		elseif cardIdx == 222 then
			return {`,
`		elseif cardIdx == 223 then
			return {
				"MLUA_CARDMANAGER_585",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_180",
				"MLUA_CARDMANAGER_181",
				"MLUA_CARDMANAGER_586",
			}
		elseif cardIdx == 224 then
			return {
				"MLUA_CARDMANAGER_587",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_180",
				"MLUA_CARDMANAGER_181",
				"MLUA_CARDMANAGER_181",
			}
		elseif cardIdx == 225 then
			return {
				"MLUA_CARDMANAGER_588",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_589",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_070",
			}`);

// ── 4) 슬롯 툴팁 부가 정보 ──
insertBefore(`		elseif cardIdx == 222 then
			local lv222 = self.BloodThrowLevel`,
`		elseif cardIdx == 223 then
			local lv223 = self.FlameOrbLevel
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_113", self:GetFlameOrbTargetCount(lv223), self:GetFlameOrbShotCount(lv223), self.Card223BurnSeconds, math.floor(self.Card223BurnRatio * 100 + 0.5))
		elseif cardIdx == 224 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_114", self:GetFlameOrbTargetCount(self.PoisonBreathLevel), self.Card224PoisonSeconds, math.floor(self.Card224PoisonRatio * 100 + 0.5))
		elseif cardIdx == 225 then
			local lv225 = self.ExplosionLevel
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_115", self:GetExplosionTargetCount(lv225), self:GetExplosionBurnSeconds(lv225), math.floor(self.Card225BurnRatio * 100 + 0.5))`);

// ── 5) 레벨업 선택지 ──
replaceOnce('\t\tlocal isRin = (_GameManager.SelectedCharacter == 4)' + NL,
  '\t\tlocal isRin = (_GameManager.SelectedCharacter == 4)' + NL + '\t\tlocal isBenoa = (_GameManager.SelectedCharacter == 5)' + NL);
replaceOnce('\t\tif not isSylph and not isLeion and not isShade and not isRin then' + NL,
  '\t\tif not isSylph and not isLeion and not isShade and not isRin and not isBenoa then' + NL);
insertBefore(`		if isShade then
			-- 더블 스탭(Card171`,
`		if isBenoa then
			-- 베노아 전용 카드(223~225, 슬롯형 액티브 3종) — 미해금이면 슬롯 여유 있을 때만 해금, 해금 후 Lv5까지 강화
			if self.FlameOrbLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 223, type = "unlock" }) end
			elseif self.FlameOrbLevel < 5 then
				table.insert(pool, { card = 223, type = "flameorb_up" })
			end
			if self.PoisonBreathLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 224, type = "unlock" }) end
			elseif self.PoisonBreathLevel < 5 then
				table.insert(pool, { card = 224, type = "poisonbreath_up" })
			end
			if self.ExplosionLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 225, type = "unlock" }) end
			elseif self.ExplosionLevel < 5 then
				table.insert(pool, { card = 225, type = "explosion_up" })
			end
		end
`);

// ── 6) 선택 카드 텍스트 ──
insertBefore(`		if cardIdx == 203 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.WindTalismanLevel + 1)`,
`		if cardIdx == 223 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.FlameOrbLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(223)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(223))
			return
		end

		if cardIdx == 224 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.PoisonBreathLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(224)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(224))
			return
		end

		if cardIdx == 225 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.ExplosionLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(225)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(225))
			return
		end
`);

// ── 7) 강화 적용 ──
const applyBlock = (idx, prop, upType, name, extraLog) => `		-- ${name}(베노아 전용, 슬롯형 액티브)
		if cardIdx == ${idx} then
			if upgradeType == "unlock" then
				self.${prop} = 1
				local slotIdx = self:GetNextEmptySlot()
				if slotIdx > 0 then
					self:AssignCardToSlot(slotIdx, ${idx})
					self:ResetSlotTimer(slotIdx)
					log("Card${idx}(${name}) -> Slot" .. slotIdx)
				end
			elseif upgradeType == "${upType}" and self.${prop} < 5 then
				self.${prop} = self.${prop} + 1
			end
			log("${name} L" .. self.${prop} .. ${extraLog})
			return
		end
`;
insertBefore('\t\t-- 윈드 탈리스만(린 전용, 슬롯형 액티브 — 광역)',
  applyBlock(223, 'FlameOrbLevel', 'flameorb_up', 'FlameOrb', '" (dmg=" .. math.floor(self:GetFlameOrbDamage(self.FlameOrbLevel)) .. " targets=" .. self:GetFlameOrbTargetCount(self.FlameOrbLevel) .. " shots=" .. self:GetFlameOrbShotCount(self.FlameOrbLevel) .. ")"') + NL +
  applyBlock(224, 'PoisonBreathLevel', 'poisonbreath_up', 'PoisonBreath', '" (dmg=" .. math.floor(self:GetPoisonBreathDamage(self.PoisonBreathLevel)) .. " targets=" .. self:GetFlameOrbTargetCount(self.PoisonBreathLevel) .. ")"') + NL +
  applyBlock(225, 'ExplosionLevel', 'explosion_up', 'Explosion', '" (dmg=" .. math.floor(self:GetExplosionDamage(self.ExplosionLevel)) .. " targets=" .. self:GetExplosionTargetCount(self.ExplosionLevel) .. " burn=" .. self:GetExplosionBurnSeconds(self.ExplosionLevel) .. "s)"'));

// ── 8) 드롭/상자 강화 풀 ──
insertBefore(`		if _GameManager.SelectedCharacter == 3 then
			if self:IsCardUnlocked(171)`,
`		-- 베노아(2026-10-03 추가) — 아르카나 카드가 안 틱되므로 별도 풀
		if _GameManager.SelectedCharacter == 5 then
			if self:IsCardUnlocked(223) and self.FlameOrbLevel < 5 then table.insert(pool, 223) end
			if self:IsCardUnlocked(224) and self.PoisonBreathLevel < 5 then table.insert(pool, 224) end
			if self:IsCardUnlocked(225) and self.ExplosionLevel < 5 then table.insert(pool, 225) end
			return pool
		end`);

// ── 9) 다시하기 초기화 ──
insertAfterLine('\t\tself.ShadowTrapLevel = 0',
`		-- 베노아 전용(223~225) — 새 카드를 넣을 때마다 여기도 같이(누락 시 다시하기 후 해금 카드가 슬롯에 안 들어간다)
		self.FlameOrbLevel = 0
		self.PoisonBreathLevel = 0
		self.ExplosionLevel = 0`);

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
