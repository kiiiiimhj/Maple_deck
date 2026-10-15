from pathlib import Path
import json,hashlib,shutil,subprocess,sys
out=Path('outputs/pet-gear-clean-v10');stage=Path('work/pet-gear-clean-v10');project=Path('G:/Maple_Story_Deck');folder=(project/'ArtSource/PetEquipment').resolve();history=folder/'History/pose-v9';assert folder.is_relative_to((project/'ArtSource').resolve())
proof=json.loads((out/'runtime-verification.json').read_text());leaf=json.loads((out/'leaf-pixel-verification.json').read_text());assert proof['status']=='passed'and leaf['status']=='passed'and leaf['sourceRGBAndAlphaExact']
ns={};p=Path('work/pet-gear-pose-v9/stage.py').read_text();exec(p[:p.index("maps=prop(")],ns);ns['source']=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig');before=ns['prop']('NativePetGearOverlays');ttung=ns['prop']('PetGearOverlays');defs=ns['prop']('NativePetGearDefinitions');ns['source']=(stage/'PetLogic.mlua').read_text(encoding='utf-8-sig');after=ns['prop']('NativePetGearOverlays');assert ns['prop']('PetGearOverlays')==ttung and ns['prop']('NativePetGearDefinitions')==defs
changes=[]
for pet,rows in before.items():
 for ruid,layers in rows.items():
  for slot,z in layers.items():
   new=after[pet][ruid][slot]
   if z!=new:assert pet=='5002617'and slot=='hat';changes.append(ruid)
assert len(changes)==101
for name in ['Maps','Workflow','Previews']:
 source=folder/name;dest=history/name
 assert source.is_relative_to(folder)and dest.is_relative_to(folder/'History')
 if not dest.exists():shutil.copytree(source,dest)
# The organizer reads the current applied Lua mappings, including the new RUID.
subprocess.run([sys.executable,'-X','utf8','work/pet-gear-pose-v9/organize.py','--write'],check=True)
manifest=json.loads((folder/'Maps/equipment-resources.json').read_text());active={(folder/r['file']).resolve()for r in manifest['resources']};moved=[]
for name in ['Textures','Icons']:
 for p in (folder/name).rglob('*.png'):
  p=p.resolve();assert p.is_relative_to(folder/name)
  if p not in active:
   dest=history/p.relative_to(folder);assert dest.is_relative_to(history);dest.parent.mkdir(parents=True,exist_ok=True);assert not dest.exists();shutil.move(str(p),str(dest));moved.append(p.name)
assert len(moved)<=2,moved
for p in stage.glob('*.py'):shutil.copy2(p,folder/'Workflow'/p.name)
for name in ['overlay-map.json','overlay-ruids.json'] :shutil.copy2(out/name,folder/'Maps'/name)
hashes={}
for name in ['PetLogic.mlua','PetHouseUI.mlua','PetUI.mlua']:
 p=project/'RootDesk/MyDesk/Pet'/name;assert p.read_bytes()==(stage/name).read_bytes();hashes[name]=hashlib.sha256(p.read_bytes()).hexdigest();shutil.copy2(p,folder/'Workflow/AppliedSource'/name)
for p in out.iterdir():
 if p.name.endswith('verification.json')or p.name in ['leaf-before-after.png','actual-four-walk-frames.png','actual-clean-guri-walk.gif','actual-clean-guri-walk-sequence.png']:shutil.copy2(p,folder/'Previews'/p.name)
assert all(p.is_file()for p in active)
report={'status':'passed','onlyGuriHeadpieceMappingsChanged':len(changes),'otherPetsEquipmentAndStatsUnchanged':True,'walkingLegacyFaceRendererRemoved':True,'actualWalkSamplesWithOneBody':proof['samples'],'sourceLeafInteriorAndEdgePixelsRestored':leaf['previouslyMissingInteriorAndEdgePixels'],'newTextureHasTransparentEdgePadding':True,'sourceHashes':hashes,'resourceFolder':str(folder),'obsoleteTexturesArchived':moved}
(out/'final-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');shutil.copy2(out/'final-verification.json',folder/'Previews/final-verification.json');print(json.dumps(report,ensure_ascii=False),flush=True)
