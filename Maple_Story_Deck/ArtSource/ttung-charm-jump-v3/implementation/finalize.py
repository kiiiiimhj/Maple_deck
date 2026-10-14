from pathlib import Path
import json,hashlib,shutil
stage=Path('work/ttung-charm-jump-v3');out=Path('outputs/ttung-charm-jump-v3')
report=json.loads((out/'runtime-verification.json').read_text(encoding='utf-8'))
assert report['status']=='passed'and report['testAccountRestored']
assert report['buildErrors']==report['runtimeErrors']==0
report.pop('coldFirstCastChecked',None)
report['firstCastAfterRunStartChecked']=True
report['paintedPosePhases']=12;report['uniquePaintedPoses']=10
for name in ['observedFirstCast','observedSecondCast']:
    r=report[name];assert r['framesSeen']==12 and r['blank']==r['overlap']==r['disabled']==r['wrongTexture']==r['tint']==0
    assert r['firstAge']<.1 and r['minAlpha']==r['maxAlpha']==1 and r['heartAscending']
(out/'runtime-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
path=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua')
assert path.read_text(encoding='utf-8-sig')==(stage/'PetLogic.mlua').read_text(encoding='utf-8')
for p,h in json.loads((stage/'preserved.json').read_text()).items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
assert (stage/'PetLogic.before.mlua').read_text(encoding='utf-8-sig')==Path('work/ttung-charm-jump/PetLogic.mlua').read_text(encoding='utf-8')
(out/'applied-source-hash.json').write_text(json.dumps({str(path):hashlib.sha256(path.read_bytes()).hexdigest()},indent=2),encoding='utf-8')
(out/'change-notes.md').write_text('''# 뚱땅이 원래 비율 점프 재작업

둥근 몸통과 짧은 발을 유지한 전체 자세를 built-in image_gen으로 다시 그렸습니다. 10개 전체 그림을 12단계(정점 유지와 동일한 시작 자세 포함)로 재생합니다. 팔다리를 자르거나 회전하거나 관절 메쉬로 늘리는 작업은 사용하지 않습니다. 웅크림, 도약, 공중에서 발 모으기, 착지와 복귀를 그림 자체로 표현합니다.

얼굴 내부는 같은 원본을 사용하며 PNG의 팔레트, 불투명 테두리와 픽셀 배율을 고정했습니다. 잘린 픽셀·분리된 잔상·얼굴 내부 픽셀 변화가 없음을 확인했습니다. 도약 0.17초에 하트가 퍼집니다. 첫 시전 준비와 렌더러 재사용도 유지했습니다.

실제 U 키로 모험 시작 후 첫 시전과 재시전을 검증했습니다. 둘 다 첫 0.02초 이내부터 관찰하며 12단계를 모두 확인했고 상태 검사상 빈/겹친 자세, 색 변화와 렌더러 꺼짐은 0입니다. 정지·재개, 종료 시 숨김, 렌더러 재사용과 해제를 확인했습니다. 실행·빌드 오류는 없고 테스트 계정과 카메라 설정은 복구했습니다. 픽셀 정렬 검사 시에는 다른 공격의 카메라 흔들림을 임시로 껐습니다.

사용자의 검토 후 되돌릴 수 있도록 이번 작업 직전의 원본 PetLogic.mlua를 implementation/PetLogic.before.mlua와 source-backup에 보관했습니다. 다른 펫, 펫하우스, 카드·몬스터 AI·성장/저장 파일은 변경하지 않았습니다.

생성 원본: pose-sheet.png
생성 도구 및 정확한 프롬프트: generation-prompt.txt
미리보기: jump-loop.gif
실제 적용 모습: applied-preview.png
게임 프레임: jump-01.png ~ jump-12.png
''',encoding='utf-8')
archive=Path('G:/Maple_Story_Deck/ArtSource/ttung-charm-jump-v3')
shutil.copytree(out,archive/'outputs',dirs_exist_ok=True)
shutil.copytree(stage,archive/'implementation',dirs_exist_ok=True)
print('Whole-pose trial applied and verified. Previous version retained; artwork, prompt and proof archived.')
