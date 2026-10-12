from pathlib import Path
from datetime import datetime
import sys,time,json,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-lobby-icon');out=Path('outputs/pet-lobby-icon')
asset=json.loads((out/'applied-assets.json').read_text(encoding='utf-8'))['pet-house-paw']
s=MakerSession();proofs={};started=datetime.now().isoformat(timespec='seconds')
def run(tag,body):
    needle='[VRF] PET-LOBBY-ICON '+tag+' '+str(time.time_ns())+' '
    s.call('maker_execute_script',{'context':'client','script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
    for _ in range(12):
        time.sleep(.3);logs=s.call('maker_logs',{'kind':'normal'})
        hits=[x['message'] for x in logs.get('logs',[]) if needle in x.get('message','')]
        if hits:
            value=json.loads(hits[-1].split(needle,1)[1]);proofs[tag]=value;print(tag+': '+json.dumps(value,ensure_ascii=False),flush=True);return value
        errors=[x for x in logs.get('logs',[]) if x.get('logType')=='Error' and x.get('dateTime','')>=started]
        assert not errors,errors[-3:]
    raise AssertionError('Runtime result missing: '+tag)
try:
    mode=s.call('maker_get_current_map')
    if '--resume' not in sys.argv:
        assert mode['mode']=='edit'
        print('Play:',s.call('maker_play'),flush=True)
    for _ in range(20):
        time.sleep(1)
        try:mode=s.call('maker_get_current_map')
        except AssertionError:continue
        if mode.get('mode')=='play':break
    assert mode.get('mode')=='play'
    for _ in range(20):
        r=run('ready','local b=_PetHouseUI.PetButton;local i=b:GetChildByName("Icon");local result={account=_PetLogic.ClientReady,icon=i.SpriteGUIRendererComponent.ImageRUID.DataId,visible=b.VisibleInHierarchy,width=i.UITransformComponent.RectSize.x,height=i.UITransformComponent.RectSize.y,x=i.UITransformComponent.anchoredPosition.x,y=i.UITransformComponent.anchoredPosition.y}')
        if r['account'] and r['icon']==asset['ruid']:break
        time.sleep(.4)
    assert r['account'] and r['icon']==asset['ruid'] and r['width']==r['height']==104 and r['x']==0 and r['y']==19
    # Returning to the normal battle lobby is read-only with respect to account data.
    run('lobby','_TitleUI:ShowLobby();local result={shown=_TitleUI.titleGroup.Enable}')
    time.sleep(1)
    r=run('layout','''local b=_PetHouseUI.PetButton;local i=b:GetChildByName("Icon");local l=b:GetChildByName("Label");local t=i.UITransformComponent;local lt=l.UITransformComponent;local metrics=_CardManager:GetSpriteMetrics(i.SpriteGUIRendererComponent.ImageRUID.DataId);local result={frame=b.SpriteGUIRendererComponent.ImageRUID.DataId,label=l.TextGUIRendererComponent.Text,gap=t.anchoredPosition.y-t.RectSize.y/2-lt.anchoredPosition.y-lt.RectSize.y/2,loaded=metrics.w>0 and metrics.h>0,visible=b.VisibleInHierarchy}''')
    assert r['frame']=='5828fdca6b1d48198e257b2202833abb' and r['gap']>=2 and r['loaded'] and r['visible']
    shot=s.call('maker_screenshot');shutil.copy2(shot['path'],out/'lobby-applied.png')
    run('activate','_PetHouseUI.PetButton:SendEvent(ButtonClickEvent());local result={sent=true}')
    r=run('opened','local result={open=_PetHouseUI.PetMode,overlay=_PetHouseUI.Overlay.Enable}')
    assert r['open'] and r['overlay']
    run('close','_PetHouseUI.CloseButton:SendEvent(ButtonClickEvent());local result={sent=true}')
    r=run('closed','local result={closed=not _PetHouseUI.PetMode,overlay=not _PetHouseUI.Overlay.Enable,icon=_PetHouseUI.PetButton:GetChildByName("Icon").SpriteGUIRendererComponent.ImageRUID.DataId}')
    assert r['closed'] and r['overlay'] and r['icon']==asset['ruid']
    logs=s.call('maker_logs',{'kind':'normal'});errors=[x for x in logs.get('logs',[]) if x.get('logType')=='Error' and x.get('dateTime','')>=started];assert not errors,errors
    build=s.call('maker_logs',{'kind':'build'});assert not [x for x in build.get('logs',[]) if x.get('logType')=='Error']
    report={'status':'passed','newIconLoaded':True,'squareProportions':True,'labelGapPixels':proofs['layout']['gap'],'existingFrameUnchanged':True,'lobbyButtonOpensPetHouse':True,'closeReturnsToNewIcon':True,'runtimeErrors':0,'buildErrors':0}
    (out/'runtime-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');(stage/'runtime-proof-state.json').write_text(json.dumps(proofs,ensure_ascii=False,indent=2),encoding='utf-8');(stage/'runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8')
    print('New icon loaded and actual lobby button events passed.',flush=True)
finally:s.close()
