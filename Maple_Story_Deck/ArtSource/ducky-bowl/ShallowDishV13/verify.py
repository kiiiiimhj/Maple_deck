from pathlib import Path
import sys,time,json
from PIL import Image
from datetime import datetime
sys.path.insert(0,str(Path('work/pet-equipment-native-v11').resolve()));import runtime_common as R
out=Path('outputs/ducky-bowl-fit-v13');prepared=False;reports=[];started=datetime.now().isoformat(timespec='seconds')
native=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());clip=next(c for c in native['clips']if c['petId']=='5000498'and c['pose']=='eat')
def gear(kind):
 R.setup('5000498',0 if kind=='original'else 10101)
 if kind=='bare':R.run('bare','local L=_PetLogic;local id=L._T.native11User;L.States[id].pets["5000498"].GearEquippedMask=0;L:PushState(id,"","");local result={ok=true}','server_main')
 R.wait('gear','local p=_PetHouseUI.PetDisplay:GetChildByName("Portrait");local q=_PetLogic._T.nativePetGearUI[p.Id];local result={code=q.code,ready=q.ready}',lambda r:r['ready']and r['code']=={'bare':0,'original':13,'variation':26}[kind])
def snap(name):
 im=Image.open(R.s.call('maker_screenshot')['path']).convert('RGB');im.save(out/(name+'-full.png'));return im.crop((775,490,1090,715))
try:
 R.preserve();prepared=True
 for kind in ['bare','original','variation']:
  R.open_pet('5000498',3);gear(kind)
  R.run('watch','''local L=_PetLogic;L._T.duckyBowlWatch={samples=0,frames={},errors=0};L._T.duckyBowlTimer=_TimerService:SetTimerRepeat(function()local H=_PetHouseUI;if H.Motion~="feed"then return end;local p=H.PetDisplay:GetChildByName("Portrait");local q=L._T.nativePetGearUI[p.Id];if q==nil or q.clip~=L.FoxMotions.eat then return end;local w=L._T.duckyBowlWatch;w.samples=w.samples+1;w.frames[q.base]=true;local b=H.DuckyFoodBowl;if not b.Enable or not b.SpriteGUIRendererComponent.Enable or p.SpriteGUIRendererComponent.Enable or not q.frame.Enable then w.errors=w.errors+1 end;local t=b.UITransformComponent;local scale=t.RectSize.x/128;local y=t.anchoredPosition.y-54*scale;if math.abs(y-H:GetPortraitY())>1.1 then w.errors=w.errors+1 end;if w.x~=nil and math.abs(t.anchoredPosition.x-w.x)>1.1 then w.errors=w.errors+1 end;w.x=t.anchoredPosition.x end,.01,.01);local result={ok=true}''')
  R.run('feed','_PetHouseUI:RequestCare("feed");local result={ok=true}');R.wait('start','local result={motion=_PetHouseUI.Motion}',lambda r:r['motion']=='feed')
  shots=[snap(kind+'-eating-'+str(i))for i in range(3)]
  R.wait('end','local result={motion=_PetHouseUI.Motion,bowl=_PetHouseUI.DuckyFoodBowl.Enable}',lambda r:r['motion']==''and not r['bowl'])
  report=R.run('watch-result','local L=_PetLogic;_TimerService:ClearTimer(L._T.duckyBowlTimer);L._T.duckyBowlTimer=nil;local result=L._T.duckyBowlWatch');assert report['samples']>0 and report['errors']==0 and len(report['frames'])==8,report;report['kind']=kind;reports.append(report)
  board=Image.new('RGB',(315*3,225))
  for i,im in enumerate(shots):board.paste(im,(i*315,0))
  board.save(out/(kind+'-actual-playback.png'))
  # Compare every distinct original eating pose, frozen through the same
  # actual body/gear renderer and ground-aligned bowl placement.
  R.run('freeze','_PetHouseUI.PetMode=false;local result={ok=true}')
  frames=[]
  for i,f in enumerate(clip['frames'][:4]):
   base=f['ruid'];R.run('pose','local H=_PetHouseUI;local p=H.PetDisplay:GetChildByName("Portrait");local r=p.SpriteGUIRendererComponent;r.ImageRUID=DataRef("'+base+'");r.PlayRate=0;r.FlipX=false;_PetLogic:RenderNativePetGearUI(p,H:GetDisplayedPet());H:SetDuckyFoodBowl(true,1);local result={ok=true}')
   R.wait('frame','local H=_PetHouseUI;local p=H.PetDisplay:GetChildByName("Portrait");local q=_PetLogic._T.nativePetGearUI[p.Id];_PetLogic:RenderNativePetGearUI(p,H:GetDisplayedPet());local result={base=q.base}',lambda r:r['base']==base)
   frames.append(snap(kind+'-pose-'+str(i)))
  board=Image.new('RGB',(315*4,225))
  for i,im in enumerate(frames):board.paste(im,(i*315,0))
  board.save(out/(kind+'-all-poses.png'));R.run('unfreeze','_PetHouseUI.PetMode=true;local result={ok=true}')
  print('Actual feeding playback and all four distinct poses:',kind,'samples',report['samples'],flush=True)
 R.open_pet('5002617',1);assert R.run('other-pet','local result={bowl=_PetHouseUI.DuckyFoodBowl.Enable}')['bowl']==False
 errors=R.errors(started);assert not errors,errors
 (out/'actual-verification.json').write_text(json.dumps({'status':'passed','normalEatingPlaybacks':reports,'frozenPoseCases':12,'groundAndVisibilityErrors':0,'runtimeErrors':errors},indent=2))
 print('PASS: all 8 eating animation frames observed for bare/original/variation. Bowl stays planted and hides on finish/other pet.',flush=True)
finally:
 try:
  R.run('cleanup','local L=_PetLogic;if L._T.duckyBowlTimer~=nil then _TimerService:ClearTimer(L._T.duckyBowlTimer);L._T.duckyBowlTimer=nil end;_PetHouseUI.PetMode=true;_PetHouseUI:Close();local result={ok=true}')
  if prepared:R.restore()
 finally:R.s.close()
