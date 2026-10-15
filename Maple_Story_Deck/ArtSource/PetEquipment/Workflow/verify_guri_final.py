from pathlib import Path
from PIL import Image
import ast,json,time
from runtime_common import s,run,wait,preserve,setup,restore,out
tree=ast.parse(Path('work/pet-gear-motion-v8/verify_runtime.py').read_text(encoding='utf-8'));captures=[];prepared=False
for name in ['capture','open_pet']:exec(ast.unparse(next(x for x in tree.body if isinstance(x,ast.FunctionDef)and x.name==name)),globals())
try:
 preserve();prepared=True;open_pet(1,'5002617')
 run('walk','_PetHouseUI:RequestCare("walk");local result={requested=true}')
 wait('started','local result={motion=_PetHouseUI.Motion}',lambda r:r['motion']=='walk')
 run('watch','local L=_PetLogic;local H=_PetHouseUI;H.WalkPlan={route=1,found=true,icon="",message="",revealed=false};local q={samples=0,rotationErrors=0,scaleErrors=0,earlyFootErrors=0,frames={}};L._T.pose9FinalGround=q;local t=0;t=_TimerService:SetTimerRepeat(function()if H.Motion~="walk"then return end;local e=H.PetDisplay:GetChildByName("Portrait");local p=L._T.nativePetGearUI[e.Id];q.samples=q.samples+1;if math.abs(e.UITransformComponent.UIRotation.z)>.0001 then q.rotationErrors=q.rotationErrors+1 end;if p~=nil and p.base~=nil then q.frames[p.base]=true;if math.abs(p.pixelScale-6)>.001 then q.scaleErrors=q.scaleErrors+1 end;local m=L.NativePetGearSpriteMetrics[p.base];local foot=e.UITransformComponent.anchoredPosition.y-m.py*m.h*p.pixelScale;if _UtilLogic.ElapsedSeconds-H.MotionStart<.65 and math.abs(foot-H:GetPortraitY())>1 then q.earlyFootErrors=q.earlyFootErrors+1 end end end,.02,.02);L._T.pose9FinalTimer=t;local result={watching=true}')
 capture('final-guri-walk',11.8)
 wait('ended','local result={done=_PetHouseUI.MotionUntil==0}',lambda r:r['done'])
 q=run('result','_TimerService:ClearTimer(_PetLogic._T.pose9FinalTimer);local result=_PetLogic._T.pose9FinalGround');assert q['samples']>100 and q['rotationErrors']==0 and q['scaleErrors']==0 and q['earlyFootErrors']==0 and len(q['frames'])==4,q
 report={'status':'passed',**q,'originalWalkingFramesPreserved':True,'bodyRotationRemoved':True,'sourceResourceFolder':'G:/Maple_Story_Deck/ArtSource/PetEquipment'}
 (out/'guri-final-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
finally:
 try:
  run('cleanup','if _PetLogic._T.pose9FinalTimer~=nil then _TimerService:ClearTimer(_PetLogic._T.pose9FinalTimer)end;_PetHouseUI:Close();local result={clean=true}')
  if prepared:restore()
 finally:s.close()
