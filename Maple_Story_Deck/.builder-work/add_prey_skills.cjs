// 실피드 신규 4종 — 윈드 오브 프레이(121) / 게일 오브 프레이(122) / 스네어 오브 프레이(123) / 컨센트레이션(124, 패시브)을
// CardManager.mlua의 모든 분기에 끼워 넣는 1회성 패치(2026-09-30). 앵커가 정확히 1번씩 있어야만 쓴다. 이미 적용돼 있으면 중단.
const fs = require("fs");
const FILE = "RootDesk/MyDesk/Card/CardManager.mlua";
const prey = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
let raw = fs.readFileSync(FILE, "utf8");
const crlf = raw.includes("\r\n");
let s = raw.replace(/\r\n/g, "\n");
if (s.includes("WindOfPreyLevel")) { console.log("already applied"); process.exit(0); }

const count = (hay, needle) => hay.split(needle).length - 1;
function check(anchor) { if (count(s, anchor) !== 1) throw new Error("anchor x" + count(s, anchor) + ": " + anchor.slice(0, 100)); }
function after(anchor, text) { check(anchor); s = s.replace(anchor, () => anchor + text); }
function before(anchor, text) { check(anchor); s = s.replace(anchor, () => text + anchor); }
function swap(anchor, text) { check(anchor); s = s.replace(anchor, () => text); }
const q = (arr) => arr.map((r) => `"${r}"`).join(", ");

const WOP = prey["skill/312.img/skill/3121052"];
const GALE = prey["skill/16212.img/skill/162121015"];
const SWING = prey["skill/16211.img/skill/162111000"];
const F_WOP = WOP["effect"].frames;
const F_GALE_CAST = GALE["effect"].frames;
const F_GALE_TORNADO = GALE["summon/attack1"].frames;
const F_SNARE_CAST = SWING["effect"].frames;
const F_SNARE_BIND = SWING["special1"].frames.concat(SWING["special2"].frames);
if (F_WOP.length !== 17 || F_GALE_TORNADO.length !== 48 || F_SNARE_BIND.length !== 32) throw new Error("frame count");

