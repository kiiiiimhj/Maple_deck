from pathlib import Path
import sys,json,time
from PIL import Image
from datetime import datetime
sys.path.insert(0,str(Path('work/pet-equipment-native-v11').resolve()));import runtime_common as R
out=Path('outputs/pet-shop-ui-v14');started=datetime.now().isoformat(timespec='seconds')
try:
 R.wait('ready','local result={ready=_ShopUI._T.petShop~=nil and _ShopUI._T.petShop.ready}',lambda r:r['ready'])
 R.run('open','_TitleUI:ShowLobby();_TitleUI:ShowTab("shop");_ShopUI._T.petShop.tab:SendEvent(ButtonClickEvent());local result={ok=true}')
 report=R.run('layout','''local S=_ShopUI;local q=S._T.petShop;local t=q.panel.UITransformComponent;local old=S.skinPanelRoot.UITransformComponent;local rows={};for _,c in ipairs(q.cards)do local ct=c.entity.UITransformComponent;table.insert(rows,{x=ct.anchoredPosition.x,y=ct.anchoredPosition.y,w=ct.RectSize.x,h=ct.RectSize.y,price=c.price.TextGUIRendererComponent.Text,pet=c.petId,captionY=c.coming.UITransformComponent.anchoredPosition.y,captionH=c.coming.UITransformComponent.RectSize.y,caption=c.coming.TextGUIRendererComponent.Text})end;local result={panelX=t.anchoredPosition.x,panelY=t.anchoredPosition.y,referenceX=old.anchoredPosition.x,referenceY=old.anchoredPosition.y,w=t.RectSize.x,h=t.RectSize.y,rows=rows,petVisible=q.panel.Enable,skinVisible=S.skinPanel.Enable,diamondVisible=S.scrollTouchArea.Enable}''')
 assert abs(report['panelX']-report['referenceX'])<.01 and abs(report['panelY']-report['referenceY'])<.01
 assert len(report['rows'])==4 and report['petVisible']and not report['skinVisible']and not report['diamondVisible']
 for row in report['rows']:
  assert abs(row['x'])+row['w']/2<=report['w']/2 and abs(row['y'])+row['h']/2<=report['h']/2
  assert row['h']/2+row['captionY']-row['captionH']/2>=16 and row['price']=='1,300 코인'
 errors=R.errors(started);assert not errors,errors
 Image.open(R.s.call('maker_screenshot')['path']).save(out/'actual-pet-shop-final.png')
 old=json.loads((out/'actual-verification.json').read_text());old['finalLayout']=report;old['layoutRuntimeErrors']=errors;(out/'actual-verification.json').write_text(json.dumps(old,ensure_ascii=False,indent=2))
 print('Final layout passed: all four cards inside the shop panel; caption clears bottom rim.',flush=True)
finally:R.s.close()
