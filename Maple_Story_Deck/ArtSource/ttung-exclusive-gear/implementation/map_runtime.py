from pathlib import Path
from datetime import datetime
import sys,time,json,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/ttung-gear');out=Path('outputs/ttung-gear');s=MakerSession();proofs={};started=datetime.now().isoformat(timespec='seconds')
def run(tag,body,context='client'):
 needle='[VRF] TTUNG-GEAR-MAP-CHECK '+tag+' '+str(time.time_ns())+' '
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
 run('prepare-account','''local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;assert(id~=nil and L._T.jumpOriginalAccount==nil);L._T.jumpUser=id;L._T.jumpOriginalAccount=L.States[id];local rec=L:ReadAccount(L:SerializeAccount(L.States[id]));rec.test=true;rec.dirty=false;rec.generation=0;rec.pets.ttungttang.Owned=true;rec.pets.ttungttang.GearOwnedMask=7;rec.pets.ttungttang.GearEquippedMask=7;for key,p in pairs(rec.pets)do p.Equipped=key=="ttungttang" end;L.States[id]=rec;local G=_GameManager;L._T.jumpGameOriginal={hp=G.PlayerHp,maxhp=G.PlayerMaxHp};local guard=0;guard=_TimerService:SetTimerRepeat(function()if G.GameStarted then G.OptionPaused=true;_MonsterSpawner:StopSpawning();_TimerService:ClearTimer(guard)end end,0.01,0.01);L._T.jumpGuard=guard;local result={prepared=true}''','server_main');prepared=True
 run('start-game','_PetHouseUI:Close();_TitleUI.titleGroup.Enable=false;_GameManager:RequestStartGame(false,0,1);local result={requested=true}')
 wait('combat-ready','local result={started=_GameManager.GameStarted,entry=_GameManager.EntryPresentationPending}',lambda r:r['started']and not r['entry'])
 run('fixtures','''local L=_PetLogic;local G=_GameManager;G.OptionPaused=true;G.TutorialPaused=false;G.ShopPaused=false;G.EasterEggPaused=false;G.EntryPresentationPending=false;G.GameOver=false;G.PlayerHp=100000;G.PlayerMaxHp=100000;_MonsterSpawner:StopSpawning();_MonsterProjectileFx:ResetForRun();_Ep1ProjectileFx:ResetForRun();local zone=_MapManager.CurrentMapIndex;local root=_EntityService:GetEntityByPath("/maps/".._MapManager:GetMapName(zone));for _,m in ipairs(_CardManager:GetMonstersInCurrentZone(root))do if isvalid(m.Entity)then m.Entity:Destroy()end end;local cx=_MonsterSpawner:GetZoneOffsetX(zone);local gy=_MonsterSpawner:GetBottomGroundY(root,cx);L._T.jumpFixtures={};for i=1,2 do local e=_SpawnService:SpawnByModelId(_MonsterSpawner.MonsterModelId,"JumpFixture"..i,Vector3(cx+(i==1 and -1.4 or 1.4),gy,0),root);local m=e:GetComponent("script.MonsterAI");m:InitializeStats(12,1,false,3);_MonsterSpawner:UnregisterZoneMonster(m._spawnZoneIndex,m);m:SetSpawnZone(zone);e.TransformComponent.WorldPosition=Vector3(cx+(i==1 and -1.4 or 1.4),gy,0);m._currentScale=1.6;m._reachedPlayer=true;m._attackTimer=100;m.ApproachSpeed=0;m.MaxHp=100000000;m.CurrentHp=m.MaxHp;table.insert(L._T.jumpFixtures,m)end;L.RunPetId="5002617";L._T.petSkillCast=nil;L._T.petSkillCooldown=60;local result={targets=#L._T.jumpFixtures,ground=gy}''','server_main')

 run('fixture-view','local L=_PetLogic;local G=_GameManager;L._T.jumpOldShake={hit=G.HitShakeIntensity,boss=G.BossHitShakeIntensity};G.HitShakeIntensity=0;G.BossHitShakeIntensity=0;local cam=_CameraService:GetCurrentCameraComponent();if cam~=nil then cam:ShakeCamera(0,0.01)end;local result={isolated=true}')
 wait('pool-ready','local p=_PetLogic._T.petCharmRenderPool;local result={ready=p~=nil and p.ready or false,poses=p~=nil and #p.bodies or 0,warmFrames=p~=nil and p.warmFrames or 0}',lambda r:r['ready']and r['poses']==12)
 observer = r"""local L=_PetLogic;L._T.jumpProof={seen={},samples=0,blank=0,overlap=0,gearErrors=0,disabled=0,wrongTexture=0,tint=0,minAlpha=1,maxAlpha=0,maxPixelPhase=0,firstHeart=-1,heartAscending=false,firstAge=-1,captured=0,nextCapture=1,captureAges={1.62},finished=false};local timer=0;timer=_TimerService:SetTimerRepeat(function()local v=L._T.petSkillVisual;local q=L._T.jumpProof;if v==nil or v.id~="ttungttang"then return end;q.samples=q.samples+1;if q.firstAge<0 then q.firstAge=v.age end;q.seen[v.charmFrame]=true;local expected=L.PetGearOverlays[L.PetCharmJumpRUIDs[v.charmFrame]];local gearActive=0;for ruid,actor in pairs(v.gearByRUID)do if actor.SpriteRendererComponent.Color.a>0.99 then gearActive=gearActive+1;local bodyPos=v.body.TransformComponent.WorldPosition;local gearPos=actor.TransformComponent.WorldPosition;if ruid~=expected.hat and ruid~=expected.coat and ruid~=expected.neck then q.gearErrors=q.gearErrors+1 end;if math.abs(bodyPos.x-gearPos.x)>0.00001 or math.abs(bodyPos.y-gearPos.y)>0.00001 then q.gearErrors=q.gearErrors+1 end end end;if gearActive~=3 or v.gearMask~=7 then q.gearErrors=q.gearErrors+1 end;L._T.jumpActors=v.charmBodies;local active=0;for i,actor in ipairs(v.charmBodies)do if actor.SpriteRendererComponent.Color.a>0.99 then active=active+1 end;if not actor.Enable then q.disabled=q.disabled+1 end;if actor.SpriteRendererComponent.SpriteRUID~=L.PetCharmJumpRUIDs[i]then q.wrongTexture=q.wrongTexture+1 end end;if active==0 then q.blank=q.blank+1 end;if active>1 then q.overlap=q.overlap+1 end;local color=v.body.SpriteRendererComponent.Color;q.minAlpha=math.min(q.minAlpha,color.a);q.maxAlpha=math.max(q.maxAlpha,color.a);if color.r~=1 or color.g~=1 or color.b~=1 then q.tint=q.tint+1 end;local pos=v.body.TransformComponent.WorldPosition;local origin=_UILogic:ScreenToWorldPosition(Vector2(0,0));local headTop=pos.y+v.charmWidth*0.5-L.PetCharmJumpNods[v.charmFrame]*v.charmWidth/128;local grid=(headTop-origin.y)/v.pixel;q.maxPixelPhase=math.max(q.maxPixelPhase,math.abs(grid-math.floor(grid+0.5)));q.sourcePixelScale=v.charmWidth/(128*v.pixel);for _,h in ipairs(v.hearts)do if h.SpriteRendererComponent.Color.a>0 then if q.firstHeart<0 then q.firstHeart=v.age;q.heartAscending=L:GetPetCharmJumpHeight(v.age)>0 end;break end end;local target=q.captureAges[q.nextCapture];if target~=nil and v.age>=target then q.captured=q.nextCapture;q.nextCapture=q.nextCapture+1;if q.captured==#q.captureAges then q.finished=true;_TimerService:ClearTimer(timer)end;_GameManager:RequestSetOptionPaused(true)end end,0.01,0.01);L._T.jumpObserver=timer;local result={observing=true}"""
 probe=r"""local q=_PetLogic._T.jumpProof;local count=0;for _,_ in pairs(q.seen)do count=count+1 end;local v=_PetLogic._T.petSkillVisual;local result={gearErrors=q.gearErrors,finished=q.finished,captured=q.captured,paused=_GameManager:IsGamePaused(),framesSeen=count,samples=q.samples,blank=q.blank,overlap=q.overlap,disabled=q.disabled,wrongTexture=q.wrongTexture,tint=q.tint,minAlpha=q.minAlpha,maxAlpha=q.maxAlpha,pixelPhase=q.maxPixelPhase,firstAge=q.firstAge,firstHeart=q.firstHeart,heartAscending=q.heartAscending,sourcePixelScale=q.sourcePixelScale or 0,index=v~=nil and v.charmFrame or 0,age=v~=nil and v.age or -1}"""
 ids=run('pool-identities','local p=_PetLogic._T.petCharmRenderPool;local ids={};for _,a in ipairs(p.bodies)do table.insert(ids,a.Id)end;local result={ids=ids}')['ids']
 for cast in [1,2]:
  if cast==2:
   run('second-u-setup','local L=_PetLogic;L.RunPetId="5002617";L._T.petSkillCast=nil;L._T.petSkillCooldown=60;local result={prepared=true}','server_main')
  run('observe-render-'+str(cast),observer)
  run('resume-for-u-'+str(cast),'_GameManager.OptionPaused=false;local result={resumed=true}','server_main')
  print('Actual U cast '+str(cast)+': '+str(s.call('maker_keyboard_input',{'action':'tap','keys':['U'],'duration_ms':70})),flush=True)
  for k in range(1,2):
   r=wait('cast-'+str(cast)+'-phase-'+str(k),probe,lambda v:v['captured']>=k and v['paused'],count=24)
   assert r['gearErrors']==r['blank']==r['overlap']==r['wrongTexture']==r['disabled']==r['tint']==0,r
   assert r['minAlpha']==r['maxAlpha']==1 and r['pixelPhase']<.03,r
   assert abs(r['sourcePixelScale']-round(r['sourcePixelScale']))<.001,r
   pic=s.call('maker_screenshot');shutil.copy2(pic['path'],out/('gear-cast-'+str(cast)+'-phase-'+str(k)+'.png'))
   hold=run('held-pose-'+str(cast)+'-'+str(k),probe);assert hold['index']==r['index']and abs(hold['age']-r['age'])<.01
   if k<1:run('resume-'+str(cast)+'-'+str(k),'_GameManager.OptionPaused=false;local result={resumed=true}','server_main')
  assert r['framesSeen']==12 and r['samples']>40 and r['firstAge']<.10 and .16<=r['firstHeart']<.24 and r['heartAscending'],r
  run('resume-cleanup-'+str(cast),'_GameManager.OptionPaused=false;local result={resumed=true}','server_main')
  wait('all-poses-hidden-'+str(cast),'local L=_PetLogic;local p=L._T.petCharmRenderPool;local visible=0;for _,list in ipairs({p.bodies,p.waves,p.hearts})do for _,a in ipairs(list)do if a.SpriteRendererComponent.Color.a>0 then visible=visible+1 end end end;local result={gone=L._T.petSkillVisual==nil,visible=visible}',lambda r:r['gone']and r['visible']==0,count=32)
  newids=run('reused-pool-'+str(cast),'local p=_PetLogic._T.petCharmRenderPool;local ids={};for _,a in ipairs(p.bodies)do table.insert(ids,a.Id)end;local result={ids=ids}')['ids'];assert newids==ids
 assert run('cleanup-pool','local L=_PetLogic;L:ClearPetCharmRenderPool();local alive=0;for _,a in ipairs(L._T.jumpActors)do if isvalid(a)then alive=alive+1 end end;local result={alive=alive}')['alive']==0
 passed=True;print('Cold first U and repeated U passed, including the first visible pose. 12 whole painted poses; no activation swaps, fixed colour, pixel grid and launch hearts.',flush=True)
