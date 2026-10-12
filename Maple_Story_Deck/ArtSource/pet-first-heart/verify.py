from pathlib import Path
import re,ast,json
stage=Path('work/pet-first-heart');out=Path('outputs/pet-first-heart')
# Keep all 52 previously established charm/heart/hopping/dust behavior checks.
source=Path('work/pet-skill-polish/verify.py').read_text(encoding='utf-8').split('\ndef methods(s):')[0].replace('work/pet-skill-polish','work/pet-first-heart').replace('outputs/pet-skill-polish','outputs/pet-first-heart')
scope={};exec(compile(source,'existing-pet-effects','exec'),scope);lua=scope['lua']
# Compile the exact production helpers again, because the baseline behavior tests stub them.
translate=scope['ns']['translate'];logic=lua.execute(translate((stage/'PetLogic.mlua').read_text(encoding='utf-8')));lua.globals().L=logic
lua.execute('''
Vector3=setmetatable({zero={x=0,y=0,z=0}},{__call=function(self,x,y,z)return {x=x,y=y,z=z}end})
local methods=L;local P=_PetLogic;P._T={};P.SpawnPetSkillSprite=methods.SpawnPetSkillSprite;P.PlacePetSkillSprite=methods.PlacePetSkillSprite;P.PreloadPetSkillArtwork=methods.PreloadPetSkillArtwork
local calls={};local fx={Enable=true,SpriteRendererComponent={Color=Color(1,1,1,1),SpriteRUID='prefab'}}
_SpawnService={SpawnByModelId=function()return fx end}
local m={w=5.12,h=5.12,px=.5,py=.5}
_CardManager.GetSpriteMetrics=function(self,ruid)check(not fx.Enable and fx.SpriteRendererComponent.Color.a==0,'Cold lookup cannot show default heart');return m end
_MonsterProjectileFx={PlaceVisual=function(self,e,metrics,pos,scale,rotation)check(not e.Enable,'Placement happens while hidden');e.position=pos;e.scale=scale end}
local result=P:SpawnPetSkillSprite('heart',{},130)
check(result==fx and not fx.Enable and fx.SpriteRendererComponent.Color.a==0,'Spawn starts disabled and transparent')
P:PlacePetSkillSprite(fx,Vector3(3,4,0),1,0,0)
check(not fx.Enable and fx.scale<.2,'Unused burst remains hidden at the correct scale')
P:PlacePetSkillSprite(fx,Vector3(3,4,0),2,0,.4)
check(fx.Enable and fx.SpriteRendererComponent.Color.a==.4 and fx.position.x==3,'Visible only after placement and opacity')
fx.Enable=false;fx.SpriteRendererComponent.Color.a=0;m={w=-1,h=-1}
P:PlacePetSkillSprite(fx,Vector3(0,0,0),8,0,1)
check(not fx.Enable and fx.SpriteRendererComponent.Color.a==0,'Invalid geometry never becomes a giant visible heart')
_ResourceService={PreloadAsync=function(self,assets,callback)calls.assets=assets;callback({1,1,1,1,1,1,1,1,1})end}
PreloadResultStatus={Success=1}
local loaded=0;_CardManager.GetSpriteMetrics=function(self,ruid)check(not P._T.petSkillArtReady,'Readiness waits for geometry');loaded=loaded+1;return {w=1,h=1}end
P:PreloadPetSkillArtwork();check(P._T.petSkillArtReady and loaded==9,'All pet art geometry is warm before ready')
loaded=0;_CardManager.GetSpriteMetrics=function(self,ruid)loaded=loaded+1;return loaded==2 and {w=-1,h=-1} or {w=1,h=1}end
P:PreloadPetSkillArtwork();check(not P._T.petSkillArtReady,'Failed geometry is never reported ready')
''')
def methods(s):return {m[1]:m[0] for m in re.finditer(r'(?ms)^\tmethod \w+ (\w+)\([^\n]*\)\n.*?^\tend',s)}
old=methods((stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig'));new=methods((stage/'PetLogic.mlua').read_text(encoding='utf-8'))
changed={'PreloadPetSkillArtwork','SpawnPetSkillSprite','PlacePetSkillSprite'}
for name in old:
    if name not in changed:assert old[name]==new[name],name+' changed unexpectedly'
report={'status':'passed','behaviorChecks':lua.globals().checks,'unchangedPetMethods':len(old)-len(changed),'hiddenBeforeColdLookup':True,'revealAfterPlacement':True,'prewarmedGeometry':True,'invalidGeometryHidden':True}
(out/'source-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
