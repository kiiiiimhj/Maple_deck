// 인사이징 3종 연출 방향 통일(2026-10-01) — 휘두르기·궤적·폭발·타격·관통 검기가 전부 같은 쪽을 향하게. 1회성 패치.
const fs = require("fs");
const FILE = "RootDesk/MyDesk/Card/CardManager.mlua";
const raw = fs.readFileSync(FILE, "utf8");
const crlf = raw.includes("\r\n");
let s = raw.replace(/\r\n/g, "\n");
function swap(a, t) { const n = s.split(a).length - 1; if (n !== 1) throw new Error("x" + n + ": " + a.slice(0, 90)); s = s.replace(a, () => t); }

// 1. 공용 프레임 재생에 좌우 반전 버전 추가
swap(`		-- PlayFrameEffect와 같고 투명도만 지정한다(1 = 불투명)
		local fx = self:SpawnEffectWithModel(frames[1], pos, 0, 1.0, scale, alpha, "skilleffectlong")
		if fx == nil then return end
		local renderer = fx.SpriteRendererComponent
`, `		-- PlayFrameEffect와 같고 투명도만 지정한다(1 = 불투명)
		self:PlayFrameEffectEx(frames, pos, scale, frameDur, loops, alpha, false)
	end

	@ExecSpace("ServerOnly")
	method void PlayFrameEffectEx(table frames, Vector3 pos, number scale, number frameDur, integer loops, number alpha, boolean flipX)
		-- PlayFrameEffectAlpha + 좌우 반전(그림 기준점 중심으로 뒤집힌다)
		local fx = self:SpawnEffectWithModel(frames[1], pos, 0, 1.0, scale, alpha, "skilleffectlong")
		if fx == nil then return end
		local renderer = fx.SpriteRendererComponent
		if flipX and isvalid(renderer) then renderer.FlipX = true end
`);

// 2. 휘두르기에 반전
swap(`	method void PlaySwingFrameEffect(table frames, Vector3 pos, number scale, number duration, number fromDeg, number toDeg)
		-- 프레임을 넘기면서 그림을 기준점(스프라이트 pivot) 중심으로 돌려 휘두르는 연출. 처음엔 느리게, 끝으로 갈수록 빠르게
		local fx = self:SpawnEffectWithModel(frames[1], pos, fromDeg, 1.0, scale, 1.0, "skilleffectlong")
		if fx == nil then return end
`, `	method void PlaySwingFrameEffect(table frames, Vector3 pos, number scale, number duration, number fromDeg, number toDeg, boolean flipX)
		-- 프레임을 넘기면서 그림을 기준점(스프라이트 pivot) 중심으로 돌려 휘두르는 연출. 처음엔 느리게, 끝으로 갈수록 빠르게.
		-- flipX면 그림을 뒤집고 회전도 거울로(각도 부호 반대) 돌린다
		if flipX then
			fromDeg = -fromDeg
			toDeg = -toDeg
		end
		local fx = self:SpawnEffectWithModel(frames[1], pos, fromDeg, 1.0, scale, 1.0, "skilleffectlong")
		if fx == nil then return end
		if flipX then fx.SpriteRendererComponent.FlipX = true end
`);

// 3. 시전: 방향을 먼저 정하고 전부 그 방향으로
swap(`				local pivotPos = Vector3(p.x + self.Card192PivotOffsetX * scale, p.y + self.Card192PivotOffsetY * scale, p.z)
`, `				-- 방향(유저 지정 2026-10-01): 휘두르기·궤적·폭발·타격·관통 검기가 전부 같은 쪽을 향한다(인사이징/관/폭 공통).
				-- 몬스터가 더 많은 쪽으로 벤다. 원본 그림은 왼쪽을 향하므로 오른쪽(dir = 1)이면 전부 좌우 반전 + 기준점을 반대편에 둔다
				local dir = self:GetIncisingDirection(map, target, p.x)
				local flip = (dir > 0)
				local pivotPos = Vector3(p.x - dir * self.Card192PivotOffsetX * scale, p.y + self.Card192PivotOffsetY * scale, p.z)
`);
swap(`self.Card192SwingDuration, self.Card192SwingFromDeg, self.Card192SwingToDeg)`, `self.Card192SwingDuration, self.Card192SwingFromDeg, self.Card192SwingToDeg, flip)`);
swap(`					self:PlayFrameEffect(dropSword, Vector3(pivotPos.x, pivotPos.y + self.Card192DropSwordYOffset, pivotPos.z), scale * self.Card192DropSwordScaleMult, self.Card192FrameDuration, 1)`,
  `					self:PlayFrameEffectEx(dropSword, Vector3(pivotPos.x, pivotPos.y + self.Card192DropSwordYOffset, pivotPos.z), scale * self.Card192DropSwordScaleMult, self.Card192FrameDuration, 1, 1.0, flip)`);
