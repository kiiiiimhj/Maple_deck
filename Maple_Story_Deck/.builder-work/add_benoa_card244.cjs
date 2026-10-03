// 베노아 조합 카드244(메테오) = 블레이즈 샷(230) Lv5 + 매직 액셀레이션(231) + 엘리멘탈 드레인(233). 블레이즈 샷 슬롯 승계. 재실행 안전.
const fs = require('fs');
const NL = '\n';
function count(h, n) { let c = 0, i = 0; while ((i = h.indexOf(n, i)) >= 0) { c++; i += n.length; } return c; }
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
if (src.includes('@Sync property integer MeteorBLevel')) { console.log('already applied'); process.exit(0); }
function after(anchorLine, add, expected = 1) {
  const needle = anchorLine + NL; const c = count(src, needle);
  if (c !== expected) throw new Error(`anchor ${c} != ${expected}: ${anchorLine}`);
  src = src.split(needle).join(needle + add + NL);
}
function before(anchor, add) { const c = count(src, anchor); if (c !== 1) throw new Error(`before ${c}: ${anchor.slice(0, 70)}`); src = src.replace(anchor, add + NL + anchor); }
function rep(a, b) { const c = count(src, a); if (c !== 1) throw new Error(`rep ${c}: ${a.slice(0, 70)}`); src = src.replace(a, b); }

