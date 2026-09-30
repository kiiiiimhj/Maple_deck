// 프리징 브레스(26) / 프로즌 오브(27) / 라이트닝 오브(28) 카드를 CardManager.mlua의 모든 분기에 끼워 넣는 1회성 패치(2026-09-30).
// 앵커가 정확히 1번씩 있어야만 쓰고, 하나라도 어긋나면 아무것도 쓰지 않는다. 이미 적용돼 있으면 중단.
const fs = require("fs");
const FILE = "RootDesk/MyDesk/Card/CardManager.mlua";
let raw = fs.readFileSync(FILE, "utf8");
const crlf = raw.includes("\r\n");
let s = raw.replace(/\r\n/g, "\n");
if (s.includes("FreezingBreathLevel")) { console.log("already applied"); process.exit(0); }

const count = (hay, needle) => hay.split(needle).length - 1;
function after(anchor, text) {
  if (count(s, anchor) !== 1) throw new Error("anchor x" + count(s, anchor) + ": " + anchor.slice(0, 90));
  s = s.replace(anchor, () => anchor + text);
}
function before(anchor, text) {
  if (count(s, anchor) !== 1) throw new Error("anchor x" + count(s, anchor) + ": " + anchor.slice(0, 90));
  s = s.replace(anchor, () => text + anchor);
}
const q = (arr) => arr.map((r) => `"${r}"`).join(", ");

const FB = ["dc62ea9b2da848d0a55be0c611c438eb", "9cc36da5a3b74abd877e11605e1f4502", "06ed72a384cf4c34be166ef6fc35b5d4", "0a5605e054084160a9d3c9bec2f79830", "d127194e58a942a299e760c2ea31d4f2", "dd25ddd7c3b54c14b37690f550f3bcd0", "57fb2913576046c7921fc67773e58777", "0b35c74a26bf4fc8a0ee62144992a517"];
const FOB = ["caa4ce013c19411db92f658f2da20d66", "99672cd33d724eeeb2e1696e83d1d495", "0e0664d74d3e45208a577094c83e8b69", "5473fc0b826a4e7fa09a018c1f92a446", "834b0f5477df4171a18e8d97006dcf48", "4d423b8de5154577bd72abe79516adbc", "9fd1f42fbe9a4ea6bb922386c2da4ab7", "564943ce1a9040b090b6e599e74a0676"];
const FOH = ["c3ddf02954794f5bbfeb061f0a25b1c1", "4e00ce1c09d64066a454a363b157b65c", "c96e9b389f1f42b896483cc0929090fb", "550418598acb408fb267f5c80827e40b", "e7998a7df8944f379e4ec1a38c778364"];
const LOB = ["bbfdfc17e499479a8352ee3e7b304214", "1f56d51c6ae34e2c8dadc9d6f2e5da6f", "9a706c9e4fdf48a88e5e167b11505701", "4a8c8e57c47b4b77975a8d0a3562cde1", "000560ffbb4e472b81fa085a1c6e05e9", "2350d847fc2c469a955a6199e4b2ef75", "5310095f3a1349c4b4d0c60f6ea26f2d", "084c8450d77a4b378cda2272bd08fb2d", "8cc490f74d3e4ac1bdb56386ad29ee16", "a62469b74c464a81b36958b726a3bd2a", "88845231e1614569b824ded996fe2c0a", "3b675c1db63642188c649961f8115025"];
const LOH = ["464529bdd42e463d8c0de81ec588b796", "e2991b9f0f974e02bdbb21f43108bb12", "746b82c2c42945239dd658425a79792c", "5a274b90439e492189f81d514ad56f91", "45e5b265189c4af7ae9bdaf823a981ee", "348093773bef4027a649ae02a710d361", "8ed357c474ea4f2bbe58dd092e9e7d71", "e4f83d6858674dbdb79da633bf41d48a", "2e76fbc841d54cc9b6a9bf1ea44ebb54", "42782a6b36864ec5935874c93cb17b81", "52f9e92b5ea44c2fabf90daecc94606c", "c6342c8c4d8142a1b419408402b2bb11"];

