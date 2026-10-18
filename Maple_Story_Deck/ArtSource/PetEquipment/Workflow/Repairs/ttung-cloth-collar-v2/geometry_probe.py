from pathlib import Path
import sys,json
sys.path.insert(0,str(Path('work/pet-variation-v1').resolve()));from runtime_common import s,run
try:
 r=run('geometry','local p=_PetHouseUI.PetDisplay:GetChildByName("Portrait");local t=p.UITransformComponent;local a=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(-t.RectSize.x/2,t.RectSize.y/2),t));local b=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(t.RectSize.x/2,-t.RectSize.y/2),t));local result={W=_UILogic.ScreenWidth,H=_UILogic.ScreenHeight,left=a.x,top=a.y,right=b.x,bottom=b.y,size=t.RectSize.x,ruid=tostring(p.SpriteGUIRendererComponent.ImageRUID.DataId)}');print(json.dumps(r));Path('outputs/pet-variation-repair-v2/geometry.json').write_text(json.dumps(r,indent=2))
finally:s.close()
