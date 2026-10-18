from pathlib import Path
from datetime import datetime
import sys,json,time,hashlib
from PIL import Image
sys.path.insert(0,str(Path('work/pet-equipment-native-v11').resolve()));import runtime_common as R
stage=Path('work/pet-shop-alignment-v15');out=Path('outputs/pet-shop-alignment-v15')
started=datetime.now().isoformat(timespec='seconds')
try:
 R.wait('shop-ready','local result={ready=_ShopUI._T.petShop~=nil and _ShopUI._T.petShop.ready}',lambda r:r['ready'])
 R.run('shop-open','_TitleUI:ShowLobby();_TitleUI:ShowTab("shop");_ShopUI._T.petShop.tab:SendEvent(ButtonClickEvent());local result={ok=true}')
 r=R.run('alignment-final','''local q=_ShopUI._T.petShop;local rows={};for _,c in ipairs(q.cards)do local it=c.skillIcon.UITransformComponent;local nt=c.skillName.UITransformComponent;local dt=c.skillDesc.UITransformComponent;local pt=c.price.UITransformComponent;local bt=c.price.Parent.UITransformComponent;local p=c.price.TextGUIRendererComponent.Padding;local np=c.skillName.TextGUIRendererComponent.Padding;local ir=c.skillIcon.SpriteGUIRendererComponent;table.insert(rows,{pet=c.petId,skillName=c.skillName.TextGUIRendererComponent.Text,iconX=it.anchoredPosition.x,iconY=it.anchoredPosition.y,iconWidth=it.RectSize.x,iconHeight=it.RectSize.y,iconLocalX=ir.LocalPosition.x,iconLocalY=ir.LocalPosition.y,nameX=nt.anchoredPosition.x,nameWidth=nt.RectSize.x,gap=(nt.anchoredPosition.x-nt.RectSize.x/2)-(it.anchoredPosition.x+it.RectSize.x/2),nameAlign=tostring(c.skillName.TextGUIRendererComponent.HorizontalAlignment),namePadding=np.left+np.right+np.top+np.bottom,descX=dt.anchoredPosition.x,descAlign=tostring(c.skillDesc.TextGUIRendererComponent.HorizontalAlignment),intervalX=c.interval.UITransformComponent.anchoredPosition.x,intervalAlign=tostring(c.interval.TextGUIRendererComponent.HorizontalAlignment),price=c.price.TextGUIRendererComponent.Text,priceX=pt.anchoredPosition.x,priceY=pt.anchoredPosition.y,priceBoxX=bt.anchoredPosition.x,priceAlign=tostring(c.price.TextGUIRendererComponent.HorizontalAlignment),priceVertical=tostring(c.price.TextGUIRendererComponent.VerticalAlignment),pricePadding=p.left+p.right+p.top+p.bottom})end;local result={ready=q.ready,tab=_ShopUI._currentTab,rows=rows}''')
 assert r['ready']and r['tab']=='pet'and len(r['rows'])==4
 assert [x['pet']for x in r['rows']]==['5002617','ttungttang','5000498','landturtle']
 for x in r['rows']:
  assert x['iconX']==-116 and x['gap']==6 and x['nameAlign']=='Left'and x['namePadding']==0,x
  assert x['descX']==0 and x['descAlign']=='Center'and x['intervalX']==0 and x['intervalAlign']=='Center',x
  assert x['price']=='1,300 코인'and x['priceX']==0 and x['priceBoxX']==0 and x['priceY']==4 and x['priceAlign']=='Center'and x['priceVertical']=='Middle'and x['pricePadding']==0,x
 assert abs(r['rows'][3]['iconLocalY']+9.5)<.01,r['rows'][3]
 time.sleep(.5);Image.open(R.s.call('maker_screenshot')['path']).save(out/'actual-pet-shop-aligned.png')
 r['runtimeErrors']=R.errors(started);assert not r['runtimeErrors'],r['runtimeErrors']
 source=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/UI/ShopUI.mlua')
 assert source.read_bytes()==(stage/'ShopUI.mlua').read_bytes()
 r['sourceHash']=hashlib.sha256(source.read_bytes()).hexdigest()
 for name,folder in [('ShopPurchaseLogic.mlua','UI'),('PetLogic.mlua','Pet'),('PetHouseUI.mlua','Pet')]:
  assert (Path('G:/Maple_Story_Deck/RootDesk/MyDesk')/folder/name).read_bytes()==(stage/(name+'.before')).read_bytes(),name+' changed'
 (out/'actual-verification.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
 print('Actual Maker: four cards, 6 px icon/name gap, centered descriptions and prices, source saved; no runtime errors.',flush=True)
finally:R.s.close()
