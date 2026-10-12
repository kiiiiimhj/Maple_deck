from runtime_common import *
server='server_main'
def wait_for(tag,body,predicate,context='client',count=20):
    for _ in range(count):
        r=run(tag,body,context,.1)
        if predicate(r):return r
        time.sleep(.4)
    raise AssertionError(tag)
def clean():
    run('final-cleanup','''_GameManager.GameStarted=false;_GameManager.GameOver=false;_GameManager.OptionPaused=false;_MonsterSpawner:StopSpawning();for _,m in ipairs(_PetLogic._T.finishMobs or {})do if isvalid(m) and isvalid(m.Entity)then m._dead=true;m.Entity:Destroy()end end;local id=_PetLogic._T.finishUser;_PetLogic.States[id]=_PetLogic._T.finishRecord;_PetLogic:PushState(id,"","");_CardManager.DebugMode=_PetLogic._T.finishDebug;_PetLogic._T.finishMobs=nil;_PetLogic._T.petSkillCast=nil;_PetLogic.RunPetId="";_PetLogic._T.petSkillCooldown=60;_GameManager.PlayerHp=100;_GameManager.PlayerMaxHp=100;_MonsterProjectileFx:ResetForRun();_Ep1ProjectileFx:ResetForRun();local result={restored=_PetLogic.States[id]==_PetLogic._T.finishRecord}''',server,.3)
    script('_PetLogic:ClearPetSkillVisual();_PetHouseUI:Close();_TitleUI.titleGroup.Enable=true;_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true',pause=.3)