// ── 1. 본체 ─────────────────────────────────────────────────────────────
const BLOCK = `	-- ── 실피드: 윈드 오브 프레이 (Card 121) / 게일 오브 프레이 (Card 122) / 스네어 오브 프레이 (Card 123)
	--          + 패시브 컨센트레이션 (Card 124) — 유저 지정 2026-09-30 ──
	-- 윈드 오브 프레이: 슬롯형 액티브(Lv1~5). 가까운 몬스터 N명을 골라 각각 바람 연출을 띄우고, 그 연출 범위(타원) 안의
	--   몬스터 전부에게 대미지. 한 번의 시전에 한 몬스터는 한 번만 맞는다. 130/150/170/190/210, 타겟 1 → Lv2부터 2명. 쿨타임 5초.
	-- 게일 오브 프레이(원본 이름 "분출 : 돌개바람"은 쓰지 않는다) = 윈드 오브 프레이 Lv5 + 컨센트레이션 + 파이널 어택 : 활.
	--   240/270/300, 타겟 3명. 맞은 몬스터마다 돌개바람이 생겨 대미지 30%를 한 번 더 주고 넉백(보스·엘리트는 절반).
	-- 스네어 오브 프레이(원본 이름 "발현 : 바람 그네"는 쓰지 않는다) = 윈드 오브 프레이 Lv5 + 컨센트레이션 + 크리티컬 샷.
	--   240/270/300, 타겟 2명, 치명타 +20%. 맞은 몬스터마다 바람 그네가 생겨 대미지 30%를 한 번 더 주고 2초 속박(보스·엘리트는 절반).
	-- 두 조합 모두 윈드 오브 프레이의 슬롯을 그대로 넘겨받는다(패시브는 그대로 남는다). 하나를 만들면 윈드 오브 프레이가
	-- 사라지므로 나머지 하나는 그 판에서 못 만든다(아르카나 프리징 브레스 → 프로즌/라이트닝 오브와 같은 양자택일).
	-- 컨센트레이션: 슬롯 없는 패시브. 몬스터 공격 회피 3/5/7/9/12%(영구) — MonsterAI.OnReachPlayer가 굴린다.
	@Sync property integer WindOfPreyLevel = 0
	@Sync property integer GaleOfPreyLevel = 0
	@Sync property integer SnareOfPreyLevel = 0
	@Sync property integer ConcentrationLevel = 0
	property string Card121Name = "MLUA_CARDMANAGER_555"
	property string Card122Name = "MLUA_CARDMANAGER_556"
	property string Card123Name = "MLUA_CARDMANAGER_557"
	property string Card124Name = "MLUA_CARDMANAGER_558"
	property string Card121IconRUID = "0c7429594f59465da53d31def2b1c566"
	property string Card122IconRUID = "1145fd299098487cbbb083e611a3669e"
	property string Card123IconRUID = "a848ac6a11194dc6a5c25bfa5cd5331b"
	property string Card124IconRUID = "f0007cc9b4324713b0ad8ee938f40325"
	-- 사운드: 각 리소스팩의 _audio/Use(시전) · 추가타(돌개바람 _audio/SummonedAttack1, 바람 그네 _audio/special)
	property string Card121SoundRUID = "5c5d26576ac94474a341966a33a89bf3"
	property string Card122SoundRUID = "c5933d4bab484846bce9235e6b4f7a79"
	property string Card122HitSoundRUID = "c43e3a4a98414a51915dd69af074ea6c"
	property string Card123SoundRUID = "f75bd4661dbe4ee482ba30a867a06933"
	property string Card123HitSoundRUID = "d71283af9e324e309b9ccf36153eb95d"
	property number Card121Cooldown = 5.0  -- 세 카드 공통, 레벨 무관 고정
	-- 바람 연출(윈드 오브 프레이 팩 "effect" 17프레임, 원본 648x452px, pivot이 아래 가운데라 몬스터 발밑에 그대로 세운다)
	property number Card121EffectScale = 0.6
	property number Card121FrameDuration = 0.06
	property number Card121ImpactDelay = 0.4  -- 연출이 뜬 뒤 대미지가 들어가는 시점
	-- 판정 범위(타원 반축, 유닛)와 그 중심 높이(발밑 기준) — 연출 크기(0.6배 = 3.9x2.7유닛)보다 살짝 안쪽
	property number Card121AreaHalfW = 1.7
	property number Card121AreaHalfH = 1.0
	property number Card121AreaYOffset = 0.6
	-- 조합 공통: 추가타(돌개바람/바람 그네) = 본 대미지의 30%
	property number PreySecondaryRatio = 0.3
	-- 게일: 시전 연출(296x284px 10프레임) → 돌개바람(summon/attack1, 820x876px 48프레임)
	property number Card122CastScale = 0.8
	property number Card122CastFrameDuration = 0.05
	property number Card122TornadoScale = 0.3
	property number Card122TornadoFrameDuration = 0.035
	property number Card122TornadoHitDelay = 0.5  -- 돌개바람이 뜬 뒤 추가타 + 넉백이 들어가는 시점
	property number Card122KnockbackScale = 0.85  -- 썬더 커터와 같은 "맨 뒤" 스케일
	-- 스네어: 시전 연출(272x268px 10프레임) → 속박 연출(special1 + special2, 548x500px 16 + 16프레임을 속박 시간에 맞춰 재생)
	property number Card123CastScale = 0.8
	property number Card123CastFrameDuration = 0.05
	property number Card123BindScale = 0.45
	property number Card123BindDuration = 2.0  -- 보스·엘리트는 절반
	property number Card123CritBonus = 0.20

	method table GetWindOfPreyFrames()
		-- 윈드 오브 프레이 팩 "effect"
		return { ${q(F_WOP)} }
	end

	method table GetGaleCastFrames()
		-- 분출 : 돌개바람 팩 "effect"
		return { ${q(F_GALE_CAST)} }
	end

	method table GetGaleTornadoFrames()
		-- 분출 : 돌개바람 팩 "summon/attack1"
		return { ${q(F_GALE_TORNADO)} }
	end

	method table GetSnareCastFrames()
		-- 발현 : 바람 그네 팩 "effect"
		return { ${q(F_SNARE_CAST)} }
	end

	method table GetSnareBindFrames()
		-- 발현 : 바람 그네 팩 "special1" + "special2"(이어 붙여 한 번에 재생)
		return { ${q(F_SNARE_BIND)} }
	end

	method number GetWindOfPreyDamage()
		if self.WindOfPreyLevel >= 5 then return 210
		elseif self.WindOfPreyLevel >= 4 then return 190
		elseif self.WindOfPreyLevel >= 3 then return 170
		elseif self.WindOfPreyLevel >= 2 then return 150
		end
		return 130
	end

	method integer GetWindOfPreyTargetCount()
		if self.WindOfPreyLevel >= 2 then return 2 end
		return 1
	end

	method number GetPreyFusionDamage(integer level)
		-- 게일/스네어 공통 — 240/270/300
		if level >= 3 then return 300
		elseif level >= 2 then return 270
		end
		return 240
	end

	method integer GetGaleOfPreyTargetCount()
		return 3
	end

	method integer GetSnareOfPreyTargetCount()
		return 2
	end

	-- 컨센트레이션 — 몬스터 공격 회피 확률. Lv1:3% / Lv2:5% / Lv3:7% / Lv4:9% / Lv5:12% (획득 즉시 영구 적용)
	method number GetConcentrationEvadeChance()
		if self.ConcentrationLevel >= 5 then return 0.12
		elseif self.ConcentrationLevel >= 4 then return 0.09
		elseif self.ConcentrationLevel >= 3 then return 0.07
		elseif self.ConcentrationLevel >= 2 then return 0.05
		elseif self.ConcentrationLevel >= 1 then return 0.03
		end
		return 0
	end

	@ExecSpace("ServerOnly")
	method void WindOfPreyAttack(number damage, boolean isCrit)
		self:PlayBreathSfx(self.Card121SoundRUID)
		self:PreyCast(121, damage, isCrit, self:GetWindOfPreyTargetCount(), 0)
	end

	@ExecSpace("ServerOnly")
	method void GaleOfPreyAttack(number damage, boolean isCrit)
		self:PlayBreathSfx(self.Card122SoundRUID)
		self:PreyCast(122, damage, isCrit, self:GetGaleOfPreyTargetCount(), 1)
	end

	@ExecSpace("ServerOnly")
	method void SnareOfPreyAttack(number damage, boolean isCrit)
		self:PlayBreathSfx(self.Card123SoundRUID)
		self:PreyCast(123, damage, isCrit, self:GetSnareOfPreyTargetCount(), 2)
	end

	@ExecSpace("ServerOnly")
	method void PreyCast(integer cardIdx, number damage, boolean isCrit, integer targetCount, integer kind)
		-- 프레이 3종 공용 본체. kind: 0 = 추가타 없음(윈드 오브 프레이) / 1 = 돌개바람(게일) / 2 = 바람 그네(스네어)
		local targets = self:GetClosestTargets(targetCount)
		local map = self:GetCurrentMap()
		local castZoneIndex = _MapManager.CurrentMapIndex
		local frames = self:GetWindOfPreyFrames()
		-- 판정 중심과 조준 대상의 깊이 구간을 시전 시점에 값으로 잡아 둔다(대상이 도중에 죽어도 판정·연출은 그대로)
		local anchors = {}
		for _, mob in ipairs(targets) do
			---@type MonsterAI
			local target = mob
			if isvalid(target) and isvalid(target.Entity) then
				local p = target.Entity.TransformComponent.Position
				local scale = self.Card121EffectScale * self:GetEffectScaleRatio(target)
				self:PlayFrameEffect(frames, Vector3(p.x, p.y, p.z), scale, self.Card121FrameDuration, 1)
				table.insert(anchors, { x = p.x, y = p.y + self.Card121AreaYOffset, target = target, band = self:GetDepthBand(target) })
			end
		end
		log("PreyCast: card=" .. cardIdx .. " anchors=" .. #anchors .. "/" .. targetCount .. " dmg=" .. math.floor(damage))
		if #anchors == 0 or map == nil then return end

		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			-- 존을 넘어간 뒤에 실행되면 다음 존 몬스터가 맞는다 — 시전 시점 존과 다르면 버린다
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			local hitCount = 0
			local monsters = self:GetMonstersInCurrentZone(map)
			for _, mob in ipairs(monsters) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead then
					local mp = m.Entity.TransformComponent.Position
					local inArea = false
					for _, a in ipairs(anchors) do
						if m == a.target then
							inArea = true
						elseif self:InEllipse(mp.x - a.x, mp.y - a.y, self.Card121AreaHalfW, self.Card121AreaHalfH) and self:IsInDepthBand(m, a.band) then
							inArea = true
						end
						if inArea then break end
					end
					if inArea then
						if isCrit then _DpsMeterLogic:Tag(cardIdx, m):TakeDamageCrit(damage * 2)
						else _DpsMeterLogic:Tag(cardIdx, m):TakeDamage(damage) end
						hitCount = hitCount + 1
						if kind > 0 and not m._dead then self:SpawnPreySecondary(cardIdx, m, damage, isCrit, kind, castZoneIndex) end
					end
				end
			end
			log("PreyCast: card=" .. cardIdx .. " impact hit=" .. hitCount)
		end, self.Card121ImpactDelay)
	end

	@ExecSpace("ServerOnly")
	method void SpawnPreySecondary(integer cardIdx, MonsterAI target, number damage, boolean isCrit, integer kind, integer castZoneIndex)
		-- 본 공격에 맞은 몬스터 자리에 시전 연출 → 돌개바람/바람 그네를 띄우고, 그 몬스터에게만 추가타(PreySecondaryRatio)와 CC를 준다
		local p = target.Entity.TransformComponent.Position
		local pos = Vector3(p.x, p.y, p.z)
		local ratio = self:GetEffectScaleRatio(target)
		local castFrames = self:GetGaleCastFrames()
		local castScale = self.Card122CastScale * ratio
		local castDur = self.Card122CastFrameDuration
		if kind == 2 then
			castFrames = self:GetSnareCastFrames()
			castScale = self.Card123CastScale * ratio
			castDur = self.Card123CastFrameDuration
		end
		self:PlayFrameEffect(castFrames, pos, castScale, castDur, 1)

		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			local alive = isvalid(target) and isvalid(target.Entity) and not target._dead
			local secondaryDmg = damage * self.PreySecondaryRatio
			if kind == 1 then
				-- 돌개바람: 연출은 대상 생사와 무관하게 끝까지, 추가타 + 넉백은 Card122TornadoHitDelay 뒤에
				self:PlayFrameEffect(self:GetGaleTornadoFrames(), pos, self.Card122TornadoScale * ratio, self.Card122TornadoFrameDuration, 1)
				self:PlayBreathSfx(self.Card122HitSoundRUID)
				_TimerService:SetTimerOnce(function()
					if not isvalid(self) or not isvalid(target) or not isvalid(target.Entity) or target._dead then return end
					if isCrit then _DpsMeterLogic:Tag(cardIdx, target):TakeDamageCrit(secondaryDmg * 2)
					else _DpsMeterLogic:Tag(cardIdx, target):TakeDamage(secondaryDmg) end
					if not target._dead then
						local kbScale = self.Card122KnockbackScale
						if target._isBoss or target._isElite then
							-- 보스/엘리트는 넉백 효율 50% — 목표 스케일을 현재 스케일과의 중간값으로(썬더 커터와 같은 규칙)
							kbScale = target._currentScale - (target._currentScale - self.Card122KnockbackScale) * 0.5
						end
						target:ApplyKnockback(kbScale)
					end
					log("SpawnPreySecondary: card=" .. cardIdx .. " tornado dmg=" .. math.floor(isCrit and secondaryDmg * 2 or secondaryDmg))
				end, self.Card122TornadoHitDelay)
			else
				-- 바람 그네: 추가타 + 속박을 걸고, 속박 시간 동안 special1 → special2를 이어서 보여준다
				local bindDur = self.Card123BindDuration
				if alive and (target._isBoss or target._isElite) then bindDur = bindDur * 0.5 end
				local bindFrames = self:GetSnareBindFrames()
				self:PlayFrameEffect(bindFrames, pos, self.Card123BindScale * ratio, bindDur / #bindFrames, 1)
				self:PlayBreathSfx(self.Card123HitSoundRUID)
				if not alive then return end
				if isCrit then _DpsMeterLogic:Tag(cardIdx, target):TakeDamageCrit(secondaryDmg * 2)
				else _DpsMeterLogic:Tag(cardIdx, target):TakeDamage(secondaryDmg) end
				if not target._dead then target:ApplyStun(bindDur, false) end
				log("SpawnPreySecondary: card=" .. cardIdx .. " snare dmg=" .. math.floor(isCrit and secondaryDmg * 2 or secondaryDmg) .. " bind=" .. bindDur)
			end
		end, castDur * #castFrames)
	end

`;
before("\t-- ── 실피드 전용 패시브 5종 (카드 109~113) — 아르카나의 매직 부스터(7)/매직 크리티컬(8)/매직\n", BLOCK);

