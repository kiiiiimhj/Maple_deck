from pathlib import Path
import sys,time,json,math
from datetime import datetime
from PIL import Image,ImageDraw
import numpy as np
sys.path.insert(0,str(Path('work/pet-equipment-native-v11').resolve()));import runtime_common as R
sys.path.insert(0,str(Path('work/pet-guri-bugi-v12').resolve()));from repair_art import data,parts,comp,move,root
out=Path('outputs/pet-guri-bugi-v12');prepared=False;created=False;reports=[];playback=[];started=datetime.now().isoformat(timespec='seconds')
def code_ready(code):return R.wait('code','local p=_PetHouseUI.PetDisplay:GetChildByName("Portrait");local q=_PetLogic._T.nativePetGearUI[p.Id];local result={ready=q.ready,code=q.code}',lambda r:r['ready']and r['code']==code)
def select(batch):
 payload=json.dumps([{'pet':p,'base':b,'code':c,'flip':f}for p,b,c,f in batch],separators=(',',':'))
 R.run('fixture-select','''local L=_PetLogic;local rows=_HttpService:JSONDecode('''+json.dumps(payload)+''');local list=L._T.native12Fixtures;L._T.native12Entries={};for i,p in ipairs(list)do p.Enable=i<=#rows;if i<=#rows then local row=rows[i];local entry=nil;for _,e in ipairs(L:GetPetCatalog())do if e.id==row.pet then entry=e break end end;local code=row.code;local mask=0;local designs=0;for _,v in ipairs({{1,1},{2,100},{4,10000}})do local digit=code%3;code=math.floor(code/3);if digit>0 then mask=mask+v[1]end;if digit==2 then designs=designs+v[2]end end;entry.progress={Owned=true,GearEquippedMask=mask,GearDesigns=designs};local r=p.SpriteGUIRendererComponent;r.ImageRUID=DataRef(row.base);r.FlipX=row.flip;r.Color=Color(1,1,1,1);r.PlayRate=0;L:RenderNativePetGearUI(p,entry);L._T.native12Entries[i]=entry end end;local result={selected=#rows}''')
def geometry():
 return R.wait('fixture-ready','''local L=_PetLogic;local rows={};local ready=true;for i,p in ipairs(L._T.native12Fixtures)do if p.Enable then L:RenderNativePetGearUI(p,L._T.native12Entries[i]);local q=L._T.nativePetGearUI[p.Id];local r=p.SpriteGUIRendererComponent;local base=tostring(r.ImageRUID.DataId);local code=L:GetNativePetEquipmentCode(L._T.native12Entries[i].progress.GearEquippedMask,L._T.native12Entries[i].progress.GearDesigns);if not q.ready or q.base~=base or q.code~=code then ready=false end;local t=q.viewport.UITransformComponent;local a=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(-t.RectSize.x/2,t.RectSize.y/2),t));local b=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(t.RectSize.x/2,-t.RectSize.y/2),t));table.insert(rows,{left=a.x,top=a.y,right=b.x,bottom=b.y,base=q.base,code=q.code,atomic=q.atomic,bodyEnabled=r.Enable,screenW=_UILogic.ScreenWidth,screenH=_UILogic.ScreenHeight})end end;local result={ready=ready,rows=rows}''',lambda r:r['ready'])['rows']