started=False
try:
    assert all('care-'+a in proofs and proofs['care-'+a]['action']==a for a in ['feed','wash','walk','sleep','inject'])
    assert proofs['projectile-shell-target']['decoy'] and proofs['shield-ended']['proof']['protectionGone'] and proofs['pause-frozen']['dust']==8
    run('finish-boot','local result={ready=_PetLogic.TurtleReady}',pause=.1)
    logs=s.call('maker_logs',{'kind':'normal'});start=max(x['dateTime'] for x in logs.get('logs',[]) if prefix+'finish-boot ' in x.get('message',''))
    (stage/'runtime-start.json').write_text(json.dumps({'start':start}),encoding='utf-8')
    run('finish-profile','''local id=nil;for uid,r in pairs(_PetLogic.States)do id=uid;_PetLogic._T.finishRecord=r end;_PetLogic._T.finishUser=id;_PetLogic._T.finishDebug=_CardManager.DebugMode;local rec=_PetLogic:ReadAccount(_PetLogic:SerializeAccount(_PetLogic._T.finishRecord));rec.test=true;rec.dirty=false;_PetLogic.States[id]=rec;_PetLogic:PushState(id,"","");local result={ready=true}''',server,.2);started=True
    script('_PetHouseUI:Close();_TitleUI.titleGroup.Enable=false;_GameManager:RequestStartGame(false,0,1)',pause=4)
    run('finish-fixtures','''_MonsterSpawner:StopSpawning();local map=_EntityService:GetEntityByPath("/maps/".._MapManager:GetMapName(_MapManager.CurrentMapIndex));local cx=_MonsterSpawner:GetZoneOffsetX(_MapManager.CurrentMapIndex);local gy=_MonsterSpawner:GetBottomGroundY(map,cx);for _,m in ipairs(_CardManager:GetMonstersInCurrentZone(map))do if isvalid(m) and isvalid(m.Entity)then m._dead=true;m.Entity:Destroy()end end;_PetLogic._T.finishMobs={};for i=1,3 do local e=_SpawnService:SpawnByModelId(_MonsterSpawner.MonsterModelId,"BugiFinish"..i,Vector3(cx+(i-2)*1.5,gy,0),map);local m=e:GetComponent("script.MonsterAI");m:InitializeStats(12,1,false,3);_MonsterSpawner:UnregisterZoneMonster(m._spawnZoneIndex,m);m:SetSpawnZone(_MapManager.CurrentMapIndex);m._isFlying=false;m._isBonusBoss=false;m._currentScale=1.5;m._reachedPlayer=true;m._paused=false;m._attackTimer=100;m.ApproachSpeed=0;m.MaxHp=100000000;m.CurrentHp=m.MaxHp;e.TransformComponent.Scale=Vector3(1.5*m._scaleMultiplier,1.5*m._scaleMultiplier,1);e.TransformComponent.WorldPosition=Vector3(cx+(i-2)*1.5,gy,0);table.insert(_PetLogic._T.finishMobs,m)end;_GameManager.PlayerHp=100000;_GameManager.PlayerMaxHp=100000;_PetLogic.RunPetId="landturtle";_PetLogic._T.petSkillCooldown=60;_CardManager.DebugMode=true;local result={count=3}''',server,.2)
    script('''local P=_PetLogic;P._T.bugiRollProof={seen=false,done=false,lastAge=0,beyondThree=false};local proof=P._T.bugiRollProof;local timer=0;timer=_TimerService:SetTimerRepeat(function()local c=P._T.petSkillCast;if c~=nil and c.id=="5002617" then proof.seen=true;proof.lastAge=c.age;if c.age>3.15 then proof.beyondThree=true end elseif proof.seen then proof.done=true;_TimerService:ClearTimer(timer)end end,.025,.025)''',server,.1)
    script('_PetLogic:CheatRequestNextPetSkill()',pause=.2)
    r=run('U-fourth-to-first','local result={pet=_PetLogic.RunPetId,cooldown=_PetLogic._T.petSkillCooldown}',server,.1)
    assert r['pet']=='5002617' and 2<r['cooldown']<=3
    r=wait_for('guri-four-seconds','local result={proof=_PetLogic._T.bugiRollProof}',lambda v:v['proof']['done'],server)
    assert r['proof']['beyondThree'] and 3.9<r['proof']['lastAge']<=4.03
    time.sleep(.7)
    r=run('guri-cleaned','local result={gone=_PetLogic._T.petSkillVisual==nil}',pause=.1);assert r['gone']
    run('ep1-arm','''_PetLogic.RunPetId="landturtle";_PetLogic._T.petSkillCooldown=0;local result={armed=true}''',server,.1)
    wait_for('ep1-shell-ready','''local v=_PetLogic._T.petSkillVisual;local result={ready=v~=nil and v.id=="landturtle" and v.age>=0.42 and _PetLogic:GetPetTurtleTarget(v.zone)~=nil}''',lambda v:v['ready'])
    script('''local P=_PetLogic;P._T.bugiEp1Proof={captured=false};local source=_UserService.LocalPlayer.CurrentMap:GetChildByName("BugiFinish1");local F=_Ep1ProjectileFx;F:PrepareVisual(991011,source,"19cb5a8c16654c00bfb6d153fadece14","8072902461784a6fbab61834b992fde7",0,.52,_MapManager.CurrentMapIndex,F.RunRevision,false);local timer=0;timer=_TimerService:SetTimerRepeat(function()for _,shot in ipairs(F._T.shots)do if shot.id==991011 and isvalid(shot.fx) then local ep=_UILogic:ScreenToWorldPosition(shot.targetScreen);local target=P:GetPetTurtleTarget(shot.zone);P._T.bugiEp1Proof={captured=true,decoy=shot.decoy==true,width=shot.s1*shot.metrics.w,order=shot.fx.SpriteRendererComponent.OrderInLayer,x=ep.x,y=ep.y,targetX=target~=nil and target.x or -100,targetY=target~=nil and target.y or -100};_TimerService:ClearTimer(timer);return end end end,.015,.015)''',pause=.2)
    r=wait_for('ep1-projectile-target','local result=_PetLogic._T.bugiEp1Proof',lambda v:v['captured'])
    assert r['decoy'] and r['width']<=.6501 and r['order']==134 and abs(r['x']-r['targetX'])<.001 and abs(r['y']-r['targetY'])<.001
    clean();started=False
    assert proofs['final-cleanup']['restored']
    logs=s.call('maker_logs',{'kind':'normal'});errors=[x for x in logs.get('logs',[]) if x.get('logType')=='Error' and x.get('dateTime','')>=start]
    (stage/'final-runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8');assert not errors,errors
    build=s.call('maker_logs',{'kind':'build'});assert not [x for x in build.get('logs',[]) if x.get('logType')=='Error']
    report={'status':'passed','catalogCount':4,'temporaryHatchButton':True,'nativeCareActions':['feed','wash','walk','sleep','inject'],'baseHpPercent':5,'runHpVerified':proofs['equipped-hp']['hp'],'dropTravelWorldUnits':proofs['fall-samples']['travel'],'shellWidth':2.6,'cameraShakeIntensity':.18,'shieldSecondsAfterLanding':3,'normalBossChargeHitsAbsorbed':2,'bothProjectilePipelinesHitShell':True,'pauseFreezesDropShieldDust':True,'UIncludesFourthPet':True,'guriRollSeconds':4,'originalRecordRestored':True,'runtimeErrors':0,'buildErrors':0}
    (out/'runtime-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
finally:
    if started:
        try:clean()
        except Exception as e:print('Cleanup requires follow-up:',type(e).__name__,flush=True)
    s.close()