// ── 2. 액티브/조합(121~123) 분기 — 기존 120(플레시 봄버) 줄 뒤에 붙인다 ───────────────
after("\t\tif cardIdx == 120 then return self.FlashBomberLevel > 0 end\n",
  "\t\tif cardIdx == 121 then return self.WindOfPreyLevel > 0 end\n\t\tif cardIdx == 122 then return self.GaleOfPreyLevel > 0 end\n\t\tif cardIdx == 123 then return self.SnareOfPreyLevel > 0 end\n");
after("\t\telseif cardIdx == 120 then base = self:GetFlashBomberDamage(self.FlashBomberLevel)\n",
  "\t\telseif cardIdx == 121 then base = self:GetWindOfPreyDamage()\n\t\telseif cardIdx == 122 then base = self:GetPreyFusionDamage(self.GaleOfPreyLevel)\n\t\telseif cardIdx == 123 then base = self:GetPreyFusionDamage(self.SnareOfPreyLevel)\n");
after("\t\telseif cardIdx == 120 then return self.Card120Cooldown\n",
  "\t\telseif cardIdx == 121 or cardIdx == 122 or cardIdx == 123 then return self.Card121Cooldown\n");
after("\t\telseif cardIdx == 120 then return self.Card120IconRUID\n",
  "\t\telseif cardIdx == 121 then return self.Card121IconRUID\n\t\telseif cardIdx == 122 then return self.Card122IconRUID\n\t\telseif cardIdx == 123 then return self.Card123IconRUID\n");
