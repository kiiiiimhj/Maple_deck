from runtime_common import *
try:
 mode=s.call('maker_get_current_map');assert mode.get('mode')=='edit',mode
 (stage/'runtime-start.json').write_text(json.dumps({'start':datetime.now().isoformat(timespec='seconds')}),encoding='utf-8');print('Play:',s.call('maker_play'),flush=True)
 for _ in range(25):
  time.sleep(1)
  try:mode=s.call('maker_get_current_map')
  except AssertionError:continue
  if mode.get('mode')=='play':break
 assert mode.get('mode')=='play',mode
 wait_for('boot','local result={account=_PetLogic.ClientReady,art=_PetLogic.OduckReady}',lambda r:r['account']and r['art'])
 r=run('migration', '''local L=_PetLogic;local rec=L:ReadAccount(nil);rec.pet.Owned=true;rec.pet.Equipped=true;rec.pet.Level=7;rec.pet.XP=43;rec.pet.Stat3=2;rec.pet.Stones=37;rec.pet.HeartDayKey=20261013;rec.pet.HeartClaimedMask=3;rec.pets["5000498"].Owned=true;rec.pets["5000498"].Level=4;rec.pets.landturtle.Owned=true;rec.pets.landturtle.Level=6;local rows={};for v=2,5 do local data=L:SerializeAccount(rec);data.version=v;if v<5 then data.pets.oduck=nil end;if v<4 then data.pets.landturtle=nil end;if v<3 then data.pets["5000498"]=nil end;local r=L:ReadAccount(data);local eq=0;local count=0;if r~=nil then for _,p in pairs(r.pets)do count=count+1;if p.Equipped then eq=eq+1 end end end;table.insert(rows,{version=v,valid=r~=nil,count=count,old=r~=nil and r.pet.Level==7 and r.pet.XP==43 and r.pet.Stat3==2 and r.pet.Stones==37 and r.pet.HeartClaimedMask==3,fox=v<3 or r.pets["5000498"].Level==4,turtle=v<4 or r.pets.landturtle.Level==6,newLocked=r~=nil and not r.pets.oduck.Owned,oneEquipped=eq==1,migrated=r~=nil and r.dirty})end;local legacy=L:ReadAccount(rec.pet:Serialize());local bad=L:SerializeAccount(rec);bad.pets.oduck=nil;local missing=L:ReadAccount(bad)==nil;local future=L:SerializeAccount(rec);future.version=6;local p=PetProgress();p.Owned=true;p.Level=3;p.Stat3=5;local lines=L:GetPetStatLines("oduck",p);local result={rows=rows,v1=legacy~=nil and legacy.pet.Level==7 and legacy.pets.oduck~=nil,missingRejected=missing,futureRejected=L:ReadAccount(future)==nil,innate=L:GetBonusPercent("oduck",1,0),levelGrowth=L:GetBonusPercent("oduck",2,0),fourRows=#lines,unlock3=lines[2].unlocked and lines[2].kind==5,oldInitials={L:GetBonusPercent("5002617",1,0),L:GetBonusPercent("ttungttang",1,0),L:GetBonusPercent("5000498",1,0),L:GetBonusPercent("landturtle",1,0)}}''','server_main')
 assert all(x['valid']and x['count']==5 and x['old']and x['fox']and x['turtle']and x['newLocked']and x['oneEquipped']and x['migrated']==(x['version']<5)for x in r['rows'])
 assert r['v1']and r['missingRejected']and r['futureRejected']and r['innate']==1 and r['levelGrowth']>1 and r['fourRows']==4 and r['unlock3']and r['oldInitials']==[3,3,1,5]
 run('temporary-account','''local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;assert(id~=nil);L._T.oduckVerifyUser=id;L._T.oduckVerifyOriginal=L.States[id];local r=L:ReadAccount(L:SerializeAccount(L.States[id]));r.test=true;r.dirty=false;r.generation=0;r.lastRequest=-100;r.busyUntil=0;r.responsePetId="oduck";r.pets.oduck.Owned=false;L.States[id]=r;L:PushState(id,"","");local result={temporary=true}''','server_main')
 r=run('open-fifth','''_TitleUI:ShowLobby();local P=_PetHouseUI;P:ClosePetTutorial();P:Open();P.SelectedPetIndex=5;P:Refresh();local entries=_PetLogic:GetPetCatalog();local e=P:GetDisplayedPet();local result={count=#entries,id=e.id,name=_LocalizationService:GetText(e.nameKey),ready=e.ready,test=P.PetPanel:GetChildByName("test").Enable,prev=P.PetPanel:GetChildByName("PrevPet").ButtonComponent.Enable,next=P.PetPanel:GetChildByName("NextPet").ButtonComponent.Enable}''')
 assert r['count']==5 and r['id']=='oduck'and r['name']=='오덕'and r['ready']and r['test']and r['prev']and not r['next']
 run('hatch-click','local P=_PetHouseUI;P.PetPanel:GetChildByName("test"):SendEvent(ButtonClickEvent());local result={requested=true}')
 wait_for('hatched','local e=_PetHouseUI:GetDisplayedPet();local result={owned=e.progress.Owned,test=_PetLogic.ClientTest,id=e.id}',lambda r:r['owned']and r['test'])
 time.sleep(3)
 r=run('stat-popup','''local P=_PetHouseUI;P:OpenStatPopup();local w=P.StatPopup:GetChildByName("Window");local result={open=P.StatPopup.Enable,bonus=P.PetPanel:GetChildByName("Bonus").TextGUIRendererComponent.Text,name=w:GetChildByName("Row4"):GetChildByName("Name").TextGUIRendererComponent.Text,description=w:GetChildByName("SkillDescription").TextGUIRendererComponent.Text,attack=w:GetChildByName("Row0"):GetChildByName("Value").TextGUIRendererComponent.Text}''')
 assert r['open']and r['name']=='댄스 타임'and '1.00%' in r['bonus']and '20%'in r['description']and '30'in r['description'];shot('oduck-skill-details.png')
 run('close-stats','_PetHouseUI:CloseStatPopup();local result={closed=true}');shot('oduck-pet-house.png')
 for action,pose,duration in [('feed','eat',3.8),('wash','chat',4.5),('walk','move',12),('inject','inject',5.5),('sleep','sleep',6)]:
  run('care-arm-'+action,'''local L=_PetLogic;local r=L.States[L._T.oduckVerifyUser];r.lastRequest=-100;r.busyUntil=0;local result={ready=true}''','server_main')
  run('care-click-'+action,'_PetHouseUI.PetPanel:GetChildByName("'+action+'"):SendEvent(ButtonClickEvent());local result={clicked=true}')
  r=wait_for('care-motion-'+action,'local P=_PetHouseUI;local result={motion=P.Motion,ruid=P.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.ImageRUID.DataId,backdrop=P.SceneAction,cushion=isvalid(P.SleepCushion)and P.SleepCushion.Enable}',lambda r:r['motion']==action)
  if action=='inject':assert r['ruid']in ['9e1b9ed82ef842bdb93c408f7b03dabf','e8e7fbebf2b44e2c90da9f8c117ff086','9ac825fbe4284bdc973cc1ef1bf2d1a5']
  else:assert r['ruid']=={'eat':'1b43a3d250c64656be66bc04a9887fa5','chat':'67ec0d6dc67d4cb4a7be3a4604da544a','move':'d14e3254c4134f1eae318670d2167285','sleep':'e5125fa1d39941489c7301b56f2fad24'}[pose]
  if action=='sleep':assert r['cushion']
  time.sleep(duration+.3)
  wait_for('care-finished-'+action,'local result={done=_PetHouseUI.Motion==""}',lambda r:r['done'])
 print('Save migration, fixed stat, skill details and all five native care actions passed.',flush=True)
finally:s.close()