def capture(tag,duration):
 frames=[];states=[];deadline=time.monotonic()+duration
 while time.monotonic()<deadline:
  state=R.run('playback','local H=_PetHouseUI;local p=H.PetDisplay:GetChildByName("Portrait");local q=_PetLogic._T.nativePetGearUI[p.Id];local result={motion=H.Motion,base=q.base,code=q.code,renderers=not p.SpriteGUIRendererComponent.Enable and q.frame.Enable and q.frame.SpriteGUIRendererComponent.Enable,phase=H.WalkPhase}')
  states.append(state);im=Image.open(R.s.call('maker_screenshot')['path']).convert('RGB');frames.append(im.crop((760,470,1090,715)))
 assert frames
 board=Image.new('RGB',(330*4,245*math.ceil(len(frames)/4)))
 for i,im in enumerate(frames):board.paste(im,(i%4*330,i//4*245))
 board.save(out/(tag+'-playback.png'));playback.append({'tag':tag,'samples':states});assert all(s['renderers']for s in states)
try:
 R.preserve();prepared=True
 # Exercise actual care handlers and transition clocks, including both designs.
 for pet,index in [('5002617',1),('landturtle',4)]:
  for design,gear in [('original',0),('variation',10101)]:
   for action in (['walk']if pet=='5002617'else['idle','feed','wash','walk','sleep','inject']):
    R.open_pet(pet,index)
    if gear==0:R.setup(pet,gear);code_ready(13)
    if action!='idle':
     R.run('care','_PetHouseUI:RequestCare("'+action+'");local result={ok=true}')
     R.wait('care-start','local result={motion=_PetHouseUI.Motion}',lambda r:r['motion']==action)
    capture(pet+'-'+design+'-'+action,1.5 if action=='walk'else .9)
    print('Real playback:',pet,design,action,flush=True)
 R.run('fixture-create','''local H=_PetHouseUI;H:Close();_TitleUI:ShowLobby();H:Open();H.PetMode=false;H.PetPanel.Enable=false;local L=_PetLogic;local list={};local template=_PetUI.PetGearSlots:GetChildByName("Cap"):GetChildByName("Icon");for i=1,8 do local p=_SpawnService:SpawnByEntity(template,"NativeEquipmentQA"..i,Vector3.zero,H.Overlay,false);local t=p.UITransformComponent;t.AnchorsMin=Vector2(.5,.5);t.AnchorsMax=Vector2(.5,.5);t.Pivot=Vector2(.5,.5);t.UIScale=Vector3(1,1,1);t.UIRotation=Vector3.zero;t.RectSize=Vector2(320,320);t.anchoredPosition=_UILogic:ScreenToLocalUIPosition(Vector2(350+((i-1)%4)*400,720-math.floor((i-1)/4)*380),H.Overlay.UITransformComponent);local r=p.SpriteGUIRendererComponent;r.PreserveSprite=PreserveSpriteType.NativeSize;r.LocalScale=Vector2(4,4);r.LocalPosition=Vector2.zero;r.RaycastTarget=false;r.Outline=false;r.DropShadow=false;r.Type=ImageType.Simple;table.insert(list,p)end;L._T.native12Fixtures=list;local result={created=#list}''');created=True
 cases=[]
 for pet,bases in [('5002617',[f['ruid']for f in move['frames']]),('landturtle',list(parts['landturtle']))]:
  cases.extend((pet,base,code,False)for base in bases for code in [13,26])
  for code in range(27):cases.append((pet,bases[0],code,code%2==1))
 for page in range(math.ceil(len(cases)/8)):
  batch=cases[page*8:page*8+8];select(batch);geos=geometry();screen=Image.open(R.s.call('maker_screenshot')['path']).convert('RGB');rgb=np.array(screen)
  for (pet,base,code,flip),g in zip(batch,geos):
   assert not g['bodyEnabled']and g['atomic']
   expected=comp(pet,base,code)
   if flip:expected=expected.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
   a=np.array(expected);h,w=a.shape[:2];rx=screen.width/g['screenW'];ry=screen.height/g['screenH'];left=g['left']*rx;right=g['right']*rx;top=(g['screenH']-g['top'])*ry;bottom=(g['screenH']-g['bottom'])*ry
   yy,xx=np.indices((h,w));sx=np.floor(left+(xx+.5)*(right-left)/w).astype(int);sy=np.floor(top+(yy+.5)*(bottom-top)/h).astype(int);actual=rgb[sy,sx];delta=np.abs(actual.astype(int)-a[:,:,:3].astype(int)).max(axis=2);opaque=a[:,:,3]==255;bad=opaque&(delta>6)
   reports.append({'pet':pet,'frame':base,'code':code,'flip':flip,'opaquePixels':int(opaque.sum()),'differentPixels':int(bad.sum())})
   if bad.any():screen.save(out/f'failure-{page}.png');raise AssertionError(reports[-1])
  screen.save(out/f'actual-frames-{page:02}.png')
  if page%5==0:print('Actual sprite pixels checked',len(reports),'/',len(cases),flush=True)
 errors=R.errors(started);assert not errors,errors[-3:]
 report={'status':'passed','cases':len(reports),'differentPixels':sum(x['differentPixels']for x in reports),'opaquePixels':sum(x['opaquePixels']for x in reports),'details':reports,'playback':playback,'runtimeErrors':errors}
 (out/'actual-verification.json').write_text(json.dumps(report,indent=2));print('PASS',len(reports),'actual frame/combination captures,',len(playback),'normal care playback cases.',flush=True)
finally:
 try:
  if created:R.run('fixture-remove','local L=_PetLogic;for _,p in ipairs(L._T.native12Fixtures or{})do local q=L._T.nativePetGearUI[p.Id];if q~=nil then if isvalid(q.viewport)then q.viewport:Destroy()end;L._T.nativePetGearUI[p.Id]=nil end;if isvalid(p)then p:Destroy()end end;L._T.native12Fixtures=nil;_PetHouseUI.PetPanel.Enable=true;_PetHouseUI.PetMode=true;local result={ok=true}')
  R.run('close','_PetHouseUI:Close();local result={closed=true}')
  if prepared:R.restore()
 finally:R.s.close()
