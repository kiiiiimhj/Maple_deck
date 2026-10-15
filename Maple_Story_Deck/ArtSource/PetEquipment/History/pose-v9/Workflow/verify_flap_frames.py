from pathlib import Path
from PIL import Image,ImageDraw
import ast,json,time
from runtime_common import s,run,wait,preserve,setup,restore,out
tree=ast.parse(Path('work/pet-gear-motion-v8/verify_runtime.py').read_text(encoding='utf-8'))
exec(ast.unparse(next(x for x in tree.body if isinstance(x,ast.FunctionDef)and x.name=='open_pet')),globals())
n=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());expected=json.loads((out/'overlay-ruids.json').read_text());prepared=False;proof=[]
try:
 preserve();prepared=True
 for index,pet in [(5,'oduck'),(3,'5000498')]:
  open_pet(index,pet)
  run('hold','local H=_PetHouseUI;H.Motion="qa";H.MotionUntil=_UtilLogic.ElapsedSeconds+120;H.NextRefresh=_UtilLogic.ElapsedSeconds+120;H.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.PlayRate=0;local result={held=true}')
  for pose in ['chat','love','move']:
   c=next(c for c in n['clips']if c['petId']==pet and c['pose']==pose);board=Image.new('RGB',(1300,310*((len(c['frames'])+3)//4)),(48,43,38));draw=ImageDraw.Draw(board)
   for i,f in enumerate(c['frames']):
    ruid=f['ruid'];run('frame','local H=_PetHouseUI;local p=H.PetDisplay:GetChildByName("Portrait");p.SpriteGUIRendererComponent.ImageRUID=DataRef("'+ruid+'");_PetLogic:RenderPetGearUI(p,H:GetDisplayedPet(),"");local result={set=true}')
    q=wait('ready-frame','local H=_PetHouseUI;local p=_PetLogic._T.nativePetGearUI[H.PetDisplay:GetChildByName("Portrait").Id];local layer=_PetLogic.NativePetGearOverlays[p.petId][p.base];local result={base=p.base,mask=p.mask,warming=p.warmingClip~=nil,coat=layer.coat.ruid}',lambda r:r['base']==ruid and r['mask']==7 and not r['warming']);assert q['coat']==expected[pet][ruid]['coat']['ruid'];proof.append({'pet':pet,'pose':pose,'index':i,'base':ruid,'actualCoat':q['coat']})
    time.sleep(.05);p=s.call('maker_screenshot')['path'];im=Image.open(p).convert('RGB').crop((785,430,1110,720));board.paste(im,(i%4*325,i//4*310));draw.text((i%4*325+8,i//4*310+293),pose+' / '+str(i),fill='white')
   board.save(out/('actual-all-'+pet+'-'+pose+'.png'));print('Actual full frame visual sheet:',pet,pose,len(c['frames']),flush=True)
  run('close','_PetHouseUI:Close();local result={closed=true}')
 report={'status':'passed','actualMakerFrames':len(proof),'poses':['chat','love','move'],'pets':['oduck','5000498'],'sourceCoatRUIDsConfirmed':True}
 (out/'flap-frame-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(out/'flap-frame-proof.json').write_text(json.dumps(proof,indent=2),encoding='utf-8')
finally:
 try:
  run('close','_PetHouseUI:Close();_PetHouseUI.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.PlayRate=1;local result={closed=true}')
  if prepared:restore()
 finally:s.close()
