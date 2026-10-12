from pathlib import Path
import json,hashlib,shutil,re
stage=Path('work/ducky-bowl');out=Path('outputs/ducky-bowl');archive=Path('G:/Maple_Story_Deck/ArtSource/ducky-bowl')
report=json.loads((out/'runtime-verification.json').read_text());assert report['status']=='passed'
path=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetHouseUI.mlua')
assert path.read_bytes()==(stage/'PetHouseUI.mlua').read_bytes()
def methods(s):return {m[1]:m[0] for m in re.finditer(r'(?ms)^\tmethod \w+ (\w+)\([^\n]*\)\n.*?^\tend',s)}
old=methods((stage/'PetHouseUI.mlua.before').read_text(encoding='utf-8-sig'));new=methods(path.read_text(encoding='utf-8'))
changed={'Refresh','OnBeginPlay','RequestCare','SetFeedingMotion','OnEndPlay'}
for name,body in old.items():
    if name not in changed:assert body==new[name],name+' changed unexpectedly'
prior=json.loads(Path('outputs/pet-turtle/applied-source-hashes.json').read_text());manifest=json.loads(Path('work/pet-turtle/sources.json').read_text())
for name,h in prior.items():assert hashlib.sha256(Path(manifest[name]['path']).read_bytes()).hexdigest()==h,name+' changed unexpectedly'
(out/'applied-source-hashes.json').write_text(json.dumps({'PetHouseUI.mlua':hashlib.sha256(path.read_bytes()).hexdigest(),'preservedHouseMethods':len(old)-len(changed),'petLogicCombatAndLocalizationUnchanged':True},indent=2),encoding='utf-8')
plan=json.loads((stage/'plan.json').read_text())
for step in plan['steps']:step['status']='completed'
(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'change-notes.md').write_text('''# 더키 밥그릇

기존 도트 밥그릇 이미지를 재사용해 더키 원본 먹기 모션 앞에 표시한다. 먹기 중에만 짧게 나타나며 끝나거나 팝업을 닫으면 제거된다. 발 바닥과 입 앞에 맞추고 정수 화면 픽셀에 고정해 밥그릇이 흔들리지 않게 한다. 다른 펫에는 별도 그릇을 표시하지 않는다.

메이커에서 원본 먹기 모션 유지, 먹기 두 번의 표시/정리, 좌표 안정성, 다른 펫 미표시를 확인했다. 런타임/빌드 오류 0. 임시 펫 프로필은 원래 객체로 복구했다. 펫 성장/전투/번역 파일은 수정하지 않았다.
''',encoding='utf-8')
archive.mkdir(parents=True,exist_ok=True)
for folder in [out,stage]:
    for f in folder.iterdir():
        if f.is_file():shutil.copy2(f,archive/f.name)
print(json.dumps({'status':'complete','savedSourceMatches':True,'runtimeErrors':0,'buildErrors':0,'archive':str(archive)},ensure_ascii=False))
