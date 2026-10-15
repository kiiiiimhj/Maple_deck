from pathlib import Path
from PIL import Image
import ast,json,hashlib,shutil,re,sys
sys.path.insert(0,'work/ranged-lua-runtime')
project=Path('G:/Maple_Story_Deck');art=(project/'ArtSource').resolve();folder=(art/'PetEquipment').resolve()
assert folder.is_relative_to(art)and folder!=art
ns={};p=Path('work/pet-gear-pose-v9/stage.py').read_text();exec(p[:p.index("maps=prop(")],ns);ns['source']=(project/'RootDesk/MyDesk/Pet/PetLogic.mlua').read_text(encoding='utf-8-sig')
native=ns['prop']('NativePetGearOverlays');ttung=ns['prop']('PetGearOverlays');defs=ns['prop']('NativePetGearDefinitions')
records=[]
for pet,rows in native.items():
 for frame,layers in rows.items():
  for slot,z in layers.items():records.append({'pet':pet,'frame':frame,'slot':slot,**z})
for frame,layers in ttung.items():
 for slot,z in layers.items():records.append({'pet':'ttungttang','frame':frame,'slot':slot,**(z if isinstance(z,dict)else{'ruid':z,'canvas':128})})
for pet,slots in defs.items():
 for slot,z in slots.items():records.append({'pet':pet,'slot':slot,'ruid':z['icon'],'icon':True})
method=re.search(r'method table GetPetGearDefinition\(string slot\)(.*?)\n\tend',ns['source'],re.S)[1]
for slot,ruid in re.findall(r'(Cap|Coat|Necklace)=\{[^\n]+?icon="([a-f0-9]{32})"',method):records.append({'pet':'ttungttang','slot':slot,'ruid':ruid,'icon':True})
index={}
def collect(value,base):
 if isinstance(value,dict):
  ruid=value.get('ruid')or value.get('guid');path=value.get('file')or value.get('path')or value.get('png')
  if ruid and path:
   local=Path(path)
   if not local.exists():local=base/path
   if local.is_file()and local.suffix.lower()=='.png':index.setdefault(ruid,local)
  for v in value.values():collect(v,base)
 elif isinstance(value,list):
  for v in value:collect(v,base)
paths=set(Path('outputs').rglob('*applied*.json'))|set(Path('outputs').rglob('*upload*.json'))
paths=sorted(paths,key=lambda p:('pet-gear-pose-v9'in str(p),'pet-gear-motion-v8'in str(p),str(p)),reverse=True)
for p in paths:
 try:collect(json.loads(p.read_text(encoding='utf-8-sig')),p.parent)
 except (json.JSONDecodeError,UnicodeError):continue
missing=sorted({r['ruid']for r in records if r['ruid']not in index})
print('Active equipment records',len(records),'unique resources',len({r['ruid']for r in records}),'missing local PNGs',len(missing),flush=True)
if missing:
 Path('outputs/pet-gear-pose-v9/folder-missing.json').write_text(json.dumps(missing,indent=2),encoding='utf-8');print('Missing sample:',missing[:5]);sys.exit(2)
if '--write'not in sys.argv:sys.exit(0)
for name in ['Textures','Icons','Maps','Sources','Workflow','Previews','History']:(folder/name).mkdir(parents=True,exist_ok=True)
destinations={}
for row in records:
 key=(row['pet'],row['slot'],row['ruid'],row.get('icon',False));local=index[row['ruid']]
 rel=Path('Icons'if row.get('icon')else'Textures')/row['pet']/row['slot']/(row['ruid']+'.png');dest=folder/rel;dest.parent.mkdir(parents=True,exist_ok=True)
 if key not in destinations:shutil.copy2(local,dest);destinations[key]=rel.as_posix()
 row['file']=rel.as_posix();row['sha256']=hashlib.sha256(dest.read_bytes()).hexdigest()
(folder/'Maps/equipment-resources.json').write_text(json.dumps({'schema':1,'resources':records},ensure_ascii=False,indent=2),encoding='utf-8')
for name in ['overlay-map.json','overlay-ruids.json','pose-repair.json'] :shutil.copy2(Path('outputs/pet-gear-pose-v9')/name,folder/'Maps'/name)
for p in Path('outputs/pet-gear-painted-v5').glob('*-painted-*.png'):shutil.copy2(p,folder/'Sources'/p.name)
for p in Path('outputs/pet-gear-painted-v5').glob('*-coat-*.png'):shutil.copy2(p,folder/'Sources'/p.name)
for p in Path('work/pet-gear-pose-v9').glob('*.py'):shutil.copy2(p,folder/'Workflow'/p.name)
# These are source archives, never runtime paths. Keep the complete prior
# versions together, with their sibling relationships, under the one folder.
history=['pet-dedicated-gear-v1','pet-dedicated-gear-fit-v2','pet-equipment-original-frames-v3','pet-equipment-patterned-frames-v4','pet-equipment-painted-original-frames-v5','pet-equipment-detail-export-v6','pet-equipment-complete-contours-v7','pet-equipment-motion-stability-v8','pet-gear-slot-test-grant-20261015']
moved=[]
for name in history:
 source=(art/name).resolve();dest=(folder/'History'/name).resolve()
 assert source.parent==art and source.is_relative_to(art)and dest.is_relative_to(folder/'History')
 if source.exists():assert not dest.exists();shutil.move(str(source),str(dest));moved.append(name)
(folder/'README.md').write_text('''# 펫 장비 리소스

현재 적용 중인 다섯 펫의 머리장식·옷·목걸이 PNG와 슬롯 아이콘을 이 폴더에서 관리합니다.

- Textures: 펫 ID / 장비 슬롯 / RUID.png
- Icons: 슬롯 아이콘
- Maps/equipment-resources.json: 원본 프레임, 장비 슬롯, 좌표·밀도, RUID, 이 폴더 기준 상대 경로와 파일 해시
- Sources: 기존 장비 원화
- Workflow: 현재 추출·등록·검사 작업
- Previews: 실제 메이커 재생 검사
- History: 이전 장비 버전 원본과 기록

게임은 등록된 RUID를 사용하므로 원본 폴더 정리는 게임의 리소스 참조를 바꾸지 않습니다. 원격 리소스 저장소의 폴더를 만든 것은 아니며, 프로젝트 원본 파일의 관리 폴더입니다. 개인 계정 스냅샷과 업로드 URL은 포함하지 않습니다.
''',encoding='utf-8')
assert all((folder/r['file']).is_file()and hashlib.sha256((folder/r['file']).read_bytes()).hexdigest()==r['sha256']for r in records)
report={'status':'passed','folder':str(folder),'pets':sorted({r['pet']for r in records}),'activeUniqueResources':len({r['ruid']for r in records}),'activeFrameSlotRecords':len(records),'historyFoldersMoved':moved,'runtimeRuidsUnchanged':True}
Path('outputs/pet-gear-pose-v9/folder-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False),flush=True)
