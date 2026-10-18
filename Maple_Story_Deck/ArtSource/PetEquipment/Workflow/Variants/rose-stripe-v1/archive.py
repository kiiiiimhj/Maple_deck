from pathlib import Path
import json,shutil,hashlib
out=Path('outputs/pet-variation-v1');stage=Path('work/pet-variation-v1');root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment');project=root.parents[1]
report=json.loads((out/'runtime-verification.json').read_text());logic=json.loads((out/'logic-verification.json').read_text());skill=json.loads((out/'map-runtime-verification.json').read_text());assert report['status']==skill['status']=='passed'and report['schemaVersion']==9
uploaded=json.loads((out/'applied-assets.json').read_text());maps=json.loads((out/'variant-map.json').read_text());specs={s['name']:s for s in json.loads((out/'asset-specs.json').read_text())};manifest=json.loads((root/'Maps/equipment-resources.json').read_text(encoding='utf-8'))
# Original native/dog artwork tables and their body frame lists must be untouched.
import sys
sys.path.insert(0,'work/ranged-lua-runtime')
ns={};parser=Path('work/pet-gear-pose-v9/stage.py').read_text();exec(parser[:parser.index('maps=prop(')],ns)
original=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig');current=(stage/'PetLogic.mlua').read_text(encoding='utf-8')
for name in ['PetGearOverlays','NativePetGearOverlays','PetCharmJumpRUIDs','NativePetGearClips','NativePetFrameDelays']:
 ns['source']=original;before=ns['prop'](name);ns['source']=current;assert before==ns['prop'](name),name
history=root/'History/pre-rose-stripe-v1';history.mkdir(parents=True,exist_ok=True)
prior=root/'Maps/equipment-resources.json'
if not(history/'equipment-resources.json').exists():shutil.copy2(prior,history/'equipment-resources.json')
assets={};newrows=[]
for base,layers in maps.items():
 for slot,key in layers.items():
  uid=uploaded[key]['ruid'];rel=Path('Textures/ttungttang/Variants/rose-stripe-v1')/slot/(uid+'.png');target=root/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(specs[key]['file'],target);assets[key]=rel.as_posix()
  newrows.append({'pet':'ttungttang','frame':base,'slot':slot,'variant':2,'design':'rose-stripe-v1','ruid':uid,'canvas':128,'file':rel.as_posix(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
for slot in ['hat','coat','neck']:
 key='ttung-icon-'+slot+'-v1';uid=uploaded[key]['ruid'];rel=Path('Icons/ttungttang/Variants/rose-stripe-v1')/slot/(uid+'.png');target=root/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(specs[key]['file'],target);assets[key]=rel.as_posix()
 newrows.append({'pet':'ttungttang','slot':slot,'variant':2,'design':'rose-stripe-v1','kind':'icon','ruid':uid,'file':rel.as_posix(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
manifest['resources']=[r for r in manifest['resources']if r.get('design')!='rose-stripe-v1']+newrows
prior.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
variation={'id':'rose-stripe-v1','pet':'ttungttang','variant':2,'items':[{'slot':slot,'itemId':'ttung-stripe-'+slot.lower(),'bonus':bonus}for slot,bonus in [('Cap','critical damage +10%'),('Coat','attack +5%'),('Necklace','critical chance +5%')]],'artwork':{base:{slot:uploaded[key]['ruid']for slot,key in layers.items()}for base,layers in maps.items()},'files':assets,'selection':'GearDesigns: independent radix-100 digits for head, coat, necklace (0 = original design).','bonuses':'GearEquippedMask only; designs in the same slot cannot stack.','ownership':'Original items use GearOwnedMask; subsequent designs use three bits per design in GearVariantOwnedMask.','testGrant':'Inventory > Pet > 장비 시험 grants all currently defined designs in Maker only.'}
(root/'Maps/rose-stripe-v1.json').write_text(json.dumps(variation,ensure_ascii=False,indent=2),encoding='utf-8')
source=root/'Sources/Variants/rose-stripe-v1';source.mkdir(parents=True,exist_ok=True)
for name in ['stripe-design-reference.png','original-three-poses.png']:shutil.copy2(out/name,source/name)
workflow=root/'Workflow/Variants/rose-stripe-v1';workflow.mkdir(parents=True,exist_ok=True)
for p in stage.glob('*.py'):
 if p.name not in ['upload_resume.py','runtime_common.py']:shutil.copy2(p,workflow/p.name)
preview=root/'Previews/Variants/rose-stripe-v1';preview.mkdir(parents=True,exist_ok=True)
for p in out.iterdir():
 if p.name.startswith('actual-')or p.name.endswith('verification.json')or p.name in ['stripe-six-poses.png','stripe-all-76-frames.png']:shutil.copy2(p,preview/p.name)
for name in ['PetLogic.mlua','PetUI.mlua','PetProgress.mlua']:
 p=project/'RootDesk/MyDesk/Pet'/name;assert p.read_bytes()==(stage/name).read_bytes();shutil.copy2(p,root/'Workflow/AppliedSource'/name)
prompt='''Built-in image_gen edit, reference: original-three-poses.png.
Change only navy fabric on the existing cap and coat to warm burgundy with subtle rose pinstripes; preserve ivory trim, gold hardware, exact dog, poses, silhouette, black outlines and pixel scale. Change the teal pendant to ruby. Transparent background; no text or extra objects.

The generated reference supplies material colors. Production assets preserve the original fitted 128 x 128 alpha masks and dark outlines exactly, register pattern phase to existing garment templates, and never copy generated dog anatomy. All 76 original body images and animation timings are unchanged.
'''
(source/'generation-and-extraction.txt').write_text(prompt,encoding='utf-8')
guide='''# Rose stripe variation (test)

Three separate Ttungttang items. Original clothing remains available; any mix of original and rose stripe parts is valid. Clicking a different design swaps the slot. Clicking the currently equipped design removes it. Stat bonuses depend only on the occupied slots.

Add future designs to GetPetGearVariants and matching PetGearVariantOverlays keys FRAME:designN. Preserve the original per-frame transparency, outlines, canvas and anchors. Never replace a body sprite with a generated concept image. The saved selection stores separate design indexes per slot; up to 17 total designs per slot fit the validated ownership field.

Resources stay under the existing PetEquipment root. Maps/equipment-resources.json includes the variation marker; Maps/rose-stripe-v1.json is the portable variation catalogue. New grants are test-only through 장비 시험; no release acquisition rules were added.

Verification: real Maker inventory cell and slot button clicks, save migration, all 76 frames in independent slot/pattern/facing combinations, care playback, cold first and repeated U skill casts. Contact sheets and actual screenshots are in Previews/Variants/rose-stripe-v1.
'''
(workflow/'README.md').write_text(guide,encoding='utf-8')
assert len(assets)==74 and len(newrows)==231
assert all((root/r['file']).is_file()for r in manifest['resources'])
result={'status':'passed','pet':'ttungttang','newSet':'rose-stripe-v1','newItems':3,'frames':76,'newUniqueTextures':74,'oneDesignPerSlot':True,'independentSlotMixing':True,'statStacking':False,'resourceFolder':str(root),'schemaVersion':9,'runtimeCases':report['frameCases']['samples'],'firstAndRepeatedSkillChecked':True,'unchangedOriginalBodyAndGear':True}
(out/'final-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');shutil.copy2(out/'final-verification.json',preview/'final-verification.json');print(json.dumps(result,ensure_ascii=False),flush=True)
