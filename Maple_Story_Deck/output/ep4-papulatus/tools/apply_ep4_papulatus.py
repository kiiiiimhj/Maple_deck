from pathlib import Path
import csv,io
desk=Path('G:/Maple_Story_Deck/RootDesk/MyDesk');out=Path('outputs/ep4-papulatus');out.mkdir(parents=True,exist_ok=True);pending=[]
def rep(t,a,b,n=1):
 assert t.count(a)==n,(a,t.count(a),n)
 return t.replace(a,b)
def edit(name,fn):
 f=desk/name;b=out/('before-'+f.name)
 assert not b.exists(),b
 t=fn(f.read_text(encoding='utf-8-sig'));pending.append((f,b,t))
def manager(t):
 t=rep(t,'self.MaxMapIndex = 188  -- map5(174~183) + map1 히든맵 5존(184~188)','self.MaxMapIndex = 189  -- 맵1 히든맵 5존과 파풀라투스 단일 존')
 m='\tmethod void MoveByDelta(integer delta)\n\t\tlocal actualIndex = self.CurrentMapIndex\n'
 t=rep(t,m,m+'\t\tif actualIndex==189 then return end -- 파풀 방은 좌우 이동 없음\n')
 m='\t\t\t[188] = { file = "ep4_map1_ester1", container = nil, spawnX = 62, landY = -0.12 },'
 t=rep(t,m,m+'\n\t\t\t[189] = { file = "ep4_map5_ester1", container = nil, spawnX = 0, landY = -1.32 },')
 t=rep(t,'or self:IsEp4Map1Ester1Zone(targetIndex)','or self:IsEp4Map1Ester1Zone(targetIndex) or targetIndex==189')
 m='\t\telseif self:IsEp4Map1Ester1Zone(mapIndex) then'
 t=rep(t,m,'''\t\telseif mapIndex==189 then
\t\t\t-- 파풀라투스는 존1 안에서만 전투한다.
\t\t\tcam.ConfineCameraArea=false cam.UseCustomBound=true
\t\t\tcam.LeftBottom=Vector2(self.Ep4ConfineMinX,self.Ep4FixedCameraY)
\t\t\tcam.RightTop=Vector2(7.75,self.Ep4FixedCameraY)
\t\t\tcam.DeadZone=Vector2(self.DefaultDeadZone.x,0) cam.SoftZone=Vector2(self.DefaultSoftZone.x,0)
\t\t\tself:LockCameraY(self.Ep4FixedCameraY)
'''+m)
 return t
def game(t):
 t=rep(t,'return mapIndex >= 134 and mapIndex <= 188','return mapIndex >= 134 and mapIndex <= 189')
 m='\t\tlog("GameManager: ep4 monster data built")'
 t=rep(t,m,'''\t\t-- 파풀 처치 후에는 맵5 전체에서 중복 없이 모은 종 중 무작위로 등장한다.
\t\tlocal pool={} local seen={}
\t\tfor z=174,183 do for _,name in ipairs(self._ep4Zones[z]) do
\t\t\tif not seen[name] then seen[name]=true table.insert(pool,name) end
\t\tend end
\t\tself._ep4Zones[189]=pool
'''+m)
 t=rep(t,'if _MapManager:IsEp4Map1Ester1Zone(_MapManager.CurrentMapIndex) and not _MapManager.AwayOnSideMap then','if _MapManager:IsEp4Map1Ester1Zone(_MapManager.CurrentMapIndex) and _Ep4Map1HiddenExpLogic.Active and not _MapManager.AwayOnSideMap then')
 t=rep(t,'\t\t_MonsterSpawner:ClearCurrentBoss()','\t\tif _MapManager.CurrentMapIndex~=189 then _MonsterSpawner:ClearCurrentBoss() end')
 t=rep(t,'\t\t_CardManager:EndBossWaveDropCap()','\t\tif _MapManager.CurrentMapIndex~=189 then _CardManager:EndBossWaveDropCap() end')
 t=rep(t,'\t\t_Ep4Map5EasterEggLogic:ResetForNewRun()','\t\t_Ep4Map5EasterEggLogic:ResetForNewRun()\n\t\t_Ep4Map1HiddenExpLogic:ResetForNewRun()\n\t\t_Ep4PapulatusLogic:ResetForNewRun()',2)
 return t
