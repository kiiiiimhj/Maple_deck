// 베노아 패시브 5종(카드231~235)을 CardManager.mlua / MonsterAI.mlua 연결 지점에 삽입한다(린 패시브 213/214 줄을 앵커로 씀).
// 재실행 안전: 이미 "MagicAccelLevel" 프로퍼티가 있으면 아무것도 안 한다.
const fs = require('fs');
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
const NL = '\n';
if (src.includes('@Sync property integer MagicAccelLevel')) { console.log('already applied'); process.exit(0); }

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
function replaceOnce(from, to) {
  const c = count(src, from);
  if (c !== 1) throw new Error(`replace count ${c} != 1: ${from.slice(0, 80)}`);
  src = src.replace(from, to);
}

const P = [
  { idx: 231, prop: 'MagicAccelLevel', key: 'magicaccel', buff: 'magicAccel', fn: 'MagicAccel', up: 'magicaccel_up' },
  { idx: 232, prop: 'ManaWaveLevel', key: 'manawave', buff: 'manaWave', fn: 'ManaWave', up: 'manawave_up' },
  { idx: 233, prop: 'ElementalDrainLevel', key: 'elementaldrain', buff: 'elementalDrain', fn: 'ElementalDrain', up: 'elementaldrain_up' },
  { idx: 234, prop: 'MagicGuardLevel', key: 'magicguard', buff: 'magicGuard', fn: 'MagicGuard', up: 'magicguard_up' },
  { idx: 235, prop: 'HighWisdomLevel', key: 'highwisdom', buff: 'highWisdom', fn: 'HighWisdom', up: 'highwisdom_up' },
];

// ── 1) 프로퍼티 + 게터(린 패시브 블록 뒤) ──
insertBefore('\t-- 표창술(214) 추가 공격 발동 확률 — 기본 공격이 나갈 때마다 TickCard(slotIndex==0)에서 굴린다.',
`	-- ── 베노아 패시브 5종(231~235, 유저 지정 2026-10-03) — 슬롯을 차지하지 않고 해금 즉시 영구 적용된다.
	-- 수치는 CardRegistry chancePerLevel. 매직 액셀레이션 = 쿨타임 감소(GetEffectiveCooldown), 마나 웨이브 = 크리티컬(RollCrit),
	-- 엘리멘탈 드레인 = 도트(화상·중독·출혈 등 ApplyDot) + 독무 틱 대미지 증가, 매직 가드 = 받는 피해 감소(GetMagicArmorReduction에 합산),
	-- 하이 위즈덤 = 피해량 증가(GetCardDamage 전역 곱연산)
	@Sync property integer MagicAccelLevel = 0
	@Sync property integer ManaWaveLevel = 0
	@Sync property integer ElementalDrainLevel = 0
	@Sync property integer MagicGuardLevel = 0
	@Sync property integer HighWisdomLevel = 0

	method number GetMagicAccelReduction()
		-- 매직 액셀레이션(231) 쿨타임 감소율 — 5/7/10/12/15%
		return _CardRegistry:GetChance(231, self.MagicAccelLevel)
	end

	method number GetElementalDrainMult()
		-- 엘리멘탈 드레인(233) 틱 대미지 배율 — +3/6/9/12/15%
		return 1.0 + _CardRegistry:GetChance(233, self.ElementalDrainLevel)
	end

	method number GetMagicGuardReduction()
		-- 매직 가드(234) 받는 피해 감소율 — 5/7/10/12/15%
		return _CardRegistry:GetChance(234, self.MagicGuardLevel)
	end

	method number GetHighWisdomMult()
		-- 하이 위즈덤(235) 피해량 배율 — +3/6/9/12/15%
		return 1.0 + _CardRegistry:GetChance(235, self.HighWisdomLevel)
	end
`);

