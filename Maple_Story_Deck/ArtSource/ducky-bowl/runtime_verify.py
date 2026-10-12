from runtime_common import *
server='server_main';started=False
def wait_for(tag,body,predicate,context='client',count=12):
    for _ in range(count):
        r=run(tag,body,context,.1)
        if predicate(r):return r
        time.sleep(.4)
    raise AssertionError(tag)
def clean():
    run('cleanup','''local id=_PetLogic._T.bowlOriginalUser;_PetLogic.States[id]=_PetLogic._T.bowlOriginalRecord;_PetLogic:PushState(id,"","");local result={restored=_PetLogic.States[id]==_PetLogic._T.bowlOriginalRecord}''',server,.3)
    script('_PetHouseUI:Close();_TitleUI.titleGroup.Enable=true;_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true',pause=.2)
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
    wait_for('boot','local result={bowl=_PetHouseUI.DuckyBowlReady,fox=_PetLogic.FoxReady,account=_PetLogic.ClientReady}',lambda v:v['bowl'] and v['fox'] and v['account'],count=24)
    logs=s.call('maker_logs',{'kind':'normal'});start=max(x['dateTime'] for x in logs.get('logs',[]) if prefix+'boot ' in x.get('message',''))
    (stage/'runtime-start.json').write_text(json.dumps({'start':start}),encoding='utf-8')
    run('test-profile','''local count=0;local now=_DateTimeLogic:GetTimeElapsedWithoutOffset();for id,r in pairs(_PetLogic.States)do _PetLogic._T.bowlOriginalUser=id;_PetLogic._T.bowlOriginalRecord=r;local preview=_PetLogic:ReadAccount(_PetLogic:SerializeAccount(r));preview.test=true;preview.dirty=false;preview.lastRequest=0;preview.busyUntil=0;local p=preview.pets["5000498"];p.Owned=true;p.Fullness=40;p.Energy=1000;p.Cleanliness=100;p.Mood=100;p.Fatigue=0;p.Health=100;p.NeedsAt=now;p.EnergyAt=now;p.SleepUntil=0;preview.responsePetId="5000498";_PetLogic.States[id]=preview;_PetLogic:PushState(id,"","");count=count+1 end;local result={count=count}''',server,.3);started=True
    script('_TitleUI.titleGroup.Enable=true;_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true;_PetHouseUI:Open()',pause=.6)
    for _ in range(5):
        r=run('select','local result={id=_PetHouseUI:GetDisplayedPet().id}',pause=.1)
        if r['id']=='5000498':break
        direction=1 if r['id'] in ['5002617','ttungttang'] else -1
        script('_PetHouseUI:MovePet('+str(direction)+')',pause=.5)
    assert r['id']=='5000498'
    wait_for('idle-ready','''local h=_PetHouseUI;local result={ruid=h.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.ImageRUID.DataId,bowl=h.DuckyFoodBowl.Enable}''',lambda v:v['ruid']=='ee8505e525324895ae95ff4e18d9fd47' and not v['bowl'])
    script('_PetHouseUI:PlayPortrait(_PetLogic.FoxMotions.eat);_PetHouseUI:SetFeedingMotion(true,1.2)',pause=.2)
    r=run('bowl-preview','''local h=_PetHouseUI;local b=h.DuckyFoodBowl;local t=b.UITransformComponent;local result={visible=b.Enable,alpha=b.SpriteGUIRendererComponent.Color.a,ruid=b.SpriteGUIRendererComponent.ImageRUID.DataId,x=t.anchoredPosition.x,y=t.anchoredPosition.y,width=t.RectSize.x,portrait=h.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.ImageRUID.DataId}''',pause=.1)
    assert r['visible'] and r['alpha']==1 and r['portrait']=='1b2ef1073fa14e8f906327425b4b4a1a'
    shot('ducky-eating-with-bowl.png')
    script('_PetHouseUI:SetFeedingMotion(false,0);_PetHouseUI.IdleRUID="";_PetHouseUI:PlayIdle()',pause=.2)
    for attempt in [1,2]:
        run('reset-'+str(attempt),'''local id=_PetLogic._T.bowlOriginalUser;local r=_PetLogic.States[id];local p=r.pets["5000498"];p.Fullness=40;p.Energy=1000;p.Fatigue=20;r.lastRequest=0;r.busyUntil=0;r.responsePetId="5000498";_PetLogic:PushState(id,"","");local result={ready=true}''',server,.2)
        script('''local h=_PetHouseUI;h._T.bowlProof={seen=false,done=false,shown=false,native=true,maxShift=0,hiddenAfter=false};local proof=h._T.bowlProof;local timer=0;timer=_TimerService:SetTimerRepeat(function()if h.Motion=="feed" and h.MotionUntil>0 then proof.seen=true;local b=h.DuckyFoodBowl;if b.Enable and b.SpriteGUIRendererComponent.Color.a>0.5 then proof.shown=true;local p=b.UITransformComponent.anchoredPosition;if proof.x==nil then proof.x=p.x;proof.y=p.y end;proof.maxShift=math.max(proof.maxShift,math.abs(p.x-proof.x)+math.abs(p.y-proof.y))end;proof.native=proof.native and h.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.ImageRUID.DataId=="1b2ef1073fa14e8f906327425b4b4a1a" elseif proof.seen then proof.done=true;proof.hiddenAfter=not h.DuckyFoodBowl.Enable;_TimerService:ClearTimer(timer)end end,.02,.02);h.PetPanel:GetChildByName("feed"):SendEvent(ButtonClickEvent(h.PetPanel:GetChildByName("feed")))''',pause=.2)
        r=wait_for('feeding-'+str(attempt),'local result=_PetHouseUI._T.bowlProof',lambda v:v['done'],count=20)
        assert r['shown'] and r['native'] and r['hiddenAfter'] and r['maxShift']<.01
    script('_PetHouseUI:SetFeedingMotion(false,0);_PetHouseUI:MovePet(-1)',pause=.5)
    r=run('other-pet','''_PetHouseUI:SetDuckyFoodBowl(true,1);local result={id=_PetHouseUI:GetDisplayedPet().id,shown=_PetHouseUI.DuckyFoodBowl.Enable}''',pause=.1)
    assert r['id']=='ttungttang' and not r['shown']
    clean();started=False
    logs=s.call('maker_logs',{'kind':'normal'});errors=[x for x in logs.get('logs',[]) if x.get('logType')=='Error' and x.get('dateTime','')>=start];assert not errors,errors
    build=s.call('maker_logs',{'kind':'build'});assert not [x for x in build.get('logs',[]) if x.get('logType')=='Error']
    report={'status':'passed','nativeEatMotionPreserved':True,'feedingAttempts':2,'stableBowlPosition':True,'otherPetBowlHidden':True,'hiddenAfterActionAndClose':True,'originalRecordRestored':proofs['cleanup']['restored'],'runtimeErrors':0,'buildErrors':0}
    (out/'runtime-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(stage/'runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
finally:
    if started:
        try:clean()
        except Exception as e:print('Cleanup requires follow-up:',type(e).__name__,flush=True)
    s.close()
