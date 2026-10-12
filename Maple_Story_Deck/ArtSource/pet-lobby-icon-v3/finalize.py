from pathlib import Path
import json,hashlib,shutil
stage=Path('work/pet-lobby-icon-v3');out=Path('outputs/pet-lobby-icon-v3');archive=Path('G:/Maple_Story_Deck/ArtSource/pet-lobby-icon-v3')
runtime=json.loads((out/'runtime-verification.json').read_text(encoding='utf-8'));assert runtime['status']=='passed'
ui=json.loads((out/'saved-ui-verification.json').read_text(encoding='utf-8'));assert ui['savedMatchesStaged']
sources=json.loads((stage/'sources.json').read_text(encoding='utf-8'))
assert Path(sources['PetHouseUI.mlua']['path']).read_text(encoding='utf-8-sig')==(stage/'PetHouseUI.mlua').read_text(encoding='utf-8')
previous=json.loads(Path('outputs/pet-hit-feedback/applied-source-hashes.json').read_text(encoding='utf-8'))['files']
assert hashlib.sha256(Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua').read_bytes()).hexdigest()==previous['PetLogic.mlua']
hashes={name:hashlib.sha256(Path(info['path']).read_bytes()).hexdigest() for name,info in sources.items()}
(out/'applied-source-hashes.json').write_text(json.dumps(hashes,indent=2),encoding='utf-8')
(out/'change-notes.md').write_text('승인된 정면 펫 집 디자인의 형태·색감·재질을 유지하면서 집 전체를 살짝 측면으로 돌린 PNG를 적용했다. 입구와 발바닥은 같은 앞면에 놓여 원근과 중심을 유지한다. 원형 버튼은 156px 그대로 두고 아이콘을 104px에서 134px로 약 29% 확대해 거의 가득 차게 배치했다. 아이콘 중심은 (0,0), 펫 글씨는 (0,-93)으로 내려 9px 간격을 확보했다. 다른 UI 엔티티 2138개와 펫 하우스의 다른 메서드, 펫 능력치·스킬·저장은 유지했다. 메이커 로비에서 실제 모양과 버튼 열기·닫기를 확인했고 빌드/런타임 오류 0이다. 내장 image_gen으로 수정했으며 투명 PNG 원본을 그대로 사용했다.\n',encoding='utf-8')
plan=json.loads((stage/'plan.json').read_text(encoding='utf-8'))
for item in plan['steps']:item['status']='completed'
(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
archive.mkdir(parents=True,exist_ok=True)
for folder in [stage,out]:
    for p in folder.iterdir():
        if p.is_file():shutil.copy2(p,archive/p.name)
print(json.dumps({'status':'complete','newArtApplied':True,'savedVerified':True,'runtimeErrors':0,'buildErrors':0}),flush=True)
