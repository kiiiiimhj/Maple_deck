from pathlib import Path
import json,shutil,hashlib,sys
from PIL import Image,ImageDraw,ImageFont
out=Path('outputs/pet-variation-repair-v2');stage=Path('work/pet-variation-repair-v2');root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment');project=root.parents[1]
pixel=json.loads((out/'actual-pixel-verification.json').read_text());care=json.loads((out/'runtime-verification.json').read_text());skill=json.loads((out/'map-runtime-verification.json').read_text());assert pixel['differentPixels']==0 and pixel['frameCases']==125;assert care['status']==skill['status']=='passed' and care['atomicBodyAndGear']
ns={};p=Path('work/pet-gear-pose-v9/stage.py').read_text();exec(p[:p.index('maps=prop(')],ns);before=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig');after=(stage/'PetLogic.mlua').read_text()
for name in ['NativePetGearOverlays','PetCharmJumpRUIDs','NativePetGearClips','NativePetFrameDelays','TtungttangFrames']:
 if '\tproperty table '+name+' = 'not in before:continue
 ns['source']=before;a=ns['prop'](name);ns['source']=after;assert a==ns['prop'](name),name
for name in ['PetUI.mlua','PetProgress.mlua']:assert (stage/(name+'.before')).read_bytes()==(project/'RootDesk/MyDesk/Pet'/name).read_bytes(),name
for name in ['PetLogic.mlua','PetHouseUI.mlua']:assert (stage/name).read_bytes()==(project/'RootDesk/MyDesk/Pet'/name).read_bytes(),name
uploaded=json.loads((out/'applied-assets.json').read_text());maps=json.loads((out/'repair-map.json').read_text());specs={s['name']:s for s in json.loads((out/'asset-specs.json').read_text())}
manifestFile=root/'Maps/equipment-resources.json';manifest=json.loads(manifestFile.read_text(encoding='utf-8'));history=root/'History/pre-cloth-collar-repair-v2';history.mkdir(parents=True,exist_ok=True)
if not(history/'equipment-resources.json').exists():shutil.copy2(manifestFile,history/'equipment-resources.json')
if not(history/'PetLogic.mlua').exists():shutil.copy2(stage/'PetLogic.mlua.before',history/'PetLogic.mlua')
for r in manifest['resources']:
 if r['pet']=='ttungttang'and r.get('frame')and r['slot']in['coat','neck']:
  dest=history/r['file'];dest.parent.mkdir(parents=True,exist_ok=True)
  if not dest.exists():shutil.copy2(root/r['file'],dest)
