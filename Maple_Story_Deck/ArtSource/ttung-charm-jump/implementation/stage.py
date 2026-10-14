from pathlib import Path
import json,re,hashlib
stage=Path('work/ttung-charm-jump');out=Path('outputs/ttung-charm-jump');path=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua')
raw=path.read_bytes();s=path.read_text(encoding='utf-8-sig');(stage/'PetLogic.before.mlua').write_bytes(raw)
assets=json.loads((out/'applied-assets.json').read_text(encoding='utf-8'));timing=json.loads((out/'timing.json').read_text(encoding='utf-8'));assert len(assets)==20
def replace(a,b):
 global s
 assert s.count(a)==1,(a[:100],s.count(a));s=s.replace(a,b)
ruids=[assets[f'jump-{i+1:02}']['ruid']for i in range(20)];feet=[(r['bottom']/128-.5)for r in timing['frames']];mouth=[(r['bottom']-64-r['nod'])/128 for r in timing['frames']]
properties='\tproperty table PetCharmJumpRUIDs = {'+','.join('"'+x+'"'for x in ruids)+'}\n\tproperty table PetCharmJumpFeet = {'+','.join(str(x)for x in feet)+'}\n\tproperty table PetCharmJumpMouth = {'+','.join(str(x)for x in mouth)+'}\n\tproperty number PetCharmJumpPeriod = 0.66\n\tproperty number PetCharmLaunchTime = 0.12\n\tproperty boolean PetCharmJumpReady = false\n'
replace('\tproperty string PetCharmRoarRUID = ',properties+'\tproperty string PetCharmRoarRUID = ')
replace('''\t\tlocal phase=math.max(0,elapsed)%0.66 local u=math.min(1,phase/0.50)
\t\treturn phase<0.50 and 4*0.36*u*(1-u) or 0''','''\t\tlocal phase=math.max(0,elapsed)%self.PetCharmJumpPeriod
\t\tif phase<=self.PetCharmLaunchTime or phase>=0.54 then return 0 end
\t\tlocal u=(phase-self.PetCharmLaunchTime)/(0.54-self.PetCharmLaunchTime)
\t\treturn 4*0.36*u*(1-u)''')
replace('if cast.age>=self.PetCharmWindup and cast.age<self.PetCharmPresence and cast.scan<=0 then','if cast.age>=self.PetCharmLaunchTime and cast.age<self.PetCharmPresence and cast.scan<=0 then')
replace('''\t\tself._T.petSkillArtReady=false
\t\tlocal assets={''','''\t\tself._T.petSkillArtReady=false self.PetCharmJumpReady=false
\t\tlocal assets={''')
replace('''\t\t_ResourceService:PreloadAsync(assets,function(results)
\t\t\tif not isvalid(self) then return end
\t\t\tlocal ready=true for _,r in pairs(results) do if r~=PreloadResultStatus.Success then ready=false end end''','''\t\tfor _,ruid in ipairs(self.PetCharmJumpRUIDs) do table.insert(assets,ruid) end
\t\t_ResourceService:PreloadAsync(assets,function(results)
\t\t\tif not isvalid(self) then return end
\t\t\tlocal ready=true for _,r in pairs(results) do if r~=PreloadResultStatus.Success then ready=false end end''')
replace('\t\t\tself._T.petSkillArtReady=ready log("[VRF] PET-SKILL artwork and geometry ready="..tostring(ready))','\t\t\tself.PetCharmJumpReady=ready\n\t\t\tself._T.petSkillArtReady=ready log("[VRF] PET-SKILL artwork and geometry ready="..tostring(ready))\n\t\t\tlog("[VRF] TTUNG-JUMP twenty frames prewarmed="..tostring(ready))')
replace('''\t\tlocal bodyRUID=petId=="ttungttang" and self.PetCharmRoarRUID or self.PetRollRUID''','''\t\tlocal bodyRUID=petId=="ttungttang" and (self.PetCharmJumpReady and self.PetCharmJumpRUIDs[1] or self.PetCharmRoarRUID) or self.PetRollRUID''')
replace('''\t\tif petId=="ttungttang" then
\t\t\tfor i=1,6 do''','''\t\tif petId=="ttungttang" then
\t\t\tif self.PetCharmJumpReady then
\t\t\t\tlocal bodies={fx}
\t\t\t\tfor i=2,#self.PetCharmJumpRUIDs do bodies[i]=self:SpawnPetSkillSprite(self.PetCharmJumpRUIDs[i],map,132) end
\t\t\t\tself._T.petSkillVisual.charmBodies=bodies self._T.petSkillVisual.charmFrame=1
\t\t\tend
\t\t\tfor i=1,6 do''')
replace('''\t\t\t-- Keep the original pose and silhouette: move the map actor, without scaling its art.
\t\t\tlocal jump=self:GetPetCharmJumpHeight(t)
\t\t\tlocal p=v.center local width=self.PetCharmWidth
\t\t\tlocal bodyY=p.y+width*0.46875+jump -- measured opaque foot is row 123 of the 128px sprite
\t\t\tself:PlacePetSkillSprite(v.body,Vector3(p.x,bodyY,p.z),width,0,fade)
\t\t\tlocal mouthY=p.y+width*(0.46875+0.12)+self:GetPetCharmJumpHeight(self.PetCharmWindup)''','''\t\t\tlocal jump=self:GetPetCharmJumpHeight(t)
\t\t\tlocal p=v.center local width=self.PetCharmWidth
\t\t\tlocal index=self:GetPetCharmJumpFrameIndex(t)
\t\t\tlocal foot=0.46875
\t\t\tif v.charmBodies~=nil then
\t\t\t\tlocal nextBody=v.charmBodies[index]
\t\t\t\tif isvalid(nextBody) then
\t\t\t\t\tlocal previous=v.body v.body=nextBody v.charmFrame=index foot=self.PetCharmJumpFeet[index]
\t\t\t\t\t-- Every texture is fixed on its actor and already prewarmed. Reveal the
\t\t\t\t\t-- next complete pose before hiding the previous one; never reload a RUID mid-hop.
\t\t\t\t\tself:PlacePetSkillSprite(nextBody,Vector3(p.x,p.y+width*foot+jump,p.z),width,0,fade)
\t\t\t\t\tif previous~=nextBody and isvalid(previous) then previous.Enable=false end
\t\t\t\tend
\t\t\telse self:PlacePetSkillSprite(v.body,Vector3(p.x,p.y+width*foot+jump,p.z),width,0,fade) end
\t\t\tlocal launchIndex=self:GetPetCharmJumpFrameIndex(self.PetCharmLaunchTime)
\t\t\tlocal mouthY=p.y+width*self.PetCharmJumpMouth[launchIndex]''')
# Only the dog's visual branch changes; the fox retains its original 0.34s windup.
start=s.index('\t\tif v.id=="ttungttang" then');end=s.index('\t\telseif v.id=="oduck" then',start)
branch=s[start:end].replace('t-self.PetCharmWindup','t-self.PetCharmLaunchTime');s=s[:start]+branch+s[end:]
# Clear every hidden prewarmed pose when the charm ends or the map/run changes.
start=s.index('\tmethod void ClearPetSkillVisual()');end=s.index('\n\tend',start);body=s[start:end]
needle='\t\tif isvalid(v.body) then v.body:Destroy() end'
assert needle in body
body=body.replace(needle,'''\t\tif v.charmBodies~=nil then
\t\t\tfor _,actor in ipairs(v.charmBodies) do if isvalid(actor) then actor:Destroy() end end
\t\t\tv.body=nil v.charmBodies=nil
\t\tend
'''+needle)
s=s[:start]+body+s[end:]
replace('\tmethod number GetPetCharmJumpHeight(number elapsed)','''\tmethod integer GetPetCharmJumpFrameIndex(number elapsed)
\t\tlocal phase=math.max(0,elapsed)%self.PetCharmJumpPeriod
\t\treturn math.min(#self.PetCharmJumpRUIDs,math.floor(phase/self.PetCharmJumpPeriod*#self.PetCharmJumpRUIDs)+1)
\tend

\tmethod number GetPetCharmJumpHeight(number elapsed)''')
(stage/'PetLogic.mlua').write_text(s,encoding='utf-8')
def methods(t):return{m[1]:m[0]for m in re.finditer(r'(?ms)^\tmethod \w+ (\w+)\([^\n]*\)\n.*?^\tend',t)}
a=methods((stage/'PetLogic.before.mlua').read_text(encoding='utf-8-sig'));b=methods(s);changed=[n for n in a if a[n]!=b[n]];allowed=['GetPetCharmJumpHeight','TickPetSkillCast','PreloadPetSkillArtwork','StartPetSkillVisual','UpdatePetSkillVisual','ClearPetSkillVisual'];assert set(changed)==set(allowed)
sources={'PetLogic.mlua':{'path':str(path),'sha256':hashlib.sha256(raw).hexdigest()}};(stage/'sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8')
preserved={str(p):hashlib.sha256(p.read_bytes()).hexdigest()for p in[Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetHouseUI.mlua'),Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Card/CardManager.mlua'),Path('G:/Maple_Story_Deck/RootDesk/MyDesk/MonsterAI.mlua'),Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetProgress.mlua')]};(stage/'preserved.json').write_text(json.dumps(preserved,indent=2),encoding='utf-8')
(out/'scope.json').write_text(json.dumps({'modifiedMethods':changed,'newMethods':list(b.keys()-a.keys()),'unchangedMethods':sum(a[n]==b[n]for n in a),'heartLaunchSeconds':.12,'foxWindupPreserved':.34,'poolOffsetPreserved':55,'stableSpriteActors':20},indent=2),encoding='utf-8')
print('Twenty poses staged; launch-synced hearts, fixed textures, foot anchors, cleanup; other pets and pool offset preserved.')
