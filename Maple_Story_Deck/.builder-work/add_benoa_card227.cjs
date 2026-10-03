// 베노아 카드227(포이즌 트랩)을 CardManager.mlua 의 각 연결 지점에 삽입한다(카드226 줄을 앵커로 씀).
// 재실행 안전: 이미 "PoisonTrapLevel" 프로퍼티가 있으면 아무것도 안 한다.
const fs = require('fs');
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
const NL = '\n';
if (src.includes('@Sync property integer PoisonTrapLevel')) { console.log('already applied'); process.exit(0); }

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

const block = `	-- ── 베노아: 포이즌 트랩(카드227) — 유저 지정 2026-10-03 ──
	-- 100/120/140/160/180, 쿨 6초. 타겟 = 지금 중독된 몬스터 전부(MonsterAI.IsPoisoned — 포이즌 브레스 중독 / 독무 안).
	-- 중독된 몬스터가 하나도 없으면 시전하지 않고 쿨타임이 다 찬 채로 대기한다(메소 익스플로젼과 같은 skipCooldownReset 경로).
	-- 맞은 몬스터는 속박 2초(100%) — 살짝 뜨고(ApplyLevitate) 멈추며(ApplyStun), 넝쿨(mob/0)이 몸통을 감는다(MonsterAI.ApplyPoisonTrapVine).
	-- 넝쿨 크기는 몸 높이에 비례하되 상한이 있어 큰 몬스터도 몸통에만 감긴다(MonsterAI.PoisonTrapVine* 값).
	@Sync property integer PoisonTrapLevel = 0
	property number Card227Cooldown = 6.0
	property string Card227HitRUID = "4528050d32f04dd78b8509931912b650"  -- hit/0, 10프레임 0.6초, 약 2.4유닛 가운데 피벗
	property string Card227UseSoundRUID = "f0f6482a9c2b4ad59baff123312e0356"
	property string Card227HitSoundRUID = "05f82f9ab544439d893d481957dab1d8"
	property number Card227HitScale = 0.6
	property number Card227HitLifetime = 0.6
	property number Card227BodyYOffset = 0.5  -- 타격 연출 = 발밑 + 이 값
	property number Card227RootDuration = 2.0

	method number GetPoisonTrapDamage(integer level)
		-- 레벨별 기준 대미지(유저 표) — 100/120/140/160/180
		if level >= 5 then return 180
		elseif level >= 4 then return 160
		elseif level >= 3 then return 140
		elseif level >= 2 then return 120
		end
		return 100
	end

	@ExecSpace("ServerOnly")
	method boolean PoisonTrapAttack(number damage, boolean isCrit)
		-- 포이즌 트랩 — 중독된 몬스터 전부에게 대미지 + 속박. 대상이 없으면 false(쿨타임을 돌리지 않고 대기)
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
		-- 넝쿨 표시 시간은 실제 속박 시간과 맞춘다(유물 시몬수의자가 ApplyStun/ApplyLevitate 안에서 늘리는 몫까지)
		local dur = self.Card227RootDuration
		local vineDur = dur * _RelicInventory:GetAilmentDurationMult()
		for _, mob in ipairs(targets) do
			---@type MonsterAI
			local m = mob
			local ratio = self:GetEffectScaleRatio(m)
			local mp = self:WorldToCurrentMapLocal(m.Entity.TransformComponent.WorldPosition)
			local fx = self:SpawnEffect(self.Card227HitRUID, Vector3(mp.x, mp.y + self.Card227BodyYOffset * ratio, mp.z), 0, 1.0, self.Card227HitScale * ratio, 1)
			if fx ~= nil then fx:Destroy(self.Card227HitLifetime) end
			if isCrit then _DpsMeterLogic:Tag(227, m):TakeDamageCrit(damage * 2)
			else _DpsMeterLogic:Tag(227, m):TakeDamage(damage) end
			if not m._dead then
				-- 속박 100% — 살짝 떠서 멈춘다(비행 몬스터는 ApplyLevitate가 스스로 건너뛴다)
				m:ApplyStun(dur, false)
				m:ApplyLevitate(dur)
				m:ApplyPoisonTrapVine(vineDur)
			end
		end
		log("PoisonTrapAttack: lv=" .. self.PoisonTrapLevel .. " targets=" .. #targets .. " dmg=" .. math.floor(isCrit and damage * 2 or damage) .. " root=" .. dur .. "s")
		return true
	end
`;
insertBefore('\t-- ── 레이온: 인사이징 (Card 192) / 인사이징:관', block);

