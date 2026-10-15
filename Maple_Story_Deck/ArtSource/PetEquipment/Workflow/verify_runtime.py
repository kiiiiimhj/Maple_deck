from pathlib import Path
from PIL import Image
import ast,json,time
from runtime_common import s,run,wait,preserve,setup,restore,out
tree=ast.parse(Path('work/pet-gear-motion-v8/verify_runtime.py').read_text(encoding='utf-8'));captures=[];prepared=False
for name in ['capture','open_pet']:exec(ast.unparse(next(x for x in tree.body if isinstance(x,ast.FunctionDef)and x.name==name)),globals())
try:
 wait('ready','local result={ready=_PetLogic.ClientReady and _PetLogic.NativePetGearReady}',lambda r:r['ready'])
 preserve();prepared=True;open_pet(1,'5002617')
 run('request','_PetHouseUI:RequestCare("walk");local result={requested=true}')
 wait('started','local result={motion=_PetHouseUI.Motion}',lambda r:r['motion']=='walk')
 run('watch','local L=_PetLogic;local H=_PetHouseUI;H.WalkPlan={route=1,found=true,icon="",message="",revealed=false};local bodies={};for key,_ in pairs(L.NativePetGearOverlays["5002617"])do bodies[key]=true end;bodies[H.HappyFaceRUID]=true;local q={samples=0,duplicateBodyErrors=0,legacyFaceErrors=0,maxVisibleBodies=0,frames={},paths={}};L._T.clean10Watch=q;local t=0;t=_TimerService:SetTimerRepeat(function()if H.Motion~="walk"then return end;local p=L._T.nativePetGearUI[H.PetDisplay:GetChildByName("Portrait").Id];if p==nil or p.base==nil then return end;local count=0;local function visit(e,active,path)active=active and e.Enable;local r=e.SpriteGUIRendererComponent;if active and r~=nil and r.Enable and r.Color.a>.5 then local key=tostring(r.ImageRUID.DataId);if bodies[key]then count=count+1;q.paths[path.."/"..e.Name]=true end;if key==H.HappyFaceRUID then q.legacyFaceErrors=q.legacyFaceErrors+1 end end;for _,child in ipairs(e.Children:ToTable())do visit(child,active,path.."/"..e.Name)end end;visit(H.PetPanel,true,"");q.samples=q.samples+1;q.frames[p.base]=true;q.maxVisibleBodies=math.max(q.maxVisibleBodies,count);if count~=1 then q.duplicateBodyErrors=q.duplicateBodyErrors+1 end end,.03,.03);L._T.clean10WatchTimer=t;local result={watching=true}')
 capture('actual-clean-guri-walk',11.8)
 wait('ended','local result={ended=_PetHouseUI.MotionUntil==0}',lambda r:r['ended'])
 q=run('result','_TimerService:ClearTimer(_PetLogic._T.clean10WatchTimer);local result=_PetLogic._T.clean10Watch');assert q['samples']>100 and q['duplicateBodyErrors']==0 and q['legacyFaceErrors']==0 and q['maxVisibleBodies']==1 and len(q['frames'])==4,q
 # Show the actual new headpiece with each native walking frame and on idle;
 # the body is frozen so a missing green patch cannot hide in a motion blur.
 frames=run('frame-list','local H=_PetHouseUI;H.Motion="qa";H.MotionUntil=_UtilLogic.ElapsedSeconds+60;H.NextRefresh=_UtilLogic.ElapsedSeconds+60;local p=H.PetDisplay:GetChildByName("Portrait");p.SpriteGUIRendererComponent.PlayRate=0;local result=H.WalkFrameRUIDs')
 board=Image.new('RGB',(1320,300),(50,45,40))
 for j,ruid in enumerate(frames):
  run('frame','local H=_PetHouseUI;local p=H.PetDisplay:GetChildByName("Portrait");p.SpriteGUIRendererComponent.ImageRUID=DataRef("'+ruid+'");p.SpriteGUIRendererComponent.FlipX=true;_PetLogic:RenderPetGearUI(p,H:GetDisplayedPet(),"");local result={set=true}')
  wait('frame-ready','local p=_PetLogic._T.nativePetGearUI[_PetHouseUI.PetDisplay:GetChildByName("Portrait").Id];local result={base=p.base,warming=p.warmingClip~=nil}',lambda r:r['base']==ruid and not r['warming'])
  im=Image.open(s.call('maker_screenshot')['path']).convert('RGB').crop((790,430,1120,730));board.paste(im,(330*j,0))
 board.save(out/'actual-four-walk-frames.png')
 run('idle','_PetHouseUI:Close();_PetHouseUI:Open();local result={open=true}');time.sleep(.3)
 Image.open(s.call('maker_screenshot')['path']).convert('RGB').crop((790,420,1120,730)).save(out/'actual-leaf-idle.png')
 build=s.call('maker_logs',{'kind':'build'});assert not[r for r in build.get('logs',[])if r.get('logType')=='Error']
 normal=s.call('maker_logs',{'kind':'normal'});assert not[r for r in normal.get('logs',[])if r.get('logType')=='Error'and any(k in r.get('message','')for k in ['PetHouseUI','PetLogic','NativePetGear'])]
 report={'status':'passed',**q,'actualFrozenWalkFrames':len(frames),'buildErrors':0,'petRuntimeErrors':0,'sourceLeafPixelReport':'leaf-pixel-verification.json'}
 (out/'runtime-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
finally:
 try:
  run('cleanup','local L=_PetLogic;if L._T.clean10WatchTimer~=nil then _TimerService:ClearTimer(L._T.clean10WatchTimer)end;_PetHouseUI:Close();local p=_PetHouseUI.PetDisplay:GetChildByName("Portrait");p.SpriteGUIRendererComponent.PlayRate=1;p.SpriteGUIRendererComponent.FlipX=false;local result={clean=true}')
  if prepared:restore()
 finally:s.close()
