from runtime_common import *
server='server_main';started=False
def wait_for(tag,body,predicate,context='client',count=16):
    for _ in range(count):
        r=run(tag,body,context,.1)
        if predicate(r):return r
        time.sleep(.3)
    raise AssertionError(tag)
def clean():
    run('cleanup','''_GameManager.GameStarted=false;_GameManager.GameOver=false;_GameManager.OptionPaused=false;_MonsterSpawner:StopSpawning();for _,m in ipairs(_PetLogic._T.feedbackMobs or {})do if isvalid(m) and isvalid(m.Entity)then m._dead=true;m.Entity:Destroy()end end;local id=_PetLogic._T.feedbackUser;_PetLogic.States[id]=_PetLogic._T.feedbackRecord;_PetLogic:PushState(id,"","");_PetLogic._T.feedbackMobs=nil;_PetLogic._T.petSkillCast=nil;_PetLogic.RunPetId="";_PetLogic._T.petSkillCooldown=60;_GameManager.PlayerHp=100;_GameManager.PlayerMaxHp=100;_MonsterProjectileFx:ResetForRun();_Ep1ProjectileFx:ResetForRun();local result={restored=_PetLogic.States[id]==_PetLogic._T.feedbackRecord}''',server,.3)
    script('_PetLogic:ClearPetSkillVisual();_PetHouseUI:Close();_TitleUI.titleGroup.Enable=true;_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true',pause=.2)