// ── 1. 본체(프로퍼티 + 수치 + 공격) ─────────────────────────────────────────
const BLOCK = `	-- ── 프리징 브레스 (Card 26) / 프로즌 오브 (Card 27) / 라이트닝 오브 (Card 28) — 유저 지정 2026-09-30 ──
	-- 프리징 브레스: 슬롯형 액티브(Lv1~5). 가까운 몬스터 N명을 골라 각각 브레스 연출을 띄우고, 그 연출 범위(타원) 안에
	--   있는 몬스터 전부에게 대미지 + 슬로우 3초 + 빙결 스택 +1. 연출이 겹쳐도 한 번의 시전에 한 몬스터는 한 번만 맞는다.
	--   Lv1 130·1명 / Lv2 150·2명 / Lv3 200 / Lv4 220 / Lv5 240. 쿨타임 5초 고정.
	-- 프로즌 오브(조합: 프리징 브레스 Lv5 + 콜드빔 Lv5) / 라이트닝 오브(조합: 프리징 브레스 Lv5 + 에너지볼트 Lv5), 둘 다 Lv1~3.
	--   프리징 브레스의 슬롯을 그대로 넘겨받고(콜드빔/에너지볼트는 슬롯에 그대로 남는다), 둘 중 하나를 만들면 브레스가
	--   사라지므로 나머지 하나는 그 판에서 못 만든다.
	--   브레스는 똑같이 나가고(타겟 3명, 대미지 100%), 맞은 몬스터마다 구슬이 생겼다가 터지면서 대미지 50%를 한 번 더 준다.
	--   프로즌 오브: 260/290/320, 빙결 스택 +2.  라이트닝 오브: 280/310/340, 빙결 스택 +1, 치명타 +20%,
	--   구슬이 터질 때 스턴 1.5초(보스·엘리트는 절반 0.75초).
	-- 빙결 스택은 MonsterAI.AddFreezeStack 규칙 그대로라 프리징 이펙트(Card10) 보유 시에만 쌓인다.
	@Sync property integer FreezingBreathLevel = 0
	@Sync property integer FrozenOrbLevel = 0
	@Sync property integer LightningOrbLevel = 0
	property string Card26Name = "MLUA_CARDMANAGER_546"
	property string Card27Name = "MLUA_CARDMANAGER_547"
	property string Card28Name = "MLUA_CARDMANAGER_548"
	property string Card26IconRUID = "fce4228656b546ac98793726418ffc86"
	-- ⚠ 프로즌 오브 팩의 아이콘은 헤일 버스트(Card23)가 이미 쓰고 있는 것과 같은 그림이다(리소스팩이 같다)
	property string Card27IconRUID = "412638a16dc643f595b035ba776ef425"
	property string Card28IconRUID = "48d122c4eb43493bb1ad12758bc32418"
	-- 사운드: 각 리소스팩의 audio/Use(시전) · audio/Hit(구슬 폭발)
	property string Card26SoundRUID = "295d66efb3d8458b9f9ddd6bc54ae94e"
	property string Card27SoundRUID = "da73ed29690748eb8cdc54636bd17a5d"
	property string Card27HitSoundRUID = "0b92f3d3c5ce4b6dae25ac28123ad09e"
	property string Card28SoundRUID = "aea2a4bff03e4243bd0c4d0dada84f01"
	property string Card28HitSoundRUID = "085f434c82c948959ec78b12ad425577"
	property number Card26Cooldown = 5.0  -- 세 카드 공통, 레벨 무관 고정
	property number Card26SlowDuration = 3.0
	-- 브레스 연출(리소스팩 "keydown" 8프레임, 원본 656x372px = 6.56x3.72유닛, pivot이 오른쪽 아래(0.80, 0.115)에 있다)
	property number Card26EffectScale = 0.6
	property number Card26FrameDuration = 0.07
	property integer Card26EffectLoops = 2  -- 8프레임 × 2바퀴 = 1.12초
	property number Card26EffectYOffset = 0.3  -- 몬스터 발밑이 아니라 몸통 높이에 연출 중심을 둔다
	property number Card26ImpactDelay = 0.35  -- 연출이 뜬 뒤 대미지가 들어가는 시점
	-- 판정 범위(타원 반축, 유닛) — 연출 크기(0.6배 = 3.9x2.2유닛)보다 살짝 안쪽
	property number Card26AreaHalfW = 1.7
	property number Card26AreaHalfH = 0.9
	-- 구슬(오브) 공통
	property number OrbBallDamageRatio = 0.5  -- 구슬 폭발 = 브레스 대미지의 50%
	property number OrbBallYOffset = 0.35
	property number Card27BallScale = 0.35       -- 프로즌 오브 구슬(412x420px, pivot 0.77/0.39)
	property number Card27BallFrameDuration = 0.06
	property number Card27HitScale = 0.9         -- 폭발(208x184px)
	property number Card27HitFrameDuration = 0.07
	property integer Card27FreezeStacks = 2
	property number Card28BallScale = 0.45       -- 라이트닝 오브 구슬(288x284px, pivot 0.50/0.32)
	property number Card28BallFrameDuration = 0.05
	property number Card28HitScale = 0.6         -- 폭발(416x304px, pivot 0.49/0.32)
	property number Card28HitFrameDuration = 0.05
	property number Card28CritBonus = 0.20
	property number Card28StunDuration = 1.5     -- 보스·엘리트는 절반

	method table GetFreezingBreathFrames()
		-- 프리징 브레스 팩 "keydown" 클립의 프레임 스프라이트(순서대로)
		return { ${q(FB)} }
	end

	method table GetFrozenOrbBallFrames()
		-- 프로즌 오브 강화 팩 "ball"
		return { ${q(FOB)} }
	end

	method table GetFrozenOrbHitFrames()
		-- 프로즌 오브 강화 팩 "hit/0"
		return { ${q(FOH)} }
	end

	method table GetLightningOrbBallFrames()
		-- 라이트닝 오브 팩(skill/400021094) "ball"
		return { ${q(LOB)} }
	end

	method table GetLightningOrbHitFrames()
		-- 라이트닝 오브 팩 "hit/0"
		return { ${q(LOH)} }
	end

	method number GetFreezingBreathDamage()
		if self.FreezingBreathLevel >= 5 then return 240
		elseif self.FreezingBreathLevel >= 4 then return 220
		elseif self.FreezingBreathLevel >= 3 then return 200
		elseif self.FreezingBreathLevel >= 2 then return 150
		end
		return 130
	end

	method integer GetFreezingBreathTargetCount()
		if self.FreezingBreathLevel >= 2 then return 2 end
		return 1
	end

	method number GetFrozenOrbDamage()
		if self.FrozenOrbLevel >= 3 then return 320
		elseif self.FrozenOrbLevel >= 2 then return 290
		end
		return 260
	end

	method number GetLightningOrbDamage()
		if self.LightningOrbLevel >= 3 then return 340
		elseif self.LightningOrbLevel >= 2 then return 310
		end
		return 280
	end

	method integer GetOrbTargetCount()
		-- 프로즌 오브/라이트닝 오브 공통 — 전 레벨 3명
		return 3
	end

	@ExecSpace("Multicast")
	method void PlayBreathSfx(string soundRUID)
		-- 브레스/오브 계열 효과음(클라에서만 재생)
		if self:IsServer() then return end
		_SoundOptionLogic:PlaySfx(soundRUID, 1.0)
	end

	@ExecSpace("ServerOnly")
	method Vector3 OffsetByPivot(Vector3 center, number nx, number ny, number widthUnits, number heightUnits, number scale)
		-- 스프라이트 pivot이 가운데가 아닐 때, 그림의 "가운데"가 center에 오도록 스폰 좌표를 보정한다
		-- (밀리는 양 = (0.5 - n) × 크기 → 반대로 (n - 0.5) × 크기만큼 옮긴다. nx는 왼쪽 기준, ny는 아래쪽 기준)
		return Vector3(center.x + (nx - 0.5) * widthUnits * scale, center.y + (ny - 0.5) * heightUnits * scale, center.z)
	end

	@ExecSpace("ServerOnly")
	method void PlayFrameEffect(table frames, Vector3 pos, number scale, number frameDur, integer loops)
		-- 프레임 스프라이트를 직접 이어붙여 재생하는 공용 연출(네이티브 재생에 맡기면 공용 모델 수명에 잘린다 — 프로젝트 기본 기법)
		local fx = self:SpawnEffectWithModel(frames[1], pos, 0, 1.0, scale, 1.0, "skilleffectlong")
		if fx == nil then return end
		local renderer = fx.SpriteRendererComponent
		local total = #frames * loops
		for step = 2, total do
			local frameRUID = frames[((step - 1) % #frames) + 1]
			_TimerService:SetTimerOnce(function()
				if isvalid(fx) and isvalid(renderer) then renderer.SpriteRUID = frameRUID end
			end, frameDur * (step - 1))
		end
		fx:Destroy(frameDur * total)
	end

	@ExecSpace("ServerOnly")
	method void FreezingBreathAttack(number damage, boolean isCrit)
		self:PlayBreathSfx(self.Card26SoundRUID)
		self:BreathCast(26, damage, isCrit, self:GetFreezingBreathTargetCount(), 1, 0)
	end

	@ExecSpace("ServerOnly")
	method void FrozenOrbAttack(number damage, boolean isCrit)
		self:PlayBreathSfx(self.Card27SoundRUID)
		self:BreathCast(27, damage, isCrit, self:GetOrbTargetCount(), self.Card27FreezeStacks, 1)
	end

	@ExecSpace("ServerOnly")
	method void LightningOrbAttack(number damage, boolean isCrit)
		self:PlayBreathSfx(self.Card28SoundRUID)
		self:BreathCast(28, damage, isCrit, self:GetOrbTargetCount(), 1, 2)
	end

	@ExecSpace("ServerOnly")
	method void BreathCast(integer cardIdx, number damage, boolean isCrit, integer targetCount, integer freezeStacks, integer orbKind)
		-- 브레스 3종 공용 본체. orbKind: 0 = 구슬 없음(프리징 브레스) / 1 = 프로즌 오브 / 2 = 라이트닝 오브
		local targets = self:GetClosestTargets(targetCount)
		local map = self:GetCurrentMap()
		local castZoneIndex = _MapManager.CurrentMapIndex
		local frames = self:GetFreezingBreathFrames()
		-- 연출 중심과 조준 대상의 깊이 구간을 시전 시점에 값으로 잡아 둔다(대상이 도중에 죽어도 판정·연출은 그대로)
		local anchors = {}
		for _, mob in ipairs(targets) do
			---@type MonsterAI
			local target = mob
			if isvalid(target) and isvalid(target.Entity) then
				local p = target.Entity.TransformComponent.Position
				local scale = self.Card26EffectScale * self:GetEffectScaleRatio(target)
				local center = Vector3(p.x, p.y + self.Card26EffectYOffset, p.z)
				self:PlayFrameEffect(frames, self:OffsetByPivot(center, 0.80, 0.115, 6.56, 3.72, scale), scale, self.Card26FrameDuration, self.Card26EffectLoops)
				table.insert(anchors, { x = center.x, y = center.y, target = target, band = self:GetDepthBand(target) })
			end
		end
		log("BreathCast: card=" .. cardIdx .. " anchors=" .. #anchors .. "/" .. targetCount .. " dmg=" .. math.floor(damage))
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
						elseif self:InEllipse(mp.x - a.x, mp.y - a.y, self.Card26AreaHalfW, self.Card26AreaHalfH) and self:IsInDepthBand(m, a.band) then
							inArea = true
						end
						if inArea then break end
					end
					if inArea then
						local finalDmg = damage * self:GetIceStackBonus(m)
						if isCrit then _DpsMeterLogic:Tag(cardIdx, m):TakeDamageCrit(finalDmg * 2)
						else _DpsMeterLogic:Tag(cardIdx, m):TakeDamage(finalDmg) end
						m:ApplySlow(self.Card26SlowDuration)
						for i = 1, freezeStacks do m:AddFreezeStack() end
						hitCount = hitCount + 1
						if orbKind > 0 and not m._dead then self:SpawnOrbBall(cardIdx, m, damage, isCrit, orbKind, castZoneIndex) end
					end
				end
			end
			log("BreathCast: card=" .. cardIdx .. " impact hit=" .. hitCount)
		end, self.Card26ImpactDelay)
	end

	@ExecSpace("ServerOnly")
	method void SpawnOrbBall(integer cardIdx, MonsterAI target, number damage, boolean isCrit, integer orbKind, integer castZoneIndex)
		-- 브레스에 맞은 몬스터 위에 구슬을 띄웠다가 터뜨린다 — 폭발 대미지는 그 몬스터에게만(브레스 대미지의 OrbBallDamageRatio)
		local p = target.Entity.TransformComponent.Position
		local ratio = self:GetEffectScaleRatio(target)
		local center = Vector3(p.x, p.y + self.OrbBallYOffset, p.z)
		local ballFrames = self:GetFrozenOrbBallFrames()
		local hitFrames = self:GetFrozenOrbHitFrames()
		local ballScale = self.Card27BallScale * ratio
		local hitScale = self.Card27HitScale * ratio
		local ballDur = self.Card27BallFrameDuration
		local hitDur = self.Card27HitFrameDuration
		local ballPos = self:OffsetByPivot(center, 0.77, 0.39, 4.12, 4.20, ballScale)
		local hitPos = self:OffsetByPivot(center, 0.54, 0.44, 2.08, 1.84, hitScale)
		local hitSound = self.Card27HitSoundRUID
		if orbKind == 2 then
			ballFrames = self:GetLightningOrbBallFrames()
			hitFrames = self:GetLightningOrbHitFrames()
			ballScale = self.Card28BallScale * ratio
			hitScale = self.Card28HitScale * ratio
			ballDur = self.Card28BallFrameDuration
			hitDur = self.Card28HitFrameDuration
			ballPos = self:OffsetByPivot(center, 0.50, 0.32, 2.88, 2.84, ballScale)
			hitPos = self:OffsetByPivot(center, 0.49, 0.32, 4.16, 3.04, hitScale)
			hitSound = self.Card28HitSoundRUID
		end
		self:PlayFrameEffect(ballFrames, ballPos, ballScale, ballDur, 1)

		_TimerService:SetTimerOnce(function()
			if not isvalid(self) then return end
			if castZoneIndex ~= _MapManager.CurrentMapIndex then return end
			-- 폭발 연출은 대상 생사와 무관하게 끝까지 보여준다(공통 정책) — 대미지만 살아 있을 때 넣는다
			self:PlayFrameEffect(hitFrames, hitPos, hitScale, hitDur, 1)
			self:PlayBreathSfx(hitSound)
			if not isvalid(target) or not isvalid(target.Entity) or target._dead then return end
			local ballDmg = damage * self.OrbBallDamageRatio * self:GetIceStackBonus(target)
			if isCrit then _DpsMeterLogic:Tag(cardIdx, target):TakeDamageCrit(ballDmg * 2)
			else _DpsMeterLogic:Tag(cardIdx, target):TakeDamage(ballDmg) end
			if orbKind == 2 and not target._dead then
				local stunDur = self.Card28StunDuration
				if target._isBoss or target._isElite then stunDur = stunDur * 0.5 end
				target:ApplyStun(stunDur, true)
			end
			log("SpawnOrbBall: card=" .. cardIdx .. " burst dmg=" .. math.floor(isCrit and ballDmg * 2 or ballDmg))
		end, ballDur * #ballFrames)
	end

`;
before("\t-- 아이스 커터 (Card 11) — 레벨업으로 해금/강화하는 광역 스킬.", BLOCK);