// ── 2) 효과 적용 지점 ──
replaceOnce('\t\tif self.ThrowingAccelLevel > 0 then\n\t\t\tbase = base * (1.0 - self:GetThrowingAccelReduction())\n\t\tend\n',
'\t\tif self.ThrowingAccelLevel > 0 then\n\t\t\tbase = base * (1.0 - self:GetThrowingAccelReduction())\n\t\tend\n\t\t-- 베노아 매직 액셀레이션(231)\n\t\tif self.MagicAccelLevel > 0 then\n\t\t\tbase = base * (1.0 - self:GetMagicAccelReduction())\n\t\tend\n');
replaceOnce('\t\t\t+ _CardRegistry:GetChance(210, self.JavelinMasteryLevel)\n',
'\t\t\t+ _CardRegistry:GetChance(210, self.JavelinMasteryLevel)\n\t\t\t-- 베노아 마나 웨이브(232)\n\t\t\t+ _CardRegistry:GetChance(232, self.ManaWaveLevel)\n');
replaceOnce('self:GetPhysicalTrainingMult() * self:GetThiefCunningMult() * _GearEffectLogic:GetDamageMult()',
'self:GetPhysicalTrainingMult() * self:GetThiefCunningMult() * self:GetHighWisdomMult() * _GearEffectLogic:GetDamageMult()');
replaceOnce('\t\treturn base + self:GetSkillInvTierPercent(2, 0.03, 0.06, 0.09)\n\tend\n',
'\t\t-- 베노아 매직 가드(234)도 같은 "받는 피해 감소"라 여기서 합산한다(GameManager가 이 값 하나만 읽는다)\n\t\treturn base + self:GetSkillInvTierPercent(2, 0.03, 0.06, 0.09) + self:GetMagicGuardReduction()\n\tend\n');
replaceOnce('\t\tlocal tickDamage = damage * self.Card226MistRatio\n',
'\t\t-- 엘리멘탈 드레인(233) — 독무 틱도 틱 대미지라 같이 오른다(ApplyDot 경로가 아니라 여기서 직접 곱한다)\n\t\tlocal tickDamage = damage * self.Card226MistRatio * self:GetElementalDrainMult()\n');

// ── 3) 버프 아이콘 프로퍼티/Notify/맵/숨김 ──
insertAfterLine('\tproperty SpriteGUIRendererComponent shurikenMasteryFill = "9f007204-66a9-4e92-960f-b1755fa319fe"',
`	-- 베노아 패시브 5종(231~235) 버프 아이콘 — 린과 같은 이유로 패널이 독립이다(.builder-work/benoa_buff_icons.cjs가 UUID 주입)
${P.map(p => `	property Entity ${p.buff}Buff = ""\n	property SpriteGUIRendererComponent ${p.buff}Fill = ""`).join('\n')}`);
insertBefore('\t-- ── 린 패시브 5종(209~213) 버프 아이콘. 쉐이드와 효과는 같아도 패널은 독립이다(유저 지정).',
`	-- ── 베노아 패시브 5종(231~235) 버프 아이콘
${P.map(p => `	@ExecSpace("Multicast")
	method void Notify${p.fn}OnPermanent()
		if self:IsServer() then return end
		self:ShowBuffIconPermanent(self.${p.buff}Buff, self.${p.buff}Fill)
	end
`).join('\n')}`);
insertAfterLine('\t\telseif panel == self.shurikenMasteryBuff then return "shurikenmastery"',
P.map(p => `		elseif panel == self.${p.buff}Buff then return "${p.key}"`).join('\n'));
insertAfterLine('\t\telseif buffName == "shurikenmastery" then return self.shurikenMasteryBuff',
P.map(p => `		elseif buffName == "${p.key}" then return self.${p.buff}Buff`).join('\n'));
insertAfterLine('\t\tself:HideBuffIcon(self.shurikenMasteryBuff, self.shurikenMasteryFill)',
P.map(p => `		self:HideBuffIcon(self.${p.buff}Buff, self.${p.buff}Fill)`).join('\n'));
replaceOnce('\t\t\tthiefcunning = 213, shurikenmastery = 214,\n',
'\t\t\tthiefcunning = 213, shurikenmastery = 214,\n\t\t\tmagicaccel = 231, manawave = 232, elementaldrain = 233, magicguard = 234, highwisdom = 235,\n');
replaceOnce('"javelinmastery", "spiritjavelin", "radicaldarkness", "thiefcunning", "shurikenmastery" }',
'"javelinmastery", "spiritjavelin", "radicaldarkness", "thiefcunning", "shurikenmastery",\n\t\t\t"magicaccel", "manawave", "elementaldrain", "magicguard", "highwisdom" }');

