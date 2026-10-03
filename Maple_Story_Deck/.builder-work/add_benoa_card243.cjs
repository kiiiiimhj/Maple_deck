// 베노아 조합 카드243(톡식 봄버) = 포이즌 버스트(229) Lv5 + 마나 웨이브(232) + 매직 가드(234). 포이즌 버스트 슬롯 승계. 재실행 안전.
const fs = require('fs');
const NL = '\n';
function count(h, n) { let c = 0, i = 0; while ((i = h.indexOf(n, i)) >= 0) { c++; i += n.length; } return c; }
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
if (src.includes('@Sync property integer ToxicBomberLevel')) { console.log('already applied'); process.exit(0); }
function after(anchorLine, add, expected = 1) {
  const needle = anchorLine + NL; const c = count(src, needle);
  if (c !== expected) throw new Error(`anchor ${c} != ${expected}: ${anchorLine}`);
  src = src.split(needle).join(needle + add + NL);
}
function before(anchor, add) { const c = count(src, anchor); if (c !== 1) throw new Error(`before ${c}: ${anchor.slice(0, 70)}`); src = src.replace(anchor, add + NL + anchor); }
function rep(a, b) { const c = count(src, a); if (c !== 1) throw new Error(`rep ${c}: ${a.slice(0, 70)}`); src = src.replace(a, b); }

