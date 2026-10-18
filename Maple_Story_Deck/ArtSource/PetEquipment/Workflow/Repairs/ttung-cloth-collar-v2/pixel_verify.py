from pathlib import Path
from PIL import Image,ImageDraw
import json,time,sys,numpy as np
sys.path.insert(0,str(Path('work/pet-variation-v1').resolve()))
from runtime_common import s,run,wait,preserve,setup,restore
out=Path('outputs/pet-variation-repair-v2');root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment');prepared=False
frames=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text())['frames'];maps=json.loads((out/'applied-overlay-map.json').read_text());uploads=json.loads((out/'applied-assets.json').read_text());files={r['ruid']:root/r['file']for r in json.loads((root/'Maps/equipment-resources.json').read_text())['resources']};files.update({x['ruid']:Path(x['file'])for x in uploads.values()})
def expected(row,selection,mask):
 im=Image.open(row['file']).convert('RGBA');base=row['ruid']
 for slot,bit,weight in [('coat',2,100),('neck',4,10000),('hat',1,1)]:
  if mask&bit:
   art=maps['variants'][base+':design2'][slot]if(selection//weight)%100==1 else maps['original'][base][slot]
   im.alpha_composite(Image.open(files[art]).convert('RGBA'))
 return im
def snap(row,selection=10101,mask=7,flip=False,name=''):
 result=run('frozen','local H=_PetHouseUI;H.PetMode=false;local entry=H:GetDisplayedPet();entry.progress.GearDesigns='+str(selection)+';entry.progress.GearEquippedMask='+str(mask)+';local p=H.PetDisplay:GetChildByName("Portrait");local r=p.SpriteGUIRendererComponent;r.ImageRUID=DataRef("'+row['ruid']+'");r.FlipX='+str(flip).lower()+';r.Color=Color(1,1,1,1);r.PlayRate=0;p.UITransformComponent.anchoredPosition=Vector2(0,H:GetPortraitY());_PetLogic:AlignCustomPortrait(p,entry,entry.pixelScale);_PetLogic:RenderPetGearUI(p,entry,"'+row['ruid']+'");local t=p.UITransformComponent;local a=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(-t.RectSize.x/2,t.RectSize.y/2),t));local b=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(t.RectSize.x/2,-t.RectSize.y/2),t));local result={left=a.x,top=a.y,right=b.x,bottom=b.y,screenW=_UILogic.ScreenWidth,screenH=_UILogic.ScreenHeight}')
 screen=Image.open(s.call('maker_screenshot')['path']).convert('RGB');native=expected(row,selection,mask)
 if flip:native=native.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
 a=np.array(native);rgb=np.array(screen);ratioX=screen.width/result['screenW'];ratioY=screen.height/result['screenH'];left=result['left']*ratioX;right=result['right']*ratioX;top=(result['screenH']-result['top'])*ratioY;bottom=(result['screenH']-result['bottom'])*ratioY;step=(right-left)/128
 yy,xx=np.indices((128,128));sx=np.floor(left+(xx+.5)*step).astype(int);sy=np.floor(top+(yy+.5)*(bottom-top)/128).astype(int);assert sx.min()>=0 and sy.min()>=0 and sx.max()<screen.width and sy.max()<screen.height,result
 actual=rgb[sy,sx];delta=np.abs(actual.astype(int)-a[:,:,:3].astype(int)).max(axis=2);opaque=a[:,:,3]==255;bad=opaque&(delta>6)
 report={'frame':row['index'],'pose':row['name'],'selection':selection,'mask':mask,'flip':flip,'opaquePixels':int(opaque.sum()),'differentPixels':int(bad.sum()),'maximumDifference':int(delta[opaque].max()),'screenSourcePixelScale':step,'geometry':result}
 if name or bad.any():
  tag=name or f'pixel-mismatch-{row["index"]:02}';screen.save(out/(tag+'.png'));native.resize((512,512),Image.Resampling.NEAREST).save(out/(tag+'-expected.png'));Image.fromarray(actual).resize((512,512),Image.Resampling.NEAREST).save(out/(tag+'-actual-sampled.png'))
  diff=np.zeros((128,128,3),dtype=np.uint8);diff[bad]=[255,0,0];Image.fromarray(diff).resize((512,512),Image.Resampling.NEAREST).save(out/(tag+'-differences.png'))
 return report,screen.crop((round(left),round(top),round(right),round(bottom)))
try:
 wait('ready','local result={ready=_PetLogic.ClientReady and _PetLogic.PetGearReady}',lambda r:r['ready'])
 preserve();prepared=True;setup()
 run('open','_TitleUI:ShowLobby();_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;local H=_PetHouseUI;H.SelectedPetIndex=2;H:Open();local result={open=true}')
 wait('pool','local H=_PetHouseUI;local p=(_PetLogic._T.petGearUI or {})[H.PetDisplay:GetChildByName("Portrait").Id];local result={ready=p~=nil and p.ready or false}',lambda r:r['ready'])
 run('scenery-off','local H=_PetHouseUI;H:SetWalking(false,0);H:SetWater(false,0);H:SetInjection(false,0);H:SetActionScenery("",0);H:SetSleepCushion(false,0);H.PetDisplay:GetChildByName("CareMeters").Enable=false;local result={clear=true}')
 reports=[];contact=Image.new('RGB',(384*8,412*10),(60,50,40));d=ImageDraw.Draw(contact)
 for j,row in enumerate(frames):
  report,im=snap(row,name='actual-fixed-neutral'if j==0 else'');reports.append(report)
  if report['differentPixels']>0:print('Pixel comparison:',report,flush=True)
  contact.paste(im,(j%8*384,j//8*412));d.text((j%8*384+4,j//8*412+384),str(row['index'])+' '+row['name'],fill='white')
  if(j+1)%12==0:print('Actual frame pixels compared',j+1,'/',len(frames),flush=True)
 contact.save(out/'actual-fixed-all-76-frames.png')
 for index in [1,16,51,65,67,68,69,70,71,72,73,74,75,76]:
  r,_=snap(frames[index-1],selection=0,name='actual-fixed-original-'+str(index));reports.append(r)
 for selection,mask,flip in [(1,1,False),(100,2,False),(10000,4,False),(1,7,True),(100,7,True),(10000,7,True),(10101,0,True),(10101,7,True)]:
  r,_=snap(frames[9],selection,mask,flip,name='actual-fixed-mix-'+str(selection)+'-'+str(mask));reports.append(r)
 for code in range(27):
  digits=[code%3,(code//3)%3,code//9];mask=sum(bit for bit,digit in zip([1,2,4],digits)if digit);selection=sum(weight for weight,digit in zip([1,100,10000],digits)if digit==2)
  r,_=snap(frames[0],selection,mask,code%2==1);reports.append(r)
 result={'cases':reports,'frameCases':len(reports),'opaquePixelsChecked':sum(x['opaquePixels']for x in reports),'differentPixels':sum(x['differentPixels']for x in reports)}
 (out/'actual-pixel-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in result.items()if k!='cases'}),flush=True)
 assert result['differentPixels']==0,result['differentPixels']
finally:
 try:
  if prepared:
   run('cleanup','local H=_PetHouseUI;H.PetDisplay:GetChildByName("CareMeters").Enable=true;H.PetMode=true;H:Close();local p=H.PetDisplay:GetChildByName("Portrait");p.SpriteGUIRendererComponent.FlipX=false;p.SpriteGUIRendererComponent.PlayRate=1;local result={clean=true}')
   restore()
 finally:s.close()
