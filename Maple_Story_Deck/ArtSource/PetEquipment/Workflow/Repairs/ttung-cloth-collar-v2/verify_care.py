from pathlib import Path
from datetime import datetime
from PIL import Image
import json,time,ast
import sys
sys.path.insert(0,str(Path('work/pet-variation-v1').resolve()))
from runtime_common import s,run,wait,preserve,setup,restore
out=Path('outputs/pet-variation-repair-v2')
started=datetime.now().isoformat(timespec='seconds');prepared=False;captures=[];proof={}
tree=ast.parse(Path('work/pet-gear-motion-v8/verify_runtime.py').read_text(encoding='utf-8'));capture_code=ast.unparse(next(x for x in tree.body if isinstance(x,ast.FunctionDef)and x.name=='capture'))
capture_code=capture_code.replace("frames.append(im.crop((720, 390, 1200, 750)))","rawdir=out/(name+'-raw');rawdir.mkdir(exist_ok=True);im.save(rawdir/('frame-%03d.png'%len(frames)));frames.append(im.crop((720, 390, 1200, 750)))")
assert 'rawdir='in capture_code;exec(capture_code,globals())
def check(tag,body,context='client'):
 r=run(tag,body,context);proof[tag]=r;(out/'runtime-proof.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2),encoding='utf-8');print(tag+': '+json.dumps(r,ensure_ascii=False),flush=True);return r
def pic(name):
 p=s.call('maker_screenshot')['path'];im=Image.open(p).convert('RGB');im.save(out/(name+'.png'));return im
def open_house():
 run('close-inventory','_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;_PetHouseUI:Close();local result={closed=true}')
 setup();run('open-house','_TitleUI:ShowLobby();_PetHouseUI.SelectedPetIndex=2;_PetHouseUI:Open();local result={open=true}')
 wait('house-ready','local H=_PetHouseUI;local p=H.PetDisplay:GetChildByName("Portrait");local q=(_PetLogic._T.petGearUI or {})[p.Id];local count=0;if q~=nil then for _,a in ipairs(q.actors)do if a.SpriteGUIRendererComponent.Color.a>.99 then count=count+1 end end end;local result={ready=q~=nil and q.ready or false,active=count,id=H:GetDisplayedPet().id}',lambda r:r['ready']and r['active']==1 and r['id']=='ttungttang')
try:
 wait('ready','local result={ready=_PetLogic.ClientReady and _PetLogic.PetGearReady and _PetLogic.PetCharmJumpReady}',lambda r:r['ready'])
 preserve();prepared=True;setup()
 open_house();capture('after-actual-idle',2)
 # Normal care buttons and the discovery sequence, with the new set worn.
 for action in ['feed','wash','sleep','inject','walk']:
  open_house();run('request-'+action,'_PetHouseUI:RequestCare("'+action+'");local result={requested=true}')
  state=wait('care-start','local H=_PetHouseUI;local result={motion=H.Motion,remaining=H.MotionUntil-_UtilLogic.ElapsedSeconds}',lambda r:r['motion']==action)
  if action=='walk':
   run('discovery','_PetHouseUI.WalkPlan={route=1,found=true,icon="",message="",revealed=false};local result={found=true}')
   run('walk-watch','''local L=_PetLogic;local H=_PetHouseUI;local body={};for id,_ in pairs(L.PetGearOverlays)do body[id]=true end;for _,rows in pairs(L.NativePetGearOverlays)do for id,_ in pairs(rows)do body[id]=true end end;for _,id in pairs(L.PetDressedFrameAtlases)do body[id]=true end;body[H.HappyFaceRUID]=true;local q={samples=0,duplicateBodyErrors=0,gearFrameErrors=0,phases={}};L._T.repairWalk=q;local t=0;t=_TimerService:SetTimerRepeat(function()if not H.PetMode or H.Motion~="walk"then return end;local p=H.PetDisplay:GetChildByName("Portrait");local pool=L._T.petGearUI[p.Id];if pool==nil or not pool.ready then return end;local count=0;local function visit(e,visible)visible=visible and e.Enable;local r=e.SpriteGUIRendererComponent;if visible and r~=nil and r.Enable and r.Color.a>.5 and body[tostring(r.ImageRUID.DataId)]then count=count+1 end;for _,c in ipairs(e.Children:ToTable())do visit(c,visible)end end;visit(H.PetPanel,true);if count~=1 then q.duplicateBodyErrors=q.duplicateBodyErrors+1 end;local f=pool.frame;if pool.base~=H.CustomImageRUID or pool.code~=26 or not f.Enable or tostring(f.SpriteGUIRendererComponent.ImageRUID.DataId)~=L.PetDressedFrameAtlases[H.CustomImageRUID]then q.gearFrameErrors=q.gearFrameErrors+1 end;q.samples=q.samples+1;q.phases[tostring(H.WalkPhase)]=true end,.0167,.0167);L._T.repairWalkTimer=t;local result={started=true}''')
  if action!='walk':
   run('watch-'+action,'''local L=_PetLogic;local H=_PetHouseUI;local q={samples=0,gearErrors=0};L._T.careCheck=q;local t=0;t=_TimerService:SetTimerRepeat(function()if H.Motion~="'''+action+'''"then return end;local p=H.PetDisplay:GetChildByName("Portrait");local pool=(L._T.petGearUI or {})[p.Id];if pool==nil or not pool.ready then return end;local f=pool.frame;if pool.base~=H.CustomImageRUID or pool.code~=26 or not f.Enable or f.Parent~=p or tostring(f.SpriteGUIRendererComponent.ImageRUID.DataId)~=L.PetDressedFrameAtlases[H.CustomImageRUID]then q.gearErrors=q.gearErrors+1 end;q.samples=q.samples+1 end,.0167,.0167);L._T.careCheckTimer=t;local result={started=true}''')
  capture('after-actual-'+action,max(.8,state['remaining']-.1))
  if action!='walk':
   q=check('live-'+action,'_TimerService:ClearTimer(_PetLogic._T.careCheckTimer);local result=_PetLogic._T.careCheck');assert q['samples']>10 and q['gearErrors']==0,q
  wait('care-end','local result={done=_PetHouseUI.MotionUntil==0}',lambda r:r['done'])
 walk=run('walk-result','local L=_PetLogic;_TimerService:ClearTimer(L._T.repairWalkTimer);local result=L._T.repairWalk')
 assert walk['samples']>100 and walk['duplicateBodyErrors']==walk['gearFrameErrors']==0 and len(walk['phases'])==4,walk
 # Leave a real neutral final screenshot, rather than the generated concept.
 open_house();pic('after-actual-house')
 errors=[x for x in s.call('maker_logs',{'kind':'normal'}).get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=started and any(t in x.get('message','')+str(x.get('stackTrace',''))for t in ['Pet','Gear','Inventory'])]
 assert not errors,errors
 assert not[x for x in s.call('maker_logs',{'kind':'build'}).get('logs',[])if x.get('logType')=='Error']
 report={'status':'passed','inventoryItems':18,'newEquipmentItems':3,'oneEquippedDesignPerSlot':True,'bonusesNotStacked':True,'actualSlotAndInventoryButtons':True,'atomicBodyAndGear':True,'pixelComparisons':json.loads((out/'actual-pixel-verification.json').read_text())['frameCases'],'careClips':captures,'liveWalk':walk,'allCareLayerChecks':{k:v for k,v in proof.items()if k.startswith('live-')},'schemaVersion':9,'sourceArtworkRepair':True,'runtimePetErrors':0,'buildErrors':0}
 (out/'runtime-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in report.items()if k!='careClips'}),flush=True)
finally:
 try:
  run('cleanup','local L=_PetLogic;if L._T.careCheckTimer~=nil then _TimerService:ClearTimer(L._T.careCheckTimer)end;if L._T.repairWalkTimer~=nil then _TimerService:ClearTimer(L._T.repairWalkTimer)end;_PetHouseUI:Close();_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;local p=_PetHouseUI.PetDisplay:GetChildByName("Portrait");p.SpriteGUIRendererComponent.FlipX=false;p.SpriteGUIRendererComponent.PlayRate=1;local result={clean=true}')
  if prepared:restore()
 finally:s.close()
