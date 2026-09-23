// 2026-09-23: 자쿰 레이드 보상 목걸이 라인(100002) — 반지와 같은 옵션 구조로 코드에 추가(1회용)
const fs = require('fs');
function edit(p, pairs) {
  let s = fs.readFileSync(p, 'utf8');
  const crlf = s.includes('\r\n');
  s = s.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) {
    const n = s.split(a).length - 1;
    if (n !== 1) throw new Error(p + ' count ' + n + ': ' + a.slice(0, 80));
    s = s.replace(a, () => b);
  }
  if (crlf) s = s.replace(/\n/g, '\r\n');
  fs.writeFileSync(p, s, 'utf8');
  console.log('ok', p);
}

// ── WeaponTierDataLogic ──
edit('RootDesk/MyDesk/Inventory/Core/Logic/WeaponTierDataLogic.mlua', [
  [`	property integer RingItemId = 110002
`, `	property integer RingItemId = 110002

	-- 목걸이(2026-09-23 유저 지정, **자쿰 레이드 보상 전용**). 옵션 구조는 반지와 완전히 같다 —
	-- 메인 옵션 공격/체력 택1(MainStatType) + 등급마다 5종 중 1종 등급 스킬(SkillVariantByGrade).
	-- 그래서 IsRing()이 목걸이도 true를 돌려준다(반지 전용 처리 전부를 그대로 탄다). 부위는 Pendant.
	-- 반지처럼 아바타 슬롯이 없어 AvatarCategoryTable에 넣지 않았고, 몬스터 드롭 풀에도 넣지 않는다.
	property integer NecklaceItemId = 100002
`],
  [`			self.RingItemId }
		self.GearItemIds = gearItemIds`, `			self.RingItemId, self.NecklaceItemId }
		self.GearItemIds = gearItemIds`],
  [`		statFieldTable[self.RingItemId] = "Atk"
`, `		statFieldTable[self.RingItemId] = "Atk"
		statFieldTable[self.NecklaceItemId] = "Atk"
`],
  [`		-- 망토
		d[self.CapeItemId] = {`, `		-- 목걸이(자쿰 레이드 보상 전용)
		d[self.NecklaceItemId] = {
			[_GearGradeEnum.None] = "MLUA_WEAPONTIERDATALOGIC_171",
			[_GearGradeEnum.Magic] = "MLUA_WEAPONTIERDATALOGIC_172",
			[_GearGradeEnum.Rare] = "MLUA_WEAPONTIERDATALOGIC_173",
			[_GearGradeEnum.Epic] = "MLUA_WEAPONTIERDATALOGIC_174",
			[_GearGradeEnum.Unique] = "MLUA_WEAPONTIERDATALOGIC_175",
			[_GearGradeEnum.Legendary] = "MLUA_WEAPONTIERDATALOGIC_176",
		}

		-- 망토
		d[self.CapeItemId] = {`],
  [`		-- 활 (StatField=Atk, 5~10/10~15/15~30/30~60/60~100/100~150)
		t[self.BowItemId] = {`, `		-- 목걸이(자쿰 레이드 보상) — 수치·등급 스킬 범위는 반지와 똑같다(유저 지정 "옵션은 반지랑 동일").
		-- 아이콘은 등급이 오를수록 화려해지게 골랐다(2026-09-23, 썸네일 직접 확인):
		--   노멀 은 펜던트 → 매직 푸른 구슬 → 레어 황금 로켓 → 에픽 무지개 하트 → 유니크 보라 보석 → 레전더리 혼테일 펜던트.
		-- 반지와 같은 이유로 item sprite에도 "thumbnail://"를 붙인다(넥슨 아이템 스프라이트 pivot 문제 우회).
		t[self.NecklaceItemId] = {
			[_GearGradeEnum.None] = { Name = "MLUA_WEAPONTIERDATALOGIC_165", RUID = "thumbnail://15e6bf4685634c6981c2c1d6963e95fa",
				StatMin = 5, StatMax = 10, HpMin = 5, HpMax = 10, Template = "-" },
			[_GearGradeEnum.Magic] = { Name = "MLUA_WEAPONTIERDATALOGIC_166", RUID = "thumbnail://23bd77851df54e25bfb5bb834aa0463d",
				StatMin = 10, StatMax = 15, HpMin = 10, HpMax = 15, PercentMin = 1, PercentMax = 3 },
			[_GearGradeEnum.Rare] = { Name = "MLUA_WEAPONTIERDATALOGIC_167", RUID = "thumbnail://21de04211e9e42fe86af4865bf115b76",
				StatMin = 15, StatMax = 30, HpMin = 15, HpMax = 25, PercentMin = 1, PercentMax = 3 },
			[_GearGradeEnum.Epic] = { Name = "MLUA_WEAPONTIERDATALOGIC_168", RUID = "thumbnail://ccc798433c8947dfaab8662f3c135c97",
				StatMin = 30, StatMax = 60, HpMin = 25, HpMax = 50, PercentMin = 1, PercentMax = 3 },
			[_GearGradeEnum.Unique] = { Name = "MLUA_WEAPONTIERDATALOGIC_169", RUID = "thumbnail://d656671a42fb44eba681920995273558",
				StatMin = 60, StatMax = 100, HpMin = 50, HpMax = 70, PercentMin = 1, PercentMax = 3 },
			[_GearGradeEnum.Legendary] = { Name = "MLUA_WEAPONTIERDATALOGIC_170", RUID = "thumbnail://4be7532a78ec4ecbad8b68d500b6ec0e",
				StatMin = 100, StatMax = 150, HpMin = 70, HpMax = 100, PercentMin = 1, PercentMax = 3 },
		}

		-- 활 (StatField=Atk, 5~10/10~15/15~30/30~60/60~100/100~150)
		t[self.BowItemId] = {`],
  [`	method boolean IsRing(integer itemId)
		return itemId == self.RingItemId
	end`, `	-- "반지형 장신구"인가 — 반지 + 목걸이(2026-09-23). 둘은 옵션 구조가 완전히 같아서 메인 옵션 택1·등급별
	-- 스킬 굴림·합성 재굴림·백필 제외 같은 반지 전용 처리를 전부 같이 탄다. 부위(Ring/Pendant)만 다르다
	method boolean IsRing(integer itemId)
		return itemId == self.RingItemId or itemId == self.NecklaceItemId
	end`],
]);

