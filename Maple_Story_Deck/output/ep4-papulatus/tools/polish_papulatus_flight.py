from pathlib import Path
root=Path('G:/Maple_Story_Deck/RootDesk/MyDesk')
p=root/'MonsterAI.mlua';t=p.read_text(encoding='utf8')
assert t.count('self._scaleMultiplier=phase==1 and 0.95 or 1.65')==1
t=t.replace('self._scaleMultiplier=phase==1 and 0.95 or 1.65','self._scaleMultiplier=phase==1 and 0.95 or 1.2')
t=t.replace('(0.15+math.sin(t*2)*0.45)*lift','(-0.65+math.sin(t*2)*0.3)*lift')
t=t.replace('self.MonsterSprite=def.stand self:ApplyBodySprite(def.stand) self:SyncDepthOverlaySprite()','self.MonsterSprite=phase==2 and def.move or def.stand self:ApplyBodySprite(self.MonsterSprite) self:SyncDepthOverlaySprite()')
p.write_text(t,encoding='utf8',newline='\r\n')
p=root/'Puzzle/Ep4/Ep4PapulatusLogic.mlua';t=p.read_text(encoding='utf8')
m='\t@ExecSpace("ServerOnly")\n\tmethod void OnPortalTouched'
assert t.count(m)==1
t=t.replace(m,'''\t@ExecSpace("ServerOnly")
\tmethod void OnBeginPlay()
\t\t-- 플레이 초반부터 원본 모션을 준비해 퍼즐 포탈 입장 때 기다리지 않게 한다.
\t\t_TimerService:SetTimerOnce(function()
\t\t\tif not isvalid(self) then return end self:GetPhaseDef(1)
\t\t\tif not isvalid(self) then return end self:GetPhaseDef(2)
\t\tend,0.5)
\tend

'''+m)
p.write_text(t,encoding='utf8',newline='\r\n')
print('Phase2 flight and HP bar stay below the top HUD; original fly animation restored; clips warm up from game load.')
