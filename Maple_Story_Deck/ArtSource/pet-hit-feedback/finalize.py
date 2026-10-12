from pathlib import Path
import json,hashlib,shutil,re,sys
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-hit-feedback');out=Path('outputs/pet-hit-feedback');archive=Path('G:/Maple_Story_Deck/ArtSource/pet-hit-feedback')
report=json.loads((out/'runtime-verification.json').read_text());assert report['status']=='passed' and report['actualFeedButtonPositionVerified']
sources=json.loads((stage/'sources.json').read_text());hashes={}
allowed={'PetHouseUI.mlua':{'SetDuckyFoodBowl'},'PetLogic.mlua':{'PreloadPetSkillArtwork','StartPetSkillVisual','PreloadTurtleArtwork','PlayPetTurtleHit','UpdatePetTurtleVisual','ClearPetSkillVisual'}}
def methods(s):return {m[1]:m[0] for m in re.finditer(r'(?ms)^\tmethod \w+ (\w+)\([^\n]*\)\n.*?^\tend',s)}
preserved=0
for name,item in sources.items():
    p=Path(item['path']);assert p.read_bytes()==(stage/name).read_bytes()
    hashes[name]=hashlib.sha256(p.read_bytes()).hexdigest()
    old=methods((stage/(name+'.before')).read_text(encoding='utf-8-sig'));new=methods(p.read_text(encoding='utf-8'))
    for method,body in old.items():
        if method not in allowed[name]:assert body==new[method],name+': '+method
        if body==new[method]:preserved+=1
prior=json.loads(Path('outputs/pet-turtle/applied-source-hashes.json').read_text());manifest=json.loads(Path('work/pet-turtle/sources.json').read_text())
for name,h in prior.items():
    if name!='PetLogic.mlua':assert hashlib.sha256(Path(manifest[name]['path']).read_bytes()).hexdigest()==h,name+' changed unexpectedly'
s=MakerSession()
try:
    logs=s.call('maker_logs',{'kind':'normal'});start=json.loads((stage/'runtime-start.json').read_text())['start']
    errors=[x for x in logs.get('logs',[]) if x.get('logType')=='Error' and x.get('dateTime','')>=start];assert not errors,errors
    (stage/'final-runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8')
finally:s.close()
(out/'applied-source-hashes.json').write_text(json.dumps({'files':hashes,'preservedMethods':preserved,'gameplayDamageLifetimeAndSaveUnchanged':True},indent=2),encoding='utf-8')
plan=json.loads((stage/'plan.json').read_text())
for step in plan['steps']:step['status']='completed'
(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'change-notes.md').write_text('''# 펫 밥그릇 위치와 껍질 피격 표시

더키 밥그릇만 왼쪽으로 8 UI픽셀 이동했다. 크기와 바닥 높이, 먹기 모션 및 표시/정리 방식은 유지한다.

껍질 방패가 공격을 대신 받을 때 0.18초 동안 짧게 좌우로 움찔하고 살짝 눌린다. 껍질 표면에 기존 메이플 타격 이펙트 6프레임을 0.24초 동안 한 번 재생한다. 타격 표시는 캐스트당 1개를 재사용하고, 빠른 연속 타격의 재시작을 제한해 겹쳐 쌓이지 않는다. 정지 중에는 흔들림·타격 프레임도 멈추며, 종료/맵 변경/치트 교체 때 제거한다. 방패 수명 3초와 피해 차단 방식은 유지한다.

메이커에서 실제 먹기 버튼의 위치, 5회 공격 차단, 피격 흔들림과 타격 표시, 단일 이펙트 재사용, 정지/재개, 종료 정리를 확인했다. 런타임 및 빌드 오류 0. 임시 프로필과 몬스터를 제거하고 원래 계정을 복구했다.
''',encoding='utf-8')
archive.mkdir(parents=True,exist_ok=True)
for folder in [out,stage]:
    for f in folder.iterdir():
        if f.is_file():shutil.copy2(f,archive/f.name)
print(json.dumps({'status':'complete','savedSourcesMatch':True,'preservedMethods':preserved,'runtimeErrors':0,'buildErrors':0},ensure_ascii=False))
