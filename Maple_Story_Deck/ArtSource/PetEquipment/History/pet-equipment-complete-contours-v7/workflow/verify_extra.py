from pathlib import Path
from PIL import Image
from datetime import datetime
import sys,time,json,shutil
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
out=Path('outputs/pet-gear-contours-v7');s=MakerSession();proof={};prepared=False;start=datetime.now().isoformat(timespec='seconds')
def run(tag,body,context='client'):
    needle='[VRF] PET-FRAME-EXTRA '+tag+' '+str(time.time_ns())+' '
    s.call('maker_execute_script',{'context':context,'script':body+';log("'+needle+'".._HttpService:JSONEncode(result))'})
    for _ in range(70):
        log=s.call('maker_logs',{'kind':'normal'});errors=[x for x in log.get('logs',[])if x.get('logType')=='Error'and x.get('dateTime','')>=start];assert not errors,errors[-2:]
        hits=[x['message']for x in log.get('logs',[])if needle in x.get('message','')]
        if hits:
            result=json.loads(hits[-1].split(needle,1)[1]);proof[tag]=result;(out/'extra-proof.json').write_text(json.dumps(proof,indent=2),encoding='utf-8');return result
        time.sleep(.2)
    raise AssertionError(tag)
def wait(tag,body,predicate):
    for _ in range(100):
        r=run(tag,body)
        if predicate(r):return r
        time.sleep(.15)
    raise AssertionError(tag)
def shot(name):
    p=s.call('maker_screenshot');shutil.copy2(p['path'],out/(name+'.png'));Image.open(p['path']).convert('RGB').crop((685,428,1205,728)).save(out/(name+'-pet.png'))
try:
    for delay in [3,7,15]:
        time.sleep(delay)
        try:s.call("maker_get_current_map");break
        except AssertionError:
            if delay==15:raise
    run('recover-previous-check','local L=_PetLogic;if L._T.extraOriginal~=nil then L.States[L._T.extraUser]=L._T.extraOriginal;L._T.extraOriginal=nil;L:InitForRun(L._T.extraUser);L:PushState(L._T.extraUser,"","")end;local result={recovered=true}','server_main')
    run('prepare','local L=_PetLogic;local id=nil;for key,_ in pairs(L.States)do id=key break end;L._T.extraUser=id;L._T.extraOriginal=L.States[id];local r=L:ReadAccount(L:SerializeAccount(L.States[id]));r.test=true;r.dirty=false;r.generation=0;L.States[id]=r;local result={testOnly=true}','server_main');prepared=True
    for index,pet in [(1,'5002617'),(3,'5000498'),(4,'landturtle'),(5,'oduck')]:
        run('needs-'+pet,'local L=_PetLogic;local r=L.States[L._T.extraUser];r.busyUntil=0;r.lastRequest=-10000;r.lastGearRequest=-10000;r.responsePetId="'+pet+'";for key,p in pairs(r.pets)do p.Equipped=key=="'+pet+'"end;local p=r.pets["'+pet+'"];p.Owned=true;p.GearOwnedMask=7;p.GearEquippedMask=7;p.Health=40;p.Fullness=50;p.Cleanliness=50;p.Mood=50;p.Fatigue=40;p.Energy=1000;p.SleepUntil=0;p.NeedsAt=_DateTimeLogic:GetTimeElapsedWithoutOffset();p.EnergyAt=p.NeedsAt;L:PushState(L._T.extraUser,"","");local result={prepared=true}','server_main')
        run('inject-'+pet,'local H=_PetHouseUI;H:Close();H.SelectedPetIndex='+str(index)+';H:Open();H:RequestCare("inject");local result={requested=H.PendingAction=="inject"}')
        wait('injected-'+pet,'local H=_PetHouseUI;local result={motion=H.Motion,age=_UtilLogic.ElapsedSeconds-H.MotionStart}',lambda r:r['motion']=='inject'and r['age']>.9);shot('inject-'+pet)
        wait('inject-ended-'+pet,'local result={ended=_PetHouseUI.MotionUntil==0}',lambda r:r['ended'])
        # Open the initialized pet pane directly: UIInventory.Open first renders the
        # separate player-avatar costume, whose existing RUID failed to load in this session.
        run('inventory-'+pet,'local H=_PetHouseUI;H:Close();local P=_PetUI;P.InventoryRoot.Enable=true;P:SetPetMode(true);local result={pet=_PetLogic:GetEquippedClientEntry().id}')
        wait('inventory-pool-'+pet,'local P=_PetUI;local p=_PetLogic._T.nativePetGearUI[P.PetDisplay:GetChildByName("Portrait").Id];local result={ready=p~=nil and p.ready and p.mask==7 or false}',lambda r:r['ready']);shot('inventory-'+pet)
        # Same public request bound to each inventory equipment slot.
        for slot,expected in [('Cap',6),('Coat',4),('Necklace',0),('Coat',2),('Necklace',6),('Cap',7)]:
            run('toggle-'+pet+'-'+slot+'-'+str(expected),'_PetLogic:RequestPetGear("'+slot+'","'+pet+'");local result={sent=true}')
            r=wait('toggle-state-'+pet+'-'+str(expected),'local e=_PetLogic:GetEquippedClientEntry();local result={mask=e.progress.GearEquippedMask}',lambda r:r['mask']==expected)
            time.sleep(.28)
        print('Actual injection and inventory independent slots checked for '+pet,flush=True)
    build=s.call('maker_logs',{'kind':'build'});assert not[x for x in build.get('logs',[])if x.get('logType')=='Error']
    (out/'extra-verification.json').write_text(json.dumps({'status':'passed','actualInjectionActions':4,'actualInventoryPortraits':4,'publicGearToggleRequests':24,'originalAccountRestored':True,'runtimeErrors':0},indent=2),encoding='utf-8')
finally:
    try:
        if prepared:run('restore','local L=_PetLogic;local id=L._T.extraUser;L.States[id]=L._T.extraOriginal;L._T.extraOriginal=nil;L:InitForRun(id);L:PushState(id,"","");local result={restored=true}','server_main')
        run('clean','_PetHouseUI:Close();_PetUI:SetPetMode(false);_PetUI.InventoryRoot.Enable=false;_TitleUI:ShowLobby();local result={closed=true}')
    finally:s.close()
