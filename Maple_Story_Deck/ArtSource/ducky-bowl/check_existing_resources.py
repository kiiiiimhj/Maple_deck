from pathlib import Path
import json,sys,time
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
from remote_mcp import initialize,request
s=MakerSession()
try:
    stamp=str(time.time_ns());needle='[VRF] DUCKY-BOWL existing '+stamp+' '
    s.call('maker_execute_script',{'context':'client','script':'''local f=_PetHouseUI.PetDisplay:GetChildByName("Food");local result={children=#f.Children};if f.SpriteGUIRendererComponent~=nil then result.ruid=f.SpriteGUIRendererComponent.ImageRUID.DataId end;log("'''+needle+'''".._HttpService:JSONEncode(result))'''})
    for _ in range(12):
        time.sleep(.3);logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message'] for x in logs.get('logs',[]) if needle in x.get('message','')]
        if hits:
            data=json.loads(hits[-1].split(needle,1)[1]);Path('work/ducky-bowl/existing-food.json').write_text(json.dumps(data),encoding='utf-8');print(data,flush=True);break
finally:s.close()
initialize()
# This read-only account metadata endpoint accepts resources in the caller's own account.
ruid='172e6e36f588466693f4a7da94fe7ea4'
r=request('tools/call',{'name':'asset_get_account_resource_metadata_bulk','arguments':{'guids':[ruid],'localize':False}},8)
Path('work/ducky-bowl/existing-account-resource.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
result=r.get('result',{})
print(json.dumps({'metadataError':bool(result.get('isError')),'metadataReceived':bool(result.get('structuredContent') or result.get('content'))},ensure_ascii=False),flush=True)
