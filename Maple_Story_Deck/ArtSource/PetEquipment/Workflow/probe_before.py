from pathlib import Path
from PIL import Image
import ast,time,json,sys
sys.path.insert(0,'work/pet-gear-pose-v9')
from runtime_common import s,run,wait,preserve,setup,restore
out=Path('outputs/pet-gear-clean-v10');prepared=False
tree=ast.parse(Path('work/pet-gear-motion-v8/verify_runtime.py').read_text(encoding='utf-8'));exec(ast.unparse(next(x for x in tree.body if isinstance(x,ast.FunctionDef)and x.name=='open_pet')),globals())
def shot(name):
 p=s.call('maker_screenshot')['path'];Image.open(p).convert('RGB').crop((765,420,1160,730)).save(out/(name+'.png'))
try:
 preserve();prepared=True;open_pet(1,'5002617')
 run('walk','_PetHouseUI:RequestCare("walk");local result={requested=true}')
 wait('walk-start','local result={motion=_PetHouseUI.Motion}',lambda r:r['motion']=='walk')
 q=run('layers','local H=_PetHouseUI;local p=H.PetDisplay:GetChildByName("Portrait");H.Motion="qa";H.MotionUntil=_UtilLogic.ElapsedSeconds+60;H.NextRefresh=_UtilLogic.ElapsedSeconds+60;H:SetWalking(true,1.8);p.SpriteGUIRendererComponent.PlayRate=0;p.SpriteGUIRendererComponent.ImageRUID=DataRef(H.WalkFrameRUIDs[1]);local mouth=H.WalkSmile:GetChildByName("Mouth");local result={smileParent=H.WalkSmile.Enable,mouthEntity=mouth.Enable,mouthRenderer=mouth.SpriteGUIRendererComponent.Enable,mouthResource=tostring(mouth.SpriteGUIRendererComponent.ImageRUID.DataId),maskWidth=H.WalkSmile.UITransformComponent.RectSize.x,maskHeight=H.WalkSmile.UITransformComponent.RectSize.y}')
 time.sleep(.4);shot('before-walk-extra-face')
 run('hide-extra','local H=_PetHouseUI;H.WalkSmile.Enable=false;local result={hidden=true}');time.sleep(.15);shot('before-walk-with-extra-face-hidden')
 (out/'before-live-layer-proof.json').write_text(json.dumps(q,indent=2),encoding='utf-8');print(q)
finally:
 try:
  run('clean','_PetHouseUI:Close();_PetHouseUI.PetDisplay:GetChildByName("Portrait").SpriteGUIRendererComponent.PlayRate=1;local result={clean=true}')
  if prepared:restore()
 finally:s.close()
