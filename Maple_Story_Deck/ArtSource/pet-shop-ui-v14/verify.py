from pathlib import Path
import sys,json,time,hashlib
from datetime import datetime
from PIL import Image
sys.path.insert(0,str(Path('work/pet-equipment-native-v11').resolve()));import runtime_common as R
out=Path('outputs/pet-shop-ui-v14');started=datetime.now().isoformat(timespec='seconds')
try:
 R.wait('ready','local result={ready=_ShopUI._T.petShop~=nil and _ShopUI._T.petShop.ready}',lambda r:r['ready'])
 before=R.run('state-before','local L=_PetLogic;local rows={};for _,e in ipairs(L:GetPetCatalog())do table.insert(rows,{id=e.id,owned=e.progress~=nil and e.progress.Owned or false})end;local result={coins=_GameManager.TotalCoins,diamond=_GameManager.Diamond,pets=rows}')
 R.run('open','_PetHouseUI:Close();_TitleUI:ShowLobby();_TitleUI:ShowTab("shop");_ShopUI._T.petShop.tab:SendEvent(ButtonClickEvent());local result={ok=true}')
 report=R.run('cards','''local S=_ShopUI;local q=S._T.petShop;local rows={};for i,c in ipairs(q.cards)do local icon=c.portrait.SpriteGUIRendererComponent;local t=c.entity.UITransformComponent;table.insert(rows,{id=c.petId,name=c.name.TextGUIRendererComponent.Text,price=c.price.TextGUIRendererComponent.Text,base=c.bonus.TextGUIRendererComponent.Text,skill=c.skillName.TextGUIRendererComponent.Text,coming=c.coming.TextGUIRendererComponent.Text,portrait=icon.Enable and c.portrait.Enable and tostring(icon.ImageRUID.DataId)==c.body,scale=icon.LocalScale.x,x=t.anchoredPosition.x,y=t.anchoredPosition.y,w=t.RectSize.x,h=t.RectSize.y})end;local result={tab=S._currentTab,visible=q.panel.Enable,skin=S.skinPanel.Enable,diamond=S.scrollTouchArea.Enable,catalog=S:GetPetShopCatalog(),rows=rows}''')
 print('Pet cards:',report,flush=True);assert report['tab']=='pet'and report['visible']and not report['skin']and not report['diamond']
 assert [r['id']for r in report['rows']]==['5002617','ttungttang','5000498','landturtle']
 assert all(r['price']=='1,300 코인'and r['portrait']and r['coming']=='판매 준비 중'for r in report['rows'])
 Image.open(R.s.call('maker_screenshot')['path']).save(out/'actual-pet-shop.png')
 clicks=[]
 for i in range(1,5):
  r=R.run('click','local S=_ShopUI;S._T.petShop.cards['+str(i)+'].entity:SendEvent(ButtonClickEvent());local result={notice=S.noticeText.Text,banner=S.noticeBanner.Enable,skinConfirm=S.buyConfirmPanel.Enable}')
  assert r['banner']and r['notice']=='펫 판매를 준비 중이에요.'and not r['skinConfirm'];clicks.append(r)
 after=R.run('state-after','local L=_PetLogic;local rows={};for _,e in ipairs(L:GetPetCatalog())do table.insert(rows,{id=e.id,owned=e.progress~=nil and e.progress.Owned or false})end;local result={coins=_GameManager.TotalCoins,diamond=_GameManager.Diamond,pets=rows}')
 assert before==after,(before,after)
 tabs=[]
 for name in ['skin','diamond','pet']:
  r=R.run('tab-switch','local S=_ShopUI;local b="'+name+'"=="pet"and S._T.petShop.tab or ("'+name+'"=="skin"and S.tabSkin.Entity or S.tabDiamond.Entity);b:SendEvent(ButtonClickEvent());local result={tab=S._currentTab,pet=S._T.petShop.panel.Enable,skin=S.skinPanel.Enable,diamond=S.scrollTouchArea.Enable}')
  assert r['tab']==name and r['pet']==(name=='pet')and r['skin']==(name=='skin')and r['diamond']==(name=='diamond');tabs.append(r)
 errors=R.errors(started);assert not errors,errors[-5:]
 R.run('finish','_ShopUI.noticeBanner.Enable=false;local result={ok=true}')
 Image.open(R.s.call('maker_screenshot')['path']).save(out/'actual-pet-shop-final.png')
 report.update(status='passed',clicks=clicks,tabChecks=tabs,walletAndOwnershipUnchanged=before==after,runtimeErrors=errors)
 (out/'actual-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS: four price-only pet cards; Oduck excluded; click notices only, wallet/ownership unchanged; all three tabs switch.',flush=True)
finally:R.s.close()
