from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import sys,json,time,shutil
sys.path.insert(0,'work')
from maker_session import MakerSession
out=Path('outputs/pet-gear-contours-v7');s=MakerSession();preserved=False;passed=False
def run(tag,body,context='client'):
 needle='[VRF] PET-DETAIL-FINAL '+tag+' '+str(time.time_ns())+' '
 s.call('maker_execute_script',{'context':context,'script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
 for _ in range(80):
  rows=s.call('maker_logs',{'kind':'normal'}).get('logs',[]);hits=[x['message']for x in rows if needle in x.get('message','')]
  if hits:return json.loads(hits[-1].split(needle,1)[1])
  time.sleep(.15)
 raise AssertionError(tag)
def shot(name):
 p=s.call('maker_screenshot')['path'];shutil.copy2(p,out/(name+'.png'));im=Image.open(p).convert('RGB');assert im.size==(1868,1051);im.crop((685,428,1205,728)).save(out/(name+'-pet.png'))
try:
 for i in range(15):
  time.sleep(2)
  try:s.call('maker_get_current_map');break
  except AssertionError:
   if i==14:raise
 # Exercise the full-frame blur replacement in the actual world renderer as well.
 native=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());clip=next(c for c in native['clips'] if c['petId']=='landturtle'and c['pose']=='roll')
 ages={};elapsed=0
 for f in clip['frames']:
  ages.setdefault(f['ruid'],elapsed+f['delay']*.25);elapsed+=f['delay']
 params='{'+','.join('{ruid='+json.dumps(r)+',age='+str(a)+'}' for r,a in ages.items())+'}'
 result=run('world-blur','local L=_PetLogic;local pool=L._T.nativePetGearWorld;assert(pool~=nil and pool.ready);local clip='+json.dumps(clip['ruid'])+';local body=L:SpawnPetSkillSprite(clip,pool.map,132);assert(isvalid(body));body.TransformComponent.Scale=Vector3(2,2,1);body.TransformComponent.WorldPosition=Vector3(0,0,0);local r=body.SpriteRendererComponent;r.Color=Color(1,1,1,1);local v={id="landturtle",map=pool.map,body=body,nativeClip=clip,nativeFrameStart=0};local cases=0;for _,frame in ipairs('+params+')do for mask=0,7 do for flip=0,1 do v.age=frame.age;v.gearMask=mask;r.FlipX=flip==1;L:UpdateNativePetSkillGear(v);assert(v.nativeGearBase==frame.ruid);local layer=L.NativePetGearOverlays.landturtle[frame.ruid].coat;local source=pool.actors[frame.ruid].SpriteRendererComponent.Color.a;local painted=pool.actors[layer.ruid].SpriteRendererComponent.Color.a;if L:HasPetGearBit(mask,2)then assert(source==0 and painted>.99);assert(math.abs(pool.actors[layer.ruid].TransformComponent.Scale.x*layer.density-body.TransformComponent.Scale.x)<.0001)else assert(source>.99 and painted==0)end;cases=cases+1 end end end;body:Destroy();for _,e in pairs(pool.actors)do e.SpriteRendererComponent.Color=Color(1,1,1,0)end;pool.selected={};local result={status="passed",cases=cases,originalBrownBodyHiddenWhenCoatEquipped=true}');assert result['cases']==32
 (out/'world-blur-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
 run('preserve','local L=_PetLogic;local id=nil;for k,_ in pairs(L.States)do id=k break end;L._T.finalReviewUser=id;L._T.finalReviewOriginal=L.States[id];local r=L:ReadAccount(L:SerializeAccount(L.States[id]));r.test=true;r.dirty=false;r.generation=0;r.busyUntil=0;r.pendingWalk=nil;local now=_DateTimeLogic:GetTimeElapsedWithoutOffset();for key,p in pairs(r.pets)do p.Owned=true;if key~="ttungttang"then p.GearOwnedMask=7;p.GearEquippedMask=7;p.Fullness=70;p.Cleanliness=70;p.Mood=80;p.Health=80;p.Fatigue=25;p.Energy=1000;p.SleepUntil=0;p.NeedsAt=now;p.EnergyAt=now end end;L.States[id]=r;L:PushState(id,"","");local result={testOnly=true}','server_main');preserved=True
 run('lobby','_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;_TitleUI:ShowLobby();local result={opened=true}')
 for index,pet in [(1,'5002617'),(3,'5000498'),(4,'landturtle'),(5,'oduck')]:
  run('mask-'+pet,'local L=_PetLogic;local id=L._T.finalReviewUser;local r=L.States[id];r.responsePetId="'+pet+'";r.pets["'+pet+'"].GearEquippedMask=2;L:PushState(id,"","");local result={mask=2}','server_main')
  run('open-'+pet,'local H=_PetHouseUI;H:Close();H.SelectedPetIndex='+str(index)+';H:Open();local result={opened=true}');time.sleep(.6);shot('coat-only-'+pet)
  if pet=='oduck':
   user=Image.open('C:/Users/려진/AppData/Local/Temp/codex-clipboard-9c08fccc-8ee9-41b8-8a72-e1de396b5f6c.png').convert('RGB');actual=Image.open(out/'coat-only-oduck-pet.png').convert('RGB').crop((125,25,390,285));board=Image.new('RGB',(700,340),(52,46,39));d=ImageDraw.Draw(board);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',21);d.text((40,16),'사용자 기준 이미지',font=font,fill='white');d.text((375,16),'실제 메이커 · 옷만 착용',font=font,fill='white');board.paste(user,(115,85));board.paste(actual,(365,65));board.save(out/'oduck-reference-comparison.png')
  run('mask-full-'+pet,'local L=_PetLogic;local id=L._T.finalReviewUser;local r=L.States[id];r.pets["'+pet+'"].GearEquippedMask=7;L:PushState(id,"","");local result={mask=7}','server_main');time.sleep(.4);shot('final-worn-'+pet)
 # Freeze one exact Guri frame from the user reference, with the same coat-only mask.
 pages=json.loads(Path('outputs/pet-gear-painted-v5/pages.json').read_text())
 pg=next(p for p in pages if p['pet']=='5002617'and p['page']==4)
 frame=next(f for f in pg['frames']if f['index']==70)
 run('reference-mask','local L=_PetLogic;local id=L._T.finalReviewUser;local r=L.States[id];r.responsePetId="5002617";r.pets["5002617"].GearEquippedMask=2;L:PushState(id,"","");local result={mask=2}','server_main')
 run('reference-open','local H=_PetHouseUI;H:Close();H.SelectedPetIndex=1;H:Open();local result={opened=true}')
 time.sleep(.5)
 frozen=run('reference-frame','local L=_PetLogic;local H=_PetHouseUI;H.Motion="qa";H.MotionUntil=_UtilLogic.ElapsedSeconds+60;H.NextRefresh=_UtilLogic.ElapsedSeconds+60;local e=H:GetDisplayedPet();local p=H.PetDisplay:GetChildByName("Portrait");p.SpriteGUIRendererComponent.PlayRate=0;p.SpriteGUIRendererComponent.ImageRUID=DataRef("'+frame['ruid']+'");L:RenderPetGearUI(p,e,"'+frame['ruid']+'");local pool=L._T.nativePetGearUI[p.Id];local result={base=pool.base,mask=pool.mask,scale=pool.pixelScale,originX=pool.origin.x,originY=pool.origin.y}')
 assert frozen['base']==frame['ruid']and frozen['mask']==2
 time.sleep(.25);shot('guri-reference-exact-frame')
 user=Image.open('C:/Users/려진/AppData/Local/Temp/codex-clipboard-ff279f50-e15c-4012-a5d2-67bab5ecbb7f.png').convert('RGBA')
 col,row=frame['cell']%4,frame['cell']//4
 ref=user.crop((round(col*user.width/4),round(row*user.height/5),round((col+1)*user.width/4),round((row+1)*user.height/5)))
 # Keep the reference unaltered other than the cell crop. The actual panel is an actual Maker screenshot.
 board=Image.new('RGB',(1040,390),(52,46,39));d=ImageDraw.Draw(board);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20)
 d.text((15,12),'사용자 원본 · 구리 70번 프레임',font=font,fill='white');d.text((535,12),'실제 메이커 · 같은 프레임 · 옷만 착용',font=font,fill='white')
 board.paste(ref,(100,70),ref);board.paste(Image.open(out/'guri-reference-exact-frame-pet.png').convert('RGB'),(520,55))
 d.text((16,357),'장비 추출 대조용 · 얼굴과 발은 게임 원본 프레임을 유지',font=font,fill='white')
 board.save(out/'guri-user-reference-comparison.png')
 (out/'guri-exact-frame-comparison.json').write_text(json.dumps({'status':'passed','nativeFrame':frame['ruid'],'sourcePage':4,'sourceIndex':70,'gearMask':2,'actualMakerFrameConfirmed':True,'bodyUsesOriginalNativePixels':True,'wholeGeneratedBodyPixelIdentical':False},indent=2),encoding='utf-8')
 run('reference-close','_PetHouseUI:Close();local result={closed=true}')
 run('final-return','local L=_PetLogic;local id=L._T.finalReviewUser;local r=L.States[id];r.responsePetId="oduck";r.pets["5002617"].GearEquippedMask=7;L:PushState(id,"","");local result={set=true}','server_main')
 run('final-open','local H=_PetHouseUI;H.SelectedPetIndex=5;H:Open();local result={opened=true}')
 run('keep-preview','local L=_PetLogic;if L._T.gearDemoOriginalAccount==nil then L._T.gearDemoOriginalAccount=L._T.finalReviewOriginal end;L._T.finalReviewOriginal=nil;local result={testOnly=true,originalAccountPreserved=true}','server_main')
 board=Image.new('RGB',(1040,660),(52,46,39));d=ImageDraw.Draw(board);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',21)
 for i,(pet,name)in enumerate([('5002617','구리'),('5000498','더키'),('landturtle','부기'),('oduck','오덕')]):
  x=i%2*520;y=i//2*330;im=Image.open(out/('final-worn-'+pet+'-pet.png')).convert('RGB');board.paste(im,(x,y+30));d.text((x+18,y+3),name+' · 실제 메이커',font=font,fill='white')
 board.save(out/'actual-four-pets.png');passed=True
 (out/'final-review-verification.json').write_text(json.dumps({'status':'passed','actualCoatOnlyPortraits':4,'actualFullGearPortraits':4,'worldBlurReplacementCases':32,'originalAccountPreserved':True,'makerOnlyEquipmentPreviewLeftOpen':True,'displayedPet':'oduck'},indent=2),encoding='utf-8');print('Final actual portraits, coat-only comparison and 32 world blur cases passed. Maker-only preview left open.',flush=True)
finally:
 if preserved and not passed:run('restore','local L=_PetLogic;L.States[L._T.finalReviewUser]=L._T.finalReviewOriginal;L._T.finalReviewOriginal=nil;L:PushState(L._T.finalReviewUser,"","");local result={restored=true}','server_main')
 s.close()