// ── 2. 카드별 분기들 ──────────────────────────────────────────────────────
after("\t\tif cardIdx == 24 then return self.AquaSurgeLevel > 0 end\n",
  "\t\tif cardIdx == 26 then return self.FreezingBreathLevel > 0 end\n\t\tif cardIdx == 27 then return self.FrozenOrbLevel > 0 end\n\t\tif cardIdx == 28 then return self.LightningOrbLevel > 0 end\n");
after("\t\telseif cardIdx == 24 then base = self:GetAquaSurgeDamage()\n",
  "\t\telseif cardIdx == 26 then base = self:GetFreezingBreathDamage()\n\t\telseif cardIdx == 27 then base = self:GetFrozenOrbDamage()\n\t\telseif cardIdx == 28 then base = self:GetLightningOrbDamage()\n");
after("\t\telseif cardIdx == 24 then return self.Card24Cooldown\n",
  "\t\telseif cardIdx == 26 or cardIdx == 27 or cardIdx == 28 then return self.Card26Cooldown\n");
after("\t\telseif cardIdx == 24 then return self.Card24IconRUID\n",
  "\t\telseif cardIdx == 26 then return self.Card26IconRUID\n\t\telseif cardIdx == 27 then return self.Card27IconRUID\n\t\telseif cardIdx == 28 then return self.Card28IconRUID\n");
