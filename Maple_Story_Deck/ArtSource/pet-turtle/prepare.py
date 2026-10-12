from pathlib import Path
import sys,json,hashlib,urllib.request,time,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
from PIL import Image,ImageDraw
stage=Path('work/pet-turtle');out=Path('outputs/pet-turtle');stage.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
paths={'PetLogic.mlua':'RootDesk/MyDesk/Pet/PetLogic.mlua','GameManager.mlua':'RootDesk/MyDesk/GameManager.mlua','GameText.csv':'RootDesk/MyDesk/Localization/GameText.csv','MonsterProjectileFx.mlua':'RootDesk/MyDesk/Combat/MonsterProjectileFx.mlua','Ep1ProjectileFx.mlua':'RootDesk/MyDesk/Combat/Ep1ProjectileFx.mlua'}
manifest={}
for name,rel in paths.items():
    path=Path('G:/Maple_Story_Deck')/rel;before=stage/(name+'.before')
    if not before.exists():before.write_bytes(path.read_bytes())
    manifest[name]={'path':str(path),'sha256':hashlib.sha256(before.read_bytes()).hexdigest()}
(stage/'sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(stage/'plan.json').write_text(json.dumps({'task':'Add Bugi HP pet, dropping shell decoy for 3s, extend Guri roll to 4s','steps':[{'name':'Inspect native shell pose and existing scarecrow damage route','status':'in_progress'},{'name':'Add catalog/save migration/care/stat/skill and drop impact','status':'pending'},{'name':'Verify all four pets, 3s shielding, drop/impact, pauses and cleanup in Maker','status':'pending'}]},indent=2),encoding='utf-8')
assets={'stand':'ca7fa1b76ac949d6b5008a6a906f195f','rest':'34f1dd005a404a139d9260b4b559d082','roll':'cd0e4d71db7041cabd8d0fe0fdac0951','sleep':'c9b78e76d72b4ddaaaab815e0c3b87eb','sit':'bbc594fe58ff4dafb8dfe20f512478a7','angry':'d25152782c704517ac8d0c04905d3fa4','what':'3773ec3d2b954ac786cbd0ccbe99e342','cry':'6384cd9d454a4a0ab22e11eb8fabd225','dung':'edeb0970e9ce4b388030aa1a208aeafa','stand1':'5766dc81ccbb45e78437d2276541b880'}
for name,ruid in assets.items():
    path=out/(name+'.gif')
    if not path.exists():urllib.request.urlretrieve('https://mod-resource-search-images.dn.nexoncdn.co.kr/maplestory_world/'+ruid+'.gif',path)
    im=Image.open(path);n=im.n_frames
    sheet=Image.new('RGB',(min(n,8)*160,((n+7)//8)*170),(38,47,64));draw=ImageDraw.Draw(sheet)
    for i in range(n):
        im.seek(i);frame=im.convert('RGBA');frame.thumbnail((130,135),Image.Resampling.NEAREST)
        sheet.paste(frame,(i%8*160+(160-frame.width)//2,i//8*170+20),frame);draw.text((i%8*160+8,i//8*170+2),str(i+1),fill='white')
    sheet.save(out/(name+'-frames.png'));print(name,im.size,n,flush=True)
s=MakerSession()
try:
    mode=s.call('maker_get_current_map')
    if mode['mode']=='edit':
        s.call('maker_play')
        for _ in range(15):
            time.sleep(1)
            try:mode=s.call('maker_get_current_map')
            except AssertionError:continue
            if mode.get('mode')=='play':break
    assert mode['mode']=='play',mode
    pairs=','.join('{name="'+n+'",ruid="'+r+'"}' for n,r in assets.items())
    stamp=str(time.time_ns());needle='[VRF] PET-TURTLE inspect '+stamp+' '
    body='local result={};for _,a in ipairs({'+pairs+'})do local clip=_ResourceService:LoadAnimationClipAndWait(a.ruid);local frames={};for i=1,clip.Frames.Count do local f=clip.Frames[i];local sp=f.FrameSprite;local m=_CardManager:GetSpriteMetrics(sp.RUID);table.insert(frames,{ruid=sp.RUID,w=m.w,h=m.h,px=m.px,py=m.py})end;table.insert(result,{name=a.name,frames=frames})end;log("'+needle+'".._HttpService:JSONEncode(result))'
    s.call('maker_execute_script',{'context':'client','script':body})
    for _ in range(15):
        time.sleep(.5);logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message'] for x in logs.get('logs',[]) if needle in x.get('message','')]
        if hits:
            data=json.loads(hits[-1].split(needle,1)[1]);(out/'native-frame-metrics.json').write_text(json.dumps(data,indent=2),encoding='utf-8');print('Native frame geometry ready',flush=True);break
    else:raise AssertionError('Native frame probe did not return')
finally:s.close()
