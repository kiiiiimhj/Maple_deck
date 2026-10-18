from pathlib import Path
import json,hashlib,shutil
root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment');out=Path('outputs/pet-guri-bugi-v12');stage=Path('work/pet-guri-bugi-v12');project=root.parents[1]
qa=json.loads((out/'actual-verification.json').read_text());assert qa['status']=='passed'and qa['differentPixels']==0
assert(stage/'PetLogic.mlua').read_bytes()==(project/'RootDesk/MyDesk/Pet/PetLogic.mlua').read_bytes()
for name in ['PetHouseUI.mlua','PetUI.mlua']:assert(stage/(name+'.before')).read_bytes()==(project/'RootDesk/MyDesk/Pet'/name).read_bytes()
maps=json.loads((out/'applied-maps.json').read_text());up=json.loads((out/'applied-assets.json').read_text());byuid={r['ruid']:r for r in up.values()};manifest=json.loads((root/'Maps/equipment-resources.json').read_text());replaced=[]
def copy(src,dest):dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
for r in manifest['resources']:
 if r['pet']not in ['5002617','landturtle']:continue
 pet=r['pet'];slot=r['slot'];uid=None
 if slot=='atomicMotionSheet':uid=maps['sheets'][pet][str(r['code'])]
 elif slot in ['hat','coat','neck']:
  uid=maps['variants'if r.get('variant',1)==2 else'original'][pet][r['frame']].get(slot,{}).get('ruid')
 if uid is None or uid==r['ruid']:continue
 replaced.append(dict(r));rel=Path(r['file']).parent/(uid+'.png');copy(byuid[uid]['file'],root/rel);r.update(ruid=uid,file=rel.as_posix(),sha256=hashlib.sha256((root/rel).read_bytes()).hexdigest())
(root/'Maps/equipment-resources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
oldmap=json.loads((root/'Maps/native-equipment-v11.json').read_text());oldmap.update(maps);oldmap['anatomyRepair']='guri-bugi-anatomy-v12';(root/'Maps/native-equipment-v11.json').write_text(json.dumps(oldmap,ensure_ascii=False,indent=2),encoding='utf-8')
inputs=json.loads((out/'repaired-inputs.json').read_text());oldinputs=json.loads((root/'Maps/validated-native-equipment-inputs-v11.json').read_text());oldsource=[]
for pet,bases in inputs['parts'].items():
 for base,designs in bases.items():
  for design,layers in designs.items():
   for slot,d in layers.items():
    if d['asset']not in up:continue
    original=oldinputs['parts'][pet][base][design][slot];oldsource.append({'file':original['file'],'sha256':original['sha256']})
    rel=Path('Sources/Validated')/pet/('Original'if design=='1'else'Variation2')/slot/(d['asset']+'.png');copy(d['file'],root/rel);d['file']=rel.as_posix()
inputs['schema']=12;inputs['anatomyRepair']='Native Guri walking paws retained verbatim; Bugi missing torso restored from the corresponding native body, respecting facing direction.'
(root/'Maps/validated-native-equipment-inputs-v11.json').write_text(json.dumps(inputs,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'Maps/guri-bugi-anatomy-v12.json').write_text(json.dumps({'maps':maps,'changes':json.loads((out/'anatomy-repair.json').read_text()),'verification':qa},ensure_ascii=False,indent=2),encoding='utf-8')
preview=root/'Previews/GuriBugiAnatomyV12';preview.mkdir(exist_ok=True)
for p in out.glob('*-playback.png'):copy(p,preview/p.name)
for p in out.glob('*-repair-*.png'):copy(p,preview/p.name)
copy(out/'actual-verification.json',preview/'actual-verification.json')
copy(stage/'PetLogic.mlua',root/'Workflow/AppliedSource/PetLogic.mlua')
workflow=root/'Workflow/GuriBugiAnatomyV12'
for name in ['repair_art.py','pack.py','stage.py','verify.py','finalize.py']:copy(stage/name,workflow/name)
guide='''\n\nGuri/Bugi anatomy repair v12: Maps/guri-bugi-anatomy-v12.json supersedes the affected v11 coat exports and motion sheets; validated-native-equipment-inputs-v11.json and native-equipment-v11.json are updated in place. Guri's four move frames must use the original animated paws: the old garment export contained a stationary paw, which must not be composited over the native foot stride. Garment rows at/below native source y=30 are transparent, retaining the original anatomy beneath. Bugi's original torso is opaque below the head; the former shell eraser cut this chest/belly material out. Restore the corresponding native body pixels, respecting left/right facing direction; do not erase orange/brown body material as if it were shell. Existing world skill shell frames are intentionally shell-only and unchanged. Evidence in Previews/GuriBugiAnatomyV12 includes actual care playback for both designs plus every Bugi body frame and independent gear combinations. These are technical recovery of original pixels, with no new creative image generation.\n'''
agents=root/'AGENTS.md';text=agents.read_text(encoding='utf-8')
if 'Guri/Bugi anatomy repair v12:'not in text:agents.write_text(text+guide,encoding='utf-8')
(workflow/'README.md').write_text(guide,encoding='utf-8')
live='\n'.join(p.read_text(encoding='utf-8-sig')for p in(project/'RootDesk').rglob('*.mlua'));active={r['ruid']for r in manifest['resources']};unused={r['ruid']:r for r in replaced if r['ruid']not in active and r['ruid']not in live};files={}
for uid,r in unused.items():
 p=root/r['file']
 if p.exists():files[str(p.resolve())]={'path':str(p.resolve()),'ruid':uid,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
current_sources={d['file']for p in inputs['parts'].values()for z in p.values()for v in z.values()for d in v.values()}
for row in oldsource:
 if row['file']in current_sources:continue
 p=root/row['file']
 if p.exists():
  assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'];files[str(p.resolve())]={'path':str(p.resolve()),'sha256':row['sha256'],'source':True}
(out/'replaced-unused-resources.json').write_text(json.dumps({'resources':list(unused.values()),'files':list(files.values())},indent=2))
for r in manifest['resources']:assert hashlib.sha256((root/r['file']).read_bytes()).hexdigest()==r['sha256']
print('Canonical source/texture maps updated. Replaced',len(replaced),'rows;',len(unused),'unused old resources and',len(files),'superseded local files identified.',flush=True)