def ui(t):
 t=rep(t,'if _MapManager:IsEp4Map1Ester1Zone(mapIndex) then return 0 end','if _MapManager:IsEp4Map1Ester1Zone(mapIndex) or mapIndex==189 then return 0 end')
 t=rep(t,'and mapIndex ~= 134) end','and mapIndex ~= 134 and mapIndex ~= 189) end')
 t=rep(t,'and mapIndex ~= 188) end','and mapIndex ~= 188 and mapIndex ~= 189) end')
 return t
def spawner(t):
 t=rep(t,'mapIndex >= 134 and mapIndex <= 188','mapIndex >= 134 and mapIndex <= 189',2)
 t=rep(t,'\t\tself._elapsedPlayTime = self._elapsedPlayTime + delta','\t\tself._elapsedPlayTime = self._elapsedPlayTime + delta\n\t\tif _MapManager.CurrentMapIndex==189 and not _Ep4PapulatusLogic.Defeated then return end')
 m='\tmethod void ActivateMap(integer mapIndex)\n'
 t=rep(t,m,m+'\t\tif mapIndex==189 then\n\t\t\tif self._activeMaps==nil then self._activeMaps={} end\n\t\t\tself._activeMaps[189]=true self._pendingRushPenalty=0 _Ep4PapulatusLogic:Activate() return\n\t\tend\n')
 m='\tmethod table SpawnBatchOnMap(Entity map, integer wave, boolean isBoss, boolean allowElite, integer mapIndex, boolean isSpike, integer minCountOverride)\n'
 t=rep(t,m,m+'\t\tif mapIndex==189 and (isBoss or not _Ep4PapulatusLogic.Defeated) then return {} end\n')
 m='\tmethod void TrySpawnPersistentBoss()\n';t=rep(t,m,m+'\t\tif _MapManager.CurrentMapIndex==189 then return end\n')
 m='\tmethod void RelocateBossToCurrentZone()\n';t=rep(t,m,m+'\t\tif _MapManager.CurrentMapIndex==189 then return end\n')
 # 보스 호위/소환 부하 역시 전용 방으로 따라 들어오지 않는다.
 t=rep(t,'\t\tself._timer = self._timer - delta','\t\tif _MapManager.CurrentMapIndex==189 then\n\t\t\tself._timer=self._timer-delta\n\t\t\tif self._timer<=0 then self:SpawnWave() self._timer=self:GetEffectiveSpawnInterval(_GameManager.Wave) end\n\t\t\treturn\n\t\tend\n\t\tself._timer = self._timer - delta')
 return t
