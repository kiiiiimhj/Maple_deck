from pathlib import Path
import json,hashlib,re
stage=Path('work/ttung-charm-jump-v3');out=Path('outputs/ttung-charm-jump-v3');path=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua')
before=path.read_text(encoding='utf-8-sig');assert before==Path('work/ttung-charm-jump/PetLogic.mlua').read_text(encoding='utf-8')
s=Path('work/ttung-charm-jump-v2/PetLogic.mlua').read_text(encoding='utf-8')
assets=json.loads((out/'applied-assets.json').read_text(encoding='utf-8'));timing=json.loads((out/'timing.json').read_text(encoding='utf-8'));assert len(assets)==12
ruids=[assets[f'jump-{i+1:02}']['ruid']for i in range(12)]
for name,val in [('PetCharmJumpRUIDs','{'+','.join('"'+r+'"'for r in ruids)+'}'),('PetCharmJumpFeet','{'+','.join('0.46875'for _ in ruids)+'}'),('PetCharmJumpMouth','{'+','.join(str((124-p['mouth'])/128)for p in timing['frames'])+'}'),('PetCharmJumpNods','{'+','.join(str(p['nod'])for p in timing['frames'])+'}'),('PetCharmJumpPeriod','0.8'),('PetCharmLaunchTime','0.17')]:
    p=r'(?m)^(\tproperty \w+ '+name+r' = ).*$';assert len(re.findall(p,s))==1;s=re.sub(p,lambda m:m[1]+val,s)
needle='\tproperty number PetCharmJumpPeriod = 0.8';assert s.count(needle)==1
s=s.replace(needle,'\tproperty table PetCharmJumpFrameTimes = {'+','.join(str(t)for t in timing['frameTimes'])+'}\n'+needle)
p=r'(?ms)^\tmethod integer GetPetCharmJumpFrameIndex\([^\n]*\)\n.*?^\tend';assert len(re.findall(p,s))==1
s=re.sub(p,lambda m:'''\tmethod integer GetPetCharmJumpFrameIndex(number elapsed)
\t\tlocal phase=math.max(0,elapsed)%self.PetCharmJumpPeriod local index=1
\t\tfor i=2,#self.PetCharmJumpFrameTimes do
\t\t\tif phase<self.PetCharmJumpFrameTimes[i] then break end
\t\t\tindex=i
\t\tend
\t\treturn index
\tend''',s)
assert s.count('return 4*0.42*u*(1-u)')==1;s=s.replace('return 4*0.42*u*(1-u)','return 4*0.34*u*(1-u)')
s=s.replace('TTUNG-JUMP articulated frames loaded=','TTUNG-JUMP complete puppy poses loaded=')
def methods(t):return{m[1]:m[0]for m in re.finditer(r'(?ms)^\tmethod \w+ (\w+)\([^\n]*\)\n.*?^\tend',t)}
a,b=methods(before),methods(s);modified=[n for n in a if a[n]!=b[n]]
assert set(modified)=={'OnUpdate','GetPetCharmJumpFrameIndex','GetPetCharmJumpHeight','PreloadPetSkillArtwork','StartPetSkillVisual','UpdatePetSkillVisual','ClearPetSkillVisual','OnEndPlay'},modified
(stage/'PetLogic.before.mlua').write_bytes(path.read_bytes());(stage/'PetLogic.mlua').write_text(s,encoding='utf-8')
(stage/'sources.json').write_text(json.dumps({'PetLogic.mlua':{'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}},indent=2),encoding='utf-8')
preserved={str(p):hashlib.sha256(p.read_bytes()).hexdigest()for p in[Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetHouseUI.mlua'),Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Card/CardManager.mlua'),Path('G:/Maple_Story_Deck/RootDesk/MyDesk/MonsterAI.mlua'),Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetProgress.mlua')]}
(stage/'preserved.json').write_text(json.dumps(preserved,indent=2),encoding='utf-8')
(out/'scope.json').write_text(json.dumps({'modifiedMethods':modified,'newMethods':list(b.keys()-a.keys()),'animationPhases':12,'uniquePaintedPoses':10,'noLimbWarpOrRotation':True,'warmRenderPool':True,'integralPixelScale':True,'launch':.17,'landing':.64,'previousBackupAvailable':True},indent=2),encoding='utf-8')
print('Whole puppy poses staged with painted timing; previous version retained for user review.')