newrows=[]
for design,frames in maps.items():
 for base,layers in frames.items():
  for slot,key in layers.items():
   uid=uploaded[key]['ruid'];rel=Path('Textures/ttungttang')/('Variants/rose-stripe-v1'if design=='2'else'')/slot/(uid+'.png');target=root/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(specs[key]['file'],target)
   row={'pet':'ttungttang','frame':base,'slot':slot,'ruid':uid,'canvas':128,'file':rel.as_posix(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
   if design=='2':row.update(variant=2,design='rose-stripe-v1')
   newrows.append(row)
atlasMap=json.loads((out/'atomic-atlas-map.json').read_text());atlasAssets={v['ruid']:v for v in json.loads((out/'atomic-atlas-assets.json').read_text()).values()}
for base,uid in atlasMap.items():
 rel=Path('Textures/ttungttang/AtomicFrames')/(uid+'.png');target=root/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(atlasAssets[uid]['file'],target)
 newrows.append({'pet':'ttungttang','frame':base,'slot':'atomicFrame','ruid':uid,'canvas':128,'columns':5,'rows':6,'combinations':27,'file':rel.as_posix(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
manifest['resources']=[r for r in manifest['resources']if not(r['pet']=='ttungttang'and r.get('frame')and r['slot']in['coat','neck','atomicFrame'])]+newrows
manifestFile.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
catalogueFile=root/'Maps/rose-stripe-v1.json';catalogue=json.loads(catalogueFile.read_text(encoding='utf-8'));applied=json.loads((out/'applied-overlay-map.json').read_text());catalogue['artwork']={k.removesuffix(':design2'):v for k,v in applied['variants'].items()};catalogue['files']={r['ruid']:r['file']for r in manifest['resources']if r.get('design')=='rose-stripe-v1'};catalogue['repair']='Full cloth material coverage; no broad paw-color eraser. Collars fitted below native chin, with original anatomy occlusion in feeding/sniffing/sleeping.';catalogueFile.write_text(json.dumps(catalogue,ensure_ascii=False,indent=2),encoding='utf-8')
catalogue['uiFrames']='Maps/ttung-atomic-ui-frames-v2.json';catalogueFile.write_text(json.dumps(catalogue,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'Maps/ttung-cloth-collar-repair-v2.json').write_text(json.dumps(applied,indent=2),encoding='utf-8')
(root/'Maps/ttung-atomic-ui-frames-v2.json').write_text(json.dumps({'columns':5,'rows':6,'tileSize':128,'code':'hat + coat*3 + neck*9; each digit 0=unequipped, 1=original, 2=rose stripe','frames':atlasMap},indent=2),encoding='utf-8')
workflow=root/'Workflow/Repairs/ttung-cloth-collar-v2';workflow.mkdir(parents=True,exist_ok=True)
for p in stage.glob('*.py'):
 if p.name not in ['upload_resume.py']:shutil.copy2(p,workflow/p.name)
for name in ['PetLogic.mlua','PetHouseUI.mlua']:shutil.copy2(stage/name,root/'Workflow/AppliedSource'/name)
(workflow/'README.md').write_text('''# Corrected Ttungttang equipment and atomic UI frames

The current editable body and equipment masks are under Sources/Validated/ttungttang, indexed by Maps/validated-ttung-equipment-inputs.json. The current actual game source is under Workflow/AppliedSource. Historical exploratory scripts in this directory are evidence of the repair, not a batch to rerun in filename order.

The UI displays one 128px tile from a 640x768 sheet (5 columns, 6 rows). It contains body plus the selected equipment; digits 0=unequipped, 1=original, 2=rose stripe; code=hat+coat*3+neck*9. Maps/ttung-atomic-ui-frames-v2.json indexes the sheets. All 27 combinations preserve independent item selection and the existing bonuses. The original source PNGs remain separate and editable.

Do not restore the separate UI renderer visibility pool. Live eating captured body frame 25 together with the cap and collar from a neighbouring pose, despite static pixel checks passing. Prewarming did not fix that ordering failure. Atomic body-and-equipment frames remove that inconsistent intermediate state. Zero-softness native UI clipping shows only the selected tile; horizontal flipping also mirrors the selected column.

For a further equipment design, use the corrected editable masks and regenerate the complete combination sheets; update the layout and combination radix together. Preserve the native body, original canvas, source pixels, contours and animation timing. See ArtSource/PetEquipment/AGENTS.md for artwork and validation requirements.
''',encoding='utf-8')
preview=root/'Previews/Repairs/ttung-cloth-collar-v2';preview.mkdir(parents=True,exist_ok=True)
for p in out.iterdir():
 if p.is_file() and (p.name.startswith(('after-actual-','actual-fixed-','actual-inventory-'))or p.name in ['actual-pixel-verification.json','runtime-verification.json','map-runtime-verification.json','proposed-d2-six-poses.png','before-walk-layer-report.json','live-feed-pixel-verification.json','cold-render-verification.json','cold-feed-sequence.png','cold-feed-pixel-verification.json']):shutil.copy2(p,preview/p.name)
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',24)
beforeImage=Image.open('outputs/pet-variation-v1/actual-stripe-house.png').convert('RGB').crop((790,465,1080,705));afterImage=Image.open(out/'actual-fixed-neutral.png').convert('RGB').crop((790,465,1080,705));board=Image.new('RGB',(604,288),(53,43,34));d=ImageDraw.Draw(board);d.text((14,6),'수정 전',font=font,fill='white');d.text((316,6),'수정 후',font=font,fill='white');board.paste(beforeImage,(6,42));board.paste(afterImage,(308,42));board.save(out/'actual-before-after.png');shutil.copy2(out/'actual-before-after.png',preview/'actual-before-after.png')
for r in manifest['resources']:assert hashlib.sha256((root/r['file']).read_bytes()).hexdigest()==r['sha256']
material=json.loads((out/'material-recovery-proof.json').read_text())
result={'status':'passed','updatedCoatAndCollarTextures':len(specs),'atomicUIFrameSheets':len(atlasMap),'independentEquipmentCombinations':27,'bodyFramesAndHatsUnchanged':True,'statsAndSelectionUnchanged':True,'restoredNativeFabricPixels':sum(r['restoredFabricPixels']for r in material),'actualScreenPixelCases':pixel['frameCases'],'actualOpaquePixelsChecked':pixel['opaquePixelsChecked'],'actualScreenPixelDifferences':0,'careAndWalkPlaybackChecked':True,'liveWalk':care['liveWalk'],'allCareLayerChecks':care['allCareLayerChecks'],'liveFeedPixels':json.loads((out/'live-feed-pixel-verification.json').read_text()),'coldRender':json.loads((out/'cold-render-verification.json').read_text()),'firstAndRepeatedSkillChecked':True,'resourceFolder':str(root)}
(out/'final-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');shutil.copy2(out/'final-verification.json',preview/'final-verification.json');print(json.dumps(result,ensure_ascii=False),flush=True)
