from runtime_common import *
from PIL import Image,ImageDraw
import numpy as np,math
root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment');maps=json.loads((out/'applied-maps.json').read_text());files={r['ruid']:root/r['file']for r in json.loads((root/'Maps/equipment-resources.json').read_text())['resources']};files.update({v['ruid']:Path(v['file'])for v in json.loads((out/'applied-assets.json').read_text()).values()});body={k:Path(v)for k,v in json.loads((out/'body-inputs.json').read_text()).items()};pairs=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text())['frames'][58:66];prepared=False;created=False;proof={};started=datetime.now().isoformat(timespec='seconds')
def expected(base,code):
 im=Image.open(body[base]).convert('RGBA')
 for slot,digit in [('coat',code//3%3),('neck',code//9),('hat',code%3)]:
  if digit:im.alpha_composite(Image.open(files[(maps['original'][base]if digit==1 else maps['variants'][base+':design2'])[slot]]).convert('RGBA'))
 return im
def conditions(state,design):
 setup('ttungttang',design)
 fields={'hungry':'p.Fullness=10;p.Fatigue=0;p.Mood=100;p.Cleanliness=100;','rest':'p.Fullness=100;p.Fatigue=90;p.Mood=100;p.Cleanliness=100;','cry':'p.Fullness=100;p.Fatigue=0;p.Mood=10;p.Cleanliness=100;','angry':'p.Fullness=100;p.Fatigue=0;p.Mood=100;p.Cleanliness=10;'}[state]
 run('condition','local L=_PetLogic;local r=L.States[L._T.native11User];local p=r.pets.ttungttang;'+fields+'p.NeedsAt=_DateTimeLogic:GetTimeElapsedWithoutOffset();L:PushState(L._T.native11User,"","");local result={set=true}','server_main')
try:
 wait('loaded','local result={ready=_PetLogic.PetGearReady and _PetLogic.ClientReady}',lambda r:r['ready']);preserve();prepared=True
 # Observe the actual needs-driven idle selection, on both normal UI surfaces.
 run('watch','''local L=_PetLogic;L._T.status3Watch={samples=0,errors=0,seen={}};local timer=0;timer=_TimerService:SetTimerRepeat(function()local H=_PetHouseUI;local U=_PetUI;local host=H.PetMode and H or(U.PetMode and U or nil);if host==nil then return end;local p=host.PetDisplay:GetChildByName("Portrait");local q=(L._T.petGearUI or{})[p.Id];if q==nil or not q.ready then return end;local w=L._T.status3Watch;w.samples=w.samples+1;w.seen[q.base]=true;if p.SpriteGUIRendererComponent.Enable or not q.frame.Enable or not q.frame.SpriteGUIRendererComponent.Enable then w.errors=w.errors+1 end end,.01,.01);L._T.status3Timer=timer;local result={watching=true}''')
 for surface in ['house','inventory']:
  for design in [0,10101]:
   for pose in ['hungry','rest','cry','angry']:
    run('close','_PetHouseUI:Close();_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;local result={closed=true}');conditions(pose,design)
    if surface=='house':run('house','_TitleUI:ShowLobby();_PetHouseUI.SelectedPetIndex=2;_PetHouseUI:Open();local result={open=true}')
    else:run('inventory','_TitleUI:ShowLobby();local U=_PetUI;U.InventoryRoot.Enable=true;U:SetPetMode(true);U.ViewedPetIndex=2;U:Refresh();local result={open=true}')
    code=13 if design==0 else 26
    wait('state-pose','local H='+('_PetHouseUI'if surface=='house'else'_PetUI')+';local q=_PetLogic._T.petGearUI[H.PetDisplay:GetChildByName("Portrait").Id];local result={pose=H.CustomIdlePose,code=q~=nil and q.code or -1}',lambda r:r['pose']==pose and r['code']==code)
    pics=[];deadline=time.monotonic()+1.6
    while time.monotonic()<deadline:
     pic=Image.open(s.call('maker_screenshot')['path']).convert('RGB');pics.append(pic.crop((750,465,1110,730))if surface=='house'else pic.crop((290,430,660,720)));time.sleep(.05)
    w,h=pics[0].size;board=Image.new('RGB',(w*min(4,len(pics)),h*math.ceil(len(pics)/4)),(70,60,52))
    for i,p in enumerate(pics):board.paste(p,(i%4*w,i//4*h))
    name=f'actual-{surface}-{pose}-design{1 if design==0 else 2}';board.save(out/(name+'.png'));proof[name]={'framesCaptured':len(pics),'selectedPose':pose,'code':code}
   print('Needs-driven playback checked:',surface,'design',1 if design==0 else 2,flush=True)
 watch=run('watch-result','local result=_PetLogic._T.status3Watch');assert watch['errors']==0 and watch['samples']>100;proof['watch']=watch
 run('end-watch','_TimerService:ClearTimer(_PetLogic._T.status3Timer);_PetLogic._T.status3Timer=nil;_PetHouseUI:Close();_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;local result={closed=true}')
 # Freeze every reaction frame with all 27 independent slot combinations.
 run('fixtures','''local H=_PetHouseUI;_TitleUI:ShowLobby();H:Open();H.PetMode=false;H.PetPanel.Enable=false;local L=_PetLogic;local list={};local template=_PetUI.PetGearSlots:GetChildByName("Cap"):GetChildByName("Icon");for i=1,8 do local p=_SpawnService:SpawnByEntity(template,"TtungStatusQA"..i,Vector3.zero,H.Overlay,false);local t=p.UITransformComponent;t.AnchorsMin=Vector2(.5,.5);t.AnchorsMax=Vector2(.5,.5);t.Pivot=Vector2(.5,.5);t.UIScale=Vector3(1,1,1);t.UIRotation=Vector3.zero;t.RectSize=Vector2(256,256);t.anchoredPosition=_UILogic:ScreenToLocalUIPosition(Vector2(350+((i-1)%4)*400,720-math.floor((i-1)/4)*380),H.Overlay.UITransformComponent);local r=p.SpriteGUIRendererComponent;r.PreserveSprite=PreserveSpriteType.None;r.LocalScale=Vector2(1,1);r.LocalPosition=Vector2.zero;r.RaycastTarget=false;r.Outline=false;r.DropShadow=false;r.Type=ImageType.Simple;r.PlayRate=0;table.insert(list,p)end;L._T.status3Fixtures=list;local result={created=#list}''');created=True
 cases=[(r['ruid'],code,code%2==1)for r in pairs for code in range(27)];reports=[]
 for page in range(math.ceil(len(cases)/8)):
  batch=cases[page*8:page*8+8];payload=json.dumps([{'base':base,'code':code,'flip':flip}for base,code,flip in batch],separators=(',',':'))
  g=run('freeze','''local L=_PetLogic;local rows=_HttpService:JSONDecode('''+json.dumps(payload)+''');local result={};for i,p in ipairs(L._T.status3Fixtures)do p.Enable=i<=#rows;if p.Enable then local row=rows[i];local code=row.code;local mask=0;local designs=0;for _,v in ipairs({{1,1},{2,100},{4,10000}})do local digit=code%3;code=math.floor(code/3);if digit>0 then mask=mask+v[1]end;if digit==2 then designs=designs+v[2]end end;local entry={id="ttungttang",progress={Owned=true,GearEquippedMask=mask,GearDesigns=designs}};local r=p.SpriteGUIRendererComponent;r.ImageRUID=DataRef(row.base);r.FlipX=row.flip;r.Color=Color(1,1,1,1);L:RenderPetGearUI(p,entry,row.base);local t=p.UITransformComponent;local a=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(-128,128),t));local b=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(128,-128),t));table.insert(result,{left=a.x,top=a.y,right=b.x,bottom=b.y,screenW=_UILogic.ScreenWidth,screenH=_UILogic.ScreenHeight})end end''')
  time.sleep(.03);screen=Image.open(s.call('maker_screenshot')['path']).convert('RGB');rgb=np.array(screen)
  for (base,code,flip),geom in zip(batch,g):
   im=expected(base,code)
   if flip:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
   a=np.array(im);rx=screen.width/geom['screenW'];ry=screen.height/geom['screenH'];left=geom['left']*rx;right=geom['right']*rx;top=(geom['screenH']-geom['top'])*ry;bottom=(geom['screenH']-geom['bottom'])*ry;yy,xx=np.indices((128,128));sx=np.floor(left+(xx+.5)*(right-left)/128).astype(int);sy=np.floor(top+(yy+.5)*(bottom-top)/128).astype(int);actual=rgb[sy,sx];opaque=a[:,:,3]==255;delta=np.abs(actual.astype(int)-a[:,:,:3].astype(int)).max(2);bad=opaque&(delta>6);r={'frame':base,'code':code,'flip':flip,'opaquePixels':int(opaque.sum()),'differentPixels':int(bad.sum())};reports.append(r)
   if bad.any():screen.save(out/'actual-failed.png');im.resize((512,512),Image.Resampling.NEAREST).save(out/'expected-failed.png');raise AssertionError(r)
  if page%6==0:screen.save(out/f'actual-slot-combinations-{page}.png');print('Actual pixels compared:',len(reports),'/',len(cases),flush=True)
 proof.update(status='passed',actualPixelCases=len(reports),opaquePixelsCompared=sum(r['opaquePixels']for r in reports),differentPixels=sum(r['differentPixels']for r in reports),needsPlaybackCases=16,all27SlotCombinations=True)
 assert not errors(started),errors(started)[-2:]
 (out/'actual-verification.json').write_text(json.dumps(proof,indent=2));print('Condition playback and every independent equipment combination passed.',flush=True)
finally:
 try:
  run('cleanup','''local L=_PetLogic;if L._T.status3Timer~=nil then _TimerService:ClearTimer(L._T.status3Timer);L._T.status3Timer=nil end;for _,p in ipairs(L._T.status3Fixtures or{})do local q=L._T.petGearUI[p.Id];if q~=nil then if isvalid(q.frame)then q.frame:Destroy()end;L._T.petGearUI[p.Id]=nil end;if isvalid(p)then p:Destroy()end end;L._T.status3Fixtures=nil;_PetHouseUI.PetPanel.Enable=true;_PetHouseUI.PetMode=true;_PetHouseUI:Close();_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;local result={clean=true}''')
  if prepared:restore()
 finally:s.close()
