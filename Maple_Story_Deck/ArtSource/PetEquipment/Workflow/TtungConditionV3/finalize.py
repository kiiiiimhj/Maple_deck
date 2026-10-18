from pathlib import Path
import json,hashlib,shutil
root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment');out=Path('outputs/pet-ttung-status-fit-v3');stage=Path('work/pet-ttung-status-fit-v3');project=root.parents[1]
qa=json.loads((out/'actual-verification.json').read_text());assert qa['status']=='passed'and qa['differentPixels']==0
assert(stage/'PetLogic.mlua').read_bytes()==(project/'RootDesk/MyDesk/Pet/PetLogic.mlua').read_bytes()
for name in ['PetHouseUI.mlua','PetUI.mlua']:assert(stage/(name+'.before')).read_bytes()==(project/'RootDesk/MyDesk/Pet'/name).read_bytes()
maps=json.loads((out/'applied-maps.json').read_text());up=json.loads((out/'applied-assets.json').read_text());byuid={r['ruid']:r for r in up.values()};manifest=json.loads((root/'Maps/equipment-resources.json').read_text());replaced=[]
def copy(src,dest):dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
for r in manifest['resources']:
 if r['pet']!='ttungttang'or not r.get('frame'):continue
 base=r['frame'];slot=r['slot'];uid=None
 if slot in ['hat','coat','neck']:uid=(maps['original'][base]if r.get('variant',1)==1 else maps['variants'][base+':design2'])[slot]
 elif slot=='atomicFrame':uid=maps['atlases'][base]
 if uid is None or uid==r['ruid']:continue
 replaced.append(dict(r));rel=Path(r['file']).parent/(uid+'.png');copy(byuid[uid]['file'],root/rel);r.update(ruid=uid,file=rel.as_posix(),sha256=hashlib.sha256((root/rel).read_bytes()).hexdigest())
(root/'Maps/equipment-resources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'Maps/ttung-cloth-collar-repair-v2.json').write_text(json.dumps({'original':maps['original'],'variants':maps['variants']},indent=2))
atlas=json.loads((root/'Maps/ttung-atomic-ui-frames-v2.json').read_text());atlas['frames']=maps['atlases'];atlas['conditionRepair']='ttung-condition-equipment-v3';(root/'Maps/ttung-atomic-ui-frames-v2.json').write_text(json.dumps(atlas,indent=2))
inputs=json.loads((root/'Maps/validated-ttung-equipment-inputs.json').read_text());files={r['ruid']:root/r['file']for r in manifest['resources']}
for r in inputs['resources']:
 uid=maps['original'][r['frame']][r['slot']]
 if uid!=r['ruid']:
  rel=Path('Sources/Validated/ttungttang')/r['slot']/(uid+'.png');copy(files[uid],root/rel);r.update(ruid=uid,file=rel.as_posix(),sha256=hashlib.sha256((root/rel).read_bytes()).hexdigest())
  from PIL import Image
  r['alphaSha256']=hashlib.sha256(Image.open(root/rel).convert('RGBA').getchannel('A').tobytes()).hexdigest()
inputs['schema']=3;inputs['conditionRepair']='Native reaction head/chest rig; integer pixel displacement, stationary back and paws preserved';(root/'Maps/validated-ttung-equipment-inputs.json').write_text(json.dumps(inputs,ensure_ascii=False,indent=2),encoding='utf-8')
rose=root/'Maps/rose-stripe-v1.json';r=json.loads(rose.read_text());r['artwork']={k.removesuffix(':design2'):v for k,v in maps['variants'].items()};r['files']={r['ruid']:r['file']for r in manifest['resources']if r['pet']=='ttungttang'and r.get('variant')==2};r['conditionRepair']='ttung-condition-equipment-v3';rose.write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'Maps/ttung-condition-equipment-v3.json').write_text(json.dumps({'maps':maps,'changes':json.loads((out/'movement-proof.json').read_text()),'verification':qa},ensure_ascii=False,indent=2),encoding='utf-8')
preview=root/'Previews/TtungConditionV3';preview.mkdir(exist_ok=True)
for p in out.glob('actual-*.png'):copy(p,preview/p.name)
copy(out/'actual-verification.json',preview/'actual-verification.json');copy(out/'movement-proof.json',preview/'movement-proof.json')
copy(stage/'PetLogic.mlua',root/'Workflow/AppliedSource/PetLogic.mlua')
workflow=root/'Workflow/TtungConditionV3'
for name in ['prepare.py','stage.py','verify.py','finalize.py']:copy(stage/name,workflow/name)
guide='''\n+\n+Ttungttang condition reaction repair v3: current mapping is Maps/ttung-condition-equipment-v3.json, with the existing validated input and atomic-sheet indices updated in place. Native body pixels and reaction timing are unchanged. In each two-frame reaction, the original animated head moves down by one source pixel; the chest portion of the shirt must use that same articulated movement, while its back and planted paws remain fixed. The cap and necklace move together with the head. Both existing and rose-stripe equipment were corrected; never reintroduce static reaction masks from historical exporters. No resampling, filtering, body repainting, or whole-shirt bob is needed.\n+\n+Actual needs-driven hungry/rest/cry/angry playback was checked in both Pet House and inventory, with both sets. Every reaction frame and all 27 independent combinations were compared against actual Maker captures. Evidence: Previews/TtungConditionV3.\n+'''
agents=root/'AGENTS.md';old=agents.read_text(encoding='utf-8')
if 'Ttungttang condition reaction repair v3:'not in old:agents.write_text(old+guide,encoding='utf-8')
(workflow/'README.md').write_text(guide,encoding='utf-8')
live=(project/'RootDesk/MyDesk/Pet/PetLogic.mlua').read_text(encoding='utf-8-sig');active={r['ruid']for r in manifest['resources']};unused={r['ruid']:r for r in replaced if r['ruid']not in active and r['ruid']not in live}
cleanup=[]
for uid,r in unused.items():
 for p in root.rglob(uid+'.png'):
  if p.is_relative_to(root/'History'):continue
  cleanup.append({'path':str(p.resolve()),'ruid':uid,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(out/'replaced-unused-resources.json').write_text(json.dumps({'resources':list(unused.values()),'files':cleanup},indent=2))
for r in manifest['resources']:assert hashlib.sha256((root/r['file']).read_bytes()).hexdigest()==r['sha256']
print('Saved corrected condition sources and actual proof. Replaced',len(replaced),'resource mappings; unused superseded resources:',len(unused),'local files:',len(cleanup),flush=True)
