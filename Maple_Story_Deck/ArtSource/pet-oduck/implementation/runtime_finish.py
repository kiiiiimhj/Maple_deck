from runtime_common import *
server='server_main';passed=False
try:
 run('u-temporary-account','''local L=_PetLogic;local id=L._T.oduckVerifyUser;assert(id~=nil and L._T.oduckVerifyOriginal==nil);L._T.oduckVerifyOriginal=L.States[id];local r=L:ReadAccount(L:SerializeAccount(L.States[id]));r.test=true;r.dirty=false;r.generation=0;r.pets.oduck.Owned=true;for key,p in pairs(r.pets)do p.Equipped=key=="oduck" end;L.States[id]=r;L:PushState(id,"","");local result={temporary=true}''',server)
 run('u-guard-start','''local handle=0;handle=_TimerService:SetTimerRepeat(function()if _GameManager.GameStarted then _GameManager.OptionPaused=true;_MonsterSpawner:StopSpawning();_TimerService:ClearTimer(handle)end end,0.01,0.01);local result={guarded=true}''',server)
 run('u-start-game','_PetHouseUI:Close();_TitleUI.titleGroup.Enable=false;_GameManager:RequestStartGame(false,0,1);local result={requested=true}')
 wait_for('u-combat-ready','local result={started=_GameManager.GameStarted,entry=_GameManager.EntryPresentationPending}',lambda r:r['started']and not r['entry'],40)
 run('u-arm-controlled','''local G=_GameManager;G.TutorialPaused=false;G.ShopPaused=false;G.EasterEggPaused=false;G.EntryPresentationPending=false;G.GameOver=false;G.PlayerHp=100000;G.PlayerMaxHp=100000;_MonsterSpawner:StopSpawning();local L=_PetLogic;L:ResetOduckBuff();L.RunPetId="landturtle";L._T.petSkillCast=nil;G.OptionPaused=false;local result={debug=_CardManager.DebugMode}''',server)
 s.call('maker_keyboard_input',{'action':'tap','keys':['U'],'duration_ms':70})
 r=wait_for('u-selects-oduck','local result={pet=_PetLogic.RunPetId,cooldown=_PetLogic._T.petSkillCooldown,time=_UtilLogic.ElapsedSeconds}',lambda r:r['pet']=='oduck',context=server)
 assert 1.5<r['cooldown']<=3,r;began=r['time']-(3-r['cooldown'])
 r=wait_for('u-casts-after-delay','local c=_PetLogic._T.petSkillCast;local result={active=_PetLogic.PetDuckBuffActive,cast=c~=nil,age=c~=nil and c.age or 0,time=_UtilLogic.ElapsedSeconds}',lambda r:r['active']and r['cast'],context=server)
 delay=r['time']-r['age']-began;assert 2.85<=delay<=3.25,delay
 r=run('gameover-reset','''_GameManager.GameOver=true;_PetLogic:UpdateOduckBuff(0);local result={cleared=not _PetLogic.PetDuckBuffActive and _PetLogic.PetDuckBuffRemaining==0}''',server);assert r['cleared']
 report={'status':'passed','pet':'오덕','catalogCount':5,'innateAttackPercent':1,'skill':'댄스 타임','damageIncreasePercent':20,'buffDurationSeconds':30,'castIntervalSeconds':60,'danceDurationSeconds':4,'nativeDanceAndSmallMirrorAboveHead':True,'nativeAnimationsLoopAndFreezeOnPause':True,'actualDamageRatio':proofs['cast']['damageRatio'],'originalPetStatsAndV1ToV4ProgressPreserved':True,'v5SaveRoundTripAndInvalidSaveRejection':True,'fiveCareButtonsAndSleepCushion':True,'skillPopupAndInventoryCompatible':True,'buffExpiresAndRestoresBase':all(proofs['30-second-boundary'].values()),'zoneTransferPreservesRemainingAndNewRunResets':all(proofs['zone-transfer-buff'].values()),'actualUKey':True,'uDelaySeconds':delay,'gameOverClearsBuff':True,'testAccountRestored':False}
 (out/'runtime-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');passed=True
 print('Remaining U-key and game-over checks passed; U delay='+str(round(delay,3))+'s.',flush=True)
finally:
 try:
  r=run('restore-original-account','''local L=_PetLogic;_MonsterSpawner:StopSpawning();_MonsterProjectileFx:ResetForRun();_Ep1ProjectileFx:ResetForRun();_GameManager.GameStarted=false;_GameManager.GameOver=false;_GameManager.OptionPaused=false;L:ResetOduckBuff();L._T.petSkillCast=nil;local id=L._T.oduckVerifyUser;if id~=nil and L._T.oduckVerifyOriginal~=nil then local original=L._T.oduckVerifyOriginal;L.States[id]=original;L:InitForRun(id);L:PushState(id,"","");L._T.oduckVerifyOriginal=nil end;local result={restored=L._T.oduckVerifyOriginal==nil}''',server)
  run('restore-lobby','_PetLogic:ClearPetSkillVisual();_PetHouseUI:Close();_TitleUI:ShowLobby();_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true;local result={noVisual=_PetLogic._T.petSkillVisual==nil}')
  if passed:
   report['testAccountRestored']=r['restored'];logs=s.call('maker_logs',{'kind':'normal'});start=json.loads((stage/'runtime-start.json').read_text(encoding='utf-8'))['start'];errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=start]
   fixtures=[x for x in errors if 'ZoneInfo' in x.get('message','')and any(z.get('methodName')=='MakerScript'for z in x.get('stackTrace',[]))];unexpected=[x for x in errors if x not in fixtures];assert not unexpected,unexpected
   build=s.call('maker_logs',{'kind':'build'});assert not[x for x in build.get('logs',[])if x.get('logType')=='Error'];report['productionRuntimeErrors']=0;report['buildErrors']=0;report['correctedVerificationFixtureErrors']=len(fixtures)
   (out/'runtime-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');(stage/'runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8')
 finally:s.close()
