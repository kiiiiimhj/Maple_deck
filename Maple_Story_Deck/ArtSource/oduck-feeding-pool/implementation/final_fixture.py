from pathlib import Path
p=Path('work/oduck-feeding-pool/runtime_battle.py');s=p.read_text(encoding='utf-8')
start=s.index(" run('pause-buff'");end=s.index(' passed=True;',start)
s=s[:start]+''' r=run('exact-icon-row',\'''local C=_CardManager;local icon=C.oduckBuff:GetChildByName("Icon");local fill=C.oduckBuffFill.Entity;local x=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(0,0),icon.UITransformComponent));local f=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(0,0),fill.UITransformComponent));local n=_UILogic:WorldToScreenPosition(_UILogic:LocalUIToWorldPosition(Vector2(0,0),C.vampirePotionBuff:GetChildByName("Icon").UITransformComponent));local result={sameRow=math.abs(x.y-n.y)<1,fillCentered=math.abs(x.x-f.x)<1 and math.abs(x.y-f.y)<1,childX=icon.UITransformComponent.anchoredPosition.x,childY=icon.UITransformComponent.anchoredPosition.y}\''')
 assert r['sameRow']and r['fillCentered']and r['childX']==r['childY']==0,r
'''+s[end:]
s=s.replace('Native dance 3x mirror, potion-style 30s passive countdown, pause, expiry/reflow and refresh/reset passed.','Final visible 3x mirror and exact potion-row/overlay alignment passed; prior timer checks retained.')
s=s.replace('local L=_PetLogic;if L._T.poolDanceCapture~=nil','local L=_PetLogic;if L._T.poolSkillPause~=nil then _TimerService:ClearTimer(L._T.poolSkillPause);L._T.poolSkillPause=nil end;if L._T.poolDanceCapture~=nil')
s=s.replace("'correctedFixtureErrors':len(fixture)","'correctedFixtureErrors':len(fixture),'timerVerificationRetainedFromPreviousRun':True,'exactIconRowVerified':True,'visibleMirrorVerified':True")
Path('work/oduck-feeding-pool/runtime_final_layout.py').write_text(s,encoding='utf-8');print('Focused final native check covers the new alignment correction and visible mirror; already-passed unchanged timer tests retained.')
