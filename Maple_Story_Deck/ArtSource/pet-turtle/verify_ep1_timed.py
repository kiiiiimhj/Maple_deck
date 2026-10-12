from runtime_common import *
server='server_main'
started=False
def clean():
    run('final-cleanup','''_GameManager.GameStarted=false;_GameManager.GameOver=false;_GameManager.OptionPaused=false;_MonsterSpawner:StopSpawning();for _,m in ipairs(_PetLogic._T.finishMobs or {})do if isvalid(m) and isvalid(m.Entity)then m._dead=true;m.Entity:Destroy()end end;local id=_PetLogic._T.finishUser;_PetLogic.States[id]=_PetLogic._T.finishRecord;_PetLogic:PushState(id,"","");_CardManager.DebugMode=_PetLogic._T.finishDebug;_PetLogic._T.finishMobs=nil;_PetLogic._T.petSkillCast=nil;_PetLogic.RunPetId="";_PetLogic._T.petSkillCooldown=60;_GameManager.PlayerHp=100;_GameManager.PlayerMaxHp=100;_MonsterProjectileFx:ResetForRun();_Ep1ProjectileFx:ResetForRun();local result={restored=_PetLogic.States[id]==_PetLogic._T.finishRecord}''',server,.3)
    script('_PetLogic:ClearPetSkillVisual();_PetHouseUI:Close();_TitleUI.titleGroup.Enable=true;_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true',pause=.3)
try:
    assert proofs['guri-four-seconds']['proof']['done'] and proofs['guri-four-seconds']['proof']['beyondThree'] and proofs['guri-cleaned']['gone']
    run('ep1-timed-boot','local result={ready=_PetLogic.TurtleReady}',pause=.1)
    logs=s.call('maker_logs',{'kind':'normal'});start=max(x['dateTime'] for x in logs.get('logs',[]) if prefix+'ep1-timed-boot ' in x.get('message',''))
    (stage/'runtime-start.json').write_text(json.dumps({'start':start}),encoding='utf-8')
    run('ep1-profile','''local id=nil;for uid,r in pairs(_PetLogic.States)do id=uid;_PetLogic._T.finishRecord=r end;_PetLogic._T.finishUser=id;_PetLogic._T.finishDebug=_CardManager.DebugMode;local rec=_PetLogic:ReadAccount(_PetLogic:SerializeAccount(_PetLogic._T.finishRecord));rec.test=true;rec.dirty=false;_PetLogic.States[id]=rec;_PetLogic:PushState(id,"","");local result={ready=true}''',server,.2);started=True
    script('_PetHouseUI:Close();_TitleUI.titleGroup.Enable=false;_GameManager:RequestStartGame(false,0,1)',pause=4)
    run('ep1-fixture','''_MonsterSpawner:StopSpawning();local map=_EntityService:GetEntityByPath("/maps/".._MapManager:GetMapName(_MapManager.CurrentMapIndex));local cx=_MonsterSpawner:GetZoneOffsetX(_MapManager.CurrentMapIndex);local gy=_MonsterSpawner:GetBottomGroundY(map,cx);for _,m in ipairs(_CardManager:GetMonstersInCurrentZone(map))do if isvalid(m) and isvalid(m.Entity)then m._dead=true;m.Entity:Destroy()end end;local e=_SpawnService:SpawnByModelId(_MonsterSpawner.MonsterModelId,"BugiFinish1",Vector3(cx-1.5,gy,0),map);local m=e:GetComponent("script.MonsterAI");m:InitializeStats(12,1,false,3);_MonsterSpawner:UnregisterZoneMonster(m._spawnZoneIndex,m);m:SetSpawnZone(_MapManager.CurrentMapIndex);m._isFlying=false;m._currentScale=1.5;m._reachedPlayer=true;m._attackTimer=100;m.ApproachSpeed=0;m.MaxHp=100000000;m.CurrentHp=m.MaxHp;_PetLogic._T.finishMobs={m};_GameManager.PlayerHp=100000;_GameManager.PlayerMaxHp=100000;_PetLogic.RunPetId="landturtle";_PetLogic._T.petSkillCooldown=60;local result={ready=true}''',server,.2)
    script('''local P=_PetLogic;P._T.bugiEp1Proof={captured=false,launched=false};local F=_Ep1ProjectileFx;local timer=0;timer=_TimerService:SetTimerRepeat(function()local v=P._T.petSkillVisual;local proof=P._T.bugiEp1Proof;if not proof.launched and v~=nil and v.id=="landturtle" and v.age>=0.42 and v.age<0.85 then proof.launched=true;local source=_UserService.LocalPlayer.CurrentMap:GetChildByName("BugiFinish1");F:PrepareVisual(991011,source,"19cb5a8c16654c00bfb6d153fadece14","8072902461784a6fbab61834b992fde7",0,.52,_MapManager.CurrentMapIndex,F.RunRevision,false)end;if proof.launched then for _,shot in ipairs(F._T.shots)do if shot.id==991011 and isvalid(shot.fx) then local ep=_UILogic:ScreenToWorldPosition(shot.targetScreen);local target=P:GetPetTurtleTarget(shot.zone);P._T.bugiEp1Proof={captured=true,launched=true,decoy=shot.decoy==true,width=shot.s1*shot.metrics.w,order=shot.fx.SpriteRendererComponent.OrderInLayer,x=ep.x,y=ep.y,targetX=target~=nil and target.x or -100,targetY=target~=nil and target.y or -100};_TimerService:ClearTimer(timer);return end end end end,.015,.015)''',pause=.1)
    run('ep1-armed','''_PetLogic._T.petSkillCooldown=0;local result={armed=true}''',server,.1)
    for _ in range(12):
        r=run('ep1-projectile-target','local result=_PetLogic._T.bugiEp1Proof',pause=.1)
        if r['captured']:break
        time.sleep(.3)
    assert r['captured'] and r['decoy'] and r['width']<=.6501 and r['order']==134 and abs(r['x']-r['targetX'])<.001 and abs(r['y']-r['targetY'])<.001
    clean();started=False
    logs=s.call('maker_logs',{'kind':'normal'});errors=[x for x in logs.get('logs',[]) if x.get('logType')=='Error' and x.get('dateTime','')>=start];assert not errors,errors
    (stage/'final-runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8')
    build=s.call('maker_logs',{'kind':'build'});assert not [x for x in build.get('logs',[]) if x.get('logType')=='Error']
    report={'status':'passed','catalogCount':4,'temporaryHatchButton':True,'nativeCareActions':['feed','wash','walk','sleep','inject'],'baseHpPercent':5,'runHpVerified':proofs['equipped-hp']['hp'],'dropTravelWorldUnits':proofs['fall-samples']['travel'],'shellWidth':2.6,'cameraShakeIntensity':.18,'shieldSecondsAfterLanding':3,'normalBossChargeHitsAbsorbed':2,'bothProjectilePipelinesHitShell':True,'pauseFreezesDropShieldDust':True,'UIncludesFourthPet':True,'guriRollSeconds':4,'originalRecordRestored':proofs['final-cleanup']['restored'],'runtimeErrors':0,'buildErrors':0}
    (out/'runtime-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
finally:
    if started:
        try:clean()
        except Exception as e:print('Cleanup requires follow-up:',type(e).__name__,flush=True)
    s.close()
