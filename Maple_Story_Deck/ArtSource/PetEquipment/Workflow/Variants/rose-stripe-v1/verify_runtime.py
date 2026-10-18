from pathlib import Path
from datetime import datetime
from PIL import Image
import json,time,ast
from runtime_common import s,run,wait,preserve,setup,restore,out
started=datetime.now().isoformat(timespec='seconds');prepared=False;captures=[];proof={}
tree=ast.parse(Path('work/pet-gear-motion-v8/verify_runtime.py').read_text(encoding='utf-8'));exec(ast.unparse(next(x for x in tree.body if isinstance(x,ast.FunctionDef)and x.name=='capture')),globals())
def check(tag,body,context='client'):
 r=run(tag,body,context);proof[tag]=r;(out/'runtime-proof.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2),encoding='utf-8');print(tag+': '+json.dumps(r,ensure_ascii=False),flush=True);return r
def pic(name):
 p=s.call('maker_screenshot')['path'];im=Image.open(p).convert('RGB');im.save(out/(name+'.png'));return im
def open_house():
 run('close-inventory','_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;_PetHouseUI:Close();local result={closed=true}')
 setup();run('open-house','_TitleUI:ShowLobby();_PetHouseUI.SelectedPetIndex=2;_PetHouseUI:Open();local result={open=true}')
 wait('house-ready','local H=_PetHouseUI;local p=H.PetDisplay:GetChildByName("Portrait");local q=(_PetLogic._T.petGearUI or {})[p.Id];local count=0;if q~=nil then for _,a in ipairs(q.actors)do if a.SpriteGUIRendererComponent.Color.a>.99 then count=count+1 end end end;local result={ready=q~=nil and q.ready or false,active=count,id=H:GetDisplayedPet().id}',lambda r:r['ready']and r['active']==3 and r['id']=='ttungttang')
try:
 wait('ready','local result={ready=_PetLogic.ClientReady and _PetLogic.PetGearReady and _PetLogic.PetCharmJumpReady}',lambda r:r['ready'])
 preserve();prepared=True;setup()
 # The real Maker-only grant button must make both sets selectable.
 check('clear-test-ownership','local L=_PetLogic;local r=L.States[L._T.stripeUser];local p=r.pets.ttungttang;p.GearVariantOwnedMask=0;p.GearDesigns=0;L:PushState(L._T.stripeUser,"","");local result={reset=true}','server_main')
 run('inventory','_PetHouseUI:Close();_PetUI.InventoryRoot.Enable=true;_PetUI:SetPetMode(true);local result={opened=true}')
 run('test-grant-button','_PetUI.PetGearSlots:GetChildByName("TestGear"):SendEvent(ButtonClickEvent());local result={clicked=true}')
 wait('test-granted','local p=_PetLogic.ClientPets.ttungttang;local result={alt=p.GearVariantOwnedMask,test=_PetLogic.ClientTest}',lambda r:r['alt']==7 and r['test'])
 r=check('inventory-count','local U=_PetUI;U:RefreshPetGear();local n=0;local ids={};for _,x in ipairs(U:BuildPetInvItems())do if x.petId=="ttungttang"then n=n+1;table.insert(ids,x.def.id)end end;local result={dogItems=n,total=#U:BuildPetInvItems(),items=ids}')
 assert r['dogItems']==6 and r['total']==18
 # Click each variant through an actual inventory cell ButtonClickEvent.
 for slot,bit in [('Cap',1),('Coat',2),('Necklace',4)]:
  for variant in [2,1,2]:
   time.sleep(.3)
   run('click','local U=_PetUI;U:RefreshPetGear();local index=-1;for i,item in ipairs(U._T.petInvItems)do if item.petId=="ttungttang"and item.slot=="'+slot+'"and item.variant=='+str(variant)+'then index=i-1 break end end;assert(index>=0);U.PetInventoryPanel:GetChildByName("Cells"):GetChildByName("Cell"..index):SendEvent(ButtonClickEvent());local result={clicked=index}')
   wait('changed','local p=_PetLogic.ClientPets.ttungttang;local result={mask=p.GearEquippedMask,variant=p.GearDesigns}',lambda r:r['mask']==7 and (r['variant']//(1 if bit==1 else 100 if bit==2 else 10000))%100==variant-1)
  check('slot-'+slot,'local p=_PetLogic.ClientPets.ttungttang;local count=0;for _,i in ipairs(_PetUI:BuildPetInvItems())do if i.petId=="ttungttang"and i.slot=="'+slot+'"and i.worn then count=count+1 end end;local st=_PetLogic:GetPetStats("ttungttang",p);local result={worn=count,stats=st,mask=p.GearEquippedMask,variant=p.GearDesigns}')
  assert proof['slot-'+slot]['worn']==1
 pic('actual-inventory-stripe')
 # Equipped slot clicks remove only the currently selected design.
 time.sleep(.3);run('slot-toggle','_PetUI.PetGearSlots:GetChildByName("Cap"):SendEvent(ButtonClickEvent());local result={clicked=true}')
 wait('slot-removed','local result={mask=_PetLogic.ClientPets.ttungttang.GearEquippedMask}',lambda r:r['mask']==6)
 time.sleep(.3);run('slot-toggle','_PetUI.PetGearSlots:GetChildByName("Cap"):SendEvent(ButtonClickEvent());local result={clicked=true}')
 wait('slot-returned','local result={mask=_PetLogic.ClientPets.ttungttang.GearEquippedMask}',lambda r:r['mask']==7)
 # Saved design selection and run snapshots must keep the same bonuses.
 r=check('save-and-stats','local L=_PetLogic;local r=L.States[L._T.stripeUser];local p=r.pets.ttungttang;local original=L:GetPetStats("ttungttang",p);local statsEqual=true;for mix=0,7 do p.GearDesigns=mix%2+math.floor(mix/2)%2*100+math.floor(mix/4)%2*10000;local st=L:GetPetStats("ttungttang",p);for k,v in pairs(original)do if st[k]~=v then statsEqual=false end end end;p.GearDesigns=10101;local saved=L:SerializeAccount(r);local restored=L:ReadAccount(saved);L:InitForRun(L._T.stripeUser);local result={statsEqual=statsEqual,version=saved.version,roundTrip=restored.pets.ttungttang.GearDesigns,runMask=L.RunPetGearMask,runVariant=L.RunPetGearDesigns}','server_main')
 assert r=={'statsEqual':True,'version':9,'roundTrip':10101,'runMask':7,'runVariant':10101},r
 open_house();capture('actual-stripe-idle',2)
 # Exercise every fitted frame with both facings, mixing original / stripe and
 # independently removable slots. All gear shares the body's existing clock.
 run('observer','''local L=_PetLogic;local H=_PetHouseUI;H.Motion="qa";H.MotionUntil=_UtilLogic.ElapsedSeconds+100;H.NextRefresh=_UtilLogic.ElapsedSeconds+100;local p=H.PetDisplay:GetChildByName("Portrait");local entry=H:GetDisplayedPet();p.SpriteGUIRendererComponent.PlayRate=0;local rows={};for base,_ in pairs(L.PetGearOverlays)do table.insert(rows,base)end;table.sort(rows);local q={samples=0,errors=0,done=false,frames=#rows};L._T.stripeFrameProof=q;local n=0;local timer=0;timer=_TimerService:SetTimerRepeat(function()for batch=1,16 do n=n+1;local base=rows[math.floor((n-1)/32)+1];if base==nil then q.done=true;_TimerService:ClearTimer(timer);return end;local phase=math.floor(((n-1)%32)/2);entry.progress.GearDesigns=phase<8 and (phase%2+math.floor(phase/2)%2*100+math.floor(phase/4)%2*10000) or 10101;entry.progress.GearEquippedMask=phase<8 and 7 or phase-8;p.SpriteGUIRendererComponent.FlipX=n%2==0;p.SpriteGUIRendererComponent.ImageRUID=DataRef(base);L:AlignCustomPortrait(p,entry,entry.pixelScale);L:RenderPetGearUI(p,entry,base);local expected={};local count=0;local layers=L:GetPetGearLayers(base,entry.progress.GearDesigns);for slot,bit in pairs({hat=1,coat=2,neck=4})do if L:HasPetGearBit(entry.progress.GearEquippedMask,bit)then expected[layers[slot]]=true;count=count+1 end end;local active=0;local pool=L._T.petGearUI[p.Id];for key,actor in pairs(pool.byRUID)do if actor.SpriteGUIRendererComponent.Color.a>.99 then active=active+1;local t=actor.UITransformComponent;if not expected[key]or actor.SpriteGUIRendererComponent.FlipX~=p.SpriteGUIRendererComponent.FlipX or t.anchoredPosition~=Vector2.zero or math.abs(t.RectSize.x-p.UITransformComponent.RectSize.x)>.001 or math.abs(t.RectSize.y-p.UITransformComponent.RectSize.y)>.001 then q.errors=q.errors+1 end end end;if active~=count then q.errors=q.errors+1 end;q.samples=q.samples+1 end end,.01,.01);L._T.stripeFrameTimer=timer;local result={started=true}''')
 r=wait('frame-combinations','local result=_PetLogic._T.stripeFrameProof',lambda r:r['done']);proof['frame-combinations']=r
 assert r['frames']==76 and r['samples']==2432 and r['errors']==0,r
 print('All fitted frame / slot / pattern / facing cases passed.',flush=True)
 run('restore-frame-driver','_PetHouseUI.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.FlipX=false;_PetHouseUI.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.PlayRate=1;_PetHouseUI:Close();local result={reset=true}')
 # Normal care buttons and the discovery sequence, with the new set worn.
 for action in ['feed','wash','sleep','inject','walk']:
  open_house();run('request-'+action,'_PetHouseUI:RequestCare("'+action+'");local result={requested=true}')
  state=wait('care-start','local H=_PetHouseUI;local result={motion=H.Motion,remaining=H.MotionUntil-_UtilLogic.ElapsedSeconds}',lambda r:r['motion']==action)
  if action=='walk':run('discovery','_PetHouseUI.WalkPlan={route=1,found=true,icon="",message="",revealed=false};local result={found=true}')
  capture('actual-stripe-'+action,max(.8,state['remaining']-.1))
  wait('care-end','local result={done=_PetHouseUI.MotionUntil==0}',lambda r:r['done'])
 # Leave a real neutral final screenshot, rather than the generated concept.
 open_house();pic('actual-stripe-house')
 errors=[x for x in s.call('maker_logs',{'kind':'normal'}).get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=started and any(t in x.get('message','')+str(x.get('stackTrace',''))for t in ['Pet','Gear','Inventory'])]
 assert not errors,errors
 assert not[x for x in s.call('maker_logs',{'kind':'build'}).get('logs',[])if x.get('logType')=='Error']
 report={'status':'passed','inventoryItems':18,'newEquipmentItems':3,'oneEquippedDesignPerSlot':True,'bonusesNotStacked':True,'actualSlotAndInventoryButtons':True,'frameCases':proof['frame-combinations'],'careClips':captures,'schemaVersion':9,'runtimePetErrors':0,'buildErrors':0}
 (out/'runtime-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in report.items()if k!='careClips'}),flush=True)
finally:
 try:
  run('cleanup','local L=_PetLogic;if L._T.stripeFrameTimer~=nil then _TimerService:ClearTimer(L._T.stripeFrameTimer)end;_PetHouseUI:Close();_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;local p=_PetHouseUI.PetDisplay:GetChildByName("Portrait");p.SpriteGUIRendererComponent.FlipX=false;p.SpriteGUIRendererComponent.PlayRate=1;local result={clean=true}')
  if prepared:restore()
 finally:s.close()