after("\t\telseif cardIdx == 120 then return self.Card120Name\n",
  "\t\telseif cardIdx == 121 then return self.Card121Name\n\t\telseif cardIdx == 122 then return self.Card122Name\n\t\telseif cardIdx == 123 then return self.Card123Name\n");
after("\t\telseif cardIdx == 120 then return self.FlashBomberLevel\n",
  "\t\telseif cardIdx == 121 then return self.WindOfPreyLevel\n\t\telseif cardIdx == 122 then return self.GaleOfPreyLevel\n\t\telseif cardIdx == 123 then return self.SnareOfPreyLevel\n");
after("\t\telseif cardIdx == 120 then self.FlashBomberLevel = level\n",
  "\t\telseif cardIdx == 121 then self.WindOfPreyLevel = level\n\t\telseif cardIdx == 122 then self.GaleOfPreyLevel = level\n\t\telseif cardIdx == 123 then self.SnareOfPreyLevel = level\n");
after('\t\telseif cardIdx == 120 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_173",\n\t\t\t\t"MLUA_CARDMANAGER_174",\n\t\t\t\t"MLUA_CARDMANAGER_175",\n\t\t\t}\n',
  '\t\telseif cardIdx == 121 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_559",\n\t\t\t\t"MLUA_CARDMANAGER_180",\n\t\t\t\t"MLUA_CARDMANAGER_125",\n\t\t\t\t"MLUA_CARDMANAGER_125",\n\t\t\t\t"MLUA_CARDMANAGER_125",\n\t\t\t}\n' +
  '\t\telseif cardIdx == 122 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_560",\n\t\t\t\t"MLUA_CARDMANAGER_181",\n\t\t\t\t"MLUA_CARDMANAGER_181",\n\t\t\t}\n' +
  '\t\telseif cardIdx == 123 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_561",\n\t\t\t\t"MLUA_CARDMANAGER_181",\n\t\t\t\t"MLUA_CARDMANAGER_181",\n\t\t\t}\n');
