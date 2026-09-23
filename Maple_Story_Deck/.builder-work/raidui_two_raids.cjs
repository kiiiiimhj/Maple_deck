// 2026-09-23: RaidUI — 레이드 2종 요일 교대에 맞춰 로비 버튼 그림 / 로딩 그림 / 보상표 헤더를 현재 레이드로(1회용)
const fs = require('fs');
const p = 'RootDesk/MyDesk/Raid/RaidUI.mlua';
let s = fs.readFileSync(p, 'utf8');
const crlf = s.includes('\r\n');
s = s.replace(/\r\n/g, '\n');
function rep(a, b) {
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error('count ' + n + ': ' + a.slice(0, 80));
  s = s.replace(a, () => b);
}

rep(`	property string RaidLoadingImageRUID = "8dde242cef0040e4b5d26ab30516881b"
`, `	property string RaidLoadingImageRUID = "8dde242cef0040e4b5d26ab30516881b"

	-- ── 레이드 2종 요일 교대(2026-09-23 유저 지정: 월~수 발록 / 목~일 자쿰) ──
	-- 로비 버튼은 하나이고 요일(= _RaidLogic.RaidId)에 따라 그림만 바뀐다. 로딩 그림도 레이드별.
	property string ZakumLoadingImageRUID = "10dd753b57bc4292858d39645dbcfd83"

	property string BalrogLobbyIconRUID = "549d8fbf2bb948f8be5328fc3863af00"

	property string ZakumLobbyIconRUID = "2cba30b14d254ef3ac2fee506896e9d3"

	-- 로비 레이드 버튼 안의 보스 그림(TitleGroup/RaidButton/Overlay)
	property SpriteGUIRendererComponent lobbyOverlay = "152bbdf4-f9d4-4fc5-b293-cf0b884826f8"

	-- 로비 그림을 마지막으로 칠한 레이드(매 프레임 같은 값을 다시 쓰지 않게)
	property integer _lobbyIconRaidId = 0
`);

// 예열: 두 레이드 로딩 그림 모두
rep(`		if self.RaidLoadingImageRUID ~= "" and not seen[self.RaidLoadingImageRUID] then
			table.insert(ruids, self.RaidLoadingImageRUID)
		end`, `		for _, loadingRuid in ipairs({ self.RaidLoadingImageRUID, self.ZakumLoadingImageRUID }) do
			if loadingRuid ~= "" and not seen[loadingRuid] then
				seen[loadingRuid] = true
				table.insert(ruids, loadingRuid)
			end
		end`);
rep(`			_LoadingUI:WarmImage(self.RaidLoadingImageRUID, 1.0)`, `			_LoadingUI:WarmImage(self:GetLoadingImageRUID(), 1.0)`);
rep(`		_LoadingUI:CoverNowWithImageTitled(self.RaidLoadingImageRUID)`, `		_LoadingUI:CoverNowWithImageTitled(self:GetLoadingImageRUID())`);

rep(`	-- ── 로비 아이콘 ───────────────────────────────────────────────────────────
	@ExecSpace("ClientOnly")
	method void RefreshLobbyIcon()`, `	@ExecSpace("ClientOnly")
	method string GetLoadingImageRUID()
		-- 지금 열린 레이드의 입장 로딩 그림
		if _RaidLogic.RaidId == _RaidLogic.RaidZakum then return self.ZakumLoadingImageRUID end
		return self.RaidLoadingImageRUID
	end

	-- ── 로비 아이콘 ───────────────────────────────────────────────────────────
	@ExecSpace("ClientOnly")
	method void RefreshLobbyIcon()`);
rep(`		-- 받을 보상이 있을 때 + 캐릭터가 유령이 됐을 때(부활하러 들어가야 한다) 빨간점을 켠다
		if isvalid(self.lobbyRedDot) then
			self.lobbyRedDot.Enable = _RaidLogic:CanClaimNow() or _RaidLogic.IsGhost
		end
	end`, `		-- 받을 보상이 있을 때 + 캐릭터가 유령이 됐을 때(부활하러 들어가야 한다) 빨간점을 켠다
		if isvalid(self.lobbyRedDot) then
			self.lobbyRedDot.Enable = _RaidLogic:CanClaimNow() or _RaidLogic.IsGhost
		end
		-- 버튼 그림 = 지금 요일의 레이드(월~수 발록 / 목~일 자쿰). 바뀔 때만 쓴다
		local raidId = _RaidLogic.RaidId
		if raidId ~= self._lobbyIconRaidId and isvalid(self.lobbyOverlay) then
			self._lobbyIconRaidId = raidId
			local icon = self.BalrogLobbyIconRUID
			if raidId == _RaidLogic.RaidZakum then icon = self.ZakumLobbyIconRUID end
			self.lobbyOverlay.ImageRUID = DataRef(icon)
			log("RaidUI: lobby icon -> raid " .. raidId)
		end
	end`);

// 보상표 헤더 "반지" / "목걸이"
rep(`		local current = _RaidLogic:GetGradeIndex()
		local maxIdx = _RaidLogic:GetMaxGradeIndex()
		for i = 0, maxIdx do`, `		local current = _RaidLogic:GetGradeIndex()
		local maxIdx = _RaidLogic:GetMaxGradeIndex()
		-- 보상 장비 열 헤더 — 발록은 반지, 자쿰은 목걸이(2026-09-23)
		local head = self.rewardTable:GetChildByName("Head")
		local ringHead = nil
		if isvalid(head) then ringHead = head:GetChildByName("Ring") end
		if isvalid(ringHead) then
			local headKey = "UI_RAIDGROUP_012"
			if _RaidLogic.RaidId == _RaidLogic.RaidZakum then headKey = "MLUA_RAIDUI_005" end
			ringHead.TextGUIRendererComponent.Text = _LocalizationService:GetText(headKey)
		end
		for i = 0, maxIdx do`);

if (crlf) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync(p, s, 'utf8');
console.log('ok');
