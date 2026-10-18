from runtime_common import *
from PIL import Image,ImageDraw
prepared=False;proof={};started=datetime.now().isoformat(timespec='seconds')
def capture(tag,seconds):
 frames=[];deadline=time.monotonic()+seconds
 while time.monotonic()<deadline:
  im=Image.open(s.call('maker_screenshot')['path']).convert('RGB');frames.append(im.crop((650,400,1230,750)));time.sleep(.07)
 if not frames:raise AssertionError(tag)
 picks=[round(i*(len(frames)-1)/max(1,min(8,len(frames))-1))for i in range(min(8,len(frames)))];board=Image.new('RGB',(580*4,350*math.ceil(len(picks)/4)))
 for i,j in enumerate(picks):board.paste(frames[j],(i%4*580,i//4*350))
 board.save(out/(tag+'-playback.png'));return len(frames)
import math
try:
 preserve();prepared=True
 run('observe','''local L=_PetLogic;L._T.native11Watch={samples=0,errors=0,changes=0,walkPhases={}};local timer=0;timer=_TimerService:SetTimerRepeat(function()local H=_PetHouseUI;if not H.PetMode or not H.Overlay.Enable then return end;local p=H.PetDisplay:GetChildByName("Portrait");local q=(L._T.nativePetGearUI or{})[p.Id];if q==nil or not q.ready then return end;local w=L._T.native11Watch;w.samples=w.samples+1;local r=q.frame.SpriteGUIRendererComponent;if p.SpriteGUIRendererComponent.Enable or not q.frame.Enable or not r.Enable or r.Color.a<.99 then w.errors=w.errors+1 end;if w.pet==q.petId and w.code==q.code and w.ruid~=q.ruid then w.errors=w.errors+1 end;if w.base~=q.base then w.changes=w.changes+1 end;w.base=q.base;w.pet=q.petId;w.code=q.code;w.ruid=q.ruid;if H.Motion=="walk"then w.walkPhases[tostring(H.WalkPhase)]=true end end,.01,.01);L._T.native11WatchTimer=timer;local result={observing=true}''')
 for index,pet in [(1,'5002617'),(3,'5000498'),(4,'landturtle'),(5,'oduck')]:
  open_pet(pet,index);proof[pet+'-idle']=capture(pet+'-idle',1.5)
  for action in ['feed','wash','walk','sleep','inject']:
   open_pet(pet,index);run('care','_PetHouseUI:RequestCare("'+action+'");local result={requested=true}')
   state=wait('care-start','local H=_PetHouseUI;local result={motion=H.Motion,remaining=H.MotionUntil-_UtilLogic.ElapsedSeconds}',lambda r:r['motion']==action)
   if action=='walk':run('find','_PetHouseUI.WalkPlan={route=1,found=true,icon="",message="",revealed=false};local result={set=true}')
   if action=='feed'and pet=='5000498':
    bowl=run('fox-bowl','local H=_PetHouseUI;local b=H.DuckyFoodBowl;local result={visible=b.Enable and b.SpriteGUIRendererComponent.Enable and b.SpriteGUIRendererComponent.Color.a>.99,ready=H.DuckyBowlReady}')
    assert bowl['visible']and bowl['ready'],bowl;proof['fox-bowl']=bowl
   proof[pet+'-'+action]=capture(pet+'-'+action,max(.6,state['remaining']-.05))
   wait('care-end','local result={done=_PetHouseUI.MotionUntil==0}',lambda r:r['done'])
   print('Actual care playback:',pet,action,proof[pet+'-'+action],flush=True)
 proof['watch']=run('watch','local result=_PetLogic._T.native11Watch');assert proof['watch']['errors']==0,proof['watch']
 e=errors(started);assert not e,e[-2:]
 proof.update(status='passed',runtimeErrors=0,actualCareActions=20,atomicBodyAndEquipment=True)
 (out/'runtime-verification.json').write_text(json.dumps(proof,indent=2));print('All 20 actual care actions passed; watcher',proof['watch'],flush=True)
finally:
 try:
  run('cleanup','local L=_PetLogic;if L._T.native11WatchTimer~=nil then _TimerService:ClearTimer(L._T.native11WatchTimer);L._T.native11WatchTimer=nil end;_PetHouseUI:Close();local result={closed=true}')
  if prepared:restore()
 finally:s.close()
