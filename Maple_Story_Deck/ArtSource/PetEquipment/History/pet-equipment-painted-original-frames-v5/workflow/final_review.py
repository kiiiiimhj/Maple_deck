from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import sys,json,time,shutil
sys.path.insert(0,'work')
from maker_session import MakerSession
out=Path('outputs/pet-gear-painted-v5');s=MakerSession();preserved=False;passed=False
def run(tag,body,context='client'):
 needle='[VRF] PET-PAINTED-FINAL '+tag+' '+str(time.time_ns())+' '
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
 result=run('world-blur','local L=_PetLogic;local pool=L._T.nativePetGearWorld;assert(pool~=nil and pool.ready);local clip='+json.dumps(clip['ruid'])+';local body=L:SpawnPetSkillSprite(clip,pool.map,132);assert(isvalid(body));body.TransformComponent.Scale=Vector3(2,2,1);body.TransformComponent.WorldPosition=Vector3(0,0,0);local r=body.SpriteRendererComponent;r.Color=Color(1,1,1,1);local v={id="landturtle",map=pool.map,body=body,nativeClip=clip,nativeFrameStart=0};local cases=0;for _,frame in ipairs('+params+')do for mask=0,7 do for flip=0,1 do v.age=frame.age;v.gearMask=mask;r.FlipX=flip==1;L:UpdateNativePetSkillGear(v);assert(v.nativeGearBase==frame.ruid);local layer=L.NativePetGearOverlays.landturtle[frame.ruid].coat;local source=pool.actors[frame.ruid].SpriteRendererComponent.Color.a;local painted=pool.actors[layer.ruid].SpriteRendererComponent.Color.a;if L:HasPetGearBit(mask,2)then assert(source==0 and painted>.99)else assert(source>.99 and painted==0)end;cases=cases+1 end end end;body:Destroy();for _,e in pairs(pool.actors)do e.SpriteRendererComponent.Color=Color(1,1,1,0)end;pool.selected={};local result={status="passed",cases=cases,originalBrownBodyHiddenWhenCoatEquipped=true}');assert result['cases']==32
 (out/'world-blur-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
 run('preserve','local L=_PetLogic;local id=nil;for k,_ in pairs(L.States)do id=k break end;L._T.finalReviewUser=id;L._T.finalReviewOriginal=L.States[id];local r=L:ReadAccount(L:SerializeAccount(L.States[id]));r.test=true;r.dirty=false;r.generation=0;r.busyUntil=0;r.pendingWalk=nil;local now=_DateTimeLogic:GetTimeElapsedWithoutOffset();for key,p in pairs(r.pets)do p.Owned=true;if key~="ttungttang"then p.GearOwnedMask=7;p.GearEquippedMask=7;p.Fullness=70;p.Cleanliness=70;p.Mood=80;p.Health=80;p.Fatigue=25;p.Energy=1000;p.SleepUntil=0;p.NeedsAt=now;p.EnergyAt=now end end;L.States[id]=r;L:PushState(id,"","");local result={testOnly=true}','server_main');preserved=True
 run('lobby','_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;_TitleUI:ShowLobby();local result={opened=true}')
 for index,pet in [(1,'5002617'),(3,'5000498'),(4,'landturtle'),(5,'oduck')]:
  run('mask-'+pet,'local L=_PetLogic;local id=L._T.finalReviewUser;local r=L.States[id];r.responsePetId="'+pet+'";r.pets["'+pet+'"].GearEquippedMask=2;L:PushState(id,"","");local result={mask=2}','server_main')
  run('open-'+pet,'local H=_PetHouseUI;H:Close();H.SelectedPetIndex='+str(index)+';H:Open();local result={opened=true}');time.sleep(.6);shot('coat-only-'+pet)
  if pet=='oduck':
   user=Image.open('C:/Users/려진/AppData/Local/Temp/codex-clipboard-9c08fccc-8ee9-41b8-8a72-e1de396b5f6c.png').convert('RGB');actual=Image.open(out/'coat-only-oduck-pet.png').convert('RGB').crop((125,25,390,285));board=Image.new('RGB',(700,340),(52,46,39));d=ImageDraw.Draw(board);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',21);d.text((40,16),'사용자 기준 이미지',font=font,fill='white');d.text((375,16),'실제 메이커 · 옷만 착용',font=font,fill='white');board.paste(user,(115,85));board.paste(actual,(365,65));board.save(out/'oduck-reference-comparison.png')
  run('mask-full-'+pet,'local L=_PetLogic;local id=L._T.finalReviewUser;local r=L.States[id];r.pets["'+pet+'"].GearEquippedMask=7;L:PushState(id,"","");local result={mask=7}','server_main');time.sleep(.4);shot('final-worn-'+pet)
 run('keep-preview','local L=_PetLogic;if L._T.gearDemoOriginalAccount==nil then L._T.gearDemoOriginalAccount=L._T.finalReviewOriginal end;L._T.finalReviewOriginal=nil;local result={testOnly=true,originalAccountPreserved=true}','server_main')
 board=Image.new('RGB',(1040,660),(52,46,39));d=ImageDraw.Draw(board);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',21)
 for i,(pet,name)in enumerate([('5002617','구리'),('5000498','더키'),('landturtle','부기'),('oduck','오덕')]):
  x=i%2*520;y=i//2*330;im=Image.open(out/('final-worn-'+pet+'-pet.png')).convert('RGB');board.paste(im,(x,y+30));d.text((x+18,y+3),name+' · 실제 메이커',font=font,fill='white')
 board.save(out/'actual-four-pets.png');passed=True
 (out/'final-review-verification.json').write_text(json.dumps({'status':'passed','actualCoatOnlyPortraits':4,'actualFullGearPortraits':4,'worldBlurReplacementCases':32,'originalAccountPreserved':True,'makerOnlyEquipmentPreviewLeftOpen':True,'displayedPet':'oduck'},indent=2),encoding='utf-8');print('Final actual portraits, coat-only comparison and 32 world blur cases passed. Maker-only preview left open.',flush=True)
finally:
 if preserved and not passed:run('restore','local L=_PetLogic;L.States[L._T.finalReviewUser]=L._T.finalReviewOriginal;L._T.finalReviewOriginal=nil;L:PushState(L._T.finalReviewUser,"","");local result={restored=true}','server_main')
 s.close()