const block = `	-- ── 베노아 조합: 메테오(카드244) — 유저 지정 2026-10-04 ──
	-- 블레이즈 샷(230) Lv5 + 매직 액셀레이션(231) + 엘리멘탈 드레인(233) 보유 시 선택지에 뜨고, 해금되면 블레이즈 샷 슬롯을 그대로 넘겨받는다. 3레벨까지.
	-- 220/240/270, 쿨 6초, 타겟 2명. 원작 불독 아크메이지 "메테오"(skill/2121007, 리소스 미지정이라 내가 고름) 운석이 타겟 자리로 떨어지고,
	-- 운석이 지나간 궤적(+착탄 폭발)에 걸린 몬스터 전부 100% + 화상 100%(2초, 1초마다 50%, MarkBurned). 문구는 "관통"(유저 지정 — 궤적 100%로 처리).
	-- 아르카나 메테오(Card5)와 이름이 겹쳐 프로퍼티 접두사는 Card244 / 레벨은 MeteorBLevel.
	-- 클립 실측: tile/4 23프레임 — 0.63초부터 운석이 기준점 오른쪽 위(그림 중심 2.63, 3.51)에서 떨어져 0.99초에 착탄(422x400 폭발, 기준점 = 아래 가운데),
	--   1.62초부터 빈 그림 / hit/0 6프레임 0.21초 ~100px
	@Sync property integer MeteorBLevel = 0
	property number Card244Cooldown = 6.0
	property integer Card244TargetCount = 2
	property string Card244RockRUID = "1e542c912d3044b49b465ff465cff192"
	property string Card244HitRUID = "9dadb8bef6954b6f9bcff0d2a581a938"
	property string Card244UseSoundRUID = "98fbeec0bc974243bcd6625b5e3adf8a"
	property string Card244HitSoundRUID = "08e38d11bd3442929a74fded2a73c788"
	property number Card244RockScale = 0.6
	property number Card244RockLifetime = 1.6  -- 1.62초부터 빈 그림
	property number Card244FallStart = 0.63  -- 운석이 떨어지기 시작하는 12번째 프레임
	property number Card244ImpactTime = 0.99  -- 착탄 16번째 프레임
	property number Card244StartX = 2.63  -- 낙하 시작점(그림 중심) — 기준점에서 가로(원본은 오른쪽, 1배·스케일 곱하기 전)
	property number Card244StartY = 3.51  -- 낙하 시작점 높이
	property number Card244Tick = 0.03
	property number Card244HeadRadius = 0.5  -- 운석 머리 판정 반경(1배) — 몬스터 몸통 점까지 거리
	property number Card244BodyYOffset = 0.5
	property number Card244BlastHalfW = 1.1  -- 착탄 폭발 판정 타원(발밑 기준, 1배)
	property number Card244BlastHalfH = 0.5
	property number Card244HitScale = 0.8
	property number Card244HitLifetime = 0.18  -- 클립 0.21초보다 살짝 짧게
	property number Card244BurnRatio = 0.5
	property integer Card244BurnSeconds = 2
	property number Card244ShotInterval = 0.15

	method number GetMeteorBDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 220/240/270
		if level >= 3 then return 270
		elseif level >= 2 then return 240
		end
		return 220
	end

	@ExecSpace("ServerOnly")
	method void MeteorBAttack(number damage, boolean isCrit)
		-- 메테오 시전 — 가까운 2명 자리마다 운석 1개
		local map = self:GetCurrentMap()
		if map == nil then return end
		self:PlayBreathSfx(self.Card244UseSoundRUID)
		local targets = self:GetClosestTargets(self.Card244TargetCount)
		for shotIndex, mob in ipairs(targets) do
			---@type MonsterAI
			local target = mob
			if isvalid(target) and isvalid(target.Entity) then
				local ratio = self:GetEffectScaleRatio(target)
				local tp = self:WorldToCurrentMapLocal(target.Entity.TransformComponent.WorldPosition)
				local band = self:GetDepthBand(target)
				local zoneIndex = target._spawnZoneIndex
				_TimerService:SetTimerOnce(function()
					if not isvalid(self) then return end
					if zoneIndex ~= _MapManager.CurrentMapIndex then return end
					self:CastMeteorB(map, tp, ratio, band, damage, isCrit, zoneIndex)
				end, (shotIndex - 1) * self.Card244ShotInterval)
			end
		end
		log("MeteorBAttack: lv=" .. self.MeteorBLevel .. " targets=" .. #targets .. " dmg=" .. math.floor(damage))
	end

	@ExecSpace("ServerOnly")
	method void CastMeteorB(Entity map, Vector3 tp, number ratio, boolean band, number damage, boolean isCrit, integer zoneIndex)
		-- 운석 1개 — 플레이어 쪽 위에서 타겟 발밑으로 떨어진다. 떨어지는 동안 머리가 지나간 몬스터 → 착탄 폭발 범위 몬스터 순으로 100%(몬스터당 1회)
		local side = self:GetBenoaSideSign(tp.x)
		local scale = self.Card244RockScale * ratio
		local rock = self:SpawnEffectWithModel(self.Card244RockRUID, Vector3(tp.x, tp.y, tp.z), 0, 1.0, scale, 1, "skilleffectlong")
		if rock ~= nil then
			-- 원본은 오른쪽 위에서 떨어진다 — 플레이어가 왼쪽이면 뒤집어서 플레이어 쪽에서 오게
			local renderer = rock.SpriteRendererComponent
			if renderer ~= nil then renderer.FlipX = side < 0 end
			rock:Destroy(self.Card244RockLifetime)
		end
		local sx = tp.x + side * self.Card244StartX * scale
		local sy = tp.y + self.Card244StartY * scale
		local hitSet = {}
		local burnPerTick = damage * self.Card244BurnRatio
		local function strike(m)
			local mr = self:GetEffectScaleRatio(m)
			local mp = m.Entity.TransformComponent.Position
			local hfx = self:SpawnEffect(self.Card244HitRUID, Vector3(mp.x, mp.y + self.Card244BodyYOffset * mr, mp.z), 0, 1.0, self.Card244HitScale * mr, 1)
			if hfx ~= nil then hfx:Destroy(self.Card244HitLifetime) end
			if isCrit then _DpsMeterLogic:Tag(244, m):TakeDamageCrit(damage * 2)
			else _DpsMeterLogic:Tag(244, m):TakeDamage(damage) end
			if not m._dead then m:ApplyDot(burnPerTick, self.Card244BurnSeconds, 1.0); m:MarkBurned(self.Card244BurnSeconds) end
		end
		-- 낙하 구간 — 운석 머리 위치를 시작점→발밑으로 보간하며 0.03초마다 훑는다
		local fallTime = self.Card244ImpactTime - self.Card244FallStart
		local steps = math.max(1, math.floor(fallTime / self.Card244Tick + 0.5))
		local headR = self.Card244HeadRadius * ratio
		for i = 1, steps do
			local u = i / steps
			_TimerService:SetTimerOnce(function()
				if not isvalid(self) then return end
				if zoneIndex ~= _MapManager.CurrentMapIndex then return end
				local hx = sx + (tp.x - sx) * u
				local hy = sy + (tp.y + self.Card244BodyYOffset * ratio - sy) * u
				for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
					---@type MonsterAI
					local m = mob
					if isvalid(m) and isvalid(m.Entity) and not m._dead and not hitSet[m] then
						local mp = m.Entity.TransformComponent.Position
						local by = mp.y + self.Card244BodyYOffset * self:GetEffectScaleRatio(m)
						if self:InEllipse(mp.x - hx, by - hy, headR, headR) and self:IsInDepthBand(m, band) then
							hitSet[m] = true
							strike(m)
						end
					end
				end
			end, self.Card244FallStart + fallTime * u)
		end
		-- 착탄 — 폭발 범위 안 아직 안 맞은 몬스터
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if zoneIndex ~= _MapManager.CurrentMapIndex then return end
			self:PlayBreathSfx(self.Card244HitSoundRUID)
			local halfW = self.Card244BlastHalfW * ratio
			local halfH = self.Card244BlastHalfH * ratio
			for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead and not hitSet[m] then
					local mp = m.Entity.TransformComponent.Position
					if self:InEllipse(mp.x - tp.x, mp.y - tp.y, halfW, halfH) and self:IsInDepthBand(m, band) then
						hitSet[m] = true
						strike(m)
					end
				end
			end
			local total = 0
			for _ in pairs(hitSet) do total = total + 1 end
			log("MeteorBHit: hit=" .. total .. " side=" .. side .. " burn=" .. math.floor(burnPerTick) .. "x" .. self.Card244BurnSeconds)
		end, self.Card244ImpactTime + 0.01)
	end

`;
before('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

after('\t\tif cardIdx == 243 then return self.ToxicBomberLevel > 0 end', '\t\tif cardIdx == 244 then return self.MeteorBLevel > 0 end');
after('\t\telseif cardIdx == 243 then base = self:GetToxicBomberDamage(self.ToxicBomberLevel)', '\t\telseif cardIdx == 244 then base = self:GetMeteorBDamage(self.MeteorBLevel)');
after('\t\telseif cardIdx == 243 then return self.Card243Cooldown', '\t\telseif cardIdx == 244 then return self.Card244Cooldown');
after('\t\telseif cardIdx == 243 then return "toxicbomber_up"', '\t\telseif cardIdx == 244 then return "meteorb_up"', 2);
after('\t\telseif cardIdx == 243 then self.ToxicBomberLevel = 1', '\t\telseif cardIdx == 244 then self.MeteorBLevel = 1');
after('\t\telseif cardIdx == 243 then return self.ToxicBomberLevel', '\t\telseif cardIdx == 244 then return self.MeteorBLevel');
after('\t\telseif cardIdx == 243 then self.ToxicBomberLevel = level', '\t\telseif cardIdx == 244 then self.MeteorBLevel = level');
after('\t\telseif name == "ToxicBomberLevel" then self:RefreshSlotIfHoldsCard(243)', '\t\telseif name == "MeteorBLevel" then self:RefreshSlotIfHoldsCard(244)');
after('\t\t\t\t\tself:ToxicBomberAttack(damage, isCrit)', '\t\t\t\telseif cardIndex == 244 then\n\t\t\t\t\tself:MeteorBAttack(damage, isCrit)');

before(`		elseif cardIdx == 243 then
			return {`,
`		elseif cardIdx == 244 then
			return {
				"MLUA_CARDMANAGER_613",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_604",
			}`);
before(`		elseif cardIdx == 243 then
			extraStr = `,
`		elseif cardIdx == 244 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_125", self.Card244TargetCount, self.Card244BurnSeconds, math.floor(self.Card244BurnRatio * 100 + 0.5))`);

const bs = `			if self.BlazeShotLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 230, type = "unlock" }) end
			elseif self.BlazeShotLevel < 5 then
				table.insert(pool, { card = 230, type = "blazeshot_up" })
			end
`;
if (count(src, bs) !== 1) throw new Error('blaze shot choice anchor ' + count(src, bs));
src = src.replace(bs, `			-- 블레이즈 샷(230) — 메테오로 조합된 뒤에는 더 이상 등장하지 않음
			if self.MeteorBLevel == 0 then
				if self.BlazeShotLevel == 0 then
					if hasEmptySlot then table.insert(pool, { card = 230, type = "unlock" }) end
				elseif self.BlazeShotLevel < 5 then
					table.insert(pool, { card = 230, type = "blazeshot_up" })
				end
			end
			-- 메테오(244, 조합) — 블레이즈 샷 Lv5 + 매직 액셀레이션(231) + 엘리멘탈 드레인(233). 블레이즈 샷 슬롯 승계
			if self.BlazeShotLevel >= 5 and self:IsCardUnlocked(231) and self:IsCardUnlocked(233) and self.MeteorBLevel == 0 then
				table.insert(pool, { card = 244, type = "unlock" })
			elseif self.MeteorBLevel > 0 and self.MeteorBLevel < 3 then
				table.insert(pool, { card = 244, type = "meteorb_up" })
			end
`);

before(`		if cardIdx == 243 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.ToxicBomberLevel + 1)`,
`		if cardIdx == 244 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.MeteorBLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(244)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(244))
			return
		end
`);

before('\t\t-- ToxicBomber(베노아 조합',
`		-- MeteorB(베노아 조합 메테오 — 블레이즈 샷 슬롯을 그대로 넘겨받는다)
		if cardIdx == 244 then
			if upgradeType == "unlock" then
				self.MeteorBLevel = 1
				local bsSlot = self:GetSlotForCard(230)
				if bsSlot > 0 then
					self:AssignCardToSlot(bsSlot, 244)
					self:ResetSlotTimer(bsSlot)
					self:PlayThunderStormFusionEffect(bsSlot)
					log("Card244(Meteor) fused into Slot" .. bsSlot .. " (was BlazeShot)")
				else
					log_warning("Meteor(244): BlazeShot not found in any slot — fusion could not place the card")
				end
			elseif upgradeType == "meteorb_up" and self.MeteorBLevel < 3 then
				self.MeteorBLevel = self.MeteorBLevel + 1
			end
			log("Meteor(244) L" .. self.MeteorBLevel .. " (dmg=" .. math.floor(self:GetMeteorBDamage(self.MeteorBLevel)) .. ")")
			return
		end
`);

rep('\t\t\tif self:IsCardUnlocked(230) and self.BlazeShotLevel < 5 then table.insert(pool, 230) end',
'\t\t\tif self:IsCardUnlocked(230) and self.BlazeShotLevel < 5 and self.MeteorBLevel == 0 then table.insert(pool, 230) end\n\t\t\tif self:IsCardUnlocked(244) and self.MeteorBLevel < 3 then table.insert(pool, 244) end');
after('\t\tself.ToxicBomberLevel = 0', '\t\tself.MeteorBLevel = 0');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