after("\t\telseif cardIdx == 24 then return self.Card24Name\n",
  "\t\telseif cardIdx == 26 then return self.Card26Name\n\t\telseif cardIdx == 27 then return self.Card27Name\n\t\telseif cardIdx == 28 then return self.Card28Name\n");
after("\t\telseif cardIdx == 24 then return self.AquaSurgeLevel\n",
  "\t\telseif cardIdx == 26 then return self.FreezingBreathLevel\n\t\telseif cardIdx == 27 then return self.FrozenOrbLevel\n\t\telseif cardIdx == 28 then return self.LightningOrbLevel\n");
after("\t\telseif cardIdx == 24 then self.AquaSurgeLevel = level\n",
  "\t\telseif cardIdx == 26 then self.FreezingBreathLevel = level\n\t\telseif cardIdx == 27 then self.FrozenOrbLevel = level\n\t\telseif cardIdx == 28 then self.LightningOrbLevel = level\n");
// 레벨별 변경사항 표
after('\t\telseif cardIdx == 24 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_122",\n\t\t\t\t"MLUA_CARDMANAGER_123",\n\t\t\t\t"MLUA_CARDMANAGER_123",\n\t\t\t}\n',
  '\t\telseif cardIdx == 26 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_549",\n\t\t\t\t"MLUA_CARDMANAGER_180",\n\t\t\t\t"MLUA_CARDMANAGER_066",\n\t\t\t\t"MLUA_CARDMANAGER_125",\n\t\t\t\t"MLUA_CARDMANAGER_125",\n\t\t\t}\n' +
  '\t\telseif cardIdx == 27 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_550",\n\t\t\t\t"MLUA_CARDMANAGER_181",\n\t\t\t\t"MLUA_CARDMANAGER_181",\n\t\t\t}\n' +
  '\t\telseif cardIdx == 28 then\n\t\t\treturn {\n\t\t\t\t"MLUA_CARDMANAGER_551",\n\t\t\t\t"MLUA_CARDMANAGER_181",\n\t\t\t\t"MLUA_CARDMANAGER_181",\n\t\t\t}\n');