after('\t\telseif name == "FlashBomberLevel" then self:RefreshSlotIfHoldsCard(120)\n',
  '\t\telseif name == "WindOfPreyLevel" then self:RefreshSlotIfHoldsCard(121)\n\t\telseif name == "GaleOfPreyLevel" then self:RefreshSlotIfHoldsCard(122)\n\t\telseif name == "SnareOfPreyLevel" then self:RefreshSlotIfHoldsCard(123)\n');
after('\t\telseif cardIdx == 120 then name = _LocText:Resolve(self.Card120Name) .. " Lv." .. self.FlashBomberLevel\n',
  '\t\telseif cardIdx == 121 then name = _LocText:Resolve(self.Card121Name) .. " Lv." .. self.WindOfPreyLevel\n' +
  '\t\telseif cardIdx == 122 then name = _LocText:Resolve(self.Card122Name) .. " Lv." .. self.GaleOfPreyLevel\n' +
  '\t\telseif cardIdx == 123 then name = _LocText:Resolve(self.Card123Name) .. " Lv." .. self.SnareOfPreyLevel\n');
after('\t\telseif cardIdx == 120 then\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_006", math.floor(self:GetCardDamage(cardIdx)))\n',
  '\t\telseif cardIdx == 121 then\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_006", math.floor(self:GetCardDamage(cardIdx)))\n' +
  '\t\telseif cardIdx == 122 or cardIdx == 123 then\n\t\t\t-- 본 대미지 + 추가타(30%)를 합산한 숫자 1개로 보여준다(다단타 표기 통일 규칙)\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_006", math.floor(self:GetCardDamage(cardIdx) * (1 + self.PreySecondaryRatio)))\n');
after('\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_055", collidePct, explosionPct)\n',
  '\t\telseif cardIdx == 121 then\n\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_106", self:GetWindOfPreyTargetCount())\n' +
  '\t\telseif cardIdx == 122 then\n\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_107", self:GetGaleOfPreyTargetCount(), math.floor(self.PreySecondaryRatio * 100))\n' +
  '\t\telseif cardIdx == 123 then\n\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_108", self:GetSnareOfPreyTargetCount(), string.format("%.0f", self.Card123BindDuration), math.floor(self.PreySecondaryRatio * 100))\n');
after("\t\t\t\telseif cardIndex == 120 then\n\t\t\t\t\tself:FlashBomberAttack(damage, isCrit)\n",
  "\t\t\t\telseif cardIndex == 121 then\n\t\t\t\t\tself:WindOfPreyAttack(damage, isCrit)\n\t\t\t\telseif cardIndex == 122 then\n\t\t\t\t\tself:GaleOfPreyAttack(damage, isCrit)\n\t\t\t\telseif cardIndex == 123 then\n\t\t\t\t\tself:SnareOfPreyAttack(damage, isCrit)\n");
after("\t\tif cardIdx == 28 then chance = chance + self.Card28CritBonus end\n",
  "\t\t-- 스네어 오브 프레이(카드123) 전용 — 레벨 무관 +20%(유저 표)\n\t\tif cardIdx == 123 then chance = chance + self.Card123CritBonus end\n");
