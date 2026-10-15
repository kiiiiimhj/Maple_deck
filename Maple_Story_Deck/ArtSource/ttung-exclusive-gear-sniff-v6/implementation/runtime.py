from pathlib import Path
from datetime import datetime
import sys,json,time,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
out=Path('outputs/ttung-gear-sniff-v6');stage=Path('work/ttung-gear-sniff-v6');s=MakerSession();proof={};started=datetime.now().isoformat(timespec='seconds')

def run(tag,body):
    needle='[VRF] SNIFF-CAP6 '+tag+' '+str(time.time_ns())+' '
    s.call('maker_execute_script',{'context':'client','script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
    for _ in range(80):
        logs=s.call('maker_logs',{'kind':'normal'})
        hits=[v['message']for v in logs.get('logs',[])if needle in v.get('message','')]
        if hits:
            r=json.loads(hits[-1].split(needle,1)[1]);proof[tag]=r
            (out/'runtime-proof.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2),encoding='utf-8')
            print(tag+': '+json.dumps(r,ensure_ascii=False),flush=True);return r
        time.sleep(.3)
    raise AssertionError('No completed probe '+tag)

try:
    ready=run('ready','local H=_PetHouseUI;local p=_PetLogic.ClientPets.ttungttang;local result={gear=_PetLogic.PetGearReady,frames=_PetLogic.TtungttangReady,owned=p.Owned,mask=p.GearEquippedMask,pet=H:GetDisplayedPet().id,open=H.PetMode}')
    assert ready['gear']and ready['frames']and ready['owned']and ready['mask']==7 and ready['pet']=='ttungttang'and ready['open'],ready
    run('freeze-scene','local H=_PetHouseUI;H._T.sniffOldPlan=H.WalkPlan;H.PetMode=false;H.WalkPlan={route=1,found=true,icon="",message="",revealed=false};local result={inspection=true}')
    for name,age,index in [('discovery',3.85,None),('sniff-frame1',5.45,1),('sniff-frame2',5.3,2),('return-walking',8,None)]:
        body='''local H=_PetHouseUI;local L=_PetLogic;H:SetActionScenery("walk",AGE);H:SetWalking(true,AGE);local portrait=H.PetDisplay:GetChildByName("Portrait");local entry=H:GetDisplayedPet();L:AlignCustomPortrait(portrait,entry,entry.pixelScale);L:RenderPetGearUI(portrait,entry,H.CustomImageRUID);local expected=L.PetGearOverlays[H.CustomImageRUID];local pool=L._T.petGearUI[portrait.Id];local active=0;local hat=false;local blank=false;for ruid,a in pairs(pool.byRUID)do if a.SpriteGUIRendererComponent.Color.a>0.99 then active=active+1;if ruid==expected.hat then hat=true end end end;local result={frame=H.CustomFrameKey,image=H.CustomImageRUID,active=active,hat=hat,flip=portrait.SpriteGUIRendererComponent.FlipX,phase=H.WalkPhase}'''.replace('AGE',str(age))
        r=run(name,body);assert r['active']==3 and r['hat']and r['flip'],r
        if index is not None:assert r['frame']==f'ttungttang:sniff:{index}',r
        photo=s.call('maker_screenshot');shutil.copy2(photo['path'],out/(name+'.png'))
    run('animate-sniff','''local H=_PetHouseUI;local L=_PetLogic;local portrait=H.PetDisplay:GetChildByName("Portrait");local entry=H:GetDisplayedPet();L._T.sniffCheck={samples=0,blank=0,wrongHat=0,offset=0,seen={},finished=false};local tick=0;local timer=0;timer=_TimerService:SetTimerRepeat(function()tick=tick+1;local q=L._T.sniffCheck;local age=4.25+tick/60;H:SetWalking(true,age);L:AlignCustomPortrait(portrait,entry,entry.pixelScale);L:RenderPetGearUI(portrait,entry,H.CustomImageRUID);local expected=L.PetGearOverlays[H.CustomImageRUID];local pool=L._T.petGearUI[portrait.Id];local active=0;local hat=false;q.seen[H.CustomImageRUID]=true;for ruid,a in pairs(pool.byRUID)do if a.SpriteGUIRendererComponent.Color.a>0.99 then active=active+1;if ruid==expected.hat then hat=true end;local t=a.UITransformComponent;if t.anchoredPosition.x~=0 or t.anchoredPosition.y~=0 then q.offset=q.offset+1 end end end;if active~=3 then q.blank=q.blank+1 end;if not hat then q.wrongHat=q.wrongHat+1 end;q.samples=q.samples+1;if tick>=120 then q.finished=true;_TimerService:ClearTimer(timer)end end,1/60,1/60);L._T.sniffCheckTimer=timer;local result={started=true}''')
    for _ in range(24):
        r=run('animation-probe','local q=_PetLogic._T.sniffCheck;local n=0;for _,_ in pairs(q.seen)do n=n+1 end;local result={samples=q.samples,blank=q.blank,wrongHat=q.wrongHat,offset=q.offset,frames=n,finished=q.finished}')
        if r['finished']:break
        time.sleep(.3)
    assert r['finished']and r['samples']==120 and r['frames']==2 and r['blank']==r['wrongHat']==r['offset']==0,r
    logs=s.call('maker_logs',{'kind':'normal'});errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=started]
    (stage/'runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8');assert not errors,errors
    (out/'runtime-verification.json').write_text(json.dumps({'status':'passed','nativeSniffFrames':[1,2],'samples':120,'blank':0,'wrongCap':0,'offset':0,'discoveryAndReturnTransitionChecked':True,'runtimeErrors':0},indent=2),encoding='utf-8')
finally:
    try:
        run('restore-ui','local L=_PetLogic;if L._T.sniffCheckTimer~=nil then _TimerService:ClearTimer(L._T.sniffCheckTimer)end;local H=_PetHouseUI;H.WalkPlan=H._T.sniffOldPlan;H._T.sniffOldPlan=nil;H.PetMode=true;H:Close();H.SelectedPetIndex=2;H:Open();local result={restored=H.PetMode}')
    finally:s.close()