after('\t\telseif name == "AquaSurgeLevel" then self:RefreshSlotIfHoldsCard(24)\n',
  '\t\telseif name == "FreezingBreathLevel" then self:RefreshSlotIfHoldsCard(26)\n\t\telseif name == "FrozenOrbLevel" then self:RefreshSlotIfHoldsCard(27)\n\t\telseif name == "LightningOrbLevel" then self:RefreshSlotIfHoldsCard(28)\n');
// 툴팁: 이름 / 대미지 / 부가 설명
after('\t\telseif cardIdx == 24 then name = _LocText:Resolve(self.Card24Name) .. " Lv." .. self.AquaSurgeLevel\n',
  '\t\telseif cardIdx == 26 then name = _LocText:Resolve(self.Card26Name) .. " Lv." .. self.FreezingBreathLevel\n' +
  '\t\telseif cardIdx == 27 then name = _LocText:Resolve(self.Card27Name) .. " Lv." .. self.FrozenOrbLevel\n' +
  '\t\telseif cardIdx == 28 then name = _LocText:Resolve(self.Card28Name) .. " Lv." .. self.LightningOrbLevel\n');
after('\t\telseif cardIdx == 24 then\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_006", math.floor(self:GetCardDamage(cardIdx)))\n',
  '\t\telseif cardIdx == 26 then\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_006", math.floor(self:GetCardDamage(cardIdx)))\n' +
  '\t\telseif cardIdx == 27 or cardIdx == 28 then\n\t\t\t-- 브레스 + 구슬 폭발(50%)을 합산한 숫자 1개로 보여준다(다단타 표기 통일 규칙)\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_006", math.floor(self:GetCardDamage(cardIdx) * (1 + self.OrbBallDamageRatio)))\n');