after('\t\telseif cardIdx == 120 then return "MLUA_CARDMANAGER_493"\n',
  '\t\telseif cardIdx == 121 then return "MLUA_CARDMANAGER_565"\n\t\telseif cardIdx == 122 then return "MLUA_CARDMANAGER_566"\n\t\telseif cardIdx == 123 then return "MLUA_CARDMANAGER_567"\n');
swap("self:GetLightningOrbBallFrames(), self:GetLightningOrbHitFrames() }\n",
  "self:GetLightningOrbBallFrames(), self:GetLightningOrbHitFrames(),\n\t\t\tself:GetWindOfPreyFrames(), self:GetGaleCastFrames(), self:GetGaleTornadoFrames(), self:GetSnareCastFrames(), self:GetSnareBindFrames() }\n");

// ── 3. 패시브(124) 분기 — 기존 113(연속 사격) 줄 뒤에 붙인다 ───────────────────────
after("\t\tif cardIdx == 113 then return self.RapidFireLevel > 0 end\n", "\t\tif cardIdx == 124 then return self.ConcentrationLevel > 0 end\n");
after("\t\telseif cardIdx == 113 then return self.Card113IconRUID\n", "\t\telseif cardIdx == 124 then return self.Card124IconRUID\n");
after("\t\telseif cardIdx == 113 then return self.Card113Name\n", "\t\telseif cardIdx == 124 then return self.Card124Name\n");
after("\t\telseif cardIdx == 113 then return self.RapidFireLevel\n", "\t\telseif cardIdx == 124 then return self.ConcentrationLevel\n");
after("\t\telseif cardIdx == 113 then self.RapidFireLevel = level\n", "\t\telseif cardIdx == 124 then self.ConcentrationLevel = level\n");
after('\t\telseif cardIdx == 113 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_154",\n\t\t\t\t"MLUA_CARDMANAGER_118",\n\t\t\t\t"MLUA_CARDMANAGER_155",\n\t\t\t\t"MLUA_CARDMANAGER_155",\n\t\t\t\t"MLUA_CARDMANAGER_155",\n\t\t\t}\n',
  '\t\telseif cardIdx == 124 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_562",\n\t\t\t\t"MLUA_CARDMANAGER_563",\n\t\t\t\t"MLUA_CARDMANAGER_563",\n\t\t\t\t"MLUA_CARDMANAGER_563",\n\t\t\t\t"MLUA_CARDMANAGER_564",\n\t\t\t}\n');
after('\t\telseif name == "RapidFireLevel" then\n\t\t\tif self.RapidFireLevel > 0 then self:NotifyRapidFireOnPermanent() end\n',
  '\t\telseif name == "ConcentrationLevel" then\n\t\t\tif self.ConcentrationLevel > 0 then self:NotifyConcentrationOnPermanent() end\n');
after('\t\telseif cardIdx == 113 then name = _LocText:Resolve(self.Card113Name) .. " Lv." .. self.RapidFireLevel\n',
  '\t\telseif cardIdx == 124 then name = _LocText:Resolve(self.Card124Name) .. " Lv." .. self.ConcentrationLevel\n');
after('\t\telseif cardIdx == 113 then\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_011", self:GetRapidFirePercent())\n',
  '\t\telseif cardIdx == 124 then\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_105", math.floor(self:GetConcentrationEvadeChance() * 100 + 0.5))\n');
swap("\t\t\tor cardIdx == 109 or cardIdx == 110 or cardIdx == 111 or cardIdx == 112 or cardIdx == 113\n",
  "\t\t\tor cardIdx == 109 or cardIdx == 110 or cardIdx == 111 or cardIdx == 112 or cardIdx == 113 or cardIdx == 124\n");
after('\t\telseif cardIdx == 113 then return "MLUA_CARDMANAGER_481"\n', '\t\telseif cardIdx == 124 then return "MLUA_CARDMANAGER_568"\n');
// 버프 아이콘(하단 패시브 줄)
after('\tproperty SpriteGUIRendererComponent rapidFireFill = "29f51406-be4d-43a6-90fb-a2123d29eca7"\n',
  '\tproperty Entity concentrationBuff = ""\n\tproperty SpriteGUIRendererComponent concentrationFill = ""\n');
after("\t\tself:ShowBuffIconPermanent(self.rapidFireBuff, self.rapidFireFill)\n\tend\n",
  '\n\t@ExecSpace("Multicast")\n\tmethod void NotifyConcentrationOnPermanent()\n\t\tif self:IsServer() then return end\n\t\tself:ShowBuffIconPermanent(self.concentrationBuff, self.concentrationFill)\n\tend\n');
