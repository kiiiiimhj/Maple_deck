from pathlib import Path
import re,sys,json,csv,ast
stage=Path('work/pet-turtle');out=Path('outputs/pet-turtle')
code=Path('work/pet-skill-polish/verify.py').read_text(encoding='utf-8').split('\ndef methods(s):')[0].replace('work/pet-skill-polish','work/pet-turtle').replace('outputs/pet-skill-polish','outputs/pet-turtle')
code=code.replace('v.age=2.94','v.age=3.94').replace("Pet exits at 3s","Pet exits at 4s").replace("P.PetRollDuration,3","P.PetRollDuration,4").replace("Rolling duration remains 3s","Rolling duration is 4s")
scope={};exec(compile(code,'retained-skills','exec'),scope);lua=scope['lua'];translate=scope['ns']['translate'];previous=lua.globals().checks
# Compile all edited methods, including the two projectile paths with their native spacing.
for name in ['GameManager.mlua','MonsterProjectileFx.mlua','Ep1ProjectileFx.mlua']:
    source=(stage/name).read_text(encoding='utf-8')
    source=re.sub(r'^    (method|end)',r'\t\1',source,flags=re.M)
    names=set(re.findall(r'^\tmethod\s+\w+\s+(\w+)\(',source,re.M))
    lua.execute(translate(source,names))
