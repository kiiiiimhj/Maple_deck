from runtime_common import *
server='server_main';passed=False
try:
 mode=s.call('maker_get_current_map')
 if mode.get('mode')=='edit':
  (stage/'runtime-start.json').write_text(json.dumps({'start':datetime.now().isoformat(timespec='seconds')}),encoding='utf-8');print('Play:',s.call('maker_play'),flush=True)
  for _ in range(30):
   time.sleep(.8)
   try:mode=s.call('maker_get_current_map')
   except AssertionError:continue
   if mode.get('mode')=='play':break
 assert mode.get('mode')=='play',mode
 wait_for('ready','local result={account=_PetLogic.ClientReady,art=_PetLogic.OduckReady,pool=_PetHouseUI.OduckPoolReady}',lambda r:all(r.values()))
 run('temporary-account','''local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;assert(id~=nil);assert(L._T.poolVerifyOriginal==nil);L._T.poolVerifyUser=id;L._T.poolVerifyOriginal=L.States[id];local r=L:ReadAccount(L:SerializeAccount(L.States[id]));r.test=true;r.dirty=false;r.generation=0;r.lastRequest=-100;r.busyUntil=0;r.responsePetId="oduck";r.pets.oduck.Owned=true;r.pets.oduck.Fullness=45;r.pets.oduck.Fatigue=0;for key,p in pairs(r.pets)do p.Equipped=key=="oduck" end;L.States[id]=r;L:PushState(id,"","");local result={temporary=true}''',server)
 wait_for('client-state','local result={owned=_PetLogic:GetPetCatalog()[5].progress.Owned}',lambda r:r['owned'])
 run('open-oduck','_TitleUI:ShowLobby();local P=_PetHouseUI;P:ClosePetTutorial();P:Open();P.SelectedPetIndex=5;P:Refresh();local result={id=P:GetDisplayedPet().id,open=P.PetMode}')
 run('capture-clock','''local P=_PetHouseUI;P._T.poolCaptureClock=_TimerService:SetTimerRepeat(function()if P.Motion=="feed"then P.MotionStart=_UtilLogic.ElapsedSeconds-1;P.MotionUntil=_UtilLogic.ElapsedSeconds+10 end end,0.01,0.01);local result={armed=true}''')
 run('feed-click','_PetHouseUI.PetPanel:GetChildByName("feed"):SendEvent(ButtonClickEvent());local result={requested=true}')
 wait_for('native-feed','local P=_PetHouseUI;local result={motion=P.Motion,back=P.OduckPoolBack.Enable,front=P.OduckPoolFront.Enable,ruid=P.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.ImageRUID.DataId}',lambda r:r['motion']=='feed'and r['back']and r['front'])
 shot('oduck-drinking-pool.png')
 r=run('pool-layout','''local P=_PetHouseUI;local a=P.OduckPoolBack;local b=P.OduckPoolFront;local p=P.PetDisplay:GetChildByName("Portrait");local t=a.UITransformComponent;local f=b.UITransformComponent;local result={back=a.Enable,front=b.Enable,backIndex=_UILogic:GetSiblingIndex(t),portraitIndex=_UILogic:GetSiblingIndex(p.UITransformComponent),frontIndex=_UILogic:GetSiblingIndex(f),samePosition=math.abs(t.anchoredPosition.x-f.anchoredPosition.x)<0.01 and math.abs(t.anchoredPosition.y-f.anchoredPosition.y)<0.01,sameSize=math.abs(t.RectSize.x-f.RectSize.x)<0.01,foregroundCrop=b.SpriteGUIRendererComponent.FillAmount,foregroundVertical=b.SpriteGUIRendererComponent.FillMethod==FillMethodType.Vertical,raycasts=a.SpriteGUIRendererComponent.RaycastTarget or b.SpriteGUIRendererComponent.RaycastTarget,native=p.SpriteGUIRendererComponent.ImageRUID.DataId,width=t.RectSize.x,x=t.anchoredPosition.x,y=t.anchoredPosition.y}''')
 assert r['back']and r['front']and r['backIndex']<r['portraitIndex']<r['frontIndex']and r['samePosition']and r['sameSize']and not r['raycasts']and abs(r['foregroundCrop']-.26)<.0001 and r['foregroundVertical']and r['native']=='1b43a3d250c64656be66bc04a9887fa5',r
 run('release-capture-clock','''local P=_PetHouseUI;_TimerService:ClearTimer(P._T.poolCaptureClock);P._T.poolCaptureClock=nil;P.MotionStart=_UtilLogic.ElapsedSeconds-3.81;P.MotionUntil=_UtilLogic.ElapsedSeconds-0.01;local result={released=true}''')
 wait_for('feed-finished','local P=_PetHouseUI;local result={done=P.Motion=="",back=P.OduckPoolBack.Enable,front=P.OduckPoolFront.Enable}',lambda r:r['done']and not r['back']and not r['front'])
 r=run('other-pet-guard','''local P=_PetHouseUI;P.SelectedPetIndex=3;P:Refresh();P:SetFeedingMotion(true,1);local e=P:GetDisplayedPet();local result={id=e.id,noPool=not P.OduckPoolBack.Enable and not P.OduckPoolFront.Enable,foxBowl=P.DuckyFoodBowl.Enable};P:SetFeedingMotion(false,0);P.SelectedPetIndex=5;P:Refresh()''')
 assert r['id']=='5000498'and r['noPool']and r['foxBowl'],r
 r=run('close-hides-pool','''local P=_PetHouseUI;P:SetFeedingMotion(true,1);local shown=P.OduckPoolBack.Enable and P.OduckPoolFront.Enable;P:Close();local result={shown=shown,closed=not P.PetMode,hidden=not P.OduckPoolBack.Enable and not P.OduckPoolFront.Enable}''')
 assert all(r.values()),r
 r=run('skill-popup-icon','''local P=_PetHouseUI;P:Open();P.SelectedPetIndex=5;P:Refresh();P:OpenStatPopup();local info=_PetLogic:GetPetSkillInfo("oduck");local result={icon=info.icon,opened=P.StatPopup.Enable};P:CloseStatPopup()''')
 assert r['icon']=='677f5254aa164504941a1e44a27e8e5b'and r['opened'],r
 passed=True;print('Pool drink integration, layering, native motion, lifecycle and fox bowl guard passed.',flush=True)
finally:
 try:
  run('restore-care-account','''local L=_PetLogic;local id=L._T.poolVerifyUser;if id~=nil and L._T.poolVerifyOriginal~=nil then L.States[id]=L._T.poolVerifyOriginal;L:PushState(id,"","");L._T.poolVerifyOriginal=nil end;local result={restored=L._T.poolVerifyOriginal==nil}''',server)
  run('close-care-house','local P=_PetHouseUI;if P._T.poolCaptureClock~=nil then _TimerService:ClearTimer(P._T.poolCaptureClock);P._T.poolCaptureClock=nil end;P:Close();local result={closed=true}')
 finally:s.close()
