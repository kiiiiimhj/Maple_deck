from pathlib import Path
from PIL import Image,ImageDraw
import sys,json,time,numpy as np,subprocess
sys.path.insert(0,str(Path('work/pet-variation-v1').resolve()));from runtime_common import s,run,wait,preserve,setup,restore
out=Path('outputs/pet-variation-repair-v2');prepared=False;report={}
try:
 preserve();prepared=True;setup()
 run('cold-pool','_PetHouseUI:Close();_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;_PetLogic:ClearPetGearUI();_PetHouseUI.SelectedPetIndex=2;_PetHouseUI:Open();local result={cold=true}')
 ready=wait('cold-house-ready','local H=_PetHouseUI;local p=H.PetDisplay:GetChildByName("Portrait");local q=(_PetLogic._T.petGearUI or {})[p.Id];local n=0;local wrong=0;if q~=nil then for _,e in ipairs(q.actors)do if e.SpriteGUIRendererComponent.Color.a>.99 then n=n+1 end;if e.Parent~=p then wrong=wrong+1 end end end;local result={ready=q~=nil and q.ready or false,selected=n,wrongParent=wrong}',lambda r:r['ready']and r['selected']==1 and r['wrongParent']==0)
 report['coldHouse']=ready
 run('cold-feed-request','_PetHouseUI:RequestCare("feed");local result={requested=true}')
 wait('feeding','local result={feeding=_PetHouseUI.Motion=="feed"}',lambda r:r['feeding'])
 run('retain-normal-feed-loop','local H=_PetHouseUI;H.MotionUntil=_UtilLogic.ElapsedSeconds+12;local result={loopRateUnchanged=true}')
 raw=out/'cold-feed-raw';raw.mkdir(exist_ok=True);pics=[]
 until=time.monotonic()+10
 while time.monotonic()<until:
  im=Image.open(s.call('maker_screenshot')['path']).convert('RGB');im.save(raw/('frame-%03d.png'%len(pics)));pics.append(im.crop((720,390,1200,750)))
 board=Image.new('RGB',(480*4,360*((len(pics)+3)//4)))
 for i,im in enumerate(pics):board.paste(im,(i%4*480,i//4*360))
 board.save(out/'cold-feed-sequence.png')
 analyzer=Path('work/pet-variation-repair-v2/check_live_feed_pixels.py').read_text().replace('after-actual-feed-raw','cold-feed-raw').replace('live-feed-pixel-verification.json','cold-feed-pixel-verification.json')
 exec(compile(analyzer,'cold-feed-pixel-compare','exec'),{})
 report['coldFeedPixels']=json.loads((out/'cold-feed-pixel-verification.json').read_text())
 run('inventory-open','_PetHouseUI:Close();_PetUI.InventoryRoot.Enable=true;_PetUI:SetPetMode(true);local result={opened=true}')
 ready=wait('cold-inventory-ready','local U=_PetUI;local p=U.PetDisplay:GetChildByName("Portrait");local q=(_PetLogic._T.petGearUI or {})[p.Id];local n=0;if q~=nil then for _,e in ipairs(q.actors)do if e.SpriteGUIRendererComponent.Color.a>.99 then n=n+1 end end end;local result={ready=q~=nil and q.ready or false,selected=n,pet=U:GetShownEntry().id}',lambda r:r['ready']and r['selected']==1 and r['pet']=='ttungttang')
 report['coldInventory']=ready
 geom=run('inventory-freeze','local U=_PetUI;U.PetMode=false;local p=U.PetDisplay:GetChildByName("Portrait");local entry=U:GetShownEntry();local base=entry.frames.stand[1];p.SpriteGUIRendererComponent.ImageRUID=DataRef(base);p.SpriteGUIRendererComponent.PlayRate=0;_PetLogic:AlignCustomPortrait(p,entry,entry.inventoryPixelScale);_PetLogic:RenderPetGearUI(p,entry,base);local t=p.UITransformComponent;local a=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(-t.RectSize.x/2,t.RectSize.y/2),t));local b=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(t.RectSize.x/2,-t.RectSize.y/2),t));local result={left=a.x,top=a.y,right=b.x,bottom=b.y,w=_UILogic.ScreenWidth,h=_UILogic.ScreenHeight}')
 screen=Image.open(s.call('maker_screenshot')['path']).convert('RGB');screen.save(out/'actual-inventory-cold.png')
 # The same native composite must be retained in the independently constructed inventory pool.
 code=Path('work/pet-variation-repair-v2/pixel_verify.py').read_text();code=code[code.index("frames=json.loads"):code.index('\ndef snap(')]
 # expected() needs its definitions in one global namespace.
 n={'Path':Path,'Image':Image,'json':json,'out':out,'root':Path('G:/Maple_Story_Deck/ArtSource/PetEquipment')};exec(code,n);a=np.array(n['expected'](n['frames'][0],10101,7));yy,xx=np.indices((128,128));left=geom['left']*screen.width/geom['w'];right=geom['right']*screen.width/geom['w'];top=(geom['h']-geom['top'])*screen.height/geom['h'];bottom=(geom['h']-geom['bottom'])*screen.height/geom['h'];sx=np.floor(left+(xx+.5)*(right-left)/128).astype(int);sy=np.floor(top+(yy+.5)*(bottom-top)/128).astype(int);delta=np.abs(np.array(screen)[sy,sx].astype(int)-a[:,:,:3].astype(int)).max(axis=2);bad=int(((a[:,:,3]==255)&(delta>6)).sum());assert bad==0,bad;report['inventoryDifferentPixels']=bad
 (out/'cold-render-verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True)
finally:
 try:
  run('cold-cleanup','_PetHouseUI:Close();_PetUI.PetMode=true;_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;local result={closed=true}')
  if prepared:restore()
 finally:s.close()
