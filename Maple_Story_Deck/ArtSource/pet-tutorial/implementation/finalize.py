from pathlib import Path
import json,hashlib,shutil,re,csv,io
stage=Path('work/pet-tutorial');out=Path('outputs/pet-tutorial');archive=Path('G:/Maple_Story_Deck/ArtSource/pet-tutorial')
report=json.loads((out/'runtime-verification.json').read_text(encoding='utf-8'));assert report['status']=='passed'
preserved=json.loads((stage/'preserved-sources.json').read_text(encoding='utf-8'))
for path,h in preserved.items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==h,path+' changed'
sources=json.loads((stage/'sources.json').read_text(encoding='utf-8'))
def methods(s):return {m[1]:m[0]for m in re.finditer(r'(?ms)^\tmethod \w+ (\w+)\([^\n]*\)\n.*?^\tend',s)}
old=methods((stage/'PetHouseUI.mlua.before').read_text(encoding='utf-8-sig'));new=methods(Path(sources['PetHouseUI.mlua']['path']).read_text(encoding='utf-8-sig'))
allowed={'OnBeginPlay','OnUpdate','Close','RequestCare','BuyEgg','OpenStatPopup','MovePet','UpdateStoneTooltip'}
for name,body in old.items():
 if name not in allowed:assert body==new[name],name
before=list(csv.DictReader(io.StringIO((stage/'GameText.csv.before').read_text(encoding='utf-8-sig'))));after=list(csv.DictReader(Path(sources['GameText.csv']['path']).open(encoding='utf-8-sig',newline='')));assert after[:len(before)]==before and len(after)==len(before)+6
manifest=json.loads((out/'applied-assets.json').read_text(encoding='utf-8'));assert set(manifest)=={'care','rewards','stones','adventure','arrow'}
plan=json.loads((stage/'plan.json').read_text(encoding='utf-8'));plan['steps'][3]['status']='completed';(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
applied={name:{'path':info['path'],'sha256':hashlib.sha256(Path(info['path']).read_bytes()).hexdigest()}for name,info in sources.items()}
(out/'applied-files.json').write_text(json.dumps(applied,ensure_ascii=False,indent=2),encoding='utf-8')
notes='''# 펫 하우스 가이드\n\n펫 하우스 왼쪽 위 안내 버튼에서 네 단계 그림 안내를 엽니다.\n펫 돌봄 → 친밀도 보상 → 모험 점수와 성장석 → 펫과 함께 모험 순서로 나타납니다.\n화면을 누르면 안내를 닫고 펫 하우스로 돌아갑니다. 다시 열면 첫 단계부터 재생됩니다.\n\n보상 그림의 강화주문서는 게임에서 사용 중인 실제 아이콘입니다.\n성장석 그림은 전투 화면에 성장석을 붙였으며 그림 안의 화살표를 제거했습니다.\n단계 사이 연결 화살표는 사용자가 제공한 곡선 모양으로 새로 그려 적용했습니다.\n문구는 한·영·중문 간체/번체·일본어로 제공합니다.\n\n실제 메이커에서 안내 버튼 클릭, 일곱 부분의 등장 순서, 전체 그림과 주문서 로드,\n그림을 눌러 닫기, 재열기, 하우스 종료, 작은 화면 배치, 미보유 펫에서도 안내 열기를 검증했습니다.\n검증 중 임시 계정 상태는 원본으로 복구했습니다. 최종 실행 및 빌드 오류는 0입니다.\n\n펫 보상·성장·스킬·저장 로직과 기존 레이드 및 로비 소스는 그대로입니다.\n최종 이미지 5개는 assets/에, 실제 화면은 pet-tutorial-applied.png에 보관합니다.\n이미지는 built-in image_gen으로 생성했으며 최종 프롬프트는 generation-record.json에 기록했습니다.\n'''
(out/'README.md').write_text(notes,encoding='utf-8')
(archive/'assets').mkdir(parents=True,exist_ok=True)
for value in manifest.values():shutil.copy2(value['file'],archive/'assets'/Path(value['file']).name)
for name in ['README.md','generation-record.json','applied-assets.json','applied-files.json','runtime-verification.json','source-verification.json','layout-verification.json','saved-ui-verification.json','pet-tutorial-applied.png','pet-house-help-button.png']:
 shutil.copy2(out/name,archive/name)
shutil.copytree(stage,archive/'implementation',dirs_exist_ok=True)
print('Final illustrations, prompts, applied files and verification archived. Existing pet and raid sources preserved.',flush=True)
