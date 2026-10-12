from runtime_common import *
server='server_main';started=False
def clean():
    run('bowl-cleanup','''local id=_PetLogic._T.feedbackBowlUser;_PetLogic.States[id]=_PetLogic._T.feedbackBowlRecord;_PetLogic:PushState(id,"","");local result={restored=_PetLogic.States[id]==_PetLogic._T.feedbackBowlRecord}''',server,.3)
    script('_PetHouseUI:Close()',pause=.3)
try:
    run('bowl-profile','''local now=_DateTimeLogic:GetTimeElapsedWithoutOffset();for id,r in pairs(_PetLogic.States)do _PetLogic._T.feedbackBowlUser=id;_PetLogic._T.feedbackBowlRecord=r;local rec=_PetLogic:ReadAccount(_PetLogic:SerializeAccount(r));rec.test=true;rec.dirty=false;rec.lastRequest=0;rec.busyUntil=0;local p=rec.pets["5000498"];p.Owned=true;p.Fullness=40;p.Cleanliness=100;p.Mood=100;p.Fatigue=0;p.Health=100;p.Energy=1000;p.NeedsAt=now;p.EnergyAt=now;rec.responsePetId="5000498";_PetLogic.States[id]=rec;_PetLogic:PushState(id,"","")end;local result={ready=true}''',server,.3);started=True
    script('_TitleUI.titleGroup.Enable=true;_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true;_PetHouseUI:Open()',pause=.6)
    for _ in range(10):
        r=run('bowl-idle-settled','''local h=_PetHouseUI;local e=h:GetDisplayedPet();local p=h.PetDisplay:GetChildByName("Portrait");local result={id=e.id,owned=e.progress.Owned,ruid=p.SpriteGUIRendererComponent.ImageRUID.DataId,y=p.UITransformComponent.anchoredPosition.y,meters=h.PetDisplay:GetChildByName("CareMeters").Enable}''',pause=.1)
        if r['id']=='5000498' and r['owned'] and r['meters'] and r['ruid']=='ee8505e525324895ae95ff4e18d9fd47' and abs(r['y']+150)<.001:break
        script('_PetHouseUI:Refresh()',pause=.4)
    assert r['owned'] and r['meters'] and abs(r['y']+150)<.001
    script('''local h=_PetHouseUI;h._T.foodLeftProof={seen=false,done=false,stable=true,correctShift=true};local proof=h._T.foodLeftProof;local timer=0;timer=_TimerService:SetTimerRepeat(function()if h.Motion=="feed" and h.MotionUntil>0 then proof.seen=true;local p=h.PetDisplay:GetChildByName("Portrait").UITransformComponent.anchoredPosition;local b=h.DuckyFoodBowl;proof.stable=proof.stable and math.abs(p.y+150)<.001;if b.Enable and b.SpriteGUIRendererComponent.Color.a>0.5 then proof.correctShift=proof.correctShift and math.abs(b.UITransformComponent.anchoredPosition.x-1)<.1 end elseif proof.seen then proof.done=true;proof.hidden=not h.DuckyFoodBowl.Enable;_TimerService:ClearTimer(timer)end end,.02,.02);h.PetPanel:GetChildByName("feed"):SendEvent(ButtonClickEvent(h.PetPanel:GetChildByName("feed")))''',pause=.2)
    for _ in range(15):
        r=run('actual-meal-left','local result=_PetHouseUI._T.foodLeftProof',pause=.1)
        if r['done']:break
        time.sleep(.3)
    assert r['seen'] and r['done'] and r['stable'] and r['correctShift'] and r['hidden']
    # Capture a held original eat pose at the same ground plane verified by the real button.
    script('''local h=_PetHouseUI;h:PlayPortrait(_PetLogic.FoxMotions.eat);h.PetDisplay:GetChildByName("Portrait").UITransformComponent.anchoredPosition=Vector2(0,h:GetPortraitY());h:SetFeedingMotion(true,1.2)''',pause=.3)
    shot('ducky-bowl-left.png')
    clean();started=False
    report=json.loads((out/'runtime-verification.json').read_text());report['actualFeedButtonPositionVerified']=True
    (out/'runtime-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print('Actual feeding position and shifted bowl confirmed.',flush=True)
finally:
    if started:
        try:clean()
        except Exception as e:print('Cleanup requires follow-up:',type(e).__name__,flush=True)
    s.close()