after('\t\telseif cardIdx == 24 then\n\t\t\tlocal extraPct = math.floor(self:GetAquaSurgeExtraPercent() * 100)\n\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_045", self:GetAquaSurgeTargetCount(), extraPct)\n',
  '\t\telseif cardIdx == 26 then\n\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_102", self:GetFreezingBreathTargetCount())\n' +
  '\t\telseif cardIdx == 27 then\n\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_103", self:GetOrbTargetCount(), math.floor(self.OrbBallDamageRatio * 100))\n' +
  '\t\telseif cardIdx == 28 then\n\t\t\textraStr = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_104", self:GetOrbTargetCount(), string.format("%.1f", self.Card28StunDuration), math.floor(self.OrbBallDamageRatio * 100))\n');
// 슬롯 발동
after("\t\t\t\telseif cardIndex == 24 then\n\t\t\t\t\tself:AquaSurgeAttack(damage, isCrit)\n",
  "\t\t\t\telseif cardIndex == 26 then\n\t\t\t\t\tself:FreezingBreathAttack(damage, isCrit)\n\t\t\t\telseif cardIndex == 27 then\n\t\t\t\t\tself:FrozenOrbAttack(damage, isCrit)\n\t\t\t\telseif cardIndex == 28 then\n\t\t\t\t\tself:LightningOrbAttack(damage, isCrit)\n");
// 치명타
after("\t\tif cardIdx == 215 then chance = chance + self.Card215CritBonus end\n",
  "\t\t-- 라이트닝 오브(카드28) 전용 — 레벨 무관 +20%(유저 표)\n\t\tif cardIdx == 28 then chance = chance + self.Card28CritBonus end\n");
