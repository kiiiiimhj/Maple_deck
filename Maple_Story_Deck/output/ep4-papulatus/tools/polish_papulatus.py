from pathlib import Path
p=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Puzzle/Ep4/Ep4PapulatusLogic.mlua')
t=p.read_text(encoding='utf8')
t=t.replace('\tproperty table _durationCache = {}','\tproperty table _durationCache = {}\n\tproperty table _phaseDefs = {}\n\tproperty boolean _loading = false')
t=t.replace('\tmethod table GetPhaseDef(integer phase)\n','\tmethod table GetPhaseDef(integer phase)\n\t\tif self._phaseDefs[phase]~=nil then return self._phaseDefs[phase] end\n')
t=t.replace('\t\treturn def\n','\t\tself._phaseDefs[phase]=def\n\t\treturn def\n')
t=t.replace('\t\tif isvalid(self.Boss) then return end','''\t\tif isvalid(self.Boss) or self._loading then return end
\t\t-- 리소스를 불러오는 동안 일반 몬스터로 피격되거나 변신이 늦어지는 일을 막는다.
\t\tself._loading=true local revision=self.RunRevision
\t\tlocal phase1=self:GetPhaseDef(1) self:GetPhaseDef(2)
\t\tif self.RunRevision~=revision then return end
\t\tself._loading=false
\t\tif _GameManager.GameOver or _MapManager.CurrentMapIndex~=189 then return end''')
t=t.replace('self:GetPhaseDef(1))','phase1)')
t=t.replace('self.Boss=nil self.Phase=0 self.Defeated=false self.NormalBossHp=0','self.Boss=nil self.Phase=0 self.Defeated=false self.NormalBossHp=0 self._loading=false')
p.write_text(t,encoding='utf8',newline='\r\n')
print('Both phases preload before boss spawn; phase transition uses cached original animation durations.')