// ── EnhanceScrollLogic ──
edit('RootDesk/MyDesk/Inventory/Core/Logic/EnhanceScrollLogic.mlua', [
  [`	property integer ScrollRingItemId = 510006
`, `	property integer ScrollRingItemId = 510006

	-- 목걸이 강화 주문서(2026-09-23 유저 지정, 유저 리소스 4415d4ee) — 자쿰 레이드 보상에서만 나온다
	property integer ScrollNecklaceItemId = 510007
`],
  [`		byCategory[_GearCategoryEnum.Ring] = self.ScrollRingItemId
`, `		byCategory[_GearCategoryEnum.Ring] = self.ScrollRingItemId
		byCategory[_GearCategoryEnum.Pendant] = self.ScrollNecklaceItemId
`],
  [`		symbols[self.ScrollRingItemId] = "2953509cd0ff43b9a0eb31abb5646853"
`, `		symbols[self.ScrollRingItemId] = "2953509cd0ff43b9a0eb31abb5646853"
		-- 목걸이는 빈 펜던트 칸 아이콘(GearCategoryEnum.Pendant, UIEquipPopup 부위 배지 폴백과 같은 리소스)
		symbols[self.ScrollNecklaceItemId] = "f32d6dcdcdd44a98b579d06f8e3e99e9"
`],
]);