swap(`					self:PlayFrameEffect(slashRest, pivotPos, scale, self.Card192FrameDuration, 1)`, `					self:PlayFrameEffectEx(slashRest, pivotPos, scale, self.Card192FrameDuration, 1, 1.0, flip)`);
swap(`					self:PlayFrameEffect(blastFrames, pivotPos, scale, self.Card192FrameDuration, 1)`, `					self:PlayFrameEffectEx(blastFrames, pivotPos, scale, self.Card192FrameDuration, 1, 1.0, flip)`);
swap(`footY = p.y, ratio = ratio, target = target, band = self:GetDepthBand(target) })`, `footY = p.y, ratio = ratio, target = target, band = self:GetDepthBand(target), dir = dir })`);

// 4. 타격 연출도 맞은 범위의 방향으로
swap(`					local inArea = false
					for _, a in ipairs(anchors) do
						if m == a.target then
							inArea = true
						elseif self:InEllipse(mp.x - a.x, mp.y + self.Card192AreaYOffset - a.y, self.Card192AreaHalfW, self.Card192AreaHalfH) and self:IsInDepthBand(m, a.band) then
							inArea = true
						end
						if inArea then break end
					end`, `					local inArea = false
					local hitDir = -1
					for _, a in ipairs(anchors) do
						if m == a.target then
							inArea = true
						elseif self:InEllipse(mp.x - a.x, mp.y + self.Card192AreaYOffset - a.y, self.Card192AreaHalfW, self.Card192AreaHalfH) and self:IsInDepthBand(m, a.band) then
							inArea = true
						end
						if inArea then
							hitDir = a.dir
							break
						end
					end`);
swap(`						self:PlayFrameEffect(hitFrames, Vector3(mp.x, mp.y + self.Card192AreaYOffset, mp.z), self.Card192HitScale * self:GetEffectScaleRatio(m), self.Card192HitFrameDuration, 1)
						if not m._dead then`, `						self:PlayFrameEffectEx(hitFrames, Vector3(mp.x, mp.y + self.Card192AreaYOffset, mp.z), self.Card192HitScale * self:GetEffectScaleRatio(m), self.Card192HitFrameDuration, 1, 1.0, hitDir > 0)
						if not m._dead then`);

// 5. 관통 검기는 벤 방향 그대로
swap(`		-- 몬스터가 더 많은 쪽으로 쏜다(같으면 무작위)
		local left = 0
		local right = 0
		for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
			---@type MonsterAI
			local m = mob
			if isvalid(m) and isvalid(m.Entity) and not m._dead and m ~= anchor.target and self:IsInDepthBand(m, anchor.band) then
				local mx = m.Entity.TransformComponent.Position.x
				if mx < anchor.x then left = left + 1 elseif mx > anchor.x then right = right + 1 end
			end
		end
		local dir = 1
		if left > right then
			dir = -1
		elseif left == right and _UtilLogic:RandomDouble() < 0.5 then
			dir = -1
		end
`, `		-- 인사이징을 벤 방향(시전 때 정한 anchor.dir) 그대로 쏜다
		local dir = anchor.dir
`);

// 6. 방향 결정 함수
swap(`	@ExecSpace("ServerOnly")
	method void LaunchIncisingSpear(`, `	@ExecSpace("ServerOnly")
	method integer GetIncisingDirection(Entity map, MonsterAI target, number x)
		-- 타겟 기준 좌/우 중 같은 깊이 구간 몬스터가 더 많은 쪽(-1 = 왼쪽, 1 = 오른쪽). 같으면 존 가운데 쪽
		local left = 0
		local right = 0
		if map ~= nil then
			local band = self:GetDepthBand(target)
			for _, mob in ipairs(self:GetMonstersInCurrentZone(map)) do
				---@type MonsterAI
				local m = mob
				if isvalid(m) and isvalid(m.Entity) and not m._dead and m ~= target and self:IsInDepthBand(m, band) then
					local mx = m.Entity.TransformComponent.Position.x
					if mx < x then left = left + 1 elseif mx > x then right = right + 1 end
				end
			end
		end
		if left > right then return -1 end
		if right > left then return 1 end
		if x > self:GetZoneCenterX() then return -1 end
		return 1
	end

	@ExecSpace("ServerOnly")
	method void LaunchIncisingSpear(`);

fs.writeFileSync(FILE, crlf ? s.replace(/\n/g, "\r\n") : s);
console.log("ok");
