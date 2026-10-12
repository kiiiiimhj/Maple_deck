from pathlib import Path
import sys,time,json,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
out=Path('outputs/pet-lobby-icon');out.mkdir(parents=True,exist_ok=True)
stage=Path('work/pet-lobby-icon');stage.mkdir(parents=True,exist_ok=True)
s=MakerSession()
try:
    print('Maker:',s.call('maker_get_current_map'),flush=True)
    stamp=str(time.time_ns());needle='[VRF] PET-LOBBY-ICON inspect '+stamp+' '
    script='''local b=_PetHouseUI.PetButton local icon=b:GetChildByName("Icon") local t=icon.UITransformComponent local r=icon.SpriteGUIRendererComponent
local result={button={width=b.UITransformComponent.RectSize.x,height=b.UITransformComponent.RectSize.y,ruid=b.SpriteGUIRendererComponent.ImageRUID.DataId},icon={ruid=r.ImageRUID.DataId,width=t.RectSize.x,height=t.RectSize.y,x=t.anchoredPosition.x,y=t.anchoredPosition.y,alpha=r.Color.a,preserve=tostring(r.PreserveSprite)},label=b:GetChildByName("Label").TextGUIRendererComponent.Text}
log("NEEDLE".._HttpService:JSONEncode(result))'''.replace('NEEDLE',needle)
    s.call('maker_execute_script',{'context':'client','script':script});time.sleep(1)
    for _ in range(6):
        logs=s.call('maker_logs',{'kind':'normal'})
        hits=[x['message'] for x in logs.get('logs',[]) if needle in x.get('message','')]
        if hits:
            data=json.loads(hits[-1].split(needle,1)[1]);(out/'before-state.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(data,ensure_ascii=False),flush=True);break
        time.sleep(.8)
    else:raise AssertionError('Missing icon state')
    shot=s.call('maker_screenshot');shutil.copy2(shot['path'],out/'lobby-before.png');print('Screenshot saved.',flush=True)
finally:s.close()
