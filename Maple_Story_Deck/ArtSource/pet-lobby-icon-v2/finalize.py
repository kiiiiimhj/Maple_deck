from pathlib import Path
import json,hashlib,shutil
stage=Path('work/pet-lobby-icon-v2');out=Path('outputs/pet-lobby-icon-v2');archive=Path('G:/Maple_Story_Deck/ArtSource/pet-lobby-icon-v2')
runtime=json.loads((out/'runtime-verification.json').read_text(encoding='utf-8'));assert runtime['status']=='passed'
ui=json.loads((out/'saved-ui-verification.json').read_text(encoding='utf-8'));assert ui['savedMatchesStaged']
sources=json.loads((stage/'sources.json').read_text(encoding='utf-8'))
assert Path(sources['PetHouseUI.mlua']['path']).read_text(encoding='utf-8-sig')==(stage/'PetHouseUI.mlua').read_text(encoding='utf-8')
previous=json.loads(Path('outputs/pet-hit-feedback/applied-source-hashes.json').read_text(encoding='utf-8'))['files']
assert hashlib.sha256(Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua').read_bytes()).hexdigest()==previous['PetLogic.mlua']
hashes={name:hashlib.sha256(Path(info['path']).read_bytes()).hexdigest() for name,info in sources.items()}
(out/'applied-source-hashes.json').write_text(json.dumps(hashes,indent=2),encoding='utf-8')
(out/'change-notes.md').write_text('로비 펫 버튼의 구리 이미지 대신 펫 집과 발바닥을 함께 표현한 새 투명 PNG를 적용했다. 기존 금색 원형 버튼과 클릭 영역 및 펫 텍스트는 유지한다. 정면 형태로 다시 그려 지붕, 입구, 발바닥을 같은 세로 중심축에 맞췄다. 발바닥은 네 개 발가락과 중심 패드가 좌우 대칭이며 기울이지 않았다. 기존 104px 크기와 위치를 유지한다. 다른 UI 엔티티 2139개와 펫 하우스의 다른 메서드 및 펫 능력치/스킬/저장은 유지했다. 메이커에서 실제 그림 로드와 버튼 이벤트를 통한 펫 하우스 열기/닫기를 확인했으며 빌드/런타임 오류 0이다. 신규 PNG는 내장 image_gen으로 생성하고 원본 그대로 현재 사용자 계정 리소스로 등록했다.\n',encoding='utf-8')
plan=json.loads((stage/'plan.json').read_text(encoding='utf-8'))
for item in plan['steps']:item['status']='completed'
(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
archive.mkdir(parents=True,exist_ok=True)
for folder in [stage,out]:
    for p in folder.iterdir():
        if p.is_file():shutil.copy2(p,archive/p.name)
print(json.dumps({'status':'complete','newArtApplied':True,'savedVerified':True,'runtimeErrors':0,'buildErrors':0}),flush=True)