const block = `	-- ── 베노아 조합: 톡식 봄버(카드243) — 유저 지정 2026-10-04 ──
	-- 포이즌 버스트(229) Lv5 + 마나 웨이브(232) + 매직 가드(234) 보유 시 선택지에 뜨고, 해금되면 포이즌 버스트 슬롯을 그대로 넘겨받는다. 3레벨까지.
	-- 260/280/300, 쿨 6초, 타겟 1명. 연출은 포이즌 버스트와 같은 독 구체(d22e7d28)가 맺히며 타겟 1명에게 대미지 → 터지는 부분만 다름(유저 지정):
	-- 그 자리에 독 장판(skill/400021102 mob/2 b0503c7e + hit/0 c73783da 겹침)이 남아 1초마다 범위 틱(기준 대미지의 30/40/50%), 끝날 때 hit/1(5ec3bc93)로 사라진다.
	-- 장판 지속은 유저 표에 없어 3초로 정함(틱 1/2/3초). 틱은 엘리멘탈 드레인 배율 + 포이즌 트랩 대상 표시(MarkPoisoned).
	-- 클립 실측: mob/2 9프레임 0.81초 100x116 기준점 그림 아래 / hit/0 8프레임 0.72초 ~316px 가운데 / hit/1 9프레임 0.81초 ~520px 가운데
	@Sync property integer ToxicBomberLevel = 0
	property number Card243Cooldown = 6.0
	property string Card243MistRUID = "b0503c7e1c8444038142ebc4ea44931a"  -- mob/2 — 장판 위 일렁이는 독(루프)
	property string Card243CloudRUID = "c73783da50b94704983adf3389bda8c2"  -- hit/0 — 장판 독 구름(루프)
	property string Card243VanishRUID = "5ec3bc9335be40d3ae8bf778cd2d5a17"  -- hit/1 — 사라지는 연출
	property string Card243UseSoundRUID = "1191639174ce47a09a52a075c6ed51c6"
	property string Card243HitSoundRUID = "3fe422522f1841e68da7604640b87af4"
	property number Card243ImpactDelay = 0.14  -- 독 구체 3번째 프레임(포이즌 버스트 1타와 같은 시점) — 첫 대미지
	property number Card243FieldDelay = 0.42  -- 독 구체가 끝나고 장판이 깔리는 시점
	property number Card243FieldDuration = 3.0
	property number Card243TickInterval = 1.0
	property number Card243MistScale = 1.2
	property number Card243CloudScale = 0.5
	property number Card243VanishScale = 0.4
	property number Card243VanishLifetime = 0.76  -- 클립 0.81초보다 살짝 짧게
	property number Card243HalfW = 0.9  -- 장판 판정 타원(발밑 기준, 1배)
	property number Card243HalfH = 0.5

	method number GetToxicBomberDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 260/280/300
		if level >= 3 then return 300
		elseif level >= 2 then return 280
		end
		return 260
	end

	method number GetToxicBomberTickRatio(integer level)
		-- 장판 초당 틱 비율 — 30/40/50%
		if level >= 3 then return 0.5
		elseif level >= 2 then return 0.4
		end
		return 0.3
	end

	@ExecSpace("ServerOnly")
	method void ToxicBomberAttack(number damage, boolean isCrit)
		-- 톡식 봄버 시전 — 가장 가까운 1명 자리에 독 구체 → 첫 대미지 → 독 장판
		local map = self:GetCurrentMap()
		if map == nil then return end
		local target = self:GetClosestTargets(1)[1]
		if not isvalid(target) or not isvalid(target.Entity) then return end
		self:PlayBreathSfx(self.Card243UseSoundRUID)
		local ratio = self:GetEffectScaleRatio(target)
		local tp = self:WorldToCurrentMapLocal(target.Entity.TransformComponent.WorldPosition)
		local band = self:GetDepthBand(target)
		local zoneIndex = target._spawnZoneIndex
		local level = self.ToxicBomberLevel
		-- 포이즌 버스트와 같은 독 구체
		local orb = self:SpawnEffect(self.Card229BurstRUID, Vector3(tp.x, tp.y + self.Card229BurstYOffset * ratio, tp.z), 0, 1.0, self.Card229BurstScale * ratio, 1)
		if orb ~= nil then orb:Destroy(self.Card229BurstLifetime) end
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if zoneIndex ~= _MapManager.CurrentMapIndex then return end
			if isvalid(target) and isvalid(target.Entity) and not target._dead then
				self:PlayBreathSfx(self.Card243HitSoundRUID)
				if isCrit then _DpsMeterLogic:Tag(243, target):TakeDamageCrit(damage * 2)
				else _DpsMeterLogic:Tag(243, target):TakeDamage(damage) end
			end
		end, self.Card243ImpactDelay)
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if zoneIndex ~= _MapManager.CurrentMapIndex then return end
			self:SpawnToxicField(map, tp, ratio, band, damage * self:GetToxicBomberTickRatio(level), zoneIndex)
		end, self.Card243FieldDelay)
		log("ToxicBomberAttack: lv=" .. level .. " dmg=" .. math.floor(isCrit and damage * 2 or damage) .. " tick=" .. math.floor(damage * self:GetToxicBomberTickRatio(level)))
	end

	@ExecSpace("ServerOnly")
	method void SpawnToxicField(Entity map, Vector3 tp, number ratio, boolean band, number tickBase, integer zoneIndex)
		-- 독 장판 — 두 클립을 겹쳐 지속 동안 루프, 1초마다 범위 틱, 끝날 때 사라지는 연출
		local duration = self.Card243FieldDuration
		local mist = self:SpawnEffectWithModel(self.Card243MistRUID, Vector3(tp.x, tp.y, tp.z), 0, 1.0, self.Card243MistScale * ratio, 1, "persistenteffect")
		if mist ~= nil then mist:Destroy(duration) end
		local cloud = self:SpawnEffectWithModel(self.Card243CloudRUID, Vector3(tp.x, tp.y + self.Card229BodyYOffset * ratio, tp.z), 0, 1.0, self.Card243CloudScale * ratio, 1, "persistenteffect")
		if cloud ~= nil then cloud:Destroy(duration) end
		local halfW = self.Card243HalfW * ratio
		local halfH = self.Card243HalfH * ratio
		-- 엘리멘탈 드레인(233) — 틱 대미지라 같이 오른다(ApplyDot 경로가 아니라 여기서 직접 곱한다)
		local tickDamage = tickBase * self:GetElementalDrainMult()
		local tick = self.Card243TickInterval
		local tickNo = 0
		while tick <= duration + 0.001 do
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
						if self:InEllipse(mp.x - tp.x, mp.y - tp.y, halfW, halfH) and self:IsInDepthBand(m, band) then
							hitCount = hitCount + 1
							_DpsMeterLogic:Tag(243, m):TakeDamage(tickDamage)
							if not m._dead then m:MarkPoisoned(self.Card243TickInterval + 0.2) end
						end
					end
				end
				log("ToxicFieldTick: #" .. thisTick .. " hit=" .. hitCount .. " dmg=" .. math.floor(tickDamage))
			end, tick)
			tick = tick + self.Card243TickInterval
		end
		-- 사라지는 연출 — 장판이 걷히기 직전에 띄워 자연스럽게 넘긴다
		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if zoneIndex ~= _MapManager.CurrentMapIndex then return end
			local vfx = self:SpawnEffect(self.Card243VanishRUID, Vector3(tp.x, tp.y + self.Card229BodyYOffset * ratio, tp.z), 0, 1.0, self.Card243VanishScale * ratio, 1)
			if vfx ~= nil then vfx:Destroy(self.Card243VanishLifetime) end
		end, math.max(0, duration - 0.1))
	end

`;
before('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

after('\t\tif cardIdx == 242 then return self.IgniteWallLevel > 0 end', '\t\tif cardIdx == 243 then return self.ToxicBomberLevel > 0 end');
after('\t\telseif cardIdx == 242 then base = self:GetIgniteWallDamage(self.IgniteWallLevel)', '\t\telseif cardIdx == 243 then base = self:GetToxicBomberDamage(self.ToxicBomberLevel)');
after('\t\telseif cardIdx == 242 then return self.Card242Cooldown', '\t\telseif cardIdx == 243 then return self.Card243Cooldown');
after('\t\telseif cardIdx == 242 then return "ignitewall_up"', '\t\telseif cardIdx == 243 then return "toxicbomber_up"', 2);
after('\t\telseif cardIdx == 242 then self.IgniteWallLevel = 1', '\t\telseif cardIdx == 243 then self.ToxicBomberLevel = 1');
after('\t\telseif cardIdx == 242 then return self.IgniteWallLevel', '\t\telseif cardIdx == 243 then return self.ToxicBomberLevel');
after('\t\telseif cardIdx == 242 then self.IgniteWallLevel = level', '\t\telseif cardIdx == 243 then self.ToxicBomberLevel = level');
after('\t\telseif name == "IgniteWallLevel" then self:RefreshSlotIfHoldsCard(242)', '\t\telseif name == "ToxicBomberLevel" then self:RefreshSlotIfHoldsCard(243)');
after('\t\t\t\t\tself:IgniteWallAttack(damage, isCrit)', '\t\t\t\telseif cardIndex == 243 then\n\t\t\t\t\tself:ToxicBomberAttack(damage, isCrit)');

before(`		elseif cardIdx == 242 then
			return {`,
`		elseif cardIdx == 243 then
			return {
				"MLUA_CARDMANAGER_611",
				"MLUA_CARDMANAGER_612",
				"MLUA_CARDMANAGER_612",
			}`);
before(`		elseif cardIdx == 242 then
			extraStr = `,
`		elseif cardIdx == 243 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_124", math.floor(self.Card243FieldDuration + 0.5), math.floor(self:GetToxicBomberTickRatio(math.max(1, self.ToxicBomberLevel)) * 100 + 0.5))`);

const pb = `			if self.PoisonBurstLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 229, type = "unlock" }) end
			elseif self.PoisonBurstLevel < 5 then
				table.insert(pool, { card = 229, type = "poisonburst_up" })
			end
`;
if (count(src, pb) !== 1) throw new Error('poison burst choice anchor ' + count(src, pb));
src = src.replace(pb, `			-- 포이즌 버스트(229) — 톡식 봄버로 조합된 뒤에는 더 이상 등장하지 않음
			if self.ToxicBomberLevel == 0 then
				if self.PoisonBurstLevel == 0 then
					if hasEmptySlot then table.insert(pool, { card = 229, type = "unlock" }) end
				elseif self.PoisonBurstLevel < 5 then
					table.insert(pool, { card = 229, type = "poisonburst_up" })
				end
			end
			-- 톡식 봄버(243, 조합) — 포이즌 버스트 Lv5 + 마나 웨이브(232) + 매직 가드(234). 포이즌 버스트 슬롯 승계
			if self.PoisonBurstLevel >= 5 and self:IsCardUnlocked(232) and self:IsCardUnlocked(234) and self.ToxicBomberLevel == 0 then
				table.insert(pool, { card = 243, type = "unlock" })
			elseif self.ToxicBomberLevel > 0 and self.ToxicBomberLevel < 3 then
				table.insert(pool, { card = 243, type = "toxicbomber_up" })
			end
`);

before(`		if cardIdx == 242 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.IgniteWallLevel + 1)`,
`		if cardIdx == 243 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.ToxicBomberLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(243)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(243))
			return
		end
`);

before('\t\t-- IgniteWall(베노아 조합',
`		-- ToxicBomber(베노아 조합 — 포이즌 버스트 슬롯을 그대로 넘겨받는다)
		if cardIdx == 243 then
			if upgradeType == "unlock" then
				self.ToxicBomberLevel = 1
				local pbSlot = self:GetSlotForCard(229)
				if pbSlot > 0 then
					self:AssignCardToSlot(pbSlot, 243)
					self:ResetSlotTimer(pbSlot)
					self:PlayThunderStormFusionEffect(pbSlot)
					log("Card243(ToxicBomber) fused into Slot" .. pbSlot .. " (was PoisonBurst)")
				else
					log_warning("ToxicBomber: PoisonBurst not found in any slot — fusion could not place the card")
				end
			elseif upgradeType == "toxicbomber_up" and self.ToxicBomberLevel < 3 then
				self.ToxicBomberLevel = self.ToxicBomberLevel + 1
			end
			log("ToxicBomber L" .. self.ToxicBomberLevel .. " (dmg=" .. math.floor(self:GetToxicBomberDamage(self.ToxicBomberLevel)) .. ")")
			return
		end
`);

rep('\t\t\tif self:IsCardUnlocked(229) and self.PoisonBurstLevel < 5 then table.insert(pool, 229) end',
'\t\t\tif self:IsCardUnlocked(229) and self.PoisonBurstLevel < 5 and self.ToxicBomberLevel == 0 then table.insert(pool, 229) end\n\t\t\tif self:IsCardUnlocked(243) and self.ToxicBomberLevel < 3 then table.insert(pool, 243) end');
after('\t\tself.IgniteWallLevel = 0', '\t\tself.ToxicBomberLevel = 0');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
