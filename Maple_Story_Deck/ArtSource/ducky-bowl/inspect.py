from pathlib import Path
import sys,json,hashlib,time,urllib.request
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
from PIL import Image,ImageDraw
stage=Path('work/ducky-bowl');out=Path('outputs/ducky-bowl');stage.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
p=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetHouseUI.mlua');backup=stage/'PetHouseUI.mlua.before'
if not backup.exists():backup.write_bytes(p.read_bytes())
(stage/'sources.json').write_text(json.dumps({'PetHouseUI.mlua':{'path':str(p),'sha256':hashlib.sha256(backup.read_bytes()).hexdigest()}},indent=2),encoding='utf-8')
(stage/'plan.json').write_text(json.dumps({'task':'Add a pixel food bowl to Ducky eating only','steps':[{'name':'Inspect original eating pose and available bowl artwork','status':'in_progress'},{'name':'Add fixed bowl placement/fade and cleanup','status':'pending'},{'name':'Verify feeding twice and other pets/actions unchanged in Maker','status':'pending'}]},indent=2),encoding='utf-8')
ruid='1b2ef1073fa14e8f906327425b4b4a1a';path=out/'ducky-eat.gif'
if not path.exists():urllib.request.urlretrieve('https://mod-resource-search-images.dn.nexoncdn.co.kr/maplestory_world/'+ruid+'.gif',path)
im=Image.open(path);sheet=Image.new('RGB',(min(8,im.n_frames)*190,((im.n_frames+7)//8)*150),(30,40,55));draw=ImageDraw.Draw(sheet)
for i in range(im.n_frames):
    im.seek(i);frame=im.convert('RGBA');frame.thumbnail((175,125),Image.Resampling.NEAREST);sheet.paste(frame,(i%8*190+(190-frame.width)//2,i//8*150+20),frame);draw.text((i%8*190+6,i//8*150+3),str(i+1),fill='white')
sheet.save(out/'ducky-eat-frames.png');print('Eating frames:',im.n_frames,flush=True)
s=MakerSession()
try:
    mode=s.call('maker_get_current_map');print('Maker:',mode,flush=True)
    if mode['mode']=='play':
        stamp=str(time.time_ns());needle='[VRF] DUCKY-BOWL inspect '+stamp+' '
        s.call('maker_execute_script',{'context':'client','script':'''local food=_PetHouseUI.PetDisplay:GetChildByName("Food");local bowl=food:GetChildByName("Bowl");local result={foodEnabled=food.Enable,bowlValid=isvalid(bowl)};if isvalid(bowl) then local t=bowl.UITransformComponent;local r=bowl.SpriteGUIRendererComponent;result.bowl={ruid=r.ImageRUID.DataId,width=t.RectSize.x,height=t.RectSize.y,x=t.anchoredPosition.x,y=t.anchoredPosition.y}end;log("'''+needle+'''".._HttpService:JSONEncode(result))'''})
        for _ in range(12):
            time.sleep(.3);logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message'] for x in logs.get('logs',[]) if needle in x.get('message','')]
            if hits:
                data=json.loads(hits[-1].split(needle,1)[1]);(stage/'bowl-before.json').write_text(json.dumps(data,indent=2),encoding='utf-8');print(data,flush=True);break
finally:s.close()
