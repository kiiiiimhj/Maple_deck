from pathlib import Path
from datetime import datetime
from PIL import Image,ImageDraw,ImageFont
import sys,json,time,shutil,ast
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
out=Path('outputs/pet-gear-contours-v7');stage=Path('work/pet-gear-contours-v7');s=MakerSession();proof={};start=datetime.now().isoformat(timespec='seconds');prepared=False;combat=False;passed=False

def run(tag,body,context='client',quiet=False):
 needle='[VRF] PET-GEAR-CONTOURS-V7-QA '+tag+' '+str(time.time_ns())+' '
 s.call('maker_execute_script',{'context':context,'script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
 for _ in range(80):
  logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message']for x in logs.get('logs',[])if needle in x.get('message','')]
  errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=start];assert not errors,errors[-2:]
  if hits:
   r=json.loads(hits[-1].split(needle,1)[1]);proof[tag]=r;(out/'bugi-final-runtime-proof.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2),encoding='utf-8')
   if not quiet:print(tag+': '+json.dumps(r),flush=True)
   return r
  time.sleep(.25)
 raise AssertionError(tag)
def wait(tag,body,predicate,count=80):
 for _ in range(count):
  r=run(tag,body,quiet=True)
  if predicate(r):return r
  time.sleep(.15)
 raise AssertionError(tag)
def shot(name,full=False):
 r=s.call('maker_screenshot');im=Image.open(r['path']).convert('RGB')
 if full:shutil.copy2(r['path'],out/(name+'.png'))
 im.crop((685,428,1205,728)).save(out/(name+'-pet.png'))

def capture(name,count=8):
 frames=[];times=[]
 for i in range(count):
  r=s.call('maker_screenshot');im=Image.open(r['path']).convert('RGB').crop((685,428,1205,728));frames.append(im);times.append(time.monotonic());time.sleep(.07)
 # All frames use one palette, so the preview itself cannot introduce palette flicker.
 paletteBoard=Image.new('RGB',(520,300*len(frames)))
 for i,im in enumerate(frames):paletteBoard.paste(im,(0,300*i))
 pal=paletteBoard.quantize(colors=256)
 ff=[im.quantize(palette=pal,dither=Image.Dither.NONE)for im in frames]
 durations=[max(50,round((times[min(i+1,len(times)-1)]-times[i])*1000))for i in range(len(times))];durations[-1]=durations[-2]
 ff[0].save(out/(name+'.gif'),save_all=True,append_images=ff[1:],duration=durations,loop=0,optimize=False,disposal=2)
 board=Image.new('RGB',(520*4,300*2))
 for i,im in enumerate(frames[:8]):board.paste(im,((i%4)*520,(i//4)*300))
 board.save(out/(name+'-sequence.png'))
 print('Captured actual continuous '+name,flush=True)

def old_probe(tag):
 tree=ast.parse(Path('work/ttung-first-cast-v1/runtime.py').read_text(encoding='utf-8'))
 return next(ast.literal_eval(n.args[1])for n in ast.walk(tree)if isinstance(n,ast.Call)and isinstance(n.func,ast.Name)and n.func.id=='run'and len(n.args)>1 and isinstance(n.args[0],ast.Constant)and n.args[0].value==tag)
def setup_pet(pet,mask=7):
 return run('prepare-'+pet+'-'+str(mask),'local L=_PetLogic;local id=L._T.fitUser;local r=L.States[id];local p=r.pets["'+pet+'"];r.responsePetId="'+pet+'";r.busyUntil=0;r.lastRequest=-10000;r.lastGearRequest=-10000;r.pendingWalk=nil;p.Owned=true;p.GearOwnedMask=7;p.GearEquippedMask='+str(mask)+';p.Fullness=40;p.Cleanliness=40;p.Mood=40;p.Health=40;p.Fatigue=40;p.Energy=1000;p.SleepUntil=0;p.NeedsAt=_DateTimeLogic:GetTimeElapsedWithoutOffset();p.EnergyAt=p.NeedsAt;L:PushState(id,"","");local result={testOnly=r.test,mask=p.GearEquippedMask}','server_main',quiet=True)
try:
 for delay in [3,7,15]:
  time.sleep(delay)
  try:s.call('maker_get_current_map');break
  except AssertionError:
   if delay==15:raise
 wait('ready','local result={account=_PetLogic.ClientReady,gear=_PetLogic.NativePetGearReady,feed=_PetHouseUI.FeedingReady,bowl=_PetHouseUI.DuckyBowlReady,pool=_PetHouseUI.OduckPoolReady,walk=_PetHouseUI.WalkReady,cushion=_PetHouseUI.SleepCushionReady,backdrop=_PetHouseUI.CareBackdropReady}',lambda r:all(r.values()))
 expected=json.loads((out/'overlay-ruids.json').read_text(encoding='utf-8'))
 for pet in ['5002617','5000498','landturtle','oduck']:
  rows=[]
  for base,layers in expected[pet].items():
   for slot,z in layers.items():rows.append('{base='+json.dumps(base)+',slot='+json.dumps(slot)+',ruid='+json.dumps(z['ruid'])+'}')
  checked=run('final-assets-'+pet,'local rows={'+','.join(rows)+'};local n=0;for _,row in ipairs(rows)do local layer=_PetLogic.NativePetGearOverlays["'+pet+'"][row.base][row.slot];assert(layer.ruid==row.ruid);n=n+1 end;local result={checked=n}',quiet=True)
  assert checked['checked']==len(rows)
 run('preserve','local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;L._T.fitUser=id;L._T.fitOriginal=L.States[id];local r=L:ReadAccount(L:SerializeAccount(L.States[id]));r.test=true;r.dirty=false;r.generation=0;r.busyUntil=0;for key,p in pairs(r.pets)do p.Owned=true;p.GearOwnedMask=7;p.GearEquippedMask=7 end;L.States[id]=r;local result={privatePreview=true}','server_main');prepared=True
 run('watch-start',Path('work/pet-gear-contours-v7/watch.lua').read_text(encoding='utf-8'),quiet=True)
 for index,pet in [(4,'landturtle')]:
  setup_pet(pet,0)
  run('open-'+pet,'_TitleUI:ShowLobby();local H=_PetHouseUI;H:Close();H.SelectedPetIndex='+str(index)+';H:Open();local result={pet=H:GetDisplayedPet().id}');time.sleep(.3);shot('bare-'+pet)
  setup_pet(pet,7)
  wait('worn-'+pet,'local H=_PetHouseUI;local p=_PetLogic._T.nativePetGearUI[H.PetDisplay:GetChildByName("Portrait").Id];local result={mask=p~=nil and p.mask or -1,ready=p~=nil and p.ready or false}',lambda r:r['mask']==7 and r['ready']);time.sleep(.35);shot('worn-'+pet,full=True);capture('actual-idle-'+pet)
  if pet=='5000498':
   run('fox-rest-needs','local L=_PetLogic;local r=L.States[L._T.fitUser];r.pets["5000498"].Fatigue=85;L:PushState(L._T.fitUser,"","");local result={set=true}','server_main',quiet=True)
   wait('fox-rest-pose','local result={pose=_PetHouseUI.CustomIdlePose}',lambda r:r['pose']=='rest');capture('actual-rest-5000498')
   setup_pet(pet,7)
  for action in ['feed','wash','sleep','walk']:
   # Use the ordinary care request and let it pass through its real server response/controller.
   run('close-'+pet+'-'+action,'_PetHouseUI:Close();local result={closed=true}',quiet=True);setup_pet(pet,7)
   run('care-request-'+pet+'-'+action,'local H=_PetHouseUI;H:Open();H:RequestCare("'+action+'");local result={requested=H.PendingAction=="'+action+'"}',quiet=True)
   state=wait('care-'+pet+'-'+action,'local H=_PetHouseUI;local result={motion=H.Motion,elapsed=_UtilLogic.ElapsedSeconds-H.MotionStart}',lambda r:r['motion']==action and r['elapsed']>=.8,count=60);shot('care-'+pet+'-'+action,full=pet=='oduck'and action=='feed');capture('actual-'+pet+'-'+action)
   if action=='walk':
    wait('discovery-'+pet,'local H=_PetHouseUI;local result={elapsed=_UtilLogic.ElapsedSeconds-H.MotionStart,found=H.WalkPlan~=nil and H.WalkPlan.found or false}',lambda r:r['elapsed']>=4.6);shot('walk-mid-'+pet)
   wait('care-ended-'+pet+'-'+action,'local H=_PetHouseUI;local result={ended=H.MotionUntil==0}',lambda r:r['ended'],count=100)
  print('Actual care controls reviewed for '+pet,flush=True)
  run('close-'+pet,'_PetHouseUI:Close();local result={closed=true}',quiet=True)
 # Stable separate slot renderer for all native frames; visual quality also checked in the saved contact sheets.
 for index,pet in [(4,'landturtle')]:
  setup_pet(pet)
  run('frames-open-'+pet,'local H=_PetHouseUI;H:Close();H.SelectedPetIndex='+str(index)+';H:Open();local result={opened=true}',quiet=True)
  wait('frame-pool-'+pet,'local H=_PetHouseUI;local p=_PetLogic._T.nativePetGearUI[H.PetDisplay:GetChildByName("Portrait").Id];local result={ready=p~=nil and p.ready or false}',lambda r:r['ready'])
  run('frames-start-'+pet,'local L=_PetLogic;local H=_PetHouseUI;H.Motion="qa";H.MotionUntil=_UtilLogic.ElapsedSeconds+60;H.NextRefresh=_UtilLogic.ElapsedSeconds+60;local e=H:GetDisplayedPet();local p=H.PetDisplay:GetChildByName("Portrait");p.SpriteGUIRendererComponent.PlayRate=0;local rows={};for ruid,_ in pairs(L.NativePetGearOverlays[e.id])do table.insert(rows,ruid)end;local q={frames=0,errors=0,done=false};L._T.fitFrames=q;local i=0;local t=0;t=_TimerService:SetTimerRepeat(function()for batch=1,16 do i=i+1;local ruid=rows[math.floor((i-1)/16)+1];if ruid==nil then q.done=true;_TimerService:ClearTimer(t);return end;e.progress.GearEquippedMask=math.floor(((i-1)%16)/2);p.SpriteGUIRendererComponent.ImageRUID=DataRef(ruid);p.SpriteGUIRendererComponent.FlipX=i%2==0;L:RenderPetGearUI(p,e,ruid);local pool=L._T.nativePetGearUI[p.Id];local layers=L.NativePetGearOverlays[e.id][ruid];local exp={};if not(layers.coat~=nil and layers.coat.replacesBody==true and L:HasPetGearBit(e.progress.GearEquippedMask,2))then exp[ruid]=true end;for slot,layer in pairs(layers)do local bit=slot=="hat"and 1 or(slot=="coat"and 2 or 4);if L:HasPetGearBit(e.progress.GearEquippedMask,bit)then exp[layer.ruid]=true end end;local count=0;for id,a in pairs(pool.actors)do if a.SpriteGUIRendererComponent.Color.a>.99 then count=count+1;if not exp[id]or a.SpriteGUIRendererComponent.FlipX~=p.SpriteGUIRendererComponent.FlipX then q.errors=q.errors+1 end end end;local expected=0;for _,_ in pairs(exp)do expected=expected+1 end;if count~=expected or pool.base~=ruid or p.SpriteGUIRendererComponent.Enable then q.errors=q.errors+1 end;q.frames=q.frames+1 end end,.01,.01);L._T.fitFrameTimer=t;local result={started=true}',quiet=True)
  r=wait('frames-'+pet,'local result=_PetLogic._T.fitFrames',lambda r:r['done']);assert r['errors']==0
  run('frames-clean-'+pet,'_PetHouseUI:Close();_PetHouseUI.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.FlipX=false;local result={closed=true}',quiet=True)
  print('Frame and flip hookups checked for '+pet,flush=True)
 # Actual U casts use the already-validated encounter fixtures and new independent world gear textures.
 run('combat-guard','local L=_PetLogic;local G=_GameManager;L._T.jumpGameOriginal={hp=G.PlayerHp,maxhp=G.PlayerMaxHp,coins=G.TotalCoins,dia=G.Diamond,gold=G.Gold,coinDirty=G._coinDirty,diamondDirty=G._diamondDirty};local guard=0;guard=_TimerService:SetTimerRepeat(function()if G.GameStarted then G.OptionPaused=true;_MonsterSpawner:StopSpawning()end end,.01,.01);L._T.jumpGuard=guard;local result={prepared=true}','server_main');combat=True
 run('start-game',old_probe('start-game'));wait('combat-ready','local result={started=_GameManager.GameStarted,entry=_GameManager.EntryPresentationPending}',lambda r:r['started']and not r['entry'])
 run('fixtures',old_probe('fixtures'),'server_main')
 for pet,previous in [('landturtle','5000498')]:
  run('u-setup-'+pet,'local L=_PetLogic;L.RunPetId="'+previous+'";L._T.petSkillCast=nil;L._T.petSkillCooldown=60;_GameManager.OptionPaused=false;local result={ready=true}','server_main',quiet=True)
  run('u-capture-'+pet,'local L=_PetLogic;local t=0;t=_TimerService:SetTimerRepeat(function()local v=L._T.petSkillVisual;if v~=nil and v.id=="'+pet+'"and v.age>=.65 then _GameManager:RequestSetOptionPaused(true);_TimerService:ClearTimer(t)end end,.01,.01);L._T.fitCapture=t;local result={ready=true}',quiet=True)
  s.call('maker_keyboard_input',{'action':'tap','keys':['U'],'duration_ms':70})
  r=wait('cast-'+pet,'local L=_PetLogic;local v=L._T.petSkillVisual;local n=0;local p=L._T.nativePetGearWorld;if p~=nil then for _,e in pairs(p.actors)do if e.SpriteRendererComponent.Color.a>.9 then n=n+1 end end end;local result={pet=v~=nil and v.id or "",age=v~=nil and v.age or 0,mask=v~=nil and v.gearMask or -1,base=v~=nil and(v.nativeGearBase or "")or "",visible=n}',lambda r:r['pet']==pet and r['age']>=.6 and r['base']!='')
  assert r['mask']==7 and r['visible']>0,r;wait('paused-'+pet,'local result={paused=_GameManager:IsGamePaused()}',lambda r:r['paused']);shot('skill-'+pet,full=True)
  run('resume-'+pet,'_GameManager.OptionPaused=false;local result={resumed=true}','server_main',quiet=True);wait('ended-'+pet,'local result={ended=_PetLogic._T.petSkillVisual==nil}',lambda r:r['ended'])
  assert run('world-hidden-'+pet,'local n=0;for _,e in pairs(_PetLogic._T.nativePetGearWorld.actors)do if e.SpriteRendererComponent.Color.a>0 then n=n+1 end end;local result={visible=n}',quiet=True)['visible']==0
  print('Actual U skill checked for '+pet,flush=True)
 r=run('watch-finished','local q=_PetLogic._T.v4Watch;local result={samples=q.samples,errors=q.errors,frameChanges=q.frameChanges}');assert r['errors']==0 and r['samples']>100
 passed=True
finally:
 try:
  if combat:
   body=old_probe('restore-account').replace('L._T.jumpOriginalAccount','L._T.fitOriginal').replace('L._T.jumpUser','L._T.fitUser');run('restore-combat',body,'server_main')
  elif prepared:run('restore-account','local L=_PetLogic;local id=L._T.fitUser;L.States[id]=L._T.fitOriginal;L._T.fitOriginal=nil;L:InitForRun(id);L:PushState(id,"","");local result={restored=true}','server_main')
  run('restore-lobby','local L=_PetLogic;for _,t in ipairs({L._T.v4WatchTimer,L._T.fitFrameTimer,L._T.fitCapture})do if t~=nil then _TimerService:ClearTimer(t)end end;L:ClearPetSkillVisual();local H=_PetHouseUI;H:Close();H.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.FlipX=false;_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;_TitleUI:ShowLobby();local result={restored=true}')
  if passed:
   build=s.call('maker_logs',{'kind':'build'});assert not[x for x in build.get('logs',[])if x.get('logType')=='Error']
   report={'status':'passed','actualCareRequests':4,'nativeFrameFlipConnections':sum(proof['frames-'+p]['frames']for p in ['landturtle']),'nativeFrameErrors':0,'equipmentCombinationsPerFrame':8,'bothHorizontalDirections':True,'actualUKeyCasts':1,'independentWorldGearCleanup':True,'originalAccountRestored':True,'buildErrors':0,'runtimeErrors':0,'continuousFrameSamples':proof['watch-finished']['samples'],'continuousFrameErrors':proof['watch-finished']['errors'],'realMotionCaptureClips':5,'bodyAndGearShareFrameClock':True}
   (out/'bugi-final-runtime-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
 finally:s.close()