def ai(t):
 m='script MonsterAI extends Component\n'
 props='''\t@Sync property integer PapulatusPhase = 0
\t@Sync property number BossHealthCurrent = 0
\t@Sync property number BossHealthMaximum = 0
\t@Sync property integer BossHealthZone = 0
\tproperty integer _papActionRevision = 0
\tproperty table _papAttacks = nil
\tproperty integer _papAttackIndex = 0
\tproperty number _papClock = 0
\tproperty Vector3 _papFlightStart = Vector3(0,0,0)
'''
 t=rep(t,m,m+props)
 m='\tmethod void InitializeStats(integer zoneIndex, integer wave, boolean isBoss, integer forcedSpeciesIdx)\n'
 t=rep(t,m,m+'\t\tself.PapulatusPhase=0 self._papActionRevision=self._papActionRevision+1\n')
 t=rep(t,'\t@ExecSpace("ServerOnly")\n\tmethod void OnUpdate(number delta)\n','\tmethod void OnUpdate(number delta)\n\t\tif self:IsClient() then self:UpdateBossHealthBar(delta) return end\n\t\tif self._isBoss then\n\t\t\tif self.BossHealthCurrent~=self.CurrentHp then self.BossHealthCurrent=self.CurrentHp end\n\t\t\tif self.BossHealthMaximum~=self.MaxHp then self.BossHealthMaximum=self.MaxHp end\n\t\t\tif self.BossHealthZone~=self._spawnZoneIndex then self.BossHealthZone=self._spawnZoneIndex end\n\t\tend\n')
 m='\t\tif self._openingSummonLock then return end\n';t=rep(t,m,m+'\t\tif self.PapulatusPhase>0 then self:UpdatePapulatus(delta) return end\n')
 m='\tmethod void Die()\n\t\tif self._dead then return end'
 t=rep(t,m,m+'\n\t\tif self.PapulatusPhase==1 then self:TransitionPapulatusPhase() return end')
 t=rep(t,'\t\t\tif _MonsterSpawner:HasBossParty() then','\t\t\tif self.PapulatusPhase==2 then\n\t\t\t\t_GameManager:OnBossDefeated(self.Entity.TransformComponent.WorldPosition,fallHeight,groundWorldY,dropScale)\n\t\t\t\t_Ep4PapulatusLogic:OnDefeated(self.Entity)\n\t\t\telseif _MonsterSpawner:HasBossParty() then')
 t=rep(t,'\t\t\t_MonsterSpawner:KillBossEscorts()','\t\t\tif self.PapulatusPhase==0 then _MonsterSpawner:KillBossEscorts() end')
 # 사망/변신으로 이전 공격 복귀 타이머를 무효화한다.
 m='\tmethod void PlayPhase1TransformAnimation(string dieRUID, string dieSoundRUID)\n\t\tif self:IsServer() then return end'
 t=rep(t,m,m+'\n\t\tself._transientSpriteGeneration=self._transientSpriteGeneration+1\n\t\tself._isPlayingTransientSprite=false self._isPlayingAttackSprite=false')
 t=rep(t,'\t@ExecSpace("ServerOnly")\n\tmethod void OnEndPlay()\n','\tmethod void OnEndPlay()\n\t\tif self:IsClient() then\n\t\t\tif isvalid(self._T.bossHpBar) then self._T.bossHpBar:Destroy() end\n\t\t\tself._T.bossHpBar=nil return\n\t\tend\n')
 methods=Path('work/papulatus_ai_methods.txt').read_text(encoding='utf8')
 methods=methods.replace('self._spawnZoneIndex==_MapManager.CurrentMapIndex','self.BossHealthZone==_MapManager.CurrentMapIndex')
 bad='local evade=1-(1-_CardManager:GetDarkSightEvadeChance())*(1-_CardManager:GetRadicalDarkSightEvadeChance())'
 methods=rep(methods,bad,'''local missed=self._accuracyDebuffPercent>0 and _UtilLogic:RandomDouble()<self._accuracyDebuffPercent*0.5
\t\t\tfor _,chance in ipairs({_CardManager:GetDarkSightEvadeChance(),_CardManager:GetRadicalDarknessEvadeChance(),_CardManager:GetConcentrationEvadeChance()}) do
\t\t\t\tif not missed and chance>0 and _UtilLogic:RandomDouble()<chance then missed=true end
\t\t\tend''')
 methods=methods.replace('_GameManager:OnMonsterReached(_GameManager.BossAttackMultiplier,true,true,Vector2(pos.x,pos.y),false)','if not missed then _GameManager:OnMonsterReached(_GameManager.BossAttackMultiplier,true,true,Vector2(pos.x,pos.y),false) end')
 methods=methods.replace('self.BossHealthCurrent=hp self.BossHealthMaximum=hp','self.BossHealthCurrent=hp self.BossHealthMaximum=hp self.BossHealthZone=self._spawnZoneIndex')
 return t.rsplit('\nend',1)[0]+'\n'+methods+'end\n'
def egg(t):
 m='\t\t_MapManager:MoveToMap(_MapManager.CurrentMapIndex,184)'
 return rep(t,m,'\t\tif _Ep4Map1HiddenExpLogic.Consumed then _UIToast:ShowMessage("EP4M1_HIDDEN_TIME_UP",userId) return end\n'+m)
for name,fn in [('Map/MapManager.mlua',manager),('GameManager.mlua',game),('MapMoveUI.mlua',ui),('MonsterSpawner.mlua',spawner),('MonsterAI.mlua',ai),('Puzzle/Ep4/Ep4Map1EasterEggLogic.mlua',egg)]:edit(name,fn)
if '--check' in __import__('sys').argv:
 print('All six existing script patches passed preflight.');raise SystemExit(0)
