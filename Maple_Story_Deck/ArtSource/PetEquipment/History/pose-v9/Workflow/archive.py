from pathlib import Path
import json,hashlib,shutil,sys
sys.path.insert(0,'work/ranged-lua-runtime')
project=Path('G:/Maple_Story_Deck');folder=project/'ArtSource/PetEquipment';out=Path('outputs/pet-gear-pose-v9');stage=Path('work/pet-gear-pose-v9')
reports={name:json.loads((out/name).read_text())for name in ['local-verification.json','runtime-verification.json','flap-frame-verification.json','guri-final-verification.json','folder-verification.json']}
assert all(r['status']=='passed'for r in reports.values())
ns={};p=(stage/'stage.py').read_text();exec(p[:p.index("maps=prop(")],ns);oldsource=ns['source'];oldclip=ns['prop']('NativePetGearClips');olddefs=ns['prop']('NativePetGearDefinitions');oldttung=ns['prop']('PetGearOverlays');ns['source']=(project/'RootDesk/MyDesk/Pet/PetLogic.mlua').read_text(encoding='utf-8-sig');newclip=ns['prop']('NativePetGearClips')
assert ns['prop']('NativePetGearDefinitions')==olddefs and ns['prop']('PetGearOverlays')==oldttung
assert all(newclip[k]==v for k,v in oldclip.items())
(folder/'Workflow/AppliedSource').mkdir(parents=True,exist_ok=True);hashes={}
for name in ['PetLogic.mlua','PetHouseUI.mlua','PetUI.mlua']:
 p=project/'RootDesk/MyDesk/Pet'/name;assert p.read_bytes()==(stage/name).read_bytes();hashes[name]=hashlib.sha256(p.read_bytes()).hexdigest();shutil.copy2(p,folder/'Workflow/AppliedSource'/name)
for p in stage.glob('*.py'):shutil.copy2(p,folder/'Workflow'/p.name)
for p in out.iterdir():
 if p.name.endswith(('verification.json','proof.json'))or p.name.startswith('actual-all-')or p.name=='final-guri-walk-sequence.png'or p.suffix=='.gif':shutil.copy2(p,folder/'Previews'/p.name)
for name in ['NativePetGearSpriteMetrics','NativePetGearClips','NativePetFrameDelays']:(folder/'Maps'/(name+'.json')).write_text(json.dumps(ns['prop'](name),indent=2),encoding='utf-8')
# Preserve the original exported body frames beside the equipment references,
# so future frame fitting does not depend on a temporary output folder.
native=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());dest=folder/'Sources/NativeFrames';dest.mkdir(parents=True,exist_ok=True)
for row in native['sprites']:
 original=Path(row['file']);target=dest/(row['ruid']+'.png');shutil.copy2(original,target);row['file']=(Path('NativeFrames')/target.name).as_posix()
(folder/'Sources/native-frames.json').write_text(json.dumps(native,indent=2),encoding='utf-8')
report={'status':'passed','sourceHashes':hashes,'frameAndSlotCases':reports['runtime-verification.json']['frameAndSlotCases'],'actualFlappingPoseFramesCompared':reports['flap-frame-verification.json']['actualMakerFrames'],'initialGroundErrors':0,'guriWalkingScaleErrors':0,'ttungttangLayersAndGearStatsUnchanged':True,'folder':str(folder),'activeResources':reports['folder-verification.json']['activeUniqueResources'],'nativeBodyFrameReferences':len(native['sprites'])}
(out/'final-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');shutil.copy2(out/'final-verification.json',folder/'Previews/final-verification.json')
print(json.dumps(report,ensure_ascii=False),flush=True)
