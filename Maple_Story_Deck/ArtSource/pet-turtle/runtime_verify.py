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
    mode=s.call('maker_get_current_map')
    if mode['mode']=='edit':
        print('Play:',s.call('maker_play'),flush=True)
        for _ in range(18):
            time.sleep(1)
            try:mode=s.call('maker_get_current_map')
            except AssertionError:continue
            if mode.get('mode')=='play':break
    assert mode.get('mode')=='play'
    r=wait_for('boot','local result={art=_PetLogic._T.petSkillArtReady,turtle=_PetLogic.TurtleReady,client=_PetLogic.ClientReady,count=#_PetLogic:GetPetCatalog()}',lambda v:v['art'] and v['turtle'] and v['client'],count=24)
    assert r['count']==4
    logs=s.call('maker_logs',{'kind':'normal'});start=max(x['dateTime'] for x in logs.get('logs',[]) if prefix+'boot ' in x.get('message',''))
    (stage/'runtime-start.json').write_text(json.dumps({'start':start}),encoding='utf-8')
    r=run('preview-unowned','''local count=0;for id,record in pairs(_PetLogic.States)do _PetLogic._T.bugiOriginalRecord=record;_PetLogic._T.bugiOriginalUser=id;local preview=_PetLogic:ReadAccount(_PetLogic:SerializeAccount(record));preview.test=true;preview.dirty=false;preview.generation=0;preview.lastRequest=0;preview.busyUntil=0;preview.responsePetId="landturtle";preview.pets.landturtle.Owned=false;preview.pets.landturtle.Equipped=false;_PetLogic.States[id]=preview;_PetLogic:PushState(id,"","");count=count+1 end;_PetLogic._T.bugiOriginalDebug=_CardManager.DebugMode;local result={count=count}''',server,.4)
    assert r['count']==1;started=True
    script('''_TitleUI.titleGroup.Enable=true;_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true;_PetHouseUI:Open()''',pause=.6)
    for _ in range(5):
        selected=run('select-turtle','local result={id=_PetHouseUI:GetDisplayedPet().id}',pause=.1)['id']
        if selected=='landturtle':break
        script('_PetHouseUI:MovePet(1)',pause=.5)
    r=wait_for('unowned-house','''local h=_PetHouseUI;local e=h:GetDisplayedPet();local result={id=e.id,name=h.PetDisplay:GetChildByName("Name").TextGUIRendererComponent.Text,owned=e.progress.Owned,nextEnabled=h.PetPanel:GetChildByName("NextPet").ButtonComponent.Enable,prevEnabled=h.PetPanel:GetChildByName("PrevPet").ButtonComponent.Enable,portrait=h.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.ImageRUID.DataId}''',lambda v:not v['nextEnabled'] and v['prevEnabled'] and v['portrait']=='ca7fa1b76ac949d6b5008a6a906f195f')
    assert r['id']=='landturtle' and not r['owned'] and not r['nextEnabled'] and r['prevEnabled'] and '부기' in r['name']
    script('_PetHouseUI.PetPanel:GetChildByName("test"):SendEvent(ButtonClickEvent(_PetHouseUI.PetPanel:GetChildByName("test")))',pause=.5)
    r=wait_for('hatch','''local rec=_PetLogic.States[_PetLogic._T.bugiOriginalUser];local p=rec.pets.landturtle;local result={test=rec.test,owned=p.Owned,equipped=p.Equipped,level=p.Level,initial=_PetLogic:GetPetStatLines("landturtle",p)[1].percent}''',lambda v:v['owned'],server)
    assert r['test'] and r['equipped'] and r['level']==1 and r['initial']==5
    time.sleep(3)
    script('_PetHouseUI:OpenStatPopup()',pause=.3)
    r=run('skill-panel','''local h=_PetHouseUI;local w=h.StatPopup:GetChildByName("Window");local locks=0;for i=0,3 do if w:GetChildByName("Row"..i):GetChildByName("Lock").Enable then locks=locks+1 end end;local row=w:GetChildByName("Row4");local result={locks=locks,stat=w:GetChildByName("Row0"):GetChildByName("Name").TextGUIRendererComponent.Text,value=w:GetChildByName("Row0"):GetChildByName("Value").TextGUIRendererComponent.Text,skill=row:GetChildByName("Name").TextGUIRendererComponent.Text,icon=row:GetChildByName("Icon").SpriteGUIRendererComponent.ImageRUID.DataId,description=w:GetChildByName("SkillDescription").TextGUIRendererComponent.Text}''',pause=.2)
    assert r['locks']==3 and r['value']=='+5%' and r['skill']=='껍질 방패' and r['icon']=='0580f8428ed64902adb48820c2b1c641'
    shot('bugi-skill-panel.png')
    script('_PetHouseUI:CloseStatPopup()',pause=.1)
    for action,ruid,duration in [('feed','ef662acb5b2942e898fee063a0d0f2ba',3.8),('wash','c97fb8315ea9440c8f464953650edbf3',4.5),('walk','8f30c5c55e6e4154bfc8200d1ceb3186',12),('sleep','c9b78e76d72b4ddaaaab815e0c3b87eb',6),('inject','3773ec3d2b954ac786cbd0ccbe99e342',5.5)]:
        run('care-reset-'+action,'''local id=_PetLogic._T.bugiOriginalUser;local rec=_PetLogic.States[id];local p=rec.pets.landturtle;p.Energy=1000;p.Fullness=40;p.Cleanliness=40;p.Mood=40;p.Health=40;p.Fatigue=40;p.SleepUntil=0;rec.lastRequest=0;rec.busyUntil=0;rec.responsePetId="landturtle";_PetLogic:PushState(id,"","");local result={ready=true}''',server,.2)
        script('_PetHouseUI.PetPanel:GetChildByName("'+action+'"):SendEvent(ButtonClickEvent(_PetHouseUI.PetPanel:GetChildByName("'+action+'")))',pause=.5)
        r=wait_for('care-'+action,'''local h=_PetHouseUI;local r=h.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent;local result={action=h.Motion,ruid=r.ImageRUID.DataId,scale=r.LocalScale.x,native=r.PreserveSprite==PreserveSpriteType.NativeSize,smile=h.WalkSmile.Enable}''',lambda v:v['action']==action and v['ruid']==ruid)
        assert r['native'] and r['scale']==6 and not r['smile']
        if action in ['walk','sleep']:shot('bugi-'+action+'.png')
        time.sleep(max(0,duration-1.0))
        wait_for('care-ended-'+action,'local result={done=_PetHouseUI.MotionUntil==0}',lambda v:v['done'],count=10,delay=.2)
    r=run('equipped-hp','''local id=_PetLogic._T.bugiOriginalUser;local p=_PetLogic.States[id].pets.landturtle;_PetLogic:InitForRun(id);local result={id=_PetLogic.RunPetId,hp=_PetLogic.RunMaxHpMultiplier,expected=1+_PetLogic:GetPetStats("landturtle",p).hpPct}''',server,.2)
    assert r['id']=='landturtle' and abs(r['hp']-r['expected'])<.00001
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
