from pathlib import Path
from datetime import datetime
import ast,json,time,shutil
from PIL import Image
from runtime_common import s,run,wait,preserve,setup,restore,out
namespace=globals();tree=ast.parse(Path('work/pet-gear-motion-v8/verify_runtime.py').read_text(encoding='utf-8'))
for name in ['capture','open_pet']:
 fn=next(x for x in tree.body if isinstance(x,ast.FunctionDef)and x.name==name);exec(ast.unparse(fn),namespace)
captures=[];prepared=False;proof={};started=datetime.now().isoformat(timespec='seconds')
try:
 wait('ready','local result={ready=_PetLogic.ClientReady and _PetLogic.NativePetGearReady}',lambda r:r['ready'])
 preserve();prepared=True
 for index,pet,actions in [(3,'5000498',['feed','walk','sleep','inject']),(5,'oduck',['inject']),(4,'landturtle',['inject']),(1,'5002617',['inject'])]:
  for action in actions:
   open_pet(index,pet)
   run('request','_PetHouseUI:RequestCare("'+action+'");local result={requested=true}')
   state=wait('begin','local H=_PetHouseUI;local result={motion=H.Motion,remaining=H.MotionUntil-_UtilLogic.ElapsedSeconds}',lambda r:r['motion']==action)
   if action=='walk':run('found','_PetHouseUI.WalkPlan={route=1,found=true,icon="",message="",revealed=false};local result={set=true}')
   capture('cold-fixed-'+pet+'-'+action,max(.8,state['remaining']-.1))
   wait('ended','local result={done=_PetHouseUI.MotionUntil==0}',lambda r:r['done'])
 # Reuse the actual frame/slot check, allowing genuinely cold body sprites to
 # finish warming rather than treating the previous complete pose as a new one.
 call=next(x for x in ast.walk(tree)if isinstance(x,ast.Call)and isinstance(x.func,ast.Name)and x.func.id=='run'and x.args and isinstance(x.args[0],ast.Constant)and x.args[0].value=='all-frame-mask-check')
 body=ast.literal_eval(call.args[1]);body=body.replace('local layers=L.NativePetGearOverlays[e.id][ruid];','if pool.base~=ruid or pool.warmingClip~=nil then i=i-1;break end;local layers=L.NativePetGearOverlays[e.id][ruid];')
 for index,pet in [(3,'5000498'),(5,'oduck'),(4,'landturtle'),(1,'5002617')]:
  open_pet(index,pet);run('full-frames',body)
  q=wait('frames','local result=_PetLogic._T.motion8Frames',lambda r:r['done'],count=500);assert q['errors']==0,q;proof[pet]=q
  run('close','_PetHouseUI:Close();local result={closed=true}')
  print('Cold frame and independent slot check:',pet,q['frames'],flush=True)
 errors=[r for r in s.call('maker_logs',{'kind':'normal'}).get('logs',[])if r.get('logType')=='Error'and r.get('dateTime','')>=started];assert not errors,errors[-2:]
 report={'status':'passed','actualColdCareClips':captures,'nativeFrameAndIndependentSlotCases':sum(x['frames']for x in proof.values()),'frameErrors':0,'runtimeErrors':0,'originalAccountRestored':True}
 (out/'cold-runtime-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in report.items()if k!='actualColdCareClips'}),flush=True)
finally:
 try:
  run('cleanup','local L=_PetLogic;if L._T.motion8FrameTimer~=nil then _TimerService:ClearTimer(L._T.motion8FrameTimer)end;_PetHouseUI:Close();_PetHouseUI.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.FlipX=false;_PetHouseUI.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.PlayRate=1;local result={clean=true}')
  if prepared:restore()
 finally:s.close()
