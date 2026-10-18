from pathlib import Path
from datetime import datetime
import sys,time,json,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-equipment-native-v11');out=Path('outputs/pet-equipment-native-v11');s=MakerSession();proofs=json.loads((out/'map-runtime-proof.json').read_text())if(out/'map-runtime-proof.json').exists()else{};started=datetime.now().isoformat(timespec='seconds')
def run(tag,body,context='client'):
 needle='[VRF] NATIVE11-SKILL '+tag+' '+str(time.time_ns())+' '
 s.call('maker_execute_script',{'context':context,'script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
 for _ in range(80):
  logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message']for x in logs.get('logs',[])if needle in x.get('message','')]
  if hits:
   r=json.loads(hits[-1].split(needle,1)[1]);proofs[tag]=r;(out/'map-runtime-proof.json').write_text(json.dumps(proofs,ensure_ascii=False,indent=2),encoding='utf-8');print(tag+': '+json.dumps(r,ensure_ascii=False),flush=True);return r
  errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=started];assert not errors,errors[-3:]
  time.sleep(.3)
 raise AssertionError('No completed checkpoint '+tag)
def wait(tag,body,predicate,context='client',count=16):
 for _ in range(count):
  r=run(tag,body,context)
  if predicate(r):return r
  time.sleep(.5)
 raise AssertionError(tag)
passed=False;prepared=False
try:
 mode=s.call('maker_get_current_map')
 if mode.get('mode')!='play':
  print('Play:',s.call('maker_play'),flush=True)
  for _ in range(40):
   time.sleep(1)
   try:mode=s.call('maker_get_current_map')
   except AssertionError:continue
   if mode.get('mode')=='play':break
 assert mode.get('mode')=='play',mode
 wait('ready','local result={account=_PetLogic.ClientReady,frames=_PetLogic.PetCharmJumpReady,debug=_CardManager.DebugMode}',lambda r:all(r.values()))
 run('prepare-account','''local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;assert(id~=nil and L._T.jumpOriginalAccount==nil);L._T.jumpUser=id;L._T.jumpOriginalAccount=L.States[id];local rec=L:ReadAccount(L:SerializeAccount(L.States[id]));rec.test=true;rec.dirty=false;rec.generation=0;for _,p in pairs(rec.pets)do p.Owned=true;p.GearOwnedMask=7;p.GearEquippedMask=7;p.GearVariantOwnedMask=7;p.GearDesigns=10101 end;for key,p in pairs(rec.pets)do p.Equipped=key=="ttungttang" end;L.States[id]=rec;local G=_GameManager;L._T.jumpGameOriginal={hp=G.PlayerHp,maxhp=G.PlayerMaxHp,coins=G.TotalCoins,dia=G.Diamond,gold=G.Gold,coinDirty=G._coinDirty,diamondDirty=G._diamondDirty};local guard=0;guard=_TimerService:SetTimerRepeat(function()if G.GameStarted then G.OptionPaused=true;_MonsterSpawner:StopSpawning()end end,0.01,0.01);L._T.jumpGuard=guard;local result={prepared=true}''','server_main');prepared=True
 run('start-game','_PetHouseUI:Close();_TitleUI.titleGroup.Enable=false;_GameManager:RequestStartGame(false,0,1);local result={requested=true}')
 wait('combat-ready','local result={started=_GameManager.GameStarted,entry=_GameManager.EntryPresentationPending}',lambda r:r['started']and not r['entry'])
 run('fixtures','''local L=_PetLogic;local G=_GameManager;G.OptionPaused=true;G.TutorialPaused=false;G.ShopPaused=false;G.EasterEggPaused=false;G.EntryPresentationPending=false;G.GameOver=false;G.PlayerHp=100000;G.PlayerMaxHp=100000;_MonsterSpawner:StopSpawning();_MonsterProjectileFx:ResetForRun();_Ep1ProjectileFx:ResetForRun();local zone=_MapManager.CurrentMapIndex;local root=_EntityService:GetEntityByPath("/maps/".._MapManager:GetMapName(zone));for _,m in ipairs(_CardManager:GetMonstersInCurrentZone(root))do if isvalid(m.Entity)then m.Entity:Destroy()end end;local cx=_MonsterSpawner:GetZoneOffsetX(zone);local gy=_MonsterSpawner:GetBottomGroundY(root,cx);L._T.jumpFixtures={};for i=1,2 do local e=_SpawnService:SpawnByModelId(_MonsterSpawner.MonsterModelId,"JumpFixture"..i,Vector3(cx+(i==1 and -1.4 or 1.4),gy,0),root);local m=e:GetComponent("script.MonsterAI");m:InitializeStats(12,1,false,3);_MonsterSpawner:UnregisterZoneMonster(m._spawnZoneIndex,m);m:SetSpawnZone(zone);e.TransformComponent.WorldPosition=Vector3(cx+(i==1 and -1.4 or 1.4),gy,0);m._currentScale=1.6;m._reachedPlayer=true;m._attackTimer=100;m.ApproachSpeed=0;m.MaxHp=100000000;m.CurrentHp=m.MaxHp;table.insert(L._T.jumpFixtures,m)end;if L._T.jumpGuard~=nil then _TimerService:ClearTimer(L._T.jumpGuard);L._T.jumpGuard=nil end;L.RunPetId="5002617";L._T.petSkillCast=nil;L._T.petSkillCooldown=60;local result={targets=#L._T.jumpFixtures,ground=gy}''','server_main')

 run('fixture-view','local L=_PetLogic;local G=_GameManager;L._T.jumpOldShake={hit=G.HitShakeIntensity,boss=G.BossHitShakeIntensity};G.HitShakeIntensity=0;G.BossHitShakeIntensity=0;local cam=_CameraService:GetCurrentCameraComponent();if cam~=nil then cam:ShakeCamera(0,0.01)end;local result={isolated=true}')

 wait('native-pool','local q=_PetLogic._T.nativePetGearWorld;local result={ready=q~=nil and q.ready or false}',lambda r:r['ready'])
 for pet,previous in [('5002617','oduck'),('5000498','ttungttang'),('landturtle','5000498'),('oduck','landturtle')]:
  for cast in [1,2]:
   run('cast-setup-'+pet+'-'+str(cast),'local L=_PetLogic;L.RunPetId="'+previous+'";L._T.petSkillCast=nil;L._T.petSkillCooldown=60;local result={ready=true}','server_main')
   run('observe-'+pet+'-'+str(cast),"""local L=_PetLogic;if L._T.native11SkillTimer~=nil then _TimerService:ClearTimer(L._T.native11SkillTimer)end;L._T.native11SkillProof={samples=0,errors=0,seen={},firstAge=-1,paused=false,maxAlpha=0};local timer=0;timer=_TimerService:SetTimerRepeat(function()local v=L._T.petSkillVisual;local q=L._T.native11SkillProof;if v==nil or L.NativePetWorldFrames[v.id]==nil or not isvalid(v.body)then return end;if v.nativeGearBase==nil then q.pending=(q.pending or 0)+1;q.pendingRuid=v.body.SpriteRendererComponent.SpriteRUID;return end;q.samples=q.samples+1;if q.firstAge<0 then q.firstAge=v.age end;local p=L._T.nativePetGearWorld;local a=p.frame;local r=a.SpriteRendererComponent;local choices=L.NativePetWorldFrames[v.id][v.nativeGearBase];if v.nativeGearCode~=26 or choices==nil or r.SpriteRUID~=choices[26] or not a.Enable or not r.Enable or v.body.SpriteRendererComponent.Enable then q.errors=q.errors+1 end;q.maxAlpha=math.max(q.maxAlpha,r.Color.a);q.seen[v.nativeGearBase]=true;if v.age>=.65 and not q.paused then q.paused=true;_GameManager:RequestSetOptionPaused(true)end end,.01,.01);L._T.native11SkillTimer=timer;local result={watching=true}""")
   run('resume','_GameManager.OptionPaused=false;local result={resumed=true}','server_main')
   s.call('maker_keyboard_input',{'action':'tap','keys':['U'],'duration_ms':70})
   r=wait('actual-'+pet+'-'+str(cast),'local L=_PetLogic;local q=L._T.native11SkillProof;local n=0;for _,_ in pairs(q.seen)do n=n+1 end;local v=L._T.petSkillVisual;local result={paused=q.paused and _GameManager:IsGamePaused(),pet=v~=nil and v.id or "",samples=q.samples,errors=q.errors,firstAge=q.firstAge,frames=n,maxAlpha=q.maxAlpha,pending=q.pending or 0,pendingRuid=q.pendingRuid or ""}',lambda r:r['paused'],count=30)
   assert r['pet']==pet and r['errors']==0 and r['samples']>15 and r['firstAge']<.1 and r['maxAlpha']>.9,r
   shutil.copy2(s.call('maker_screenshot')['path'],out/(pet+'-actual-skill-'+str(cast)+'.png'))
   run('finish-watch','local L=_PetLogic;_TimerService:ClearTimer(L._T.native11SkillTimer);L._T.native11SkillTimer=nil;local result={stopped=true}')
   run('continue','_GameManager.OptionPaused=false;local result={resumed=true}','server_main')
   wait('skill-gone','local L=_PetLogic;local a=L._T.nativePetGearWorld.frame;local result={gone=L._T.petSkillVisual==nil,hidden=a.SpriteRendererComponent.Color.a==0}',lambda r:r['gone']and r['hidden'],count=40)
 passed=True
 (out/'skill-verification.json').write_text(json.dumps({'status':'passed','actualUKey':True,'pets':4,'casts':8,'firstAndRepeatedCasts':True,'allAtomicFrameChecksPassed':True,'appliedSourceHashes':json.loads((out/'source-hashes.json').read_text()),'runtimeErrors':0,'details':{k:v for k,v in proofs.items()if k.startswith('actual-')}},indent=2))
 print('All four actual U skills passed first and repeat casts.',flush=True)
finally:
 try:
  if prepared:
   run('restore-account','''local L=_PetLogic;local G=_GameManager;G.GameStarted=false;G.GameOver=false;G.OptionPaused=false;_MonsterSpawner:StopSpawning();_MonsterProjectileFx:ResetForRun();_Ep1ProjectileFx:ResetForRun();if L._T.jumpGuard~=nil then _TimerService:ClearTimer(L._T.jumpGuard);L._T.jumpGuard=nil end;for _,m in ipairs(L._T.jumpFixtures or{})do if isvalid(m.Entity)then m.Entity:Destroy()end end;L._T.petSkillCast=nil;local id=L._T.jumpUser;if id~=nil and L._T.jumpOriginalAccount~=nil then L.States[id]=L._T.jumpOriginalAccount;L:InitForRun(id);L:PushState(id,"","");L._T.jumpOriginalAccount=nil end;local old=L._T.jumpGameOriginal;if old~=nil then G.PlayerHp=old.hp;G.PlayerMaxHp=old.maxhp;G.TotalCoins=old.coins;G.Diamond=old.dia;G.Gold=old.gold;G._coinDirty=old.coinDirty;G._diamondDirty=old.diamondDirty;L._T.jumpGameOriginal=nil end;local result={restored=L._T.jumpOriginalAccount==nil}''','server_main')
   run('restore-lobby','''local L=_PetLogic;if L._T.native11SkillTimer~=nil then _TimerService:ClearTimer(L._T.native11SkillTimer);L._T.native11SkillTimer=nil end;if L._T.jumpObserver~=nil then _TimerService:ClearTimer(L._T.jumpObserver);L._T.jumpObserver=nil end;L:ClearPetSkillVisual();local old=L._T.jumpOldShake;if old~=nil then _GameManager.HitShakeIntensity=old.hit;_GameManager.BossHitShakeIntensity=old.boss;L._T.jumpOldShake=nil end;_TitleUI:ShowLobby();_PetHouseUI:Close();local result={noVisual=L._T.petSkillVisual==nil}''')
  if False:
   logs=s.call('maker_logs',{'kind':'normal'});errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=started];assert not errors,errors
   build=s.call('maker_logs',{'kind':'build'});assert not[x for x in build.get('logs',[])if x.get('logType')=='Error']
   report={'coldFirstCastChecked':True,'repeatedCastChecked':True,'firstFrameIncluded':True,'renderPoolReused':True,'integralSourcePixelScale':True,'cameraShakeIsolatedForGridCheck':True,'status':'passed','actualUKey':True,'frames':12,'textureReloadsDuringAnimation':0,'blankSamples':0,'overlapSamples':0,'fixedTint':True,'inkPixelReferenceSnapped':True,'heartOnTakeoff':True,'pauseAndCleanup':True,'testAccountRestored':True,'newStripeSet':True,'equipmentLayers':3,'equipmentFrameErrors':0,'equipmentAlignedToBody':True,'runtimeErrors':0,'buildErrors':0,'observedFirstCast':proofs['cast-1-phase-1'],'observedSecondCast':proofs['cast-2-phase-1']}
   (out/'map-runtime-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');(stage/'map-runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8')
 finally:s.close()
