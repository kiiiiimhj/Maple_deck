from pathlib import Path
from datetime import datetime
from PIL import Image
import ast,json,time
from runtime_common import s,run,wait,preserve,setup,restore,out
tree=ast.parse(Path('work/pet-gear-motion-v8/verify_runtime.py').read_text(encoding='utf-8'));captures=[];prepared=False;proof={};started=datetime.now().isoformat(timespec='seconds')
for name in ['capture','open_pet']:
 fn=next(x for x in tree.body if isinstance(x,ast.FunctionDef)and x.name==name);exec(ast.unparse(fn),globals())
try:
 wait('ready','local result={ready=_PetLogic.ClientReady and _PetLogic.NativePetGearReady}',lambda r:r['ready'])
 preserve();prepared=True
 for index,pet,actions in [(1,'5002617',['feed','walk','wash']),(5,'oduck',['wash','test','walk']),(3,'5000498',['wash','test','walk'])]:
  for action in actions:
   open_pet(index,pet)
   if action=='test':
    # Maker grants all test pets automatically. Exercise the same successful
    # unlock presentation callback without changing that acquisition feature.
    run('unlock-presentation','local H=_PetHouseUI;H.PendingAction="test";_PetLogic.ClientMotionPetId=H:GetDisplayedPet().id;H:OnPetChanged("love");local result={motion=H.Motion}')
   else:run('request','local H=_PetHouseUI;H:RequestCare("'+action+'");local result={requested=H.PendingAction=="'+action+'"}')
   state=wait('begun','local H=_PetHouseUI;local result={motion=H.Motion,remaining=H.MotionUntil-_UtilLogic.ElapsedSeconds}',lambda r:r['motion']==action)
   if action=='walk':run('discovery','_PetHouseUI.WalkPlan={route=1,found=true,icon="",message="",revealed=false};local result={set=true}')
   if pet=='5002617':
    run('ground-watch','local L=_PetLogic;local q={samples=0,rootJumpErrors=0,scales={},frames={},minRoot=10000,maxRoot=-10000};L._T.pose9Ground=q;local H=_PetHouseUI;local t=0;t=_TimerService:SetTimerRepeat(function()local p=H.PetDisplay:GetChildByName("Portrait");local elapsed=_UtilLogic.ElapsedSeconds-H.MotionStart;if H.Motion=="'+action+'"then local py=p.UITransformComponent.anchoredPosition.y;q.samples=q.samples+1;q.minRoot=math.min(q.minRoot,py);q.maxRoot=math.max(q.maxRoot,py);if elapsed<.65 and math.abs(py-H:GetPortraitY())>4 then q.rootJumpErrors=q.rootJumpErrors+1 end;local pool=L._T.nativePetGearUI[p.Id];if pool~=nil and pool.base~=nil then q.frames[pool.base]=true;q.scales[tostring(pool.pixelScale)]=true end end end,.02,.02);L._T.pose9GroundTimer=t;local result={watching=true}')
   capture('actual-'+pet+'-'+action,max(.8,state['remaining']-.1))
   wait('ended','local result={done=_PetHouseUI.MotionUntil==0}',lambda r:r['done'])
   if pet=='5002617':
    q=run('ground-result','_TimerService:ClearTimer(_PetLogic._T.pose9GroundTimer);local result=_PetLogic._T.pose9Ground');assert q['rootJumpErrors']==0,q;proof['ground-'+action]=q
    if action=='feed':assert len(q['frames'])>=2,q
  print('Actual pose review:',pet,flush=True)
 # Check the changed native frame/slot bindings, including the eating alias.
 call=next(x for x in ast.walk(tree)if isinstance(x,ast.Call)and isinstance(x.func,ast.Name)and x.func.id=='run'and x.args and isinstance(x.args[0],ast.Constant)and x.args[0].value=='all-frame-mask-check')
 body=ast.literal_eval(call.args[1]).replace('motion8','pose9');body=body.replace('local layers=L.NativePetGearOverlays[e.id][ruid];','if pool.base~=ruid or pool.warmingClip~=nil then i=i-1;break end;local layers=L.NativePetGearOverlays[e.id][ruid];')
 # The first feeding sprite is also an ordinary static-frame test target; its
 # motion alias is the original eat clip ID, not a sprite RUID.
 for index,pet in [(1,'5002617'),(5,'oduck'),(3,'5000498')]:
  open_pet(index,pet);run('bindings',body);q=wait('bindings-done','local result=_PetLogic._T.pose9Frames',lambda r:r['done'],count=500);assert q['errors']==0,q;proof['bindings-'+pet]=q
  run('close','_PetHouseUI:Close();local result={closed=true}')
 errors=[r for r in s.call('maker_logs',{'kind':'normal'}).get('logs',[])if r.get('logType')=='Error'and r.get('dateTime','')>=started];assert not errors,errors[-2:]
 assert not[r for r in s.call('maker_logs',{'kind':'build'}).get('logs',[])if r.get('logType')=='Error']
 report={'status':'passed','actualCareClips':captures,'actualUnlockPresentationCallbacks':2,'frameAndSlotCases':sum(proof['bindings-'+p]['frames']for p in ['5002617','oduck','5000498']),'guriInitialGroundErrors':sum(proof['ground-'+a]['rootJumpErrors']for a in ['feed','walk','wash']),'runtimeErrors':0,'buildErrors':0}
 (out/'runtime-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(out/'runtime-proof.json').write_text(json.dumps(proof,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in report.items()if k!='actualCareClips'}),flush=True)
finally:
 try:
  run('cleanup','local L=_PetLogic;for _,t in ipairs({L._T.pose9GroundTimer,L._T.pose9FrameTimer})do if t~=nil then _TimerService:ClearTimer(t)end end;_PetHouseUI:Close();_PetHouseUI.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.FlipX=false;_PetHouseUI.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.PlayRate=1;local result={clean=true}')
  if prepared:restore()
 finally:s.close()
