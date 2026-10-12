from runtime_common import *
try:
 run('live', '''local P=_PetHouseUI;local rows={};for i=1,7 do local e=P:GetPetTutorialSequence(i);local t=e.UITransformComponent;local r={name=e.Name,enabled=e.Enable,alpha=e.CanvasGroupComponent.GroupAlpha,x=t.anchoredPosition.x,y=t.anchoredPosition.y,scale=t.UIScale.x};if i%2==1 then local im=e:GetChildByName("Img");local m=_CardManager:GetSpriteMetrics(im.SpriteGUIRendererComponent.ImageRUID.DataId);r.ruid=im.SpriteGUIRendererComponent.ImageRUID.DataId;r.loaded=m.w>0;r.text=e:GetChildByName("Label").TextGUIRendererComponent.Text end;table.insert(rows,r)end;local result={open=P.PetTutorialOpen,revealed=P.PetTutorialRevealed,time=P.PetTutorialTime,rows=rows}''')
 shot('pet-tutorial-before-arrow-fix.png')
finally:s.close()
