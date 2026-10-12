from pathlib import Path
s=Path('work/pet-turtle/runtime_verify.py').read_text(encoding='utf-8')
head=s[:s.index('try:\n')]
tail=s[s.index("    r=run('fixtures'"):]
setup='''try:
    assert all("care-"+a in proofs and proofs["care-"+a]["action"]==a for a in ["feed","wash","walk","sleep","inject"])
    run('resume-boot','local result={ready=_PetLogic.TurtleReady}',pause=.1)
    logs=s.call('maker_logs',{'kind':'normal'});start=max(x['dateTime'] for x in logs.get('logs',[]) if prefix+'resume-boot ' in x.get('message',''))
    (stage/'runtime-start.json').write_text(json.dumps({'start':start}),encoding='utf-8')
    run('combat-preview',"local id=nil;for uid,r in pairs(_PetLogic.States)do id=uid;_PetLogic._T.bugiOriginalRecord=r end;_PetLogic._T.bugiOriginalUser=id;_PetLogic._T.bugiOriginalDebug=_CardManager.DebugMode;local rec=_PetLogic:ReadAccount(_PetLogic:SerializeAccount(_PetLogic._T.bugiOriginalRecord));rec.test=true;rec.dirty=false;rec.pets.landturtle.Owned=true;for petId,p in pairs(rec.pets)do p.Equipped=petId=='landturtle' end;_PetLogic.States[id]=rec;_PetLogic:PushState(id,'','');local result={ready=true}",server,.3)
    started=True
    script('_PetHouseUI:Close();_TitleUI.titleGroup.Enable=false;_GameManager:RequestStartGame(false,0,1)',pause=4)
'''
Path('work/pet-turtle/resume_combat.py').write_text(head+setup+tail,encoding='utf-8')
