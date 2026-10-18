from runtime_common import *
from frame_art import parts,composite,layouts
from PIL import Image,ImageDraw
import numpy as np,math
prepared=False;created=False;reports=[];started=datetime.now().isoformat(timespec='seconds')
def select(batch):
 rows=[{'pet':pet,'base':base,'code':code,'flip':flip}for pet,base,code,flip in batch]
 payload=json.dumps(rows,separators=(',',':'))
 return run('fixture-select','''local L=_PetLogic;local rows=_HttpService:JSONDecode('''+json.dumps(payload)+''');local q=L._T.native11Fixtures;L._T.native11FixtureEntries={};for i,p in ipairs(q)do p.Enable=i<=#rows;if i<=#rows then local row=rows[i];local entry=nil;for _,e in ipairs(L:GetPetCatalog())do if e.id==row.pet then entry=e break end end;local code=row.code;local mask=0;local designs=0;for _,v in ipairs({{1,1},{2,100},{4,10000}})do local digit=code%3;code=math.floor(code/3);if digit>0 then mask=mask+v[1]end;if digit==2 then designs=designs+v[2]end end;entry.progress={Owned=true,GearEquippedMask=mask,GearDesigns=designs};local r=p.SpriteGUIRendererComponent;r.ImageRUID=DataRef(row.base);r.FlipX=row.flip;r.Color=Color(1,1,1,1);r.PlayRate=0;L:RenderNativePetGearUI(p,entry);L._T.native11FixtureEntries[i]=entry end end;local result={selected=#rows}''')
def geometry(batch):
 return wait('fixture-ready','''local L=_PetLogic;local rows={};local ready=true;for i,p in ipairs(L._T.native11Fixtures)do if p.Enable then L:RenderNativePetGearUI(p,L._T.native11FixtureEntries[i]);local q=L._T.nativePetGearUI[p.Id];local r=p.SpriteGUIRendererComponent;local base=tostring(r.ImageRUID.DataId);local code=L:GetNativePetEquipmentCode(L._T.native11FixtureEntries[i].progress.GearEquippedMask,L._T.native11FixtureEntries[i].progress.GearDesigns);if not q.ready or q.base~=base or q.code~=code then ready=false end;local t=q.viewport.UITransformComponent;local a=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(-t.RectSize.x/2,t.RectSize.y/2),t));local b=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(t.RectSize.x/2,-t.RectSize.y/2),t));table.insert(rows,{left=a.x,top=a.y,right=b.x,bottom=b.y,base=q.base,code=q.code,atomic=q.atomic,bodyEnabled=p.SpriteGUIRendererComponent.Enable,screenW=_UILogic.ScreenWidth,screenH=_UILogic.ScreenHeight})end end;local result={ready=ready,rows=rows}''',lambda r:r['ready'])['rows']
try:
 preserve();prepared=True
 for pet in parts:setup(pet)
 run('fixture-create','''local H=_PetHouseUI;_TitleUI:ShowLobby();H:Open();H.PetMode=false;H.PetPanel.Enable=false;local L=_PetLogic;local list={};local template=_PetUI.PetGearSlots:GetChildByName("Cap"):GetChildByName("Icon");for i=1,8 do local p=_SpawnService:SpawnByEntity(template,"NativeEquipmentQA"..i,Vector3.zero,H.Overlay,false);local t=p.UITransformComponent;t.AnchorsMin=Vector2(.5,.5);t.AnchorsMax=Vector2(.5,.5);t.Pivot=Vector2(.5,.5);t.UIScale=Vector3(1,1,1);t.UIRotation=Vector3.zero;t.RectSize=Vector2(320,320);t.anchoredPosition=_UILogic:ScreenToLocalUIPosition(Vector2(350+((i-1)%4)*400,720-math.floor((i-1)/4)*380),H.Overlay.UITransformComponent);local r=p.SpriteGUIRendererComponent;r.PreserveSprite=PreserveSpriteType.NativeSize;r.LocalScale=Vector2(4,4);r.LocalPosition=Vector2.zero;r.RaycastTarget=false;r.Outline=false;r.DropShadow=false;r.Type=ImageType.Simple;table.insert(list,p)end;L._T.native11Fixtures=list;local result={created=#list}''');created=True
 cases=[]
 for pet,rows in parts.items():
  cases.extend((pet,base,26,False)for base in rows)
  cases.extend((pet,base,13,False)for base in rows)
  base=json.loads((out/'stand-reference.json').read_text())[pet]['base']
  cases.extend((pet,base,code,code%2==1)for code in range(27))
 for page in range(math.ceil(len(cases)/8)):
  batch=cases[page*8:page*8+8];select(batch);geos=geometry(batch);time.sleep(.05)
  screen=Image.open(s.call('maker_screenshot')['path']).convert('RGB');rgb=np.array(screen);contact=[]
  for (pet,base,code,flip),g in zip(batch,geos):
   if g['bodyEnabled']or not g['atomic']:raise AssertionError(g)
   expected=composite(pet,base,code)
   if flip:expected=expected.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
   a=np.array(expected);h,w=a.shape[:2];rx=screen.width/g['screenW'];ry=screen.height/g['screenH'];left=g['left']*rx;right=g['right']*rx;top=(g['screenH']-g['top'])*ry;bottom=(g['screenH']-g['bottom'])*ry
   yy,xx=np.indices((h,w));sx=np.floor(left+(xx+.5)*(right-left)/w).astype(int);sy=np.floor(top+(yy+.5)*(bottom-top)/h).astype(int)
   assert sx.min()>=0 and sy.min()>=0 and sx.max()<screen.width and sy.max()<screen.height,g
   actual=rgb[sy,sx];delta=np.abs(actual.astype(int)-a[:,:,:3].astype(int)).max(axis=2);opaque=a[:,:,3]==255;bad=opaque&(delta>6)
   report={'pet':pet,'frame':base,'code':code,'flip':flip,'opaquePixels':int(opaque.sum()),'differentPixels':int(bad.sum()),'maxDifference':int(delta[opaque].max())};reports.append(report)
   if bad.any():
    tag=f'failed-{page}-{pet}-{base[:8]}-{code}';screen.save(out/(tag+'.png'));Image.fromarray(actual).resize((w*3,h*3),Image.Resampling.NEAREST).save(out/(tag+'-actual.png'));expected.resize((w*3,h*3),Image.Resampling.NEAREST).save(out/(tag+'-expected.png'));raise AssertionError(report)
  screen.save(out/f'actual-frame-page-{page:03}.png')
  if(page+1)%8==0:print('Actual source pixels matched',len(reports),'/',len(cases),flush=True)
 report={'status':'passed','cases':len(reports),'opaquePixelsChecked':sum(x['opaquePixels']for x in reports),'differentPixels':sum(x['differentPixels']for x in reports),'details':reports}
 (out/'actual-pixel-verification.json').write_text(json.dumps(report,indent=2));print({k:v for k,v in report.items()if k!='details'},flush=True)
 assert not errors(started)
finally:
 try:
  if created:run('fixture-remove','''local L=_PetLogic;for _,p in ipairs(L._T.native11Fixtures or{})do local q=L._T.nativePetGearUI[p.Id];if q~=nil then if isvalid(q.viewport)then q.viewport:Destroy()end;L._T.nativePetGearUI[p.Id]=nil end;if isvalid(p)then p:Destroy()end end;L._T.native11Fixtures=nil;_PetHouseUI.PetPanel.Enable=true;_PetHouseUI.PetMode=true;_PetHouseUI:Close();local result={removed=true}''')
  if prepared:restore()
 finally:s.close()