// ── 4) 단일 줄 체인 ──
insertAfterLine('\t\tif cardIdx == 213 then return self.ThiefCunningLevel > 0 end',
P.map(p => `		if cardIdx == ${p.idx} then return self.${p.prop} > 0 end`).join('\n'));
insertAfterLine('\t\telseif cardIdx == 213 then return self.ThiefCunningLevel',
P.map(p => `		elseif cardIdx == ${p.idx} then return self.${p.prop}`).join('\n'));
insertAfterLine('\t\telseif cardIdx == 213 then self.ThiefCunningLevel = level',
P.map(p => `		elseif cardIdx == ${p.idx} then self.${p.prop} = level`).join('\n'));
insertAfterLine('\t\telseif cardIdx == 213 then return "thiefcunning_up"',
P.map(p => `		elseif cardIdx == ${p.idx} then return "${p.up}"`).join('\n'));
insertBefore('\t\telseif name == "ThiefCunningLevel" then',
P.map(p => `		elseif name == "${p.prop}" then
			if self.${p.prop} > 0 then self:Notify${p.fn}OnPermanent() end`).join('\n'));
replaceOnce('\t\t\tor cardIdx == 209 or cardIdx == 210 or cardIdx == 211 or cardIdx == 212 or cardIdx == 213\n\t\t\tor cardIdx == 214\n',
'\t\t\tor cardIdx == 209 or cardIdx == 210 or cardIdx == 211 or cardIdx == 212 or cardIdx == 213\n\t\t\tor cardIdx == 214\n\t\t\tor cardIdx == 231 or cardIdx == 232 or cardIdx == 233 or cardIdx == 234 or cardIdx == 235\n');

// ── 5) 슬롯/선택지 툴팁 한 줄(패시브 수치) ──
insertBefore('\t\telseif cardIdx == 214 then\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_020"',
`		elseif cardIdx == 231 then
			dmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_007", math.floor(self:GetMagicAccelReduction() * 100 + 0.5))
		elseif cardIdx == 232 then
			dmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_008", math.floor(_CardRegistry:GetChance(232, self.ManaWaveLevel) * 100 + 0.5))
		elseif cardIdx == 233 then
			dmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_120", math.floor(_CardRegistry:GetChance(233, self.ElementalDrainLevel) * 100 + 0.5))
		elseif cardIdx == 234 then
			dmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_010", math.floor(self:GetMagicGuardReduction() * 100 + 0.5))
		elseif cardIdx == 235 then
			dmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_018", math.floor(_CardRegistry:GetChance(235, self.HighWisdomLevel) * 100 + 0.5))`);

// ── 6) 변경내역 ──
insertBefore(`		elseif cardIdx == 213 then
			return {
				"MLUA_CARDMANAGER_154",`,
`		elseif cardIdx == 231 then
			return { "MLUA_CARDMANAGER_149", "MLUA_CARDMANAGER_074", "MLUA_CARDMANAGER_075", "MLUA_CARDMANAGER_074", "MLUA_CARDMANAGER_075" }
		elseif cardIdx == 232 then
			return { "MLUA_CARDMANAGER_076", "MLUA_CARDMANAGER_077", "MLUA_CARDMANAGER_078", "MLUA_CARDMANAGER_077", "MLUA_CARDMANAGER_078" }
		elseif cardIdx == 233 then
			return { "MLUA_CARDMANAGER_595", "MLUA_CARDMANAGER_596", "MLUA_CARDMANAGER_596", "MLUA_CARDMANAGER_596", "MLUA_CARDMANAGER_596" }
		elseif cardIdx == 234 then
			return { "MLUA_CARDMANAGER_108", "MLUA_CARDMANAGER_109", "MLUA_CARDMANAGER_110", "MLUA_CARDMANAGER_109", "MLUA_CARDMANAGER_110" }
		elseif cardIdx == 235 then
			return { "MLUA_CARDMANAGER_597", "MLUA_CARDMANAGER_274", "MLUA_CARDMANAGER_274", "MLUA_CARDMANAGER_274", "MLUA_CARDMANAGER_274" }`);