progress=lua.execute(translate(Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetProgress.mlua').read_text(encoding='utf-8-sig')))
lua.globals().Progress=progress
lua.execute('''
function PetProgress()local p={};for k,v in pairs(Progress)do p[k]=v end;return p end
local r=P:ReadAccount(nil);check(r~=nil and r.pets.landturtle~=nil,'New account contains Bugi')
local g=r.pet;g.Owned=true;g.Level=7;g.XP=53;g.Stones=42;g.Stat3=4;g.Stat6=2
local d=r.pets.ttungttang;d.Owned=true;d.Level=9;d.Stat9=3
local f=r.pets['5000498'];f.Owned=true;f.Equipped=true;f.Level=4;f.XP=21;f.Stat3=2
local data=P:SerializeAccount(r);check(data.version==4,'Four pets save as V4')
data.version=3;data.pets.landturtle=nil;local restore=P:ReadAccount(data)
check(restore~=nil and restore.dirty and not restore.pets.landturtle.Owned,'V3 adds unowned turtle without resetting')
check(restore.pet.Level==7 and restore.pet.XP==53 and restore.pet.Stones==42 and restore.pet.Stat6==2,'Guri and wallet preserved')
check(restore.pets.ttungttang.Stat9==3 and restore.pets['5000498'].Equipped and restore.pets['5000498'].XP==21,'Existing pet stats/equipment/XP preserved')
local round=P:ReadAccount(P:SerializeAccount(restore));check(round~=nil and not round.dirty,'V4 round trip is stable')
data.version=2;data.pets['5000498']=nil;data.equippedId='ttungttang';check(P:ReadAccount(data)~=nil,'V2 still migrates')
check(P:ReadAccount({version=1,Owned=true,Level=4,Stones=23}).pet.Level==4,'V1 still migrates')
local bad=P:SerializeAccount(round);bad.pets.landturtle=nil;check(P:ReadAccount(bad)==nil,'Truncated V4 rejected')
bad=P:SerializeAccount(round);bad.version=5;check(P:ReadAccount(bad)==nil,'Future schema rejected')
bad=P:SerializeAccount(round);bad.equippedId='landturtle';check(P:ReadAccount(bad)==nil,'Unowned equipped turtle rejected')
local turtle=PetProgress();turtle.Owned=true
local lines=P:GetPetStatLines('landturtle',turtle)
check(#lines==4 and lines[1].kind==4 and lines[1].percent==5 and not lines[2].unlocked,'Fixed initial HP +5%, three locked options')
near(P:GetPetStats('landturtle',turtle).hpPct,.05,'Base HP percentage reaches stat system')
turtle.Level=2;near(P:GetPetStats('landturtle',turtle).hpPct,.052,'Normal level adds 0.2 percentage points')
local rolls=0;_UtilLogic={RandomIntegerRange=function()rolls=rolls+1;return rolls%5+1 end}
local rec={pet=PetProgress(),pets={landturtle=turtle},generation=0,test=true}
for level=3,9 do turtle.Level=level;P:UnlockPetStats(rec,'landturtle') end
check(rolls==3,'Types unlock at 3/6/9');P:UnlockPetStats(rec,'landturtle');check(rolls==3,'Never rerolls saved option types')
_LocalizationService={CurrentLocaleId='ko'}
for _,id in ipairs({'5002617','ttungttang','5000498','landturtle'})do
 for _,locale in ipairs({'ko','en','ja','zh','xx'})do
  _LocalizationService.CurrentLocaleId=locale;local info=P:GetPetSkillInfo(id)
  check(info.name~='' and info.icon~='' and info.interval~='' and info.description~='','Each pet has translated skill/icon')
 end
end
check(P:GetPetDefinition('landturtle').nativeWalk and P:GetPetDefinition('landturtle').motions.eat=='ef662acb5b2942e898fee063a0d0f2ba','Original turtle care clips are independent')
P.FoxReady=true;P.TurtleReady=true;P.ClientReady=true;P.ClientPet=PetProgress();P.ClientPets={}
check(#P:GetPetCatalog()==4 and P:GetPetCatalog()[4].ready,'Navigation sees four pets')
local flash=0;P.PlayPetTurtleHit=function()flash=flash+1 end
local ending=0;P.EndPetSkillVisual=function()ending=ending+1 end
P._T.petSkillCast={id='landturtle',zone=1,age=0,serial=12,roared=false}
check(not P:AbsorbPetTurtleHit(),'Falling shell does not protect before landing')
P:TickPetSkillCast(.42);check(P._T.petSkillCast.roared,'Shield starts on landing')
check(P:AbsorbPetTurtleHit() and flash==1,'Monster hit is redirected once')
_GameManager.paused=true;local age=P._T.petSkillCast.age;local hits=P._T.petSkillCast.absorbed
check(P:AbsorbPetTurtleHit() and flash==1 and P._T.petSkillCast.absorbed==hits,'Pause cannot accumulate hit feedback')
_GameManager.paused=false;P:TickPetSkillCast(2.99);check(P:AbsorbPetTurtleHit(),'Still protected just before three seconds')
_MapManager.CurrentMapIndex=2;check(not P:AbsorbPetTurtleHit(),'Shield cannot leak to another zone');_MapManager.CurrentMapIndex=1
P:TickPetSkillCast(.011);check(P._T.petSkillCast==nil and ending==1 and not P:AbsorbPetTurtleHit(),'Shield ends after full three-second landed lifetime')
P._T.petSkillVisual={id='landturtle',zone=1,run=0,age=.2,body={},center=Vector3(0,-1.2,.3)}
check(P:GetPetTurtleTarget(1)==nil,'Projectiles do not target a falling shell')
P._T.petSkillVisual.age=.8;local target=P:GetPetTurtleTarget(1);check(target~=nil and target.x==0 and target.y> -1.2,'Projectiles target the shell surface')
P._T.petSkillVisual.ending=true;check(P:GetPetTurtleTarget(1)==nil,'Fading shell no longer attracts projectiles')
''')
def methods(s):return {m[1]:m[0] for m in re.finditer(r'(?ms)^\s*method \w+ (\w+)\([^\n]*\)\n.*?^\s{1,4}end',s)}
changed={'PetLogic.mlua':{'OnBeginPlay','GetPetDefinition','GetPetStatLines','GetBonusPercent','GetPurchasedPetId','GetPetMessageKey','GetPetCatalog','ReadAccount','SerializeAccount','TickPetSkillCast','GetPetSkillInfo','PreloadPetSkillArtwork','StartPetSkillVisual','UpdatePetSkillVisual','CheatRequestNextPetSkill'},'GameManager.mlua':{'OnMonsterReached'},'MonsterProjectileFx.mlua':{'ReleaseVisual','UpdateVisuals'},'Ep1ProjectileFx.mlua':{'UpdateVisuals'}}
preserved=0
for name,allowed in changed.items():
    old=methods((stage/(name+'.before')).read_text(encoding='utf-8-sig'));new=methods((stage/name).read_text(encoding='utf-8'))
    for method_name,body in old.items():
        if method_name not in allowed:assert body==new[method_name],name+': '+method_name
        if body==new[method_name]:preserved+=1
rows=list(csv.reader((stage/'GameText.csv').open(encoding='utf-8')));keys=[r[0] for r in rows[1:]];assert len(keys)==len(set(keys))
bugi=[r for r in rows[1:] if r[0].endswith('_BUGI')];assert len(bugi)==14 and all(all(r[i] for i in range(3,8)) for r in bugi)
report={'status':'passed','behaviorChecks':lua.globals().checks,'retainedSkillChecks':previous,'unchangedMethods':preserved,'v1v2v3v4Migration':True,'baseHpPercent':5,'guriRollSeconds':4,'shieldSecondsAfterLanding':3,'localizedPetKeys':len(bugi)}
(out/'source-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