// 예열
before("\t\tlocal count = #ruids\n",
  "\t\t-- 프리징 브레스/프로즌 오브/라이트닝 오브는 프레임 RUID를 프로퍼티가 아니라 표(Get*Frames)로 들고 있다 — 여기서 같이 예열한다\n" +
  "\t\tlocal breathFrameLists = { self:GetFreezingBreathFrames(), self:GetFrozenOrbBallFrames(), self:GetFrozenOrbHitFrames(), self:GetLightningOrbBallFrames(), self:GetLightningOrbHitFrames() }\n" +
  "\t\tfor _, list in ipairs(breathFrameLists) do\n\t\t\tfor _, frameRUID in ipairs(list) do table.insert(ruids, frameRUID) end\n\t\tend\n");
// 튜토리얼 "슬롯형 액티브" 목록
if (count(s, "\t\tif cardIdx == 14 or cardIdx == 15 then return true end\n") !== 1) throw new Error("tutorial anchor");
s = s.replace("\t\tif cardIdx == 14 or cardIdx == 15 then return true end\n", "\t\tif cardIdx == 14 or cardIdx == 15 or cardIdx == 26 then return true end\n");
// 레벨업 선택지
after('\t\t\ttable.insert(pool, { card = 23, type = "hailburst_up" })\n\t\tend\n',
  `
		-- 프리징 브레스(Card 26): 미해금이면 해금(슬롯 여유 있을 때만), 해금 후 레벨 < 5이면 강화
		-- (프로즌 오브/라이트닝 오브로 조합된 뒤에는 더 이상 등장하지 않음 — 그 슬롯을 이미 떠났으므로)
		if self.FrozenOrbLevel == 0 and self.LightningOrbLevel == 0 then
			if self.FreezingBreathLevel == 0 then
				if hasEmptySlot then table.insert(pool, { card = 26, type = "unlock" }) end
			elseif self.FreezingBreathLevel < 5 then
				table.insert(pool, { card = 26, type = "freezingbreath_up" })
			end
		end

		-- 프로즌 오브(Card 27) / 라이트닝 오브(Card 28) — 프리징 브레스의 두 갈래 조합(유저 지정 2026-09-30).
		-- 프리징 브레스 Lv5 + 콜드빔 Lv5 → 프로즌 오브, 프리징 브레스 Lv5 + 에너지볼트 Lv5 → 라이트닝 오브.
		-- 브레스 슬롯을 넘겨받으므로 새 슬롯이 필요 없고, 하나를 만들면 나머지는 그 판에서 등장하지 않는다.
		-- 콜드빔/에너지볼트는 레벨만 보므로(슬롯에 그대로 남는다) 이미 다른 조합으로 넘어간 뒤에도 조건은 유지된다.
		if self.FrozenOrbLevel == 0 and self.LightningOrbLevel == 0 and self.FreezingBreathLevel >= 5 then
			if self.ColdBeamLevel >= 5 then table.insert(pool, { card = 27, type = "unlock" }) end
			if self.EnergyBoltLevel >= 5 then table.insert(pool, { card = 28, type = "unlock" }) end
		end
		if self.FrozenOrbLevel > 0 and self.FrozenOrbLevel < 3 then
			table.insert(pool, { card = 27, type = "frozenorb_up" })
		end
		if self.LightningOrbLevel > 0 and self.LightningOrbLevel < 3 then
			table.insert(pool, { card = 28, type = "lightningorb_up" })
		end
`);
after('\t\telseif cardIdx == 24 then return "MLUA_CARDMANAGER_483"\n',
  '\t\telseif cardIdx == 26 then return "MLUA_CARDMANAGER_552"\n\t\telseif cardIdx == 27 then return "MLUA_CARDMANAGER_553"\n\t\telseif cardIdx == 28 then return "MLUA_CARDMANAGER_554"\n');
// 선택지 카드 글자
const choice = (idx, lvProp) => `		if cardIdx == ${idx} then
			local nextLevel = (upgradeType == "unlock") and 1 or (self.${lvProp} + 1)
			icon.ImageRUID = self.Card${idx}IconRUID
			title.Text = "Lv" .. nextLevel
			name.Text  = _LocText:Resolve(self.Card${idx}Name)
			return
		end

`;
before('\t\tif cardIdx == 11 then\n\t\t\tlocal nextLevel = (upgradeType == "unlock") and 1 or (self.IceCutterLevel + 1)\n',
  choice(26, "FreezingBreathLevel") + choice(27, "FrozenOrbLevel") + choice(28, "LightningOrbLevel"));
