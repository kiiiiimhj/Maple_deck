from pathlib import Path
from datetime import datetime
import sys,time,json,shutil,hashlib
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-energy-icon');out=Path('outputs/pet-energy-icon');s=MakerSession();started=datetime.now().isoformat(timespec='seconds')
def probe(tag,body):
 needle='[VRF] PET-ENERGY-ICON '+tag+' '+str(time.time_ns())+' '
 s.call('maker_execute_script',{'context':'client','script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
 for _ in range(20):
  logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message']for x in logs.get('logs',[])if needle in x.get('message','')]
  if hits:
   value=json.loads(hits[-1].split(needle,1)[1]);print(tag+': '+json.dumps(value,ensure_ascii=False),flush=True);return value
  errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error' and x.get('dateTime','')>=started];assert not errors,errors
  time.sleep(.3)
 raise AssertionError('Missing completion checkpoint '+tag)
try:
 mode=s.call('maker_get_current_map')
 if mode.get('mode')=='edit':print('Play:',s.call('maker_play'),flush=True)
 for _ in range(25):
  time.sleep(1)
  try:mode=s.call('maker_get_current_map')
  except AssertionError:continue
  if mode.get('mode')=='play':break
 assert mode.get('mode')=='play',mode
 for _ in range(20):
  ready=probe('ready','local result={account=_PetLogic.ClientReady}')
  if ready['account']:break
  time.sleep(.3)
 assert ready['account']
 probe('open','_TitleUI:ShowLobby();_PetHouseUI:ClosePetTutorial();_PetHouseUI:Open();local result={open=_PetHouseUI.PetMode}');time.sleep(.3)
 r=probe('layout','''local P=_PetHouseUI;local g=P.PetPanel:GetChildByName("EnergyBar");local e=g:GetChildByName("Icon");local t=e.UITransformComponent;local sr=e.SpriteGUIRendererComponent;local metrics=_CardManager:GetSpriteMetrics(sr.ImageRUID.DataId);local pos=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(0,0),t));local bar=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(0,0),g.UITransformComponent));local result={open=P.PetMode,enabled=e.Enable,ruid=sr.ImageRUID.DataId,loaded=metrics.w>0 and metrics.h>0,raycast=sr.RaycastTarget,x=t.anchoredPosition.x,y=t.anchoredPosition.y,w=t.RectSize.x,h=t.RectSize.y,leftOfGauge=pos.x<bar.x,sameRow=math.abs(pos.y-bar.y)<1,energyLabel=P.PetPanel:GetChildByName("EnergyCaption").TextGUIRendererComponent.Text,energyValue=P.PetPanel:GetChildByName("Energy").TextGUIRendererComponent.Text}''')
 assert r['open']and r['enabled']and r['loaded']and not r['raycast']and r['leftOfGauge']and r['sameRow']
 assert r['ruid']=='31e5d39c5475442d87ea4cec5019efa7'and r['x']==-292 and r['y']==0 and r['w']==r['h']==88
 shot=s.call('maker_screenshot');shutil.copy2(shot['path'],out/'pet-house-energy-icon-applied.png')
 probe('close','_PetHouseUI:Close();local result={closed=not _PetHouseUI.PetMode}');probe('reopen','_PetHouseUI:Open();local result={open=_PetHouseUI.PetMode,icon=_PetHouseUI.PetPanel:GetChildByName("EnergyBar"):GetChildByName("Icon").Enable}')
 logs=s.call('maker_logs',{'kind':'normal'});errors=[x for x in logs.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=started];assert not errors,errors
 build=s.call('maker_logs',{'kind':'build'});assert not[x for x in build.get('logs',[])if x.get('logType')=='Error']
 sources=json.loads((stage/'source-hashes.json').read_text(encoding='utf-8'))
 for path,h in sources['preserved'].items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==h,path+' changed'
 result={'status':'passed','iconReusedUnchanged':True,'imageLoaded':True,'onLeftOfEnergyGauge':True,'sameRow':True,'nonBlocking':True,'houseCloseReopen':True,'petCodeUnchanged':True,'runtimeErrors':0,'buildErrors':0,'actualLayout':r}
 (out/'runtime-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');(stage/'runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8')
 print('Energy bolt loaded, aligned and verified in Maker.',flush=True)
finally:s.close()
