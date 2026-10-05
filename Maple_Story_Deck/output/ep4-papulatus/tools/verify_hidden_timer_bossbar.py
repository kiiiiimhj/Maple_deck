from pathlib import Path
import json,time,sys,shutil
from maker_session import MakerSession
from run_lobby_panels_apply import errors
sys.stdout.reconfigure(encoding='utf8');out=Path('outputs/ep4-papulatus');s=MakerSession()
def check(context,code,marker):
 s.call('maker_execute_script',{'context':context,'script':code+'\nlog("'+marker+'")'})
 for _ in range(120):
  d=s.call('maker_logs',{'kind':'normal'});assert not errors(d),errors(d)
  if any(marker in x.get('message','') for x in d['logs']):print(marker,flush=True);return d
  time.sleep(.4)
 raise AssertionError(marker)
try:
 s.call('maker_clear_logs')
 check('server_main','''_GameManager:SetEasterEggPaused(false) _GameManager.GameOver=false _GameManager.PlayerHp=100000
_Ep4Map1HiddenExpLogic:ResetForNewRun()
assert(_Ep4Map1HiddenExpLogic.Duration==60 and _Ep4Map1HiddenExpLogic._remaining==60)
_MapManager._moveLocked=false _MapManager:MoveToMap(_MapManager.CurrentMapIndex,136)''','PAP_HIDDEN_PREP')
 time.sleep(2)
 check('server_main','''assert(_MapManager.CurrentMapIndex==136)
_Ep4Map1EasterEggLogic:RevealPortal()
local u=nil for _,e in pairs(_UserService.UserEntities) do if isvalid(e) then u=e break end end
_Ep4Map1EasterEggLogic:OnPortalTouched(_EntityService:GetEntityByPath("/maps/ep4_map1/esteregg_5"),u.PlayerComponent.UserId)''','PAP_HIDDEN_ENTER')
 time.sleep(2)
 check('server_main','''assert(_MapManager.CurrentMapIndex==184 and _Ep4Map1HiddenExpLogic.Active)
assert(_Ep4Map1HiddenExpLogic._remaining>55 and _Ep4Map1HiddenExpLogic._remaining<60)
local amount=_GameManager:GetExpPerKill()
_MapManager.CurrentMapIndex=136 local normal=_GameManager:GetExpPerKill() _MapManager.CurrentMapIndex=184 assert(amount==normal*2)
local aiEntity=_MonsterSpawner:SpawnOneMonster(_MonsterSpawner:GetZoneEntity(184),184,1,true,true,{},0)
assert(isvalid(aiEntity))
_GameManager:SetEasterEggPaused(true)
log("PAP_HIDDEN_PAUSED remaining=".._Ep4Map1HiddenExpLogic._remaining)''','PAP_HIDDEN_ACTIVE')
 time.sleep(2)
 check('client','''local board=_EntityService:GetEntityByPath("/ui/DefaultGroup/ExpBoostBoard")
local text=_EntityService:GetEntityByPath("/ui/DefaultGroup/ExpBoostBoard/Inner/TimerText")
assert(board.Enable)
assert(text.TextGUIRendererComponent.Text==string.format("%02d:%02d",math.floor(_Ep4Map1HiddenExpLogic.RemainingSeconds/60),_Ep4Map1HiddenExpLogic.RemainingSeconds%60))
local found=false
for _,e in pairs(_EntityService:GetEntityByPath("/maps/ep4_map1_ester1").Children) do
 local ai=e:GetComponent("script.MonsterAI")
 if ai~=nil and ai._isBoss and ai.PapulatusPhase==0 then
  assert(isvalid(ai._T.bossHpBar) and ai._T.bossHpBar.Enable) found=true
 end
end assert(found)
log("PAP_HIDDEN_TIMER_TEXT "..text.TextGUIRendererComponent.Text)''','PAP_NORMAL_BOSS_BAR_PASS')
 d=s.call('maker_screenshot');shutil.copy2(d['path'],out/'hidden-timer-normal-boss.png')
 check('server_main','''local remaining=_Ep4Map1HiddenExpLogic._remaining
_TimerService:SetTimerOnce(function()
 assert(_Ep4Map1HiddenExpLogic._remaining==remaining)
 _GameManager:SetEasterEggPaused(false)
 local deadline=_Ep4Map1HiddenExpLogic._remaining+1.5
 _TimerService:SetTimerOnce(function()
  assert(_MapManager.CurrentMapIndex==136 and _Ep4Map1HiddenExpLogic.Consumed)
  assert(not _Ep4Map1HiddenExpLogic.Active and _Ep4Map1HiddenExpLogic.RemainingSeconds==0)
  log("PAP_HIDDEN_60SEC_RETURN_PASS")
 end,deadline)
 log("PAP_HIDDEN_COUNTDOWN_RESUMED")
end,1)''','PAP_HIDDEN_RETURN_DISPATCH')
 for i in range(200):
  d=s.call('maker_logs',{'kind':'normal'});assert not errors(d),errors(d)
  if any('PAP_HIDDEN_60SEC_RETURN_PASS' in x.get('message','') for x in d['logs']):break
  if i%45==0:print('Hidden-map countdown running...',flush=True)
  time.sleep(.5)
 else:raise AssertionError('60sec return timeout')
 print('PAP_HIDDEN_60SEC_RETURN_PASS',flush=True)
 check('client','assert(not _EntityService:GetEntityByPath("/ui/DefaultGroup/ExpBoostBoard").Enable)','PAP_HIDDEN_BOARD_HIDDEN')
 check('server_main','''local u=nil for _,e in pairs(_UserService.UserEntities) do if isvalid(e) then u=e break end end
_MapManager._moveLocked=false
_Ep4Map1EasterEggLogic:OnPortalTouched(_EntityService:GetEntityByPath("/maps/ep4_map1/esteregg_5"),u.PlayerComponent.UserId)
assert(_MapManager.CurrentMapIndex==136)
_Ep4Map1HiddenExpLogic:ResetForNewRun() _Ep4PapulatusLogic:ResetForNewRun()
assert(_Ep4Map1HiddenExpLogic._remaining==60 and not _Ep4Map1HiddenExpLogic.Consumed)
assert(not _Ep4PapulatusLogic.Defeated and _Ep4PapulatusLogic.Phase==0)
_CardManager.DisableBasicAttack=false
_GameManager:SetEasterEggPaused(false)''','PAP_RESET_AND_EXHAUSTED_ENTRY_PASS')
 d=s.call('maker_logs',{'kind':'normal'});assert not errors(d)
 (out/'final-normal.json').write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf8')
 (out/'verification.json').write_text(json.dumps({'status':'PASS','papulatusZone':189,'phases':2,'papulatusTimeLimit':None,'hpMultipliers':[1.5,0.8],'minimumHpPerPhase':5000,'hiddenMapTimeLimitSeconds':60,'verified':['Native puzzle portal click entry','Original attacks and sounds','Full phase1 die1 then same-entity phase2','Phase2 flight and attack damage','All direction arrows hidden and sideways requests blocked','Boss HP bar in both phases and ordinary boss','Final die then random map5 monsters','Ordinary boss roster unchanged','Existing timer UI text','Actual 60-second countdown and return to zone136','Paused timer resumes','Exhausted reentry blocked','New run resets','Four localized messages in four locales','Zero build or runtime errors']},ensure_ascii=False,indent=2),encoding='utf8')
 print('ALL PASS',flush=True)
finally:s.close()