// 실제 적용
const orbApply = (idx, lvProp, other, tag, name) => `		if cardIdx == ${idx} then
			if upgradeType == "unlock" then
				if self.${other} > 0 then
					log_warning("${name}: the other orb is already fused — ignored")
					return
				end
				self.${lvProp} = 1
				local breathSlot = self:GetSlotForCard(26)
				if breathSlot > 0 then
					self:AssignCardToSlot(breathSlot, ${idx})
					self:ResetSlotTimer(breathSlot)
					self:PlayThunderStormFusionEffect(breathSlot)
					log("Card${idx}(${name}) fused into Slot" .. breathSlot .. " (was FreezingBreath)")
				else
					log_warning("${name}: FreezingBreath not found in any slot — fusion could not place the card")
				end
			elseif upgradeType == "${tag}" and self.${lvProp} < 3 then
				self.${lvProp} = self.${lvProp} + 1
			end
			log("${name} L" .. self.${lvProp})
			return
		end

`;
before("\t\t-- 아이스 커터 (슬롯 해금 또는 레벨 강화)\n\t\tif cardIdx == 11 then\n",
  `		-- 프리징 브레스 (슬롯 해금 또는 레벨 강화)
		if cardIdx == 26 then
			if upgradeType == "unlock" then
				self.FreezingBreathLevel = 1
				local slotIdx = self:GetNextEmptySlot()
				if slotIdx > 0 then
					self:AssignCardToSlot(slotIdx, 26)
					self:ResetSlotTimer(slotIdx)
					log("Card26(FreezingBreath) -> Slot" .. slotIdx)
				end
			elseif upgradeType == "freezingbreath_up" and self.FreezingBreathLevel < 5 then
				self.FreezingBreathLevel = self.FreezingBreathLevel + 1
			end
			log("FreezingBreath L" .. self.FreezingBreathLevel)
			return
		end

		-- 프로즌 오브 / 라이트닝 오브 (조합 스킬 — 프리징 브레스(Card26) 슬롯을 그대로 넘겨받는다. 둘 중 하나만 만들 수 있다)
` + orbApply(27, "FrozenOrbLevel", "LightningOrbLevel", "frozenorb_up", "FrozenOrb") + orbApply(28, "LightningOrbLevel", "FrozenOrbLevel", "lightningorb_up", "LightningOrb"));
// 런 리셋
after("\t\tself.AquaSurgeLevel = 0\n", "\t\tself.FreezingBreathLevel = 0\n\t\tself.FrozenOrbLevel = 0\n\t\tself.LightningOrbLevel = 0\n");
// 엘리트/보스 강화 풀
after("\t\tif self:IsCardUnlocked(24) and self.AquaSurgeLevel < 3 then table.insert(pool, 24) end\n",
  "\t\t-- 프리징 브레스는 오브로 조합되면 슬롯을 떠나므로 그 뒤엔 풀에서 뺀다\n" +
  "\t\tif self:IsCardUnlocked(26) and self.FreezingBreathLevel < 5 and self.FrozenOrbLevel == 0 and self.LightningOrbLevel == 0 then table.insert(pool, 26) end\n" +
  "\t\tif self:IsCardUnlocked(27) and self.FrozenOrbLevel < 3 then table.insert(pool, 27) end\n" +
  "\t\tif self:IsCardUnlocked(28) and self.LightningOrbLevel < 3 then table.insert(pool, 28) end\n");
after('\t\telseif cardIdx == 24 then return "aquasurge_up"\n',
  '\t\telseif cardIdx == 26 then return "freezingbreath_up"\n\t\telseif cardIdx == 27 then return "frozenorb_up"\n\t\telseif cardIdx == 28 then return "lightningorb_up"\n');
// 치트(슬롯 클릭 레벨 순환)
after('\t\telseif cardIdx == 15 then return "hailstone_up"\n\t\telseif cardIdx == 101 then return "windpoem_up"\n', "");
s = s.replace('\t\telseif cardIdx == 15 then return "hailstone_up"\n\t\telseif cardIdx == 101 then return "windpoem_up"\n',
  '\t\telseif cardIdx == 15 then return "hailstone_up"\n\t\telseif cardIdx == 26 then return "freezingbreath_up"\n\t\telseif cardIdx == 101 then return "windpoem_up"\n');
after("\t\telseif cardIdx == 15 then self.HailStoneLevel = 1\n", "\t\telseif cardIdx == 26 then self.FreezingBreathLevel = 1\n");

fs.writeFileSync(FILE, crlf ? s.replace(/\n/g, "\r\n") : s);
console.log("patched. crlf=" + crlf + " lines=" + s.split("\n").length);