try:
    mode=s.call('maker_get_current_map');assert mode['mode']=='edit'
    print('Play:',s.call('maker_play'),flush=True)
    for _ in range(18):
        time.sleep(1)
        try:mode=s.call('maker_get_current_map')
        except AssertionError:continue
        if mode.get('mode')=='play':break
    assert mode.get('mode')=='play'
    r=wait_for('boot','''local result={bowl=_PetHouseUI.DuckyBowlReady,turtle=_PetLogic.TurtleReady,account=_PetLogic.ClientReady,frames=#(_PetLogic._T.turtleHitFrames or {})}''',lambda v:v['bowl'] and v['turtle'] and v['account'])
    assert r['frames']==6
    logs=s.call('maker_logs',{'kind':'normal'});start=max(x['dateTime'] for x in logs.get('logs',[]) if prefix+'boot ' in x.get('message',''))
    (stage/'runtime-start.json').write_text(json.dumps({'start':start}),encoding='utf-8')
    run('test-profile','''local now=_DateTimeLogic:GetTimeElapsedWithoutOffset();for id,r in pairs(_PetLogic.States)do _PetLogic._T.feedbackUser=id;_PetLogic._T.feedbackRecord=r;local rec=_PetLogic:ReadAccount(_PetLogic:SerializeAccount(r));rec.test=true;rec.dirty=false;rec.lastRequest=0;rec.busyUntil=0;local p=rec.pets["5000498"];p.Owned=true;p.Fullness=40;p.Cleanliness=100;p.Mood=100;p.Fatigue=0;p.NeedsAt=now;p.EnergyAt=now;rec.responsePetId="5000498";_PetLogic.States[id]=rec;_PetLogic:PushState(id,"","")end;local result={ready=true}''',server,.3);started=True
    script('_TitleUI.titleGroup.Enable=true;_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true;_PetHouseUI:Open()',pause=.6)
    for _ in range(6):
        r=run('select','local result={id=_PetHouseUI:GetDisplayedPet().id}',pause=.1)
        if r['id']=='5000498':break
        script('_PetHouseUI:MovePet('+('1' if r['id'] in ['5002617','ttungttang'] else '-1')+')',pause=.5)
    assert r['id']=='5000498'
    script('_PetHouseUI:PlayPortrait(_PetLogic.FoxMotions.eat);_PetHouseUI:SetFeedingMotion(true,1.2)',pause=.4)
    r=run('bowl-left','''local b=_PetHouseUI.DuckyFoodBowl;local p=b.UITransformComponent.anchoredPosition;local result={visible=b.Enable,x=p.x,y=p.y,width=b.UITransformComponent.RectSize.x}''',pause=.1)
    old=json.loads(Path('outputs/ducky-bowl/runtime-proof-state.json').read_text())['bowl-preview']
    assert r['visible'] and abs(r['x']-(old['x']-8))<.1 and abs(r['y']-old['y'])<.1 and r['width']==old['width']
    shot('ducky-bowl-left.png')
    script('_PetHouseUI:Close();_TitleUI.titleGroup.Enable=false;_GameManager:RequestStartGame(false,0,1)',pause=3)
    run('fixture','''_MonsterSpawner:StopSpawning();local map=_EntityService:GetEntityByPath("/maps/".._MapManager:GetMapName(_MapManager.CurrentMapIndex));local cx=_MonsterSpawner:GetZoneOffsetX(_MapManager.CurrentMapIndex);local gy=_MonsterSpawner:GetBottomGroundY(map,cx);for _,m in ipairs(_CardManager:GetMonstersInCurrentZone(map))do if isvalid(m) and isvalid(m.Entity)then m._dead=true;m.Entity:Destroy()end end;local e=_SpawnService:SpawnByModelId(_MonsterSpawner.MonsterModelId,"FeedbackProof",Vector3(cx+1.5,gy,0),map);local m=e:GetComponent("script.MonsterAI");m:InitializeStats(12,1,false,3);_MonsterSpawner:UnregisterZoneMonster(m._spawnZoneIndex,m);m:SetSpawnZone(_MapManager.CurrentMapIndex);m._currentScale=1.5;m._reachedPlayer=true;m._attackTimer=100;m.ApproachSpeed=0;m.MaxHp=100000000;m.CurrentHp=m.MaxHp;_PetLogic._T.feedbackMobs={m};_PetLogic.RunPetId="landturtle";_PetLogic._T.petSkillCooldown=60;_GameManager.PlayerHp=100000;_GameManager.PlayerMaxHp=100000;local result={ground=gy}''',server,.2)
    script('''local P=_PetLogic;P._T.feedbackVisual={seen=false,spark=false,same=true,maxDx=0,frames=0,hidden=false,done=false};local proof=P._T.feedbackVisual;local first=nil;local seenFrames={};local timer=0;timer=_TimerService:SetTimerRepeat(function()local v=P._T.petSkillVisual;if v~=nil and v.id=="landturtle" then proof.seen=true;local fx=v.hitFx;if first==nil then first=fx end;proof.same=proof.same and fx==first;proof.maxDx=math.max(proof.maxDx,math.abs(v.body.TransformComponent.WorldPosition.x-v.center.x));if isvalid(fx) and fx.Enable and fx.SpriteRendererComponent.Color.a>0.01 then proof.spark=true;local r=fx.SpriteRendererComponent.SpriteRUID;if not seenFrames[r] then seenFrames[r]=true;proof.frames=proof.frames+1 end elseif v.sparkAt~=nil then proof.hidden=true end;elseif proof.seen then proof.done=true;proof.destroyed=not isvalid(first);_TimerService:ClearTimer(timer)end end,.01,.01)''',pause=.1)
    run('arm','''local P=_PetLogic;P._T.feedbackShield={first=false,second=false,third=false,paused=false,done=false,hp=100000,lastAge=0};local proof=P._T.feedbackShield;local timer=0;timer=_TimerService:SetTimerRepeat(function()local c=P._T.petSkillCast;if c~=nil and c.id=="landturtle" then proof.lastAge=c.age;local function hit()_GameManager:OnMonsterReached(1,true,false,Vector2(c.anchor.x+1,c.anchor.y),false,false)end;if c.age>=0.60 and not proof.first then proof.first=true;hit()end;if c.age>=0.85 and not proof.second then proof.second=true;for i=1,3 do hit()end end;if c.age>=1.12 and not proof.third then proof.third=true;hit()end;if c.age>=1.18 and not proof.paused then proof.paused=true;proof.hp=_GameManager.PlayerHp;proof.absorbed=c.absorbed;_GameManager.OptionPaused=true end elseif proof.paused then proof.done=true;_TimerService:ClearTimer(timer)end end,.015,.015);P._T.petSkillCooldown=0;local result={armed=true}''',server,.1)
    r=wait_for('paused','local result={paused=_GameManager.OptionPaused,proof=_PetLogic._T.feedbackShield}',lambda v:v['paused'],server)
    assert r['proof']['absorbed']==5 and r['proof']['hp']==100000
    r=run('hit-visible','''local v=_PetLogic._T.petSkillVisual;local fx=v.hitFx;local proof=_PetLogic._T.feedbackVisual;local result={spark=fx.Enable,alpha=fx.SpriteRendererComponent.Color.a,order=fx.SpriteRendererComponent.OrderInLayer,age=v.age,sparkAt=v.sparkAt,recoilAt=v.recoilAt,hitAt=v.hitAt,bodyX=v.body.TransformComponent.WorldPosition.x,centerX=v.center.x,same=proof.same,frames=proof.frames,maxDx=proof.maxDx,playRate=fx.SpriteRendererComponent.PlayRate}''',pause=.1)
    assert r['maxDx']>.02 and r['maxDx']<=.0551 and r['same'] and r['frames']>=3 and r['spark'] and r['alpha']>0 and r['order']==136 and r['playRate']==0
    shot('shell-shield-hit-feedback.png')
    time.sleep(.6)
    frozen=run('pause-frozen','''local v=_PetLogic._T.petSkillVisual;local result={age=v.age,x=v.body.TransformComponent.WorldPosition.x,ruid=v.hitFx.SpriteRendererComponent.SpriteRUID,alpha=v.hitFx.SpriteRendererComponent.Color.a}''',pause=.1)
    assert abs(frozen['age']-r['age'])<.0001 and abs(frozen['x']-r['bodyX'])<.0001 and abs(frozen['alpha']-r['alpha'])<.0001
    run('paused-hit-no-queue','''local c=_PetLogic._T.petSkillCast;local before=c.absorbed;_GameManager:OnMonsterReached(1,true,false,Vector2(c.anchor.x,c.anchor.y),false,false);local result={same=c.absorbed==before,hp=_GameManager.PlayerHp}''',server,.1)
    assert proofs['paused-hit-no-queue']['same'] and proofs['paused-hit-no-queue']['hp']==100000
    script('_GameManager.OptionPaused=false',server,.1)
    wait_for('finished','local result=_PetLogic._T.feedbackVisual',lambda v:v['done'])
    r=proofs['finished'];assert r['spark'] and r['same'] and r['hidden'] and r['destroyed'] and r['frames']==6
    clean();started=False
    logs=s.call('maker_logs',{'kind':'normal'});errors=[x for x in logs.get('logs',[]) if x.get('logType')=='Error' and x.get('dateTime','')>=start];assert not errors,errors
    build=s.call('maker_logs',{'kind':'build'});assert not [x for x in build.get('logs',[]) if x.get('logType')=='Error']
    report={'status':'passed','bowlShiftLeftPixels':8,'bowlHeightAndSizeUnchanged':True,'interceptedHits':5,'recoilWorldUnitsMax':r['maxDx'],'hitFramesPlayedOnce':6,'singlePooledHitSprite':True,'pauseFreezesHitAndRecoil':True,'pausedHitsDoNotQueue':True,'hitSpriteDestroyedOnExit':True,'originalRecordRestored':proofs['cleanup']['restored'],'runtimeErrors':0,'buildErrors':0}
    (out/'runtime-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(stage/'runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
finally:
    if started:
        try:clean()
        except Exception as e:print('Cleanup requires follow-up:',type(e).__name__,flush=True)
    s.close()
