from pathlib import Path
from datetime import datetime
from PIL import Image,ImageDraw,ImageFont
import json,time,sys,shutil
from runtime_common import s,run,wait,preserve,setup,restore,out
started=datetime.now().isoformat(timespec='seconds');prepared=False;proof={};captures=[]
def check(tag,body,context='client'):
 value=run(tag,body,context);proof[tag]=value
 (out/'runtime-proof.json').write_text(json.dumps(proof,indent=2),encoding='utf-8');return value
def open_pet(index,pet):
 run('close','_PetHouseUI:Close();local result={closed=true}')
 setup(pet)
 run('open','_TitleUI:ShowLobby();local H=_PetHouseUI;H.SelectedPetIndex='+str(index)+';H:Open();local result={opened=true}')
 wait('pool','local H=_PetHouseUI;local q=(_PetLogic._T.nativePetGearUI or {})[H.PetDisplay:GetChildByName("Portrait").Id];local result={ready=q~=nil and q.ready or false,pet=q~=nil and q.petId or "",mask=q~=nil and q.mask or 0}',lambda r:r['ready']and r['pet']==pet and r['mask']==7)
def capture(name,seconds):
 frames=[];times=[];deadline=time.monotonic()+seconds
 while time.monotonic()<deadline:
  raw=s.call('maker_screenshot');im=Image.open(raw['path']).convert('RGB')
  assert im.size==(1868,1051)
  frames.append(im.crop((720,390,1200,750)));times.append(time.monotonic())
  if len(frames)==1:im.save(out/(name+'-full.png'))
  time.sleep(.10)
 assert len(frames)>1
 cols=min(4,len(frames));board=Image.new('RGB',(480*cols,360*((min(len(frames),20)+cols-1)//cols)))
 picks=[round(i*(len(frames)-1)/max(1,min(len(frames),20)-1))for i in range(min(len(frames),20))]
 for j,i in enumerate(picks):board.paste(frames[i],(j%cols*480,j//cols*360))
 board.save(out/(name+'-sequence.png'))
 paletteboard=Image.new('RGB',(480,360*len(frames)))
 for i,frame in enumerate(frames):paletteboard.paste(frame,(0,i*360))
 palette=paletteboard.quantize(colors=256)
 quantized=[im.quantize(palette=palette,dither=Image.Dither.NONE)for im in frames]
 durations=[max(40,round((times[i+1]-times[i])*1000))for i in range(len(frames)-1)];durations.append(durations[-1])
 quantized[0].save(out/(name+'.gif'),save_all=True,append_images=quantized[1:],duration=durations,loop=0,optimize=False,disposal=2)
 captures.append({'name':name,'frames':len(frames),'seconds':round(times[-1]-times[0],2)})
 print('Actual playback captured:',name,len(frames),'frames',flush=True)
try:
 wait('loaded','local H=_PetHouseUI;local result={ready=_PetLogic.ClientReady and _PetLogic.NativePetGearReady and H.DuckyBowlReady and H.SleepCushionReady and H.CareBackdropReady and H.WalkReady}',lambda r:r['ready'])
 preserve();prepared=True
 run('watch',Path('work/pet-gear-contours-v7/watch.lua').read_text(encoding='utf-8'))
 for index,pet in [(3,'5000498'),(5,'oduck'),(4,'landturtle'),(1,'5002617')]:
  open_pet(index,pet);capture('actual-'+pet+'-idle',1.6)
  for action in (['feed','wash','walk','sleep','inject']if pet=='5000498'else['wash','walk','sleep','inject']):
   open_pet(index,pet)
   check('request-'+pet+'-'+action,'local H=_PetHouseUI;H:RequestCare("'+action+'");local result={requested=H.PendingAction=="'+action+'"}')
   state=wait('care-begun','local H=_PetHouseUI;local result={action=H.Motion,elapsed=_UtilLogic.ElapsedSeconds-H.MotionStart,remaining=H.MotionUntil-_UtilLogic.ElapsedSeconds}',lambda r:r['action']==action)
   if action=='walk':run('force-discovery','local H=_PetHouseUI;H.WalkPlan={route=1,found=true,icon="",message="",revealed=false};local result={testDiscovery=true}')
   if action=='feed':
    bowl=check('actual-fox-bowl','local b=_PetHouseUI.DuckyFoodBowl;local result={entity=b.Enable,renderer=b.SpriteGUIRendererComponent.Enable,alpha=b.SpriteGUIRendererComponent.Color.a,ready=_PetHouseUI.DuckyBowlReady}')
    assert bowl['entity']and bowl['renderer']and bowl['alpha']>.9 and bowl['ready']
   capture('actual-'+pet+'-'+action,max(.8,state['remaining']-.1))
   wait('care-ended','local result={done=_PetHouseUI.MotionUntil==0}',lambda r:r['done'])
  print('Reviewed all requested live motions for',pet,flush=True)
 # All slot combinations and both facings still use one native frame clock.
 for index,pet in [(3,'5000498'),(5,'oduck'),(4,'landturtle'),(1,'5002617')]:
  open_pet(index,pet)
  run('all-frame-mask-check','local L=_PetLogic;local H=_PetHouseUI;H.Motion="qa";H.MotionUntil=_UtilLogic.ElapsedSeconds+60;H.NextRefresh=_UtilLogic.ElapsedSeconds+60;local e=H:GetDisplayedPet();local p=H.PetDisplay:GetChildByName("Portrait");p.SpriteGUIRendererComponent.PlayRate=0;local rows={};for ruid,_ in pairs(L.NativePetGearOverlays[e.id])do table.insert(rows,ruid)end;local q={frames=0,errors=0,done=false};L._T.motion8Frames=q;local i=0;local t=0;t=_TimerService:SetTimerRepeat(function()for batch=1,16 do i=i+1;local ruid=rows[math.floor((i-1)/16)+1];if ruid==nil then q.done=true;_TimerService:ClearTimer(t);return end;e.progress.GearEquippedMask=math.floor(((i-1)%16)/2);p.SpriteGUIRendererComponent.ImageRUID=DataRef(ruid);p.SpriteGUIRendererComponent.FlipX=i%2==0;L:RenderPetGearUI(p,e,ruid);local pool=L._T.nativePetGearUI[p.Id];local layers=L.NativePetGearOverlays[e.id][ruid];local exp={};if not(layers.coat~=nil and layers.coat.replacesBody==true and L:HasPetGearBit(e.progress.GearEquippedMask,2))then exp[ruid]=true end;for slot,layer in pairs(layers)do local bit=slot=="hat"and 1 or(slot=="coat"and 2 or 4);if L:HasPetGearBit(e.progress.GearEquippedMask,bit)then exp[layer.ruid]=true end end;local count=0;for id,a in pairs(pool.actors)do if a.SpriteGUIRendererComponent.Color.a>.99 then count=count+1;if not exp[id]or a.SpriteGUIRendererComponent.FlipX~=p.SpriteGUIRendererComponent.FlipX then q.errors=q.errors+1 end end end;local expected=0;for _,_ in pairs(exp)do expected=expected+1 end;if count~=expected or pool.base~=ruid or p.SpriteGUIRendererComponent.Enable then q.errors=q.errors+1 end;q.frames=q.frames+1 end end,.01,.01);L._T.motion8FrameTimer=t;local result={started=true}')
  report=wait('frames-done','local result=_PetLogic._T.motion8Frames',lambda r:r['done']);assert report['errors']==0
  proof['combinations-'+pet]=report
  run('end-frames','_PetHouseUI:Close();_PetHouseUI.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.FlipX=false;local result={closed=true}')
 watch=check('watch','local q=_PetLogic._T.v4Watch;local result={samples=q.samples,errors=q.errors,frameChanges=q.frameChanges}');assert watch['errors']==0 and watch['samples']>100
 errors=[r for r in s.call('maker_logs',{'kind':'normal'}).get('logs',[])if r.get('logType')=='Error'and r.get('dateTime','')>=started]
 assert not errors,errors[-2:]
 build=s.call('maker_logs',{'kind':'build'});assert not[r for r in build.get('logs',[])if r.get('logType')=='Error']
 report={'status':'passed','actualCareRequests':17,'continuousPlaybackClips':len(captures),'captures':captures,'frameAndIndependentMaskCases':sum(proof['combinations-'+pet]['frames']for pet in ['5000498','oduck','landturtle','5002617']),'flickerVisibilitySamples':watch['samples'],'visibilityErrors':0,'runtimeErrors':0,'buildErrors':0}
 (out/'runtime-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in report.items()if k!='captures'}),flush=True)
finally:
 try:
  run('cleanup','local L=_PetLogic;for _,t in ipairs({L._T.v4WatchTimer,L._T.motion8FrameTimer})do if t~=nil then _TimerService:ClearTimer(t)end end;local H=_PetHouseUI;H:Close();H.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.FlipX=false;H.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.PlayRate=1;local result={clean=true}')
  if prepared:restore()
 finally:s.close()
