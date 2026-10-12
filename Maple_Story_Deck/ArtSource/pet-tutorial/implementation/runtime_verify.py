from runtime_common import *
from datetime import datetime
resume='--resume'in sys.argv
started=datetime.now().isoformat(timespec='seconds')
def state():return '''local P=_PetHouseUI;local result={open=P.PetTutorialOpen,house=P.PetMode,root=P.TutorialRoot.Enable,revealed=P.PetTutorialRevealed,time=P.PetTutorialTime}'''
try:
 mode=s.call('maker_get_current_map')
 if not resume:
  assert mode['mode']=='edit';print('Play:',s.call('maker_play'),flush=True)
  for _ in range(20):
   time.sleep(1)
   try:mode=s.call('maker_get_current_map')
   except AssertionError:continue
   if mode.get('mode')=='play':break
 assert mode.get('mode')=='play';(stage/'runtime-start.json').write_text(json.dumps({'start':started}),encoding='utf-8')
 wait_for('boot','local result={account=_PetLogic.ClientReady,artwork=_PetHouseUI.PetTutorialReady}',lambda r:r['account']and r['artwork'])
 run('house-open','_TitleUI:ShowLobby();_PetHouseUI:ClosePetTutorial();_PetHouseUI:Open();local P=_PetHouseUI;local t=P.TutorialHelp.UITransformComponent;local pos=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(0,0),t));local result={house=P.PetMode,help=P.TutorialHelp.Enable,x=pos.x,y=pos.y}')
 shot('pet-house-help-button.png')
 # Observe the real timeline, rather than manually advancing implementation counters.
 run('observer-start','''local P=_PetHouseUI;P._T.guideProof={order="",last=0,complete=false,valid=true};local proof=P._T.guideProof;local timer=0;timer=_TimerService:SetTimerRepeat(function()if not P.PetTutorialOpen then return end;local n=P.PetTutorialRevealed;if n~=proof.last then for i=proof.last+1,n do proof.order=proof.order..i end;proof.last=n end;for i=1,7 do local e=P:GetPetTutorialSequence(i);if e.Enable~=(i<=n) then proof.valid=false end end;if n==7 and P:GetPetTutorialSequence(7).CanvasGroupComponent.GroupAlpha>=0.999 then proof.complete=true;_TimerService:ClearTimer(timer)end end,0.01,0.01);local result={observing=true}''')
 position=proofs['house-open'];click(position['x'],position['y'])
 r=run('opened-by-mouse',state());assert r['open']and r['house']and r['root']
 run('blocked-care','''local P=_PetHouseUI;local pending=P.PendingAction;local selected=P.SelectedPetIndex;P.PetPanel:GetChildByName("feed"):SendEvent(ButtonClickEvent());P:MovePet(1);P:OpenStatPopup();local result={pendingSame=P.PendingAction==pending,selectionSame=P.SelectedPetIndex==selected,statsClosed=not P.StatPopup.Enable,guide=P.PetTutorialOpen}''')
 assert all(proofs['blocked-care'].values())
 r=wait_for('full-sequence','local result=_PetHouseUI._T.guideProof',lambda r:r['complete']);assert r['order']=='1234567'and r['valid']
 r=run('art-and-copy','''local P=_PetHouseUI;local rows={};for i=1,4 do local e=P.TutorialContent:GetChildByName("Step"..i);local t=e:GetChildByName("Label").TextGUIRendererComponent.Text;local image=e:GetChildByName("Img");local m=_CardManager:GetSpriteMetrics(image.SpriteGUIRendererComponent.ImageRUID.DataId);table.insert(rows,{step=i,visible=e.Enable,alpha=e.CanvasGroupComponent.GroupAlpha,loaded=m.w>0 and m.h>0,text=t,twoLines=string.find(t,string.char(10),1,true)~=nil})end;local native=P.TutorialContent:GetChildByName("Step2"):GetChildByName("Img"):GetChildByName("ActualScroll");local metrics=_CardManager:GetSpriteMetrics(native.SpriteGUIRendererComponent.ImageRUID.DataId);local result={rows=rows,scroll=native.SpriteGUIRendererComponent.ImageRUID.DataId,scrollLoaded=metrics.w>0 and metrics.h>0,scale=P.PetTutorialScale}''')
 assert all(row['visible']and row['alpha']==1 and row['loaded']and row['twoLines']and not row['text'].startswith('PET_GUIDE_')for row in r['rows'])
 assert r['scroll']=='52df3f22bb014921a232021a48a1279b'and r['scrollLoaded'];shot('pet-tutorial-applied.png')
 # A click on the artwork itself must reach the same full-screen close target.
 r=run('close-position','local P=_PetHouseUI;local e=P.TutorialContent:GetChildByName("Step1"):GetChildByName("Img");local p=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(0,0),e.UITransformComponent));local result={x=p.x,y=p.y}')
 click(r['x'],r['y']);r=run('closed-by-art-click',state());assert not r['open']and not r['root']and r['house']
 run('replay','_PetHouseUI.TutorialHelp:SendEvent(ButtonClickEvent());local result={open=_PetHouseUI.PetTutorialOpen,revealed=_PetHouseUI.PetTutorialRevealed}')
 assert proofs['replay']['open']and proofs['replay']['revealed']<=2
 r=run('house-exit','_PetHouseUI:Close();'+state());assert not r['open']and not r['house']and not r['root']
 run('closed-house-guard','_PetHouseUI.TutorialHelp:SendEvent(ButtonClickEvent());local result={closed=not _PetHouseUI.PetTutorialOpen and not _PetHouseUI.TutorialRoot.Enable}')
 assert proofs['closed-house-guard']['closed']
 # Narrower safe-area layout, measured using the real root, then restore it.
 run('fit-setup','''local P=_PetHouseUI;P:Open();P:OpenPetTutorial();P._T.guideCanvas=P.TutorialRoot.Parent.UITransformComponent.RectSize;P.TutorialRoot.Parent.UITransformComponent.RectSize=Vector2(1440,810);local result={saved=true}''')
 r=wait_for('fit-small','local P=_PetHouseUI;P:FitPetTutorial();local result={scale=P.PetTutorialScale,w=P.PetTutorialCanvasSize.x,h=P.PetTutorialCanvasSize.y}',lambda r:r['w']==1440 and r['h']==810)
 assert r['scale']>0 and r['scale']<=730/1040+.001
 run('restore-canvas','_PetHouseUI.TutorialRoot.Parent.UITransformComponent.RectSize=_PetHouseUI._T.guideCanvas;_PetHouseUI:FitPetTutorial();_PetHouseUI:Close();local result={restored=true}')
 # The guide can be reopened in an unowned-pet view without fabricating ownership.
 run('unowned-fixture','''for id,record in pairs(_PetLogic.States) do _PetLogic._T.guideOriginalUser=id;_PetLogic._T.guideOriginalRecord=record;local r=_PetLogic:ReadAccount(_PetLogic:SerializeAccount(record));r.test=true;r.dirty=false;r.responsePetId="5002617";r.pets["5002617"].Owned=false;_PetLogic.States[id]=r;_PetLogic:PushState(id,"","")end;local result={temporary=true}''','server_main')
 run('unowned-open','_TitleUI:ShowLobby();_PetHouseUI.SelectedPetIndex=1;_PetHouseUI:Open();_PetHouseUI:OpenPetTutorial();local result={opened=_PetHouseUI.PetTutorialOpen}')
 r=run('unowned-help','local result={open=_PetHouseUI.PetTutorialOpen,unowned=not _PetHouseUI:GetDisplayedPet().progress.Owned}');assert r['open']and r['unowned']
 run('restore-account','local id=_PetLogic._T.guideOriginalUser;_PetLogic.States[id]=_PetLogic._T.guideOriginalRecord;_PetLogic:PushState(id,"","");local result={restored=_PetLogic.States[id]==_PetLogic._T.guideOriginalRecord}','server_main')
 run('final-cleanup','_PetHouseUI:Close();_PetHouseUI._T.guideProof=nil;_PetHouseUI._T.guideCanvas=nil;local result={closed=not _PetHouseUI.PetTutorialOpen}')
 logs=s.call('maker_logs',{'kind':'normal'});errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=started];assert not errors,errors
 build=s.call('maker_logs',{'kind':'build'});assert not[x for x in build.get('logs',[])if x.get('logType')=='Error']
 report={'status':'passed','physicalHelpClick':True,'sequence':'1→arrow→2→arrow→3→arrow→4','orderedReveal':'1234567','picturesAndActualScrollLoaded':True,'localizedLineBreaks':True,'clickOnArtworkCloses':True,'careInputsBlocked':True,'replayRestartsSequence':True,'houseExitClearsGuide':True,'responsive1440x810Scale':proofs['fit-small']['scale'],'unownedPetsCanReadHelp':True,'accountRestored':True,'runtimeErrors':0,'buildErrors':0}
 (out/'runtime-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');(stage/'runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8');print('Tutorial physical input, timeline, images, layout and cleanup all passed.',flush=True)
finally:
 try:
  run('safe-close','local P=_PetHouseUI;if P._T.guideCanvas~=nil then P.TutorialRoot.Parent.UITransformComponent.RectSize=P._T.guideCanvas;P._T.guideCanvas=nil end;P:ClosePetTutorial();local result={closed=not P.PetTutorialOpen}')
  run('safe-restore','local L=_PetLogic;local id=L._T.guideOriginalUser;if id~=nil and L._T.guideOriginalRecord~=nil then L.States[id]=L._T.guideOriginalRecord;L:PushState(id,"","");L._T.guideOriginalUser=nil;L._T.guideOriginalRecord=nil end;local result={restored=true}',context='server_main')
 finally:s.close()
