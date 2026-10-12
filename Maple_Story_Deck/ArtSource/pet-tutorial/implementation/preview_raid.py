from pathlib import Path
import sys,time,json,shutil
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
out=Path('outputs/pet-tutorial');out.mkdir(parents=True,exist_ok=True)
s=MakerSession()
try:
 assert s.call('maker_get_current_map')['mode']=='play'
 # Read-only visual preview. Restore local guide state without MarkTutorialSeen RPC.
 body='''local r=_RaidTutorialUI;if r._tutorialOpen then log("[VRF] PET-TUTORIAL raid-preview busy")return end;r._T.petPreview={guide=r._guideActive,banner=r._bannerActive,announce=r._announceDone,seen=r._seenLocal};r:OpenTutorial()'''
 s.call('maker_execute_script',{'context':'client','script':body});time.sleep(4.3)
 shot=s.call('maker_screenshot');shutil.copy2(shot['path'],out/'raid-tutorial-reference.png')
 s.call('maker_execute_script',{'context':'client','script':'''local r=_RaidTutorialUI;local p=r._T.petPreview;if p~=nil then r._tutorialOpen=false;r.tutorialRoot.Enable=false;r._seenLocal=p.seen;r._announceDone=p.announce;r._guideActive=p.guide;r._bannerActive=p.banner;if isvalid(r.guideFinger)then r.guideFinger.Enable=p.guide end;if isvalid(r.banner)then r.banner.Enable=p.banner end;r._T.petPreview=nil end;log("[VRF] PET-TUTORIAL raid preview restored without save")'''});time.sleep(.4)
 s.call('maker_execute_script',{'context':'client','script':'_PetHouseUI:Open();log("[VRF] PET-TUTORIAL house preview opened")'});time.sleep(1)
 shot=s.call('maker_screenshot');shutil.copy2(shot['path'],out/'pet-house-reference.png')
 s.call('maker_execute_script',{'context':'client','script':'_PetHouseUI:Close();log("[VRF] PET-TUTORIAL house preview restored")'})
 print('Raid guide and current pet-house screenshots captured without account changes.',flush=True)
finally:s.close()