// ── 7) 레벨업 선택지(베노아 블록 끝 — 블레이즈 샷 다음) ──
const lvAnchor = `			elseif self.BlazeShotLevel < 5 then
				table.insert(pool, { card = 230, type = "blazeshot_up" })
			end
`;
if (count(src, lvAnchor) !== 1) throw new Error('levelup anchor');
src = src.replace(lvAnchor, lvAnchor + `			-- ── 베노아 패시브 5종(231~235). 슬롯을 안 쓰므로 hasEmptySlot 조건이 붙지 않는다.
${P.map(p => `			if self.${p.prop} == 0 then
				table.insert(pool, { card = ${p.idx}, type = "unlock" })
			elseif self.${p.prop} < 5 then
				table.insert(pool, { card = ${p.idx}, type = "${p.up}" })
			end`).join('\n')}
`);

// ── 8) 선택 카드 텍스트 ──
insertBefore(`		if cardIdx == 213 then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.ThiefCunningLevel + 1)`,
P.map(p => `		if cardIdx == ${p.idx} then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.${p.prop} + 1)
			icon.ImageRUID = _CardRegistry:GetIcon(${p.idx})
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(_CardRegistry:GetName(${p.idx}))
			return
		end
`).join('\n'));

// ── 9) 강화 적용 ──
insertBefore('\t\tif cardIdx == 213 then\n\t\t\tif upgradeType == "unlock" then\n\t\t\t\tself.ThiefCunningLevel = 1',
P.map(p => `		-- ${p.fn}(베노아 패시브 ${p.idx}) — 슬롯 배정 없이 해금 즉시 영구 적용
		if cardIdx == ${p.idx} then
			if upgradeType == "unlock" then
				self.${p.prop} = 1
			elseif upgradeType == "${p.up}" and self.${p.prop} < 5 then
				self.${p.prop} = self.${p.prop} + 1
			end
			self:Notify${p.fn}OnPermanent()
			log("${p.fn} L" .. self.${p.prop} .. " (" .. math.floor(_CardRegistry:GetChance(${p.idx}, self.${p.prop}) * 100 + 0.5) .. "%)")
			return
		end
`).join('\n'));

// ── 10) 패시브 드롭 풀 / 다시하기 초기화 ──
insertAfterLine('\t\tif self:IsCardUnlocked(214) and self.ShurikenMasteryLevel < 5 then table.insert(pool, 214) end',
'\t\t-- 베노아\n' + P.map(p => `		if self:IsCardUnlocked(${p.idx}) and self.${p.prop} < 5 then table.insert(pool, ${p.idx}) end`).join('\n'));
insertAfterLine('\t\tself.ThiefCunningLevel = 0',
P.map(p => `		self.${p.prop} = 0`).join('\n'));

fs.writeFileSync(path, src, 'utf8');

// ── MonsterAI: ApplyDot에 엘리멘탈 드레인 배율 ──
const mpath = 'RootDesk/MyDesk/MonsterAI.mlua';
let m = fs.readFileSync(mpath, 'utf8');
const ma = '\t\t-- 도트 데미지 적용. 중복 시 이전 도트를 취소하고 새 도트로 덮어씀\n';
if (count(m, ma) !== 1) throw new Error('monster anchor');
m = m.replace(ma, ma + '\t\t-- 베노아 엘리멘탈 드레인(카드233) — 틱 대미지 +3~15%(다른 캐릭터는 레벨 0이라 배율 1.0)\n\t\tdamagePerTick = damagePerTick * _CardManager:GetElementalDrainMult()\n');
fs.writeFileSync(mpath, m, 'utf8');
console.log('applied OK');
