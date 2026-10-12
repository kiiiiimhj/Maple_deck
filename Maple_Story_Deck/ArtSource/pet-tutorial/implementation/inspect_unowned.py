from runtime_common import *
try:
 run('conditions','local P=_PetHouseUI;local result={house=P.PetMode,title=P.TitleGroup.Enable,battle=P.TitleGroup:GetChildByName("BattlePanel").Enable,game=_GameManager.GameStarted,over=_GameManager.GameOver,root=P.TutorialRoot.Enable,owned=P:GetDisplayedPet().progress.Owned}')
 script('_TitleUI:ShowLobby()',pause=1)
 run('conditions-lobby','local P=_PetHouseUI;local result={house=P.PetMode,title=P.TitleGroup.Enable,battle=P.TitleGroup:GetChildByName("BattlePanel").Enable,game=_GameManager.GameStarted,over=_GameManager.GameOver,root=P.TutorialRoot.Enable,owned=P:GetDisplayedPet().progress.Owned}')
 script('_PetHouseUI:Open();_PetHouseUI:OpenPetTutorial()',pause=1)
 run('conditions-open','local P=_PetHouseUI;local result={house=P.PetMode,title=P.TitleGroup.Enable,battle=P.TitleGroup:GetChildByName("BattlePanel").Enable,game=_GameManager.GameStarted,over=_GameManager.GameOver,root=P.TutorialRoot.Enable,owned=P:GetDisplayedPet().progress.Owned}')
finally:s.close()
