from runtime_common import *
server='server_main'
started=False
report={}
def wait_for(tag,body,predicate,context='client',count=16,delay=.4):
    for _ in range(count):
        r=run(tag,body,context,.1)
        if predicate(r):return r
        time.sleep(delay)
    raise AssertionError('State did not complete: '+tag)
def cleanup():
    run('cleanup','''_GameManager.GameStarted=false;_GameManager.GameOver=false;_GameManager.OptionPaused=false;_MonsterSpawner:StopSpawning();for _,m in ipairs(_PetLogic._T.bugiMobs or {})do if isvalid(m) and isvalid(m.Entity)then m._dead=true;m.Entity:Destroy()end end;local id=_PetLogic._T.bugiOriginalUser;if id~=nil and _PetLogic._T.bugiOriginalRecord~=nil then _PetLogic.States[id]=_PetLogic._T.bugiOriginalRecord;_PetLogic:PushState(id,"","")end;_CardManager.DebugMode=_PetLogic._T.bugiOriginalDebug;_PetLogic._T.bugiMobs=nil;_PetLogic._T.petSkillCast=nil;_PetLogic.RunPetId="";_PetLogic._T.petSkillCooldown=60;_GameManager.PlayerHp=100;_GameManager.PlayerMaxHp=100;_MonsterProjectileFx:ResetForRun();_Ep1ProjectileFx:ResetForRun();local result={restored=id~=nil and _PetLogic.States[id]==_PetLogic._T.bugiOriginalRecord}''',server,.3)
    script('_PetLogic:ClearPetSkillVisual();_PetHouseUI:Close();_TitleUI.titleGroup.Enable=true;_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true',pause=.3)
