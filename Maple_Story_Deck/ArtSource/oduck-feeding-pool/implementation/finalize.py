from pathlib import Path
import json,hashlib,shutil
stage=Path('work/oduck-feeding-pool');out=Path('outputs/oduck-feeding-pool');archive=Path('G:/Maple_Story_Deck/ArtSource/oduck-feeding-pool')
report=json.loads((out/'runtime-verification.json').read_text(encoding='utf-8'));assert report['status']=='passed'and report['testAccountRestored']and report['productionRuntimeErrors']==report['buildErrors']==0
sources=json.loads((stage/'sources.json').read_text(encoding='utf-8'))
for name,info in sources.items():assert Path(info['path']).read_text(encoding='utf-8-sig')==(stage/name).read_text(encoding='utf-8'),name+' changed after verification'
for path,h in json.loads((stage/'preserved.json').read_text(encoding='utf-8')).items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==h,path+' changed'
shutil.copy2(stage/'prompts.json',out/'generation-prompts.json')
notes='''# 오덕 수영장 먹기와 댄스 타임 표시

오덕의 원본 음료 마시기 모션을 유지하고, 먹이 버튼을 누르면 작은 원형 수영장 안에서 코코넛 음료를 마시게 했습니다.
도트 수영장 이미지는 뒤쪽 전체 풀과 앞쪽 벽에 같은 텍스처를 사용합니다. 앞쪽은 세로 Filled 출력으로 아래 부분만 표시해 몸 아래를 가립니다.
두 레이어의 크기와 위치가 정확히 일치하며 픽셀 좌표를 맞췄습니다. 등장/종료에서만 부드럽게 투명도가 바뀝니다.
먹기 종료, 팝업 닫기, 다른 펫 선택 시 모두 숨겨집니다. 더키의 원래 밥그릇을 보존했습니다.

댄스 타임 아이콘을 새로 그려 펫 스킬 설명과 인게임 패시브 줄에 사용합니다.
인게임 패널의 Icon/Fill은 흡혈포션 UI를 원형으로 생성하므로 같은 50x50 크기, 같은 원형 시간 오버레이, 같은 줄 배치/정렬을 사용합니다.
스킬 발동 때 30초 게이지가 시작하며 종료 시 아이콘이 사라지고 뒤의 아이콘이 앞으로 이동합니다.
같은 버프를 재등록해도 한 칸과 타이머 하나만 유지합니다. 일시정지와 안전지대에서는 오덕 버프와 게이지가 함께 멈춥니다.
포션의 기존 안전지대 시간 정책은 보존했습니다.

원본 미러볼의 전체 너비를 0.75에서 2.25로 3배 키웠고, 오덕과 겹치지 않도록 머리 위 위치를 조금 올렸습니다.
원본 춤과 미러볼 애니메이션, 기존 +20% 대미지/30초 지속과 60초 발동 간격을 유지했습니다.

실제 Maker 검증: 먹이 버튼, 원본 먹기 클립, 수영장 앞/뒤 순서와 같은 크기/위치, 종료와 팝업 닫기, 다른 펫의 밥그릇,
스킬 시전, 새 아이콘과 기존 포션 게이지의 동일한 형태, 30초 등록, 3배 미러볼, 일시정지/안전지대, 만료 후 재배치, 재등록 중복 방지와 전체 초기화.
촬영을 위해 먹기 시간과 스킬 일시정지를 임시로 유지한 검증 설정은 제거했고 임시 계정은 원본 객체로 복구했습니다.
수정 후 실행과 빌드 오류가 없음을 확인했습니다. 초기 검증에서 발견한 패널 자식 생성 누락은 명시적인 자식 스폰으로 수정했습니다.

적용 파일: PetHouseUI.mlua, PetLogic.mlua, CardManager.mlua.
기존 .ui 파일, 펫 성장 데이터와 번역 CSV는 변경하지 않았습니다.

새 그림은 내장 image_gen 도구로 생성했습니다. 원본 오덕 먹기와 미러볼은 스타일 참고 자료로만 사용했습니다.
PNG는 생성 결과를 그대로 복사했고 Point 필터로 등록했습니다.
그림: oduck-pool.png, oduck-dance-icon.png
최종 프롬프트와 생성 방식: generation-prompts.json
등록 리소스: applied-assets.json
실제 적용 화면: oduck-drinking-pool.png, oduck-mirror-and-passive.png
검증 결과: runtime-verification.json, runtime-proof.json
'''
(out/'change-notes.md').write_text(notes,encoding='utf-8')
(out/'applied-source-hashes.json').write_text(json.dumps({name:{'path':v['path'],'sha256':hashlib.sha256(Path(v['path']).read_bytes()).hexdigest()}for name,v in sources.items()},ensure_ascii=False,indent=2),encoding='utf-8')
archive.mkdir(parents=True,exist_ok=True)
for f in out.iterdir():
 if f.is_file():shutil.copy2(f,archive/f.name)
shutil.copytree(stage,archive/'implementation',dirs_exist_ok=True)
print('Oduck pool and icon PNGs, prompts, applied code, screenshots and verification archived. Existing UI/progress/localization preserved.',flush=True)
