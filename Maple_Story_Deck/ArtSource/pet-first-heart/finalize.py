from pathlib import Path
import hashlib,json,shutil,sys
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
stage=Path('work/pet-first-heart');out=Path('outputs/pet-first-heart');archive=Path('G:/Maple_Story_Deck/ArtSource/pet-first-heart')
source=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua')
assert source.read_bytes()==(stage/'PetLogic.mlua').read_bytes(),'Saved source differs from verified source'
assert json.loads((out/'runtime-verification.json').read_text())['status']=='passed'
previous=json.loads(Path('outputs/pet-fox/applied-source-hashes.json').read_text())
paths=json.loads(Path('work/pet-fox/sources.json').read_text())
preserved={}
for name,h in previous.items():
    if name=='PetLogic.mlua':continue
    actual=hashlib.sha256(Path(paths[name]['path']).read_bytes()).hexdigest()
    assert actual==h,name+' changed unexpectedly'
    preserved[name]=actual
monster=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/MonsterAI.mlua')
assert hashlib.sha256(monster.read_bytes()).hexdigest()=='745465a2a41ded39c3ed2fea1e6658f770f30d44a3533fef33f4350e2e1188c7'
preserved['MonsterAI.mlua']=hashlib.sha256(monster.read_bytes()).hexdigest()
s=MakerSession()
try:
    build=s.call('maker_logs',{'kind':'build'})
    errors=[x for x in build.get('logs',[]) if x.get('logType')=='Error']
    assert not errors,errors
    (out/'build-verification.json').write_text(json.dumps({'errors':0},indent=2),encoding='utf-8')
finally:s.close()
(out/'applied-source-hashes.json').write_text(json.dumps({'PetLogic.mlua':hashlib.sha256(source.read_bytes()).hexdigest(),'preserved':preserved},indent=2),encoding='utf-8')
plan=json.loads((stage/'plan.json').read_text())
for step in plan['steps']:step['status']='completed'
(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'change-notes.md').write_text('''# 뚱땅 첫 발동 하트 수정

첫 사용의 이미지 크기/피벗 조회가 대기하는 동안 활성 상태의 하트 6개가 기본 좌표·크기·알파로 노출되는 문제를 재현했다. 첫 발동의 네 프레임에서 총 24개가 잘못 노출됐으며 두 번째 발동에는 없었다.

효과를 비활성·투명 상태로 생성하고 위치·크기·알파 적용을 끝낸 뒤 활성화한다. 초기 이미지 예열 시 크기·피벗도 준비한다. 유효하지 않은 크기는 표시하지 않는다.

새 실행의 첫 번째·두 번째 발동 모두 초기 오노출 0, 하트 16개·파동 6개 정상 표시. 같은 연출 나이의 파동 크기·알파가 일치했다. 런타임 오류 0, 빌드 오류 0. 관련 동작 72개 확인, 나머지 펫 메서드 78개 및 UI·번역·몬스터 이동 소스 유지. 임시 몬스터와 연출을 제거하고 로비로 복귀했다.
''',encoding='utf-8')
archive.mkdir(parents=True,exist_ok=True)
for folder in [out,stage]:
    for file in folder.iterdir():
        if file.is_file():shutil.copy2(file,archive/file.name)
print(json.dumps({'status':'complete','savedSourceMatches':True,'buildErrors':0,'archive':str(archive),'preservedFiles':list(preserved)},ensure_ascii=False))