after('\t\telseif panel == self.rapidFireBuff then return "rapidfire"\n', '\t\telseif panel == self.concentrationBuff then return "concentration"\n');
after('\t\telseif buffName == "rapidfire" then return self.rapidFireBuff\n', '\t\telseif buffName == "concentration" then return self.concentrationBuff\n');
after("\t\tself:HideBuffIcon(self.rapidFireBuff, self.rapidFireFill)\n", "\t\tself:HideBuffIcon(self.concentrationBuff, self.concentrationFill)\n");
swap("finalattackbow = 112, rapidfire = 113,\n", "finalattackbow = 112, rapidfire = 113, concentration = 124,\n");
swap('\t\t\t"finalattackbow", "rapidfire", "combo",', '\t\t\t"finalattackbow", "rapidfire", "concentration", "combo",');

// ── 4. 레벨업 선택지(실피드 블록) ───────────────────────────────────────────
before("\t\t\t-- 실피드 전용 패시브 5종 (카드 109~113) — 슬롯 없이 레벨만 증가하므로 hasEmptySlot 체크 없이\n",
  `			-- 윈드 오브 프레이(Card 121): 미해금이면 해금(슬롯 여유 있을 때만), 해금 후 레벨 < 5이면 강화
			-- (게일/스네어 오브 프레이로 조합된 뒤에는 더 이상 등장하지 않음 — 그 슬롯을 이미 떠났으므로)
			if self.GaleOfPreyLevel == 0 and self.SnareOfPreyLevel == 0 then
				if self.WindOfPreyLevel == 0 then
					if hasEmptySlot then table.insert(pool, { card = 121, type = "unlock" }) end
				elseif self.WindOfPreyLevel < 5 then
					table.insert(pool, { card = 121, type = "windofprey_up" })
				end
			end

			-- 게일 오브 프레이(Card 122) / 스네어 오브 프레이(Card 123) — 윈드 오브 프레이의 두 갈래 조합(유저 지정 2026-09-30).
			-- 윈드 오브 프레이 Lv5 + 컨센트레이션 + 파이널 어택 : 활 → 게일 / + 크리티컬 샷 → 스네어.
			-- 슬롯을 넘겨받으므로 새 슬롯이 필요 없고, 하나를 만들면 나머지는 그 판에서 등장하지 않는다.
			if self.GaleOfPreyLevel == 0 and self.SnareOfPreyLevel == 0 and self.WindOfPreyLevel >= 5 and self:IsCardUnlocked(124) then
				if self:IsCardUnlocked(112) then table.insert(pool, { card = 122, type = "unlock" }) end
				if self:IsCardUnlocked(111) then table.insert(pool, { card = 123, type = "unlock" }) end
			end
			if self.GaleOfPreyLevel > 0 and self.GaleOfPreyLevel < 3 then
				table.insert(pool, { card = 122, type = "galeofprey_up" })
			end
			if self.SnareOfPreyLevel > 0 and self.SnareOfPreyLevel < 3 then
				table.insert(pool, { card = 123, type = "snareofprey_up" })
			end

`);
after('\t\t\t\ttable.insert(pool, { card = 113, type = "rapidfire_up" })\n\t\t\tend\n',
  `			-- 컨센트레이션(Card 124, 패시브)
			if not self:IsCardUnlocked(124) then
				table.insert(pool, { card = 124, type = "unlock" })
			elseif self.ConcentrationLevel < 5 then
				table.insert(pool, { card = 124, type = "concentration_up" })
			end
`);

// 선택지 카드 글자
const choice = (idx, lvProp) => `		if cardIdx == ${idx} then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.${lvProp} + 1)
			icon.ImageRUID = self.Card${idx}IconRUID
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(self.Card${idx}Name)
			return
		end

`;
before("\t\t-- 카드 2/5(매직 클로/메테오)\n",
  choice(121, "WindOfPreyLevel") + choice(122, "GaleOfPreyLevel") + choice(123, "SnareOfPreyLevel") + choice(124, "ConcentrationLevel"));

