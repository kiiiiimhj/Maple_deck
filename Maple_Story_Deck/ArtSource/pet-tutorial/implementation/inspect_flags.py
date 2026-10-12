from runtime_common import *
try:
 run('flags','local P=_PetHouseUI;local result={open=P.PetTutorialOpen,ready=P.PetTutorialReady,house=P.PetMode,root=P.TutorialRoot.Enable,valid=isvalid(P.TutorialRoot),revealed=P.PetTutorialRevealed,time=P.PetTutorialTime}')
 script('_PetHouseUI:ClosePetTutorial();_PetHouseUI:OpenPetTutorial()',pause=.1)
 run('flags-reopen','local P=_PetHouseUI;local result={open=P.PetTutorialOpen,ready=P.PetTutorialReady,house=P.PetMode,root=P.TutorialRoot.Enable,valid=isvalid(P.TutorialRoot),revealed=P.PetTutorialRevealed,time=P.PetTutorialTime}')
 logs=s.call('maker_logs',{'kind':'normal'});print(json.dumps([x for x in logs.get('logs',[])if 'PET-TUTORIAL' in x.get('message','')][-25:],ensure_ascii=False),flush=True)
finally:s.close()
