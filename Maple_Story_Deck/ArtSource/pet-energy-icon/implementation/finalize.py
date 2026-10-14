from pathlib import Path
import json,shutil,hashlib
stage=Path('work/pet-energy-icon');out=Path('outputs/pet-energy-icon');archive=Path('G:/Maple_Story_Deck/ArtSource/pet-energy-icon')
report=json.loads((out/'runtime-verification.json').read_text(encoding='utf-8'));assert report['status']=='passed'
sources=json.loads((stage/'source-hashes.json').read_text(encoding='utf-8'))
for path,h in sources['preserved'].items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==h,path
plan=json.loads((stage/'plan.json').read_text(encoding='utf-8'))
for step in plan['steps']:step['status']='completed'
(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'change-notes.md').write_text('펫하우스 에너지 글씨와 게이지 사이에 기존 파란 번개/금색 테두리 이미지를 추가했습니다.\n원본 PNG를 그대로 사용했으며, 게이지의 왼쪽에 붙이고 터치 입력을 받지 않도록 설정했습니다.\n기존 220개 UI 엔티티와 에너지 게이지, 에너지 수치 및 펫 스크립트는 그대로입니다.\n실제 메이커에서 이미지 로드·정렬·하우스 닫기/재열기를 확인했고 실행 및 빌드 오류는 0입니다.\n',encoding='utf-8')
(out/'applied-source.json').write_text(json.dumps({'path':sources['ui']['path'],'sha256':hashlib.sha256(Path(sources['ui']['path']).read_bytes()).hexdigest()},ensure_ascii=False,indent=2),encoding='utf-8')
archive.mkdir(parents=True,exist_ok=True)
for file in out.iterdir():
 if file.is_file():shutil.copy2(file,archive/file.name)
shutil.copytree(stage,archive/'implementation',dirs_exist_ok=True)
print('Energy icon source, layout, actual screenshot and verification archived.',flush=True)