insertAfterLine('\t\tif cardIdx == 226 then return self.PoisonMistLevel > 0 end',
'\t\tif cardIdx == 227 then return self.PoisonTrapLevel > 0 end');
insertAfterLine('\t\telseif cardIdx == 226 then base = self:GetPoisonMistDamage(self.PoisonMistLevel)',
'\t\telseif cardIdx == 227 then base = self:GetPoisonTrapDamage(self.PoisonTrapLevel)');
insertAfterLine('\t\telseif cardIdx == 226 then return self.Card226Cooldown',
'\t\telseif cardIdx == 227 then return self.Card227Cooldown');
insertAfterLine('\t\telseif cardIdx == 226 then return "poisonmist_up"',
'\t\telseif cardIdx == 227 then return "poisontrap_up"', 2);
insertAfterLine('\t\telseif cardIdx == 226 then self.PoisonMistLevel = 1',
'\t\telseif cardIdx == 227 then self.PoisonTrapLevel = 1');
insertAfterLine('\t\telseif cardIdx == 226 then return self.PoisonMistLevel',
'\t\telseif cardIdx == 227 then return self.PoisonTrapLevel');
insertAfterLine('\t\telseif cardIdx == 226 then self.PoisonMistLevel = level',
'\t\telseif cardIdx == 227 then self.PoisonTrapLevel = level');
insertAfterLine('\t\telseif name == "PoisonMistLevel" then self:RefreshSlotIfHoldsCard(226)',
'\t\telseif name == "PoisonTrapLevel" then self:RefreshSlotIfHoldsCard(227)');
insertAfterLine('\t\t\t\t\tself:PoisonMistAttack(damage, isCrit)',
`				elseif cardIndex == 227 then
					-- 중독된 대상이 없으면 쿨타임을 돌리지 않고 대기(메소 익스플로젼과 같은 경로)
					if not self:PoisonTrapAttack(damage, isCrit) then skipCooldownReset = true end`);

insertBefore(`		elseif cardIdx == 226 then
			return {`,
`		elseif cardIdx == 227 then
			return {
				"MLUA_CARDMANAGER_591",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_125",
				"MLUA_CARDMANAGER_125",
			}`);

insertBefore(`		elseif cardIdx == 226 then
			extraStr = `,
`		elseif cardIdx == 227 then
			extraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_117", string.format("%.0f", self.Card227RootDuration))`);

const lvAnchor = `			elseif self.PoisonMistLevel < 5 then
				table.insert(pool, { card = 226, type = "poisonmist_up" })
			end
`;
if (count(src, lvAnchor) !== 1) throw new Error('levelup anchor');
src = src.replace(lvAnchor, lvAnchor + `			if self.PoisonTrapLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 227, type = "unlock" }) end
			elseif self.PoisonTrapLevel < 5 then
				table.insert(pool, { card = 227, type = "poisontrap_up" })
			end
`);

insertBefore(`		if cardIdx == 226 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.PoisonMistLevel + 1)`,
`		if cardIdx == 227 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.PoisonTrapLevel + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(227)
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(227))
			return
		end
`);

insertBefore('\t\t-- PoisonMist(베노아 전용, 슬롯형 액티브)',
`		-- PoisonTrap(베노아 전용, 슬롯형 액티브)
		if cardIdx == 227 then
			if upgradeType == "unlock" then
				self.PoisonTrapLevel = 1
				local slotIdx = self:GetNextEmptySlot()
				if slotIdx > 0 then
					self:AssignCardToSlot(slotIdx, 227)
					self:ResetSlotTimer(slotIdx)
					log("Card227(PoisonTrap) -> Slot" .. slotIdx)
				end
			elseif upgradeType == "poisontrap_up" and self.PoisonTrapLevel < 5 then
				self.PoisonTrapLevel = self.PoisonTrapLevel + 1
			end
			log("PoisonTrap L" .. self.PoisonTrapLevel .. " (dmg=" .. math.floor(self:GetPoisonTrapDamage(self.PoisonTrapLevel)) .. ")")
			return
		end
`);

insertAfterLine('\t\t\tif self:IsCardUnlocked(226) and self.PoisonMistLevel < 5 then table.insert(pool, 226) end',
'\t\t\tif self:IsCardUnlocked(227) and self.PoisonTrapLevel < 5 then table.insert(pool, 227) end');
insertAfterLine('\t\tself.PoisonMistLevel = 0',
'\t\tself.PoisonTrapLevel = 0');

fs.writeFileSync(path, src, 'utf8');
console.log('applied OK');