for f,b,t in pending:
 b.write_bytes(f.read_bytes());f.write_text(t,encoding='utf8',newline='\r\n')
for name in ['Ep4Map1HiddenExpLogic','Ep4Map5PortalTrigger','Ep4PapulatusLogic']:
 f=desk/('Puzzle/Ep4/'+name+'.mlua');assert not f.exists()
 t=Path('work/'+name+'.mlua').read_text(encoding='utf8')
 if name=='Ep4PapulatusLogic':
  t=rep(t,'\t\t_MapManager:PlayBossBgm()','\t\tlocal run=self.RunRevision\n\t\t_TimerService:SetTimerOnce(function() if self.RunRevision==run and self.Phase<3 and _MapManager.CurrentMapIndex==189 then _MapManager:PlayBossBgm() end end,0.2)')
  t=rep(t,'\t\tself.Defeated=true self.Phase=3 self.Boss=nil\n\t\t_UIToast:ShowBossMessage("EP4_PAP_DEFEATED")\n\t\t_MapManager:ForcePlayBgmForCurrentMap()\n\t\tlog("Ep4Papulatus: defeated, map5 random monsters enabled")','''\t\tself.Phase=3
\t\tlocal run=self.RunRevision local ai=entity:GetComponent("script.MonsterAI")
\t\t_TimerService:SetTimerOnce(function()
\t\t\tif self.RunRevision~=run or _GameManager.GameOver then return end
\t\t\tself.Defeated=true self.Boss=nil
\t\t\t_UIToast:ShowBossMessage("EP4_PAP_DEFEATED")
\t\t\t_MapManager:ForcePlayBgmForCurrentMap()
\t\t\t_MonsterSpawner:SpawnBatchOnMap(_MonsterSpawner:GetZoneEntity(189),_GameManager.Wave,false,false,189,false,_MonsterSpawner.MinMonstersOnArrival)
\t\t\tlog("Ep4Papulatus: defeated, map5 random monsters enabled")
\t\tend,ai._dieDuration+0.2)''')
 f.write_text(t,encoding='utf8',newline='\r\n')
f=desk/'Localization/GameText.csv';(out/'before-GameText.csv').write_bytes(f.read_bytes())
rows=list(csv.DictReader(io.StringIO(f.read_text(encoding='utf-8-sig'))));fields=list(rows[0])
texts={
 'EP4M1_HIDDEN_TIME_UP':['숨겨진 길의 시간이 끝났다! 원래 장소로 돌아가자.','Your time on the hidden path is up! Return to where you came from.','隱藏之路的時間結束了！回到原來的地方吧。','隠された道の時間が終わった！元の場所へ戻ろう。'],
 'EP4_PAP_APPEAR':['파풀라투스가 나타났다!','Papulatus has appeared!','帕普拉圖斯出現了！','ビシャスプラントが現れた！'],
 'EP4_PAP_PHASE2':['시계가 부서졌다! 파풀라투스의 본체가 나타났다!','The clock shattered! Papulatus has emerged!','時鐘碎裂了！帕普拉圖斯的本體出現了！','時計が壊れた！ビシャスプラントの本体が現れた！'],
 'EP4_PAP_DEFEATED':['파풀라투스를 물리쳤다! 몬스터들이 몰려온다!','Papulatus is defeated! Monsters are approaching!','擊敗了帕普拉圖斯！怪物湧過來了！','ビシャスプラントを倒した！モンスターたちが押し寄せてくる！']}
for key,strings in texts.items():
 assert not any(r['Key']==key for r in rows)
 r={k:'' for k in fields};r.update(Key=key,Source='Ep4PapulatusLogic',Note='EP4 hidden map message')
 for lang,txt in zip(['ko','en','zh-tw','ja'],strings):r[lang]=txt
 rows.append(r)
buf=io.StringIO(newline='');w=csv.DictWriter(buf,fieldnames=fields,lineterminator='\r\n');w.writeheader();w.writerows(rows);f.write_text(buf.getvalue(),encoding='utf-8-sig',newline='')
print('Papulatus two phases, boss health, single arena, map5 pool and 60-second hidden XP budget applied.')