finally:
 try:
  if prepared:
   run('restore-account','''local L=_PetLogic;local G=_GameManager;G.GameStarted=false;G.GameOver=false;G.OptionPaused=false;_MonsterSpawner:StopSpawning();_MonsterProjectileFx:ResetForRun();_Ep1ProjectileFx:ResetForRun();if L._T.jumpGuard~=nil then _TimerService:ClearTimer(L._T.jumpGuard);L._T.jumpGuard=nil end;for _,m in ipairs(L._T.jumpFixtures or{})do if isvalid(m.Entity)then m.Entity:Destroy()end end;L._T.petSkillCast=nil;local id=L._T.jumpUser;if id~=nil and L._T.jumpOriginalAccount~=nil then L.States[id]=L._T.jumpOriginalAccount;L:InitForRun(id);L:PushState(id,"","");L._T.jumpOriginalAccount=nil end;local old=L._T.jumpGameOriginal;if old~=nil then G.PlayerHp=old.hp;G.PlayerMaxHp=old.maxhp;L._T.jumpGameOriginal=nil end;local result={restored=L._T.jumpOriginalAccount==nil}''','server_main')
   run('restore-lobby','''local L=_PetLogic;if L._T.jumpObserver~=nil then _TimerService:ClearTimer(L._T.jumpObserver);L._T.jumpObserver=nil end;L:ClearPetSkillVisual();local old=L._T.jumpOldShake;if old~=nil then _GameManager.HitShakeIntensity=old.hit;_GameManager.BossHitShakeIntensity=old.boss;L._T.jumpOldShake=nil end;_TitleUI:ShowLobby();_PetHouseUI:Close();local result={noVisual=L._T.petSkillVisual==nil}''')
  if passed:
   logs=s.call('maker_logs',{'kind':'normal'});errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=started];assert not errors,errors
   build=s.call('maker_logs',{'kind':'build'});assert not[x for x in build.get('logs',[])if x.get('logType')=='Error']
   report={'coldFirstCastChecked':True,'repeatedCastChecked':True,'firstFrameIncluded':True,'renderPoolReused':True,'integralSourcePixelScale':True,'cameraShakeIsolatedForGridCheck':True,'status':'passed','actualUKey':True,'frames':12,'textureReloadsDuringAnimation':0,'blankSamples':0,'overlapSamples':0,'fixedTint':True,'inkPixelReferenceSnapped':True,'heartOnTakeoff':True,'pauseAndCleanup':True,'testAccountRestored':True,'equipmentLayers':3,'equipmentFrameErrors':0,'equipmentAlignedToBody':True,'runtimeErrors':0,'buildErrors':0,'observedFirstCast':proofs['cast-1-phase-1'],'observedSecondCast':proofs['cast-2-phase-1']}
   (out/'map-runtime-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');(stage/'map-runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8')
 finally:s.close()
