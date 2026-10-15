from runtime_common import *
prepared=False
try:
 preserve();prepared=True;setup('5000498')
 run('feed','_TitleUI:ShowLobby();local H=_PetHouseUI;H:Close();H.SelectedPetIndex=3;H:Open();H:RequestCare("feed");local result={requested=true}')
 wait('feeding','local H=_PetHouseUI;local result={motion=H.Motion,age=_UtilLogic.ElapsedSeconds-H.MotionStart}',lambda r:r['motion']=='feed' and r['age']>.65)
 result=run('bowl','local H=_PetHouseUI;local b=H.DuckyFoodBowl;local r=b.SpriteGUIRendererComponent;local t=b.UITransformComponent;local result={entityEnable=b.Enable,rendererEnable=r.Enable,alpha=r.Color.a,ready=H.DuckyBowlReady,x=t.anchoredPosition.x,y=t.anchoredPosition.y,width=t.RectSize.x}')
 shot('before-ducky-bowl')
 (out/'before-bowl.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result),flush=True)
finally:
 if prepared:restore()
 s.close()
