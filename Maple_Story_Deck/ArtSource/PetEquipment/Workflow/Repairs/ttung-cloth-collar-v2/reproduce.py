from pathlib import Path
from datetime import datetime
from PIL import Image
import sys,ast,time,json
sys.path.insert(0,str(Path('work/pet-variation-v1').resolve()))
from runtime_common import s,run,wait,preserve,setup,restore
out=Path('outputs/pet-variation-repair-v2');prepared=False;captures=[]
tree=ast.parse(Path('work/pet-gear-motion-v8/verify_runtime.py').read_text());exec(ast.unparse(next(x for x in tree.body if isinstance(x,ast.FunctionDef)and x.name=='capture')),globals())
try:
 if s.call('maker_get_current_map').get('mode')!='play':s.call('maker_play')
 for _ in range(60):
  time.sleep(.5)
  try:
   if s.call('maker_get_current_map').get('mode')=='play':break
  except AssertionError:continue
 wait('ready','local result={ready=_PetLogic.ClientReady and _PetLogic.PetGearReady}',lambda r:r['ready'])
 preserve();prepared=True;setup()
 run('open','_TitleUI:ShowLobby();_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;local H=_PetHouseUI;H.SelectedPetIndex=2;H:Open();local result={open=true}')
 wait('pool','local H=_PetHouseUI;local p=(_PetLogic._T.petGearUI or {})[H.PetDisplay:GetChildByName("Portrait").Id];local result={ready=p~=nil and p.ready or false}',lambda r:r['ready'])
 run('watch','''local L=_PetLogic;local H=_PetHouseUI;local body={};for id,_ in pairs(L.PetGearOverlays)do body[id]=true end;local all=L:GetPetGearArtwork();local gear={};for _,layers in pairs(all)do for _,id in pairs(layers)do gear[id]=true end end;local q={samples=0,bodyErrors=0,gearErrors=0,frameErrors=0,paths={},records={}};L._T.stripeReproduce=q;local timer=0;timer=_TimerService:SetTimerRepeat(function()if not H.PetMode then return end;local visibleBodies=0;local visibleGear=0;local current=tostring(H.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.ImageRUID.DataId);local function visit(e,enabled,path)enabled=enabled and e.Enable;local r=e.SpriteGUIRendererComponent;if r~=nil and enabled and r.Enable and r.Color.a>.5 then local id=tostring(r.ImageRUID.DataId);if body[id]then visibleBodies=visibleBodies+1;q.paths[path.."/"..e.Name]=true;if id~=current then q.frameErrors=q.frameErrors+1 end end;if gear[id]then visibleGear=visibleGear+1 end end;for _,child in ipairs(e.Children:ToTable())do visit(child,enabled,path.."/"..e.Name)end end;visit(H.PetPanel,true,"");if visibleBodies~=1 then q.bodyErrors=q.bodyErrors+1 end;if visibleGear~=3 then q.gearErrors=q.gearErrors+1 end;q.samples=q.samples+1;if #q.records<80 then table.insert(q.records,{time=_UtilLogic.ElapsedSeconds-H.MotionStart,body=visibleBodies,gear=visibleGear,base=current,custom=H.CustomImageRUID,pose=H.CustomFrameKey})end end,.0167,.0167);L._T.stripeReproduceTimer=timer;local result={watching=true}''')
 run('walk','_PetHouseUI:RequestCare("walk");local result={requested=true}')
 wait('started','local result={motion=_PetHouseUI.Motion}',lambda r:r['motion']=='walk')
 run('discovery','_PetHouseUI.WalkPlan={route=1,found=true,icon="",message="",revealed=false};local result={set=true}')
 capture('before-actual-walk',12)
 r=run('report','_TimerService:ClearTimer(_PetLogic._T.stripeReproduceTimer);local result=_PetLogic._T.stripeReproduce');(out/'before-walk-layer-report.json').write_text(json.dumps(r,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in r.items()if k!='records'}),flush=True)
 # Freeze exact walk/discovery frames and inspect every visible image child.
 run('pause','local H=_PetHouseUI;H.Motion="qa";H.MotionUntil=_UtilLogic.ElapsedSeconds+100;H.NextRefresh=_UtilLogic.ElapsedSeconds+100;H.PetMode=false;local result={frozen=true}')
 for name,t in [('walking',.3),('jump',1.05),('notice',3.85),('sniff',5.3),('celebrate',7.15)]:
  run('phase','local H=_PetHouseUI;H:SetWalking(true,'+str(t)+');local p=H.PetDisplay:GetChildByName("Portrait");_PetLogic:AlignCustomPortrait(p,H:GetDisplayedPet(),H:GetDisplayedPet().pixelScale);_PetLogic:RenderPetGearUI(p,H:GetDisplayedPet(),H.CustomImageRUID);local result={set=true}')
  im=Image.open(s.call('maker_screenshot')['path']);im.save(out/('before-'+name+'.png'))
finally:
 try:
  if prepared:run('cleanup','local L=_PetLogic;if L._T.stripeReproduceTimer~=nil then _TimerService:ClearTimer(L._T.stripeReproduceTimer)end;local H=_PetHouseUI;H.PetMode=true;H:Close();local p=H.PetDisplay:GetChildByName("Portrait");p.SpriteGUIRendererComponent.FlipX=false;local result={clean=true}')
  if prepared:restore()
 finally:s.close()