// 실제 적용
const fuseApply = (idx, lvProp, other, tag, name) => `		if cardIdx == ${idx} then
			if upgradeType == "unlock" then
				if self.${other} > 0 then
					log_warning("${name}: the other Prey fusion is already made — ignored")
					return
				end
				self.${lvProp} = 1
				local preySlot = self:GetSlotForCard(121)
				if preySlot > 0 then
					self:AssignCardToSlot(preySlot, ${idx})
					self:ResetSlotTimer(preySlot)
					self:PlayThunderStormFusionEffect(preySlot)
					log("Card${idx}(${name}) fused into Slot" .. preySlot .. " (was WindOfPrey)")
				else
					log_warning("${name}: WindOfPrey not found in any slot — fusion could not place the card")
				end
			elseif upgradeType == "${tag}" and self.${lvProp} < 3 then
				self.${lvProp} = self.${lvProp} + 1
			end
			log("${name} L" .. self.${lvProp})
			return
		end

`;
before("\t\t-- 연속 사격 (실피드 전용 패시브 — 슬롯 없이 레벨만 증가)\n",
  `		-- 윈드 오브 프레이 (슬롯 해금 또는 레벨 강화)
		if cardIdx == 121 then
			if upgradeType == "unlock" then
				self.WindOfPreyLevel = 1
				local slotIdx = self:GetNextEmptySlot()
				if slotIdx > 0 then
					self:AssignCardToSlot(slotIdx, 121)
					self:ResetSlotTimer(slotIdx)
					log("Card121(WindOfPrey) -> Slot" .. slotIdx)
				end
			elseif upgradeType == "windofprey_up" and self.WindOfPreyLevel < 5 then
				self.WindOfPreyLevel = self.WindOfPreyLevel + 1
			end
			log("WindOfPrey L" .. self.WindOfPreyLevel)
			return
		end

		-- 게일 / 스네어 오브 프레이 (조합 스킬 — 윈드 오브 프레이(Card121) 슬롯을 그대로 넘겨받는다. 둘 중 하나만 만들 수 있다.
		-- 재료 패시브(컨센트레이션/파이널 어택 : 활/크리티컬 샷)는 슬롯이 없어 그대로 남는다)
` + fuseApply(122, "GaleOfPreyLevel", "SnareOfPreyLevel", "galeofprey_up", "GaleOfPrey") + fuseApply(123, "SnareOfPreyLevel", "GaleOfPreyLevel", "snareofprey_up", "SnareOfPrey") +
`		-- 컨센트레이션 (실피드 전용 패시브 — 슬롯 없이 레벨만 증가)
		if cardIdx == 124 then
			if upgradeType == "unlock" then
				self.ConcentrationLevel = 1
			elseif upgradeType == "concentration_up" and self.ConcentrationLevel < 5 then
				self.ConcentrationLevel = self.ConcentrationLevel + 1
			end
			self:NotifyConcentrationOnPermanent()
			log("Concentration L" .. self.ConcentrationLevel .. " (회피 " .. math.floor(self:GetConcentrationEvadeChance() * 100 + 0.5) .. "%)")
			return
		end

`);

// 런 리셋 / 드롭 강화 풀 / 치트
after("\t\tself.RapidFireLevel = 0\n", "\t\tself.WindOfPreyLevel = 0\n\t\tself.GaleOfPreyLevel = 0\n\t\tself.SnareOfPreyLevel = 0\n\t\tself.ConcentrationLevel = 0\n");
after("\t\tif self:IsCardUnlocked(113) and self.RapidFireLevel < 5 then table.insert(pool, 113) end\n",
  "\t\tif self:IsCardUnlocked(124) and self.ConcentrationLevel < 5 then table.insert(pool, 124) end\n");
after("\t\t\tif self:IsCardUnlocked(120) and self.FlashBomberLevel < 3 then table.insert(pool, 120) end\n",
  "\t\t\t-- 윈드 오브 프레이는 게일/스네어로 조합되면 슬롯을 떠나므로 그 뒤엔 풀에서 뺀다\n" +
  "\t\t\tif self:IsCardUnlocked(121) and self.WindOfPreyLevel < 5 and self.GaleOfPreyLevel == 0 and self.SnareOfPreyLevel == 0 then table.insert(pool, 121) end\n" +
  "\t\t\tif self:IsCardUnlocked(122) and self.GaleOfPreyLevel < 3 then table.insert(pool, 122) end\n" +
  "\t\t\tif self:IsCardUnlocked(123) and self.SnareOfPreyLevel < 3 then table.insert(pool, 123) end\n");
after('\t\telseif cardIdx == 113 then return "rapidfire_up"\n',
  '\t\telseif cardIdx == 121 then return "windofprey_up"\n\t\telseif cardIdx == 124 then return "concentration_up"\n');
after('\t\telseif cardIdx == 120 then return "flashbomber_up"\n',
  '\t\telseif cardIdx == 122 then return "galeofprey_up"\n\t\telseif cardIdx == 123 then return "snareofprey_up"\n');
swap('\t\telseif cardIdx == 108 then return "fleshmirage_up"\n\t\telseif cardIdx == 152 then return "slash_up"\n',
  '\t\telseif cardIdx == 108 then return "fleshmirage_up"\n\t\telseif cardIdx == 121 then return "windofprey_up"\n\t\telseif cardIdx == 152 then return "slash_up"\n');
after("\t\telseif cardIdx == 108 then self.FleshMirageLevel = 1\n", "\t\telseif cardIdx == 121 then self.WindOfPreyLevel = 1\n");

fs.writeFileSync(FILE, crlf ? s.replace(/\n/g, "\r\n") : s);
console.log("patched. lines=" + s.split("\n").length);
