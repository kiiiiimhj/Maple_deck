from runtime_common import *
from PIL import Image
prepared=False;proof={};started=datetime.now().isoformat(timespec='seconds')
def state():return run('state','local U=_PetUI;local e=U:GetShownEntry();local result={pet=e.id,mask=e.progress.GearEquippedMask,designs=e.progress.GearDesigns,code=_PetLogic:GetNativePetEquipmentCode(e.progress.GearEquippedMask,e.progress.GearDesigns),stats=_PetLogic:GetPetStats(e.id,e.progress)}')
def click(slot,variant,code):
 run('allow-request','local r=_PetLogic.States[_PetLogic._T.native11User];r.lastGearRequest=-10000;local result={allowed=true}','server_main')
 r=run('real-cell-click','local U=_PetUI;U.PetInvTab="All";U.PetInvPage=1;U:RefreshPetInventory();local index=-1;for i,row in ipairs(U._T.petInvItems)do if row.petId==U:GetShownEntry().id and row.slot=="'+slot+'" and row.variant=='+str(variant)+'then index=i-1 break end end;assert(index>=0 and index<24);U.PetInventoryPanel:GetChildByName("Cells"):GetChildByName("Cell"..index):SendEvent(ButtonClickEvent());local result={clicked=index}')
 return wait('selection','local e=_PetUI:GetShownEntry();local result={code=_PetLogic:GetNativePetEquipmentCode(e.progress.GearEquippedMask,e.progress.GearDesigns),stats=_PetLogic:GetPetStats(e.id,e.progress)}',lambda r:r['code']==code)
try:
 preserve();prepared=True
 for index,pet in [(1,'5002617'),(3,'5000498'),(4,'landturtle'),(5,'oduck')]:
  run('close','_PetHouseUI:Close();_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;local result={closed=true}');setup(pet)
  run('open-inventory','_TitleUI:ShowLobby();local U=_PetUI;U.InventoryRoot.Enable=true;U.ViewedPetIndex='+str(index)+';U:SetPetMode(true);U.PetInvTab="All";U.PetInvPage=1;U:Refresh();local result={open=true}')
  wait('inventory-pet','local result={pet=_PetUI:GetShownEntry().id}',lambda r:r['pet']==pet)
  base=state()['stats'];rows=[]
  for slot,variant,code in [('Cap',1,25),('Cap',1,24),('Cap',2,26),('Coat',1,23),('Coat',1,20),('Coat',2,26),('Necklace',1,17),('Necklace',1,8),('Necklace',2,26)]:
   r=click(slot,variant,code);rows.append({'slot':slot,'variant':variant,**r})
   if code in [25,26,23,17]:assert all(abs(r['stats'][k]-base[k])<1e-8 for k in base),(pet,slot,r,base)
   if code==24:assert abs(base['critDmg']-r['stats']['critDmg']-.1)<1e-8
   if code==20:assert abs((1+r['stats']['atkPct'])*1.05-(1+base['atkPct']))<1e-8
   if code==8:assert abs(base['critRate']-r['stats']['critRate']-.05)<1e-8
  proof[pet]=rows
  for tab in ['Cap','Coat','Necklace']:
   r=run('tab','local U=_PetUI;U.PetInvTab="'+tab+'";U:RefreshPetInventory();local result={count=#U:BuildPetInvItems(),page=U.PetInvPage,pager=U._T.petInvPager.Next.Enable}');assert r['count']==10 and r['page']==1 and not r['pager']
  run('all-tab','_PetUI.PetInvTab="All";_PetUI:RefreshPetInventory();local result={count=#_PetUI:BuildPetInvItems()}')
  Image.open(s.call('maker_screenshot')['path']).save(out/(pet+'-actual-inventory-final.png'))
  print('Actual inventory swaps/removal/bonuses:',pet,'passed',flush=True)
 r=run('page1','local U=_PetUI;local result={count=#U:BuildPetInvItems(),label=U._T.petInvPager.Label.TextGUIRendererComponent.Text}');assert r['count']==30 and r['label']=='1 / 2'
 run('next','_PetUI._T.petInvPager.Next:SendEvent(ButtonClickEvent());local result={clicked=true}')
 r=run('page2','local U=_PetUI;local n=0;for _,e in ipairs(U.PetInventoryPanel:GetChildByName("Cells").Children:ToTable())do if e.Enable then n=n+1 end end;local result={page=U.PetInvPage,visible=n,label=U._T.petInvPager.Label.TextGUIRendererComponent.Text}');assert r['page']==2 and r['visible']==6
 proof['paging']=r
 r=run('roundtrip','local L=_PetLogic;local r=L.States[L._T.native11User];for k,p in pairs(r.pets)do if L.NativePetGearOverlays[k]~=nil then p.GearDesigns=10101;p.GearEquippedMask=7;p.GearVariantOwnedMask=7 end end;local saved=L:SerializeAccount(r);local loaded=L:ReadAccount(saved);local checked=0;for k,p in pairs(r.pets)do if L.NativePetGearOverlays[k]~=nil then local q=loaded.pets[k];assert(q.GearDesigns==10101 and q.GearEquippedMask==7 and q.GearVariantOwnedMask==7);checked=checked+1 end end;local result={pets=checked}','server_main');assert r['pets']==4;proof['saveRoundtrip']=r
 assert not errors(started)
 proof.update(status='passed',realButtonClicks=37,independentSlots=True,bonusesUnchanged=True,runtimeErrors=0)
 (out/'inventory-verification.json').write_text(json.dumps(proof,indent=2));print('Inventory validation passed.',flush=True)
finally:
 try:
  run('close','_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;local result={closed=true}')
  if prepared:restore()
 finally:s.close()


