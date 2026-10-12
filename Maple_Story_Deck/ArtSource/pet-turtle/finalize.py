from pathlib import Path
import json,hashlib,shutil,csv,io
stage=Path('work/pet-turtle');out=Path('outputs/pet-turtle');archive=Path('G:/Maple_Story_Deck/ArtSource/pet-turtle')
report=json.loads((out/'runtime-verification.json').read_text(encoding='utf-8'));assert report['status']=='passed'
sources=json.loads((stage/'sources.json').read_text(encoding='utf-8'));hashes={}
for name,item in sources.items():
    path=Path(item['path'])
    if name=='GameText.csv':
        saved=list(csv.reader(io.StringIO(path.read_text(encoding='utf-8-sig'))))
        verified=list(csv.reader(io.StringIO((stage/name).read_text(encoding='utf-8-sig'))))
        assert saved==verified,'Saved localization rows differ'
        # Maker saves the same validated rows with its UTF-8 BOM.
        (stage/name).write_bytes(path.read_bytes())
    else:assert path.read_bytes()==(stage/name).read_bytes(),name+' differs from verified source'
    hashes[name]=hashlib.sha256(path.read_bytes()).hexdigest()
monster=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/MonsterAI.mlua')
assert hashlib.sha256(monster.read_bytes()).hexdigest()=='745465a2a41ded39c3ed2fea1e6658f770f30d44a3533fef33f4350e2e1188c7'
prior=json.loads(Path('outputs/pet-fox/applied-source-hashes.json').read_text())
for name,path in [('PetHouseUI.mlua','G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetHouseUI.mlua'),('PetUI.mlua','G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetUI.mlua'),('PetHouseGroup.ui','G:/Maple_Story_Deck/ui/PetHouseGroup.ui')]:
    assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==prior[name],name+' changed unexpectedly'
(out/'applied-source-hashes.json').write_text(json.dumps(hashes,indent=2),encoding='utf-8')
plan=json.loads((stage/'plan.json').read_text())
for step in plan['steps']:step['status']='completed'
(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'change-notes.md').write_text('''# 부기와 구리 스킬 변경

랜드터틀 원본 리소스를 사용하는 부기 추가. 기본 최대 체력 +5%, 일반 레벨당 +0.2%p. 승급 기본값은 5/8/12/18%. 추가 옵션은 기존과 같은 3/6/9레벨 해금 방식. 돌봄, 산책, 성장, 장착 및 독립 저장 프로필에 연결. V1/V2/V3 데이터를 유지하면서 V4로 이전한다.

60초마다 껍질 방패 자동 발동. 원본 what 모션 마지막 껍질 프레임을 사용해 중앙 최하단 타일에 0.42초 동안 낙하하고 착지 먼지와 0.18 강도·0.18초 화면 흔들림을 재생한다. 착지 후 3초 동안 기존 허수아비처럼 몬스터 피해를 대신 받으며, 투사체는 껍질 표면으로 날아간다. 모달 정지 중 낙하·수명·먼지 모두 정지하며 다른 존으로 효과가 넘어가지 않는다. 종료 시 짧게 페이드하고 제거한다.

구리 데굴데굴 지속 시간과 번역 설명을 3초에서 4초로 변경. U 치트 순환에 부기 추가(구리→뚱땅→더키→부기). 기존 첫 발동 하트 초기화 수정과 몬스터 매혹 낙하 동작 유지.

실제 메이커에서 임시 부화 버튼, 다섯 돌봄 버튼, 3개 잠금과 체력 표시, 런 체력 보너스, 껍질 낙하와 착지, 3초 피해 차단, 투사체 표적, 정지/재개, U 순환 및 구리 4초를 확인했다. 임시 프로필을 원래 계정 객체로 복구하고 임시 몬스터와 연출을 제거했다. 상점 상품 ID는 기존 새 펫들과 동일하게 미등록 상태를 유지한다.
''',encoding='utf-8')
archive.mkdir(parents=True,exist_ok=True)
for folder in [out,stage]:
    for file in folder.iterdir():
        if file.is_file():shutil.copy2(file,archive/file.name)
print(json.dumps({'status':'complete','savedSourcesMatch':True,'archive':str(archive),'runtimeErrors':report['runtimeErrors'],'buildErrors':report['buildErrors']},ensure_ascii=False))
