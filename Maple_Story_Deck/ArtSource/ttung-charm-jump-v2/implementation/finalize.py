from pathlib import Path
import json,hashlib,shutil
stage=Path('work/ttung-charm-jump-v2');out=Path('outputs/ttung-charm-jump-v2')
report=json.loads((out/'runtime-verification.json').read_text(encoding='utf-8'))
assert report['status']=='passed'and report['testAccountRestored']and report['firstFrameIncluded']
assert report['runtimeErrors']==report['buildErrors']==0
for name in ['observedFirstCast','observedSecondCast']:
    r=report[name];assert r['framesSeen']==24 and r['blank']==r['overlap']==r['wrongTexture']==r['disabled']==r['tint']==0
    assert r['minAlpha']==r['maxAlpha']==1 and r['firstAge']<.10 and r['heartAscending']
path=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua')
assert path.read_text(encoding='utf-8-sig')==(stage/'PetLogic.mlua').read_text(encoding='utf-8')
for p,h in json.loads((stage/'preserved.json').read_text()).items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,p
(out/'applied-source-hash.json').write_text(json.dumps({str(path):hashlib.sha256(path.read_bytes()).hexdigest()},indent=2),encoding='utf-8')
(out/'change-notes.md').write_text('''# 뚱땅이 매혹 점프 수정

새 점프 자세를 built-in image_gen으로 그린 뒤 고정된 얼굴·털 색과 몸 부위를 사용해 24프레임으로 구성했습니다. 준비 동작, 앞발 들기, 뒷다리 접기, 착지 동작이 실제로 달라집니다. 앞발 회전 범위는 약 109도, 뒷발 접기 변화는 약 19 원본 픽셀입니다.

128px 투명 PNG는 공통 팔레트와 불투명 잉크 테두리를 사용합니다. 도약 때 하트를 발사합니다. 렌더러를 활성화/비활성화하며 자세를 바꾸지 않고 미리 준비한 렌더러의 색상 알파만 변경합니다. 준비는 정확히 4 렌더 프레임을 사용하며 중복 준비 작업을 막았습니다. 캐릭터는 정수 픽셀 배율과 정렬을 적용합니다.

메이커 새 실행에서 실제 U 키로 첫 시전과 재시전을 확인했습니다. 등장 첫 0.017초부터 검사했고 두 번 모두 24개 자세, 빈/겹친 자세 0, 잘못된 텍스처 0, 활성화 변경 0, 색 변화 0입니다. 정지·재개, 종료 시 숨김, 렌더러 재사용 및 맵/플레이 종료 시 제거를 확인했습니다. 테스트 계정과 카메라 흔들림 설정은 복구했습니다. 픽셀 정렬 수치 검사는 다른 공격의 카메라 흔들림을 임시로 끈 상태에서 수행했습니다.

원본 프레임, 생성 시트, 실제 적용 화면과 생성 프롬프트는 이 폴더에 함께 보관했습니다. 게임 소스는 PetLogic.mlua만 수정했습니다. 다른 펫, 펫하우스, 카드, 몬스터 AI와 성장/저장 구조의 파일 해시를 확인했습니다.
''',encoding='utf-8')
archive=Path('G:/Maple_Story_Deck/ArtSource/ttung-charm-jump-v2')
shutil.copytree(out,archive/'outputs',dirs_exist_ok=True)
shutil.copytree(stage,archive/'implementation',dirs_exist_ok=True)
print('Verified source, preserved files and first/repeated U proof. Final sprite frames and prompt archived.')
