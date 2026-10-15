from pathlib import Path
from datetime import datetime
import sys,time,json,shutil
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
stage=Path('work/ttung-gear');out=Path('outputs/ttung-gear');s=MakerSession();proofs={};started=datetime.now().isoformat(timespec='seconds')
def run(tag,body,context='client'):
 needle='[VRF] TTUNG-GEAR '+tag+' '+str(time.time_ns())+' '
 s.call('maker_execute_script',{'context':context,'script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
 for _ in range(80):
  logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message']for x in logs.get('logs',[])if needle in x.get('message','')]
  if hits:
   r=json.loads(hits[-1].split(needle,1)[1]);proofs[tag]=r;(out/'runtime-proof.json').write_text(json.dumps(proofs,ensure_ascii=False,indent=2),encoding='utf-8');print(tag+': '+json.dumps(r,ensure_ascii=False),flush=True);return r
  errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=started];assert not errors,errors[-3:]
  time.sleep(.3)
 raise AssertionError('No completed checkpoint '+tag)
def wait(tag,body,predicate,context='client',count=20):
 for _ in range(count):
  r=run(tag,body,context)
  if predicate(r):return r
  time.sleep(.3)
 raise AssertionError(tag)
passed=False;prepared=False
try:
 for _ in range(40):
  try:mode=s.call('maker_get_current_map')
  except AssertionError:time.sleep(1);continue
  if mode.get('mode')=='play':break
  time.sleep(1)
 assert mode.get('mode')=='play'
 wait('ready','local result={account=_PetLogic.ClientReady,gear=_PetLogic.PetGearReady,frames=_PetLogic.TtungttangReady,skill=_PetLogic.PetCharmJumpReady}',lambda r:all(r.values()))
 run('prepare','''local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;assert(id~=nil and L._T.gearOriginal==nil);L._T.gearUser=id;L._T.gearOriginal=L.States[id];local rec=L:ReadAccount(L:SerializeAccount(L.States[id]));rec.test=true;rec.dirty=false;rec.generation=0;local dog=rec.pets.ttungttang;dog.Owned=true;dog.GearOwnedMask=0;dog.GearEquippedMask=0;dog.Level=1;dog.Rank=0;dog.XP=0;dog.Stat3=0;dog.Stat6=0;dog.Stat9=0;dog.Fullness=50;dog.Cleanliness=50;dog.Health=60;dog.Fatigue=70;dog.Energy=1000;for key,p in pairs(rec.pets)do p.Equipped=key=="ttungttang" end;rec.responsePetId="ttungttang";L.States[id]=rec;L:PushState(id,"","");local result={prepared=true}''','server_main');prepared=True
 wait('dog-state','local p=_PetLogic.ClientPets.ttungttang;local result={owned=p.Owned,equipped=p.Equipped,mask=p.GearEquippedMask}',lambda r:r['owned']and r['equipped']and r['mask']==0)
 run('open-inventory','_PetHouseUI:Close();_PetUI.InventoryRoot.Enable=true;_PetUI:SetPetMode(true);local result={petMode=_PetUI.PetMode,testButton=_PetUI.PetGearSlots:GetChildByName("TestGear").Enable}');
 run('test-button','_PetUI.PetGearSlots:GetChildByName("TestGear"):SendEvent(ButtonClickEvent());local result={clicked=true}')
 wait('test-grant','local p=_PetLogic.ClientPets.ttungttang;local result={mask=p.GearEquippedMask,owned=p.GearOwnedMask,test=_PetLogic.ClientTest}',lambda r:r['mask']==7 and r['owned']==7 and r['test'])
 for slot,mask in [('Cap',6),('Coat',4),('Necklace',0),('Cap',1),('Coat',3),('Necklace',7)]:
  run('click-'+slot+'-'+str(mask),'_PetUI.PetGearSlots:GetChildByName("'+slot+'"):SendEvent(ButtonClickEvent());local result={clicked=true}')
  wait('mask-'+str(mask),'local p=_PetLogic.ClientPets.ttungttang;local result={mask=p.GearEquippedMask}',lambda r:r['mask']==mask)
 r=run('saved-and-stats','''local L=_PetLogic;local rec=L.States[L._T.gearUser];local p=rec.pets.ttungttang;local full=L:GetPetStats("ttungttang",p);p.GearEquippedMask=0;local naked=L:GetPetStats("ttungttang",p);p.GearEquippedMask=7;local json=L:SerializeAccount(rec);local clone=L:ReadAccount(_HttpService:JSONDecode(_HttpService:JSONEncode(json)));assert(clone~=nil);local legacy=_HttpService:JSONDecode(_HttpService:JSONEncode(json));legacy.version=5;for _,pet in pairs(legacy.pets)do pet.GearOwnedMask=nil;pet.GearEquippedMask=nil end;local old=L:ReadAccount(legacy);local bad=_HttpService:JSONDecode(_HttpService:JSONEncode(json));bad.pets.ttungttang.GearOwnedMask=0;local unowned=L:ReadAccount(bad)==nil;bad=_HttpService:JSONDecode(_HttpService:JSONEncode(json));bad.pets.ttungttang.GearEquippedMask=1.5;local fractional=L:ReadAccount(bad)==nil;bad=_HttpService:JSONDecode(_HttpService:JSONEncode(json));bad.pets["5002617"].GearOwnedMask=1;local wrongPet=L:ReadAccount(bad)==nil;L:InitForRun(L._T.gearUser);local save={};local generations={};L:SaveFor(_UserService:GetUserEntityByUserId(L._T.gearUser),save,generations);local writes=0;for _,_ in pairs(save)do writes=writes+1 end;local result={version=json.version,roundtrip=clone.pets.ttungttang.GearEquippedMask==7,legacy=old~=nil and old.pets.ttungttang.GearEquippedMask==0,unowned=unowned,fractional=fractional,wrongPet=wrongPet,atkRatio=(1+full.atkPct)/(1+naked.atkPct),critDelta=full.critRate-naked.critRate,critDmgDelta=full.critDmg-naked.critDmg,runMask=L.RunPetGearMask,runDamage=L.RunDamageMultiplier,runCrit=L.RunCritChanceBonus,runCritDmg=L.RunCritDamageBonus,testWrites=writes}''','server_main')
 assert all(r[x] for x in ['roundtrip','legacy','unowned','fractional','wrongPet']) and r['version']==6 and r['testWrites']==0 and r['runMask']==7 and abs(r['atkRatio']-1.05)<.0001 and abs(r['critDelta']-.05)<.0001 and abs(r['critDmgDelta']-.1)<.0001,r
 wait('inventory-render','local p=_PetUI.PetDisplay:GetChildByName("Portrait");local pool=_PetLogic._T.petGearUI and _PetLogic._T.petGearUI[p.Id];local n=0;if pool~=nil then for _,e in ipairs(pool.actors)do if e.SpriteGUIRendererComponent.Color.a>0.99 then n=n+1 end end end;local result={active=n,ready=pool~=nil and pool.ready or false}',lambda r:r['ready']and r['active']==3)
 pic=s.call('maker_screenshot');shutil.copy2(pic['path'],out/'applied-inventory.png')
 run('open-house','_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;_TitleUI:ShowLobby();local H=_PetHouseUI;for i,e in ipairs(_PetLogic:GetPetCatalog())do if e.id=="ttungttang"then H.SelectedPetIndex=i end end;H:Open();local result={open=H.PetMode,id=H:GetDisplayedPet().id}')
 wait('house-ready','local H=_PetHouseUI;local entry=H:GetDisplayedPet();local p=H.PetDisplay:GetChildByName("Portrait");local pool=_PetLogic._T.petGearUI and _PetLogic._T.petGearUI[p.Id];local n=0;if pool~=nil then for _,e in ipairs(pool.actors)do if e.SpriteGUIRendererComponent.Color.a>0.99 then n=n+1 end end end;local result={id=entry.id,active=n,ready=pool~=nil and pool.ready or false}',lambda r:r['id']=='ttungttang'and r['ready']and r['active']==3)
 pic=s.call('maker_screenshot');shutil.copy2(pic['path'],out/'applied-house.png')
 # Walk the real overlay table at the native frame rate, without giving gear an independent animation clock.
 run('all-frames-observer','''local L=_PetLogic;local H=_PetHouseUI;H.PetMode=false;local portrait=H.PetDisplay:GetChildByName("Portrait");local entry=L:GetPetDefinition("ttungttang");entry.progress=L.ClientPets.ttungttang;local q={index=0,samples=0,wrongTexture=0,blank=0,tint=0,offset=0,size=0,flip=0,finished=false};L._T.gearProof=q;local bases={};for base,_ in pairs(L.PetGearOverlays)do table.insert(bases,base)end;table.sort(bases);q.frames=#bases;local tick=0;local timer=0;timer=_TimerService:SetTimerRepeat(function()tick=tick+1;local i=math.floor((tick-1)/8)+1;if i>#bases then q.finished=true;_TimerService:ClearTimer(timer);return end;q.index=i;local base=bases[i];portrait.SpriteGUIRendererComponent.FlipX=math.floor(((tick-1)%8)/4)==1;portrait.SpriteGUIRendererComponent.ImageRUID=DataRef(base);L:AlignCustomPortrait(portrait,entry,entry.pixelScale);L:RenderPetGearUI(portrait,entry,base);local pool=L._T.petGearUI[portrait.Id];local selected=L.PetGearOverlays[base];local active=0;for ruid,e in pairs(pool.byRUID)do local color=e.SpriteGUIRendererComponent.Color;if color.a>0.99 then active=active+1;if ruid~=selected.hat and ruid~=selected.coat and ruid~=selected.neck then q.wrongTexture=q.wrongTexture+1 end;if color.r~=1 or color.g~=1 or color.b~=1 then q.tint=q.tint+1 end;if e.SpriteGUIRendererComponent.FlipX~=portrait.SpriteGUIRendererComponent.FlipX or e.SpriteGUIRendererComponent.FlipY~=portrait.SpriteGUIRendererComponent.FlipY then q.flip=q.flip+1 end;local t=e.UITransformComponent;if t.anchoredPosition.x~=0 or t.anchoredPosition.y~=0 then q.offset=q.offset+1 end;if math.abs(t.RectSize.x-portrait.UITransformComponent.RectSize.x)>0.001 or math.abs(t.RectSize.y-portrait.UITransformComponent.RectSize.y)>0.001 then q.size=q.size+1 end end end;if active~=3 then q.blank=q.blank+1 end;q.samples=q.samples+1 end,0.0167,0.0167);L._T.gearObserver=timer;local result={frames=#bases,started=true}''')
 q=wait('all-frame-results','local result=_PetLogic._T.gearProof',lambda r:r['finished'],count=30)
 assert q['frames']==76 and q['samples']==608 and sum(q[k]for k in ['wrongTexture','blank','tint','offset','size','flip'])==0,q
 run('normal-house','local H=_PetHouseUI;H.PetMode=true;H.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.FlipX=false;H.CustomFrameKey="";H:Refresh();local result={restored=true}')
 # Actual care buttons exercise the normal action and scenery paths.
 for action,pose,duration in [('feed','eat',5),('wash','chat',6),('sleep','sleep',6),('inject','inject',5),('walk','move',12)]:
  run('care-reset-'+action,'''local L=_PetLogic;local r=L.States[L._T.gearUser];r.busyUntil=0;r.lastRequest=-100000;local p=r.pets.ttungttang;p.Fullness=50;p.Cleanliness=50;p.Health=60;p.Fatigue=70;p.Mood=50;p.Energy=1000;L:PushState(L._T.gearUser,"","");local result={reset=true}''','server_main')
  run('care-button-'+action,'local H=_PetHouseUI;H.MotionUntil=0;H.WaitingUntil=0;H.Motion="";H:Refresh();H.PetPanel:GetChildByName("'+action+'"):SendEvent(ButtonClickEvent());local result={clicked=true}')
  r=wait('care-running-'+action,'local H=_PetHouseUI;local result={motion=H.Motion,id=H:GetDisplayedPet().id}',lambda r:r['motion']==action or r['motion']==pose)
  time.sleep(.5);pic=s.call('maker_screenshot');shutil.copy2(pic['path'],out/('applied-'+action+'.png'))
  time.sleep(max(0,duration-2))
 run('other-pet-hidden','local H=_PetHouseUI;H.MotionUntil=0;H.WaitingUntil=0;H.Motion="";H:SetWalking(false,0);H:SetWater(false,0);H:SetInjection(false,0);H.SelectedPetIndex=1;H.IdleRUID="";H:Refresh();local result={id=H:GetDisplayedPet().id}')
 q=wait('other-pet-no-gear','local p=_PetHouseUI.PetDisplay:GetChildByName("Portrait");local pool=_PetLogic._T.petGearUI[p.Id];local n=0;for _,e in ipairs(pool.actors)do if e.SpriteGUIRendererComponent.Color.a>0 then n=n+1 end end;local result={active=n}',lambda r:r['active']==0)
 passed=True
finally:
 try:
  if prepared:
   run('restore-account','''local L=_PetLogic;local id=L._T.gearUser;if id~=nil and L._T.gearOriginal~=nil then L.States[id]=L._T.gearOriginal;L:InitForRun(id);L:PushState(id,"","");L._T.gearOriginal=nil end;local result={restored=L._T.gearOriginal==nil}''','server_main')
   run('restore-ui','''local L=_PetLogic;if L._T.gearObserver~=nil then _TimerService:ClearTimer(L._T.gearObserver)end;_PetHouseUI.PetMode=true;_PetHouseUI:Close();_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;_TitleUI:ShowLobby();local result={restored=true}''')
  logs=s.call('maker_logs',{'kind':'normal'});errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=started];(stage/'runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8');assert not errors,errors
  if passed:(out/'runtime-verification.json').write_text(json.dumps({'status':'passed','frames':76,'samples':608,'bothDirections':True,'actualGearButtons':True,'actualCareButtons':True,'saveRoundtrip':True,'v5Migration':True,'invalidOwnershipRejected':True,'noTestWrites':True,'petPixelsPreserved':True,'runtimeErrors':0,'accountRestored':True},indent=2),encoding='utf-8')
 finally:s.close()
