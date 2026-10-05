from pathlib import Path
import json,re,time,sys,shutil
from maker_session import MakerSession
from run_lobby_panels_apply import errors
sys.stdout.reconfigure(encoding='utf8');out=Path('outputs/ep4-papulatus');s=MakerSession()
def check(context,code,marker):
 s.call('maker_execute_script',{'context':context,'script':code+'\nlog("'+marker+'")'})
 for _ in range(150):
  d=s.call('maker_logs',{'kind':'normal'});assert not errors(d),errors(d)
  if any(marker in l.get('message','') for l in d['logs']):
   (out/(marker+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf8');print(marker,flush=True);return d
  time.sleep(.4)
 raise AssertionError(marker)
def capture(name):
 d=s.call('maker_screenshot');shutil.copy2(d['path'],out/(name+'.png'));print('SCREENSHOT',name,flush=True)
try:
 s.call('maker_clear_logs')
 check('server_main',Path('work/pap_setup.lua').read_text(encoding='utf8'),'PAP_V2_SETUP')
 time.sleep(4)
 d=check('client',Path('work/pap_portal_coords.lua').read_text(encoding='utf8'),'PAP_V2_COORD')
 msg=[x['message'] for x in d['logs'] if x.get('message','').startswith('PAP_PORTAL_POS ')][-1];_,x,y=msg.split()
 s.call('maker_mouse_input',{'sequence':[{'action':'move','position':{'x':float(x),'y':float(y)},'duration':0},{'action':'click','button':'left'}]})
 check('server_main','''local function ready()
 if _Ep4PapulatusLogic.Phase~=1 or not isvalid(_Ep4PapulatusLogic.Boss) then _TimerService:SetTimerOnce(ready,0.3) return end
 local ai=_Ep4PapulatusLogic.Boss:GetComponent("script.MonsterAI")
 assert(ai._isBoss and not ai._dead and ai.CurrentHp>0)
 assert(ai.MaxHp==math.max(5000,math.floor(_Ep4PapulatusLogic.NormalBossHp*1.5)))
 assert(#_MonsterSpawner:GetMonstersInZone(189)==1)
 _GameManager:SetEasterEggPaused(true)
 log("PAP_V2_LOADED hp="..ai.MaxHp.." phase1die="..ai._dieDuration)
end
ready()''','PAP_V2_LOAD_DISPATCH')
 # 리소스 최초 캐시 준비는 비동기일 수 있다.
 for _ in range(180):
  d=s.call('maker_logs',{'kind':'normal'});assert not errors(d),errors(d)
  if any('PAP_V2_LOADED' in l.get('message','') for l in d['logs']):break
  time.sleep(.4)
 else:raise AssertionError('Boss preload timeout')
 print('PAP_V2_LOADED',flush=True)
 check('server_main',Path('work/pap_phase1.lua').read_text(encoding='utf8'),'PAP_V2_PHASE1')
 time.sleep(.5);check('client',Path('work/pap_visual1.lua').read_text(encoding='utf8'),'PAP_V2_BAR1');capture('phase1')
 check('server_main','''_GameManager:SetEasterEggPaused(false)
local ai=_Ep4PapulatusLogic.Boss:GetComponent("script.MonsterAI")
local duration=ai._dieDuration local entity=ai.Entity local bossIndex=_MonsterSpawner:GetBossIndex()
ai:TakeDamage(ai.MaxHp*2)
assert(ai._dead and _Ep4PapulatusLogic.Phase==1 and not _Ep4PapulatusLogic.Defeated)
assert(isvalid(entity) and _MonsterSpawner:GetBossIndex()==bossIndex)
_TimerService:SetTimerOnce(function()
 assert(isvalid(entity) and ai._dead and _Ep4PapulatusLogic.Phase==1)
 log("PAP_V2_DIE1_BEFORE_END")
end,duration*0.5)
_TimerService:SetTimerOnce(function()
 assert(isvalid(entity) and not ai._dead and _Ep4PapulatusLogic.Phase==2)
 assert(ai.PapulatusPhase==2 and ai._isFlying)
 assert(ai.MaxHp==math.max(5000,math.floor(_Ep4PapulatusLogic.NormalBossHp*0.8)))
 assert(_MonsterSpawner:GetBossIndex()==bossIndex and #_MonsterSpawner:GetMonstersInZone(189)==1)
 _GameManager:SetEasterEggPaused(true)
 log("PAP_V2_PHASE2 hp="..ai.MaxHp)
end,duration+0.3)''','PAP_V2_TRANSITION_DISPATCH')
 time.sleep(2)
 check('server_main','assert(_Ep4PapulatusLogic.Phase==2 and not _Ep4PapulatusLogic.Defeated)','PAP_V2_PHASE2_READY')
 check('client','''local found=false
for _,e in pairs(_EntityService:GetEntityByPath("/maps/ep4_map5_ester1").Children) do
 local ai=e:GetComponent("script.MonsterAI")
 if ai~=nil and ai.PapulatusPhase==2 then
  assert(ai.MonsterSprite=="c8d1570580c34e609dcdab0e087bbb1c")
  assert(isvalid(ai._T.bossHpBar) and ai._T.bossHpBar.Enable)
  assert(ai.BossHealthCurrent==ai.BossHealthMaximum and ai.BossHealthMaximum>=5000) found=true
 end
end assert(found)''','PAP_V2_BAR2');capture('phase2')
 check('server_main','''_GameManager:SetEasterEggPaused(false)
local ai=_Ep4PapulatusLogic.Boss:GetComponent("script.MonsterAI") local p=ai.Entity.TransformComponent.Position
local hp=_GameManager.PlayerHp
_TimerService:SetTimerOnce(function()
 local q=ai.Entity.TransformComponent.Position assert(math.abs(q.x-p.x)>0.05 or math.abs(q.y-p.y)>0.05)
 assert(_GameManager.PlayerHp<hp)
 _GameManager:SetEasterEggPaused(true) log("PAP_V2_FLIGHT_AND_ATTACK")
end,6)''','PAP_V2_FLIGHT_DISPATCH')
 time.sleep(6.5)
 check('server_main','''local ai=_Ep4PapulatusLogic.Boss:GetComponent("script.MonsterAI")
_GameManager:SetEasterEggPaused(false)
local bossIndex=_MonsterSpawner:GetBossIndex()
ai:TakeDamage(ai.MaxHp*2)
assert(_Ep4PapulatusLogic.Phase==3 and not _Ep4PapulatusLogic.Defeated)
assert(_MonsterSpawner:GetBossIndex()==bossIndex)
_GameManager:SetEasterEggPaused(false)
_TimerService:SetTimerOnce(function()
 assert(_Ep4PapulatusLogic.Defeated and _Ep4PapulatusLogic.Boss==nil)
 assert(_MonsterSpawner:GetBossIndex()==bossIndex)
 _GameManager:SetEasterEggPaused(false)
 log("PAP_V2_FINAL_DIE_COMPLETED")
end,ai._dieDuration+0.35)''','PAP_V2_FINAL_DISPATCH')
 time.sleep(3)
 check('server_main','''assert(_Ep4PapulatusLogic.Defeated)
local mons=_MonsterSpawner:GetMonstersInZone(189) assert(#mons>0)
local pool={}
for i=1,_GameManager:GetEp4MonsterCount(189) do pool[_GameManager:GetMapStandRUID(189,i)]=true end
for _,ai in ipairs(mons) do assert(not ai._isBoss and pool[ai._standRUID]) end
log("PAP_V2_RANDOM_MAP5 count="..#mons)
_GameManager:SetEasterEggPaused(true)''','PAP_V2_RANDOM_PASS');capture('after-boss')
 check('client','''for _,locale in ipairs({"ko","en","zh-tw","ja"}) do
 local tr=_LocalizationService:GetTranslatorForLocale(locale)
 for _,key in ipairs({"EP4_PAP_APPEAR","EP4_PAP_PHASE2","EP4_PAP_DEFEATED","EP4M1_HIDDEN_TIME_UP"}) do
  local txt=tr:GetText(key) assert(txt~="" and txt~=key)
 end
end''','PAP_V2_LOCALES_PASS')
 print('Papulatus native flow PASS',flush=True)
finally:s.close()