// ── GearEffectLogic ──
edit('RootDesk/MyDesk/Inventory/Core/Logic/GearEffectLogic.mlua', [
  [`	property integer RingGrade = -1
	property integer RingStatType = 0
`, `	property integer RingGrade = -1
	property integer RingStatType = 0

	-- 목걸이(2026-09-23, 자쿰 레이드 보상) — 반지와 옵션 구조가 같다. 반지와 **따로** 더해진다
	-- (같은 등급 스킬 종류면 두 보너스가 둘 다 들어간다)
	property integer NecklaceGrade = -1
	property integer NecklaceStatType = 0
	property number NecklaceBonus = 0
	property integer NecklaceAtk = 0
`],
  [`		self.RingGrade = -1
		self.RingStatType = 0
		self.RingBonus = 0
		self.RingAtk = 0
	end`, `		self.RingGrade = -1
		self.RingStatType = 0
		self.RingBonus = 0
		self.RingAtk = 0
		self.NecklaceGrade = -1
		self.NecklaceStatType = 0
		self.NecklaceBonus = 0
		self.NecklaceAtk = 0
	end`],
  [`		-- 슈트의 HP 스탯(고정값) — 유저 지정`, `		-- 목걸이 — 반지와 똑같이 읽는다(메인 옵션 한쪽에만 강화 보너스). 체력형이면 ringHp에 같이 얹는다
		local necklace = inventory:GetAttachedGearItemStruct(job, _GearCategoryEnum.Pendant)
		if necklace ~= nil and necklace.ItemId == _WeaponTierDataLogic.NecklaceItemId then
			local s = necklace:GetGearStruct()
			if s ~= nil then
				self.NecklaceGrade = s.Grade
				self.NecklaceStatType = _WeaponTierDataLogic:GetSkillVariantForGrade(s, s.Grade)
				self.NecklaceBonus = s.BonusPercentPerMille / 1000.0
				local necklaceLevelBonus = _EnhanceScrollLogic:GetStatBonusForLevel(s.Level)
				if s.MainStatType == _WeaponTierDataLogic.RingMainStatHp then
					ringHp = ringHp + s.Hp + necklaceLevelBonus
				else
					self.NecklaceAtk = s.Atk + necklaceLevelBonus
				end
			end
		end

		-- 슈트의 HP 스탯(고정값) — 유저 지정`],
  [`			.. "/atk" .. self.RingAtk .. "/hp" .. ringHp .. "/" .. string.format("%.1f", self.RingBonus * 100) .. "%"
`, `			.. "/atk" .. self.RingAtk .. "/hp" .. ringHp .. "/" .. string.format("%.1f", self.RingBonus * 100) .. "%"
			.. " necklace=g" .. self.NecklaceGrade .. "/skill" .. self.NecklaceStatType .. "/atk" .. self.NecklaceAtk
			.. "/" .. string.format("%.1f", self.NecklaceBonus * 100) .. "%"
`],
  [`	method boolean HasRingStat(integer statType)
		if self.RingGrade < _GearGradeEnum.Magic then
			return false
		end
		return self.RingStatType == statType
	end`, `	method boolean HasRingStat(integer statType)
		if self.RingGrade < _GearGradeEnum.Magic then
			return false
		end
		return self.RingStatType == statType
	end

	-- 목걸이 전용 판정(반지와 같은 규칙)
	method boolean HasNecklaceStat(integer statType)
		if self.NecklaceGrade < _GearGradeEnum.Magic then
			return false
		end
		return self.NecklaceStatType == statType
	end`],
  [`		return self.WeaponAtk + self.HelmAtk + self.RingAtk`, `		return self.WeaponAtk + self.HelmAtk + self.RingAtk + self.NecklaceAtk`],
  [`		if self:HasRingStat(1) then
			mult = mult * (1.0 + self.RingBonus)
		end
`, `		if self:HasRingStat(1) then
			mult = mult * (1.0 + self.RingBonus)
		end
		if self:HasNecklaceStat(1) then
			mult = mult * (1.0 + self.NecklaceBonus)
		end
`],
  [`		if self:HasRingStat(5) then
			reduction = reduction + self.RingBonus
		end
`, `		if self:HasRingStat(5) then
			reduction = reduction + self.RingBonus
		end
		if self:HasNecklaceStat(5) then
			reduction = reduction + self.NecklaceBonus
		end
`],
  [`		if self:HasRingStat(2) then
			bonus = bonus + self.RingBonus
		end
`, `		if self:HasRingStat(2) then
			bonus = bonus + self.RingBonus
		end
		if self:HasNecklaceStat(2) then
			bonus = bonus + self.NecklaceBonus
		end
`],
  [`		if self:HasRingStat(3) then
			bonus = bonus + self.RingBonus
		end
`, `		if self:HasRingStat(3) then
			bonus = bonus + self.RingBonus
		end
		if self:HasNecklaceStat(3) then
			bonus = bonus + self.NecklaceBonus
		end
`],
  [`		if self:HasRingStat(4) then
			mult = mult * (1.0 + self.RingBonus)
		end
`, `		if self:HasRingStat(4) then
			mult = mult * (1.0 + self.RingBonus)
		end
		if self:HasNecklaceStat(4) then
			mult = mult * (1.0 + self.NecklaceBonus)
		end
`],
]);