try:
    assert all("care-"+a in proofs and proofs["care-"+a]["action"]==a for a in ["feed","wash","walk","sleep","inject"])
    run('resume-boot','local result={ready=_PetLogic.TurtleReady}',pause=.1)
    logs=s.call('maker_logs',{'kind':'normal'});start=max(x['dateTime'] for x in logs.get('logs',[]) if prefix+'resume-boot ' in x.get('message',''))
    (stage/'runtime-start.json').write_text(json.dumps({'start':start}),encoding='utf-8')
    run('combat-preview',"local id=nil;for uid,r in pairs(_PetLogic.States)do id=uid;_PetLogic._T.bugiOriginalRecord=r end;_PetLogic._T.bugiOriginalUser=id;_PetLogic._T.bugiOriginalDebug=_CardManager.DebugMode;local rec=_PetLogic:ReadAccount(_PetLogic:SerializeAccount(_PetLogic._T.bugiOriginalRecord));rec.test=true;rec.dirty=false;rec.pets.landturtle.Owned=true;for petId,p in pairs(rec.pets)do p.Equipped=petId=='landturtle' end;_PetLogic.States[id]=rec;_PetLogic:PushState(id,'','');local result={ready=true}",server,.3)
    started=True
    script('_PetHouseUI:Close();_TitleUI.titleGroup.Enable=false;_GameManager:RequestStartGame(false,0,1)',pause=4)
    r=run('fixtures','''_MonsterSpawner:StopSpawning();local map=_EntityService:GetEntityByPath("/maps/".._MapManager:GetMapName(_MapManager.CurrentMapIndex));local cx=_MonsterSpawner:GetZoneOffsetX(_MapManager.CurrentMapIndex);local gy=_MonsterSpawner:GetBottomGroundY(map,cx);for _,m in ipairs(_CardManager:GetMonstersInCurrentZone(map))do if isvalid(m) and isvalid(m.Entity)then m._dead=true;m.Entity:Destroy()end end;_PetLogic._T.bugiMobs={};for i=1,3 do local e=_SpawnService:SpawnByModelId(_MonsterSpawner.MonsterModelId,"BugiProof"..i,Vector3(cx+(i-2)*1.5,gy,0),map);local m=e:GetComponent("script.MonsterAI");m:InitializeStats(12,1,false,3);_MonsterSpawner:UnregisterZoneMonster(m._spawnZoneIndex,m);m:SetSpawnZone(_MapManager.CurrentMapIndex);m._currentScale=1.5;m._reachedPlayer=true;m._paused=false;m._attackTimer=100;m.ApproachSpeed=0;m.MaxHp=100000000;m.CurrentHp=m.MaxHp;e.TransformComponent.Scale=Vector3(1.5*m._scaleMultiplier,1.5*m._scaleMultiplier,1);e.TransformComponent.WorldPosition=Vector3(cx+(i-2)*1.5,gy,0);table.insert(_PetLogic._T.bugiMobs,m)end;_GameManager.PlayerHp=100000;_GameManager.PlayerMaxHp=100000;_PetLogic.RunPetId="landturtle";_PetLogic._T.petSkillCooldown=60;local result={count=3,ground=gy}''',server,.2)
    script('''local P=_PetLogic;P._T.bugiFallSamples={};local timer=0;local seen=false;timer=_TimerService:SetTimerRepeat(function()local v=P._T.petSkillVisual;if v~=nil and v.id=="landturtle" then seen=true;local p=v.body.TransformComponent.WorldPosition;table.insert(P._T.bugiFallSamples,{age=v.age,y=p.y,enabled=v.body.Enable,alpha=v.body.SpriteRendererComponent.Color.a})elseif seen then _TimerService:ClearTimer(timer)end end,.02,.02)''',pause=.1)
    run('arm-shell','''local P=_PetLogic;P._T.bugiShieldProof={};local proof=P._T.bugiShieldProof;local timer=0;timer=_TimerService:SetTimerRepeat(function()local c=P._T.petSkillCast;if c~=nil and c.id=="landturtle" then proof.lastAge=c.age;if c.age<P.PetTurtleDropTime then proof.beforeLanding=P:AbsorbPetTurtleHit()end;if c.age>=0.56 and not proof.paused then local hp=_GameManager.PlayerHp;_GameManager:OnMonsterReached(1,true,false,Vector2(c.anchor.x+1,c.anchor.y),false,false);_GameManager:OnMonsterReached(1,true,true,Vector2(c.anchor.x-1,c.anchor.y),true,true);proof.protected=_GameManager.PlayerHp==hp;proof.absorbed=c.absorbed;proof.paused=true;_GameManager.OptionPaused=true end elseif proof.paused then proof.ended=true;proof.protectionGone=not P:AbsorbPetTurtleHit();_TimerService:ClearTimer(timer)end end,.02,.02);P._T.petSkillCooldown=0;local result={armed=true}''',server,.1)
    r=wait_for('shield-paused','local result={paused=_GameManager.OptionPaused,proof=_PetLogic._T.bugiShieldProof}',lambda v:v['paused'],server)
    assert r['proof']['protected'] and r['proof']['absorbed']==2 and not r['proof']['beforeLanding']
    r=run('shell-visual','''local v=_PetLogic._T.petSkillVisual;local target=_PetLogic:GetPetTurtleTarget(v.zone);local result={id=v.id,age=v.age,landed=v.landed,bodyY=v.body.TransformComponent.WorldPosition.y,width=v.body.TransformComponent.Scale.x*0.3,shell=v.body.SpriteRendererComponent.SpriteRUID,order=v.body.SpriteRendererComponent.OrderInLayer,dust=#v.dusts,targetX=target.x,targetY=target.y}''',pause=.2)
    assert r['id']=='landturtle' and r['landed'] and r['order']==132 and r['dust']==8 and abs(r['bodyY']-proofs['fixtures']['ground'])<.01 and abs(r['width']-2.6)<.06
    shot('bugi-shell-impact.png')
    age=r['age'];time.sleep(.7)
    r=run('pause-frozen','local v=_PetLogic._T.petSkillVisual;local result={age=v.age,dust=#v.dusts}',pause=.1)
    assert abs(r['age']-age)<.0001 and r['dust']==8
    r=run('projectile-shell-target','''local map=_UserService.LocalPlayer.CurrentMap;local source=map:GetChildByName("BugiProof1");local F=_MonsterProjectileFx;local p=F:GetProfile("826410e1bd4e4a12a612ab642c19c705");local shot={profile=p,source=source,body=_CardManager:GetSpriteMetrics(p.muzzleSprite),frames=F:WarmFrames(p.projectile),hits=F:WarmFrames(p.hit),flight=p.flight,zone=_MapManager.CurrentMapIndex,ghosts={},fragments={}};F:ReleaseVisual(shot,map);local endpoint=_UILogic:ScreenToWorldPosition(shot.targetScreen);local target=_PetLogic:GetPetTurtleTarget(shot.zone);local result={decoy=shot.decoy,width=shot.w1,x=endpoint.x,y=endpoint.y,targetX=target.x,targetY=target.y,order=shot.fx.SpriteRendererComponent.OrderInLayer};F:DestroyVisual(shot)''',pause=.2)
    assert r['decoy'] and r['width']<=.6501 and abs(r['x']-r['targetX'])<.001 and abs(r['y']-r['targetY'])<.001 and r['order']==134
    script('_GameManager.OptionPaused=false','server_main',.1)
    r=wait_for('shield-ended','local result={proof=_PetLogic._T.bugiShieldProof,hp=_GameManager.PlayerHp}',lambda v:v['proof'].get('ended'),server,count=15)
    assert r['proof']['protectionGone'] and 3.38<r['proof']['lastAge']<3.44 and r['hp']==100000
    r=run('fall-samples','''local rows=_PetLogic._T.bugiFallSamples;local first=100;local last=-100;local early=false;for _,v in ipairs(rows)do if v.age>0 and v.age<0.10 then first=math.min(first,v.y);early=true end;if v.age>=0.42 and v.age<0.80 then last=v.y end end;local result={frames=#rows,firstY=first,landedY=last,early=early,travel=first-last}''',pause=.2)
    assert r['early'] and r['travel']>4.6
    r=run('U-arm','''_CardManager.DebugMode=true;local result={previous=_PetLogic.RunPetId};''',server,.1)
    script('_PetLogic:CheatRequestNextPetSkill()',pause=.3)
    r=run('U-fourth-to-first','local result={pet=_PetLogic.RunPetId,cooldown=_PetLogic._T.petSkillCooldown}',server,.1)
    assert r['pet']=='5002617' and 2<r['cooldown']<=3
    script('''local P=_PetLogic;P._T.bugiRollProof={seen=false,done=false,lastAge=0,beyondThree=false};local proof=P._T.bugiRollProof;local timer=0;timer=_TimerService:SetTimerRepeat(function()local c=P._T.petSkillCast;if c~=nil and c.id=="5002617" then proof.seen=true;proof.lastAge=c.age;if c.age>3.15 then proof.beyondThree=true end elseif proof.seen then proof.done=true;_TimerService:ClearTimer(timer)end end,.025,.025)''',server,.1)
    r=wait_for('guri-four-seconds','local result={proof=_PetLogic._T.bugiRollProof}',lambda v:v['proof'].get('done'),server,count=20)
    assert r['proof']['beyondThree'] and 3.94<r['proof']['lastAge']<=4.02
    time.sleep(.7)
    run('guri-cleaned','local result={gone=_PetLogic._T.petSkillVisual==nil}',pause=.1)
    cleanup();started=False
    assert proofs['cleanup']['restored'] and proofs['guri-cleaned']['gone']
    logs=s.call('maker_logs',{'kind':'normal'});errors=[x for x in logs.get('logs',[]) if x.get('logType')=='Error' and x.get('dateTime','')>=start]
    (stage/'runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8')
    assert not errors,errors
    build=s.call('maker_logs',{'kind':'build'});assert not [x for x in build.get('logs',[]) if x.get('logType')=='Error']
    report={'status':'passed','catalogCount':4,'temporaryHatchButton':True,'nativeCareActions':['feed','wash','walk','sleep','inject'],'baseHpPercent':5,'dropTravelWorldUnits':proofs['fall-samples']['travel'],'shellWidth':2.6,'cameraShakeIntensity':.18,'shieldSecondsAfterLanding':3,'normalBossChargeHitsAbsorbed':2,'projectilesHitShell':True,'pauseFreezesDropShieldDust':True,'UIncludesFourthPet':True,'guriRollSeconds':4,'originalRecordRestored':True,'runtimeErrors':0,'buildErrors':0}
    (out/'runtime-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
finally:
    if started:
        try:cleanup()
        except Exception as e:print('Cleanup requires follow-up:',type(e).__name__,flush=True)
    s.close()
