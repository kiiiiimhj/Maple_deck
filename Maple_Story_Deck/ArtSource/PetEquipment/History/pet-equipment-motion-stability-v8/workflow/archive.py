from pathlib import Path
import json,shutil,hashlib,re,sys
sys.path.insert(0,'work/ranged-lua-runtime')
from lupa import LuaRuntime
out=Path('outputs/pet-gear-motion-v8');stage=Path('work/pet-gear-motion-v8');project=Path('G:/Maple_Story_Deck')
archive=project/'ArtSource/pet-equipment-motion-stability-v8'
assert archive.resolve().is_relative_to((project/'ArtSource').resolve())
local=json.loads((out/'local-verification.json').read_text());runtime=json.loads((out/'runtime-verification.json').read_text());cold=json.loads((out/'cold-runtime-verification.json').read_text())
assert all(r['status']=='passed'for r in [local,runtime,cold])
rt=LuaRuntime()
def plain(v):return {str(k):plain(x)for k,x in v.items()}if hasattr(v,'items')else v
old=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig');current=(stage/'PetLogic.mlua').read_text(encoding='utf-8-sig')
before=plain(rt.execute('return '+re.search(r'(?m)^\tproperty table NativePetGearOverlays = (.*)$',old)[1]));after=plain(rt.execute('return '+re.search(r'(?m)^\tproperty table NativePetGearOverlays = (.*)$',current)[1]))
assert before.get('ttungttang')==after.get('ttungttang')
assert [l for l in old.splitlines()if 'property 'in l and'NativePetGearOverlays ='not in l]==[l for l in current.splitlines()if 'property 'in l and'NativePetGearOverlays ='not in l]
for name in ['textures','maps','source','workflow','verification']:(archive/name).mkdir(parents=True,exist_ok=True)
specs=json.loads((out/'asset-specs.json').read_text());uploaded=json.loads((out/'applied-assets.json').read_text())
for spec in specs:
 p=Path(spec['file']);assert hashlib.sha256(p.read_bytes()).hexdigest()==spec['sha256']==uploaded[spec['name']]['sha256'];shutil.copy2(p,archive/'textures'/p.name)
(archive/'maps/applied-assets.json').write_text(json.dumps({s['name']:uploaded[s['name']]for s in specs},indent=2),encoding='utf-8')
for name in ['overlay-map.json','overlay-ruids.json','asset-specs.json','parts.json','motion-registration.json']:shutil.copy2(out/name,archive/'maps'/name)
hashes={}
for name in ['PetLogic.mlua','PetHouseUI.mlua','PetUI.mlua']:
 p=project/'RootDesk/MyDesk/Pet'/name;assert p.read_bytes()==(stage/name).read_bytes();hashes[name]=hashlib.sha256(p.read_bytes()).hexdigest();shutil.copy2(p,archive/'source'/(name+'.applied'));shutil.copy2(stage/(name+'.before'),archive/'source'/(name+'.before'))
for p in stage.glob('*.py'):shutil.copy2(p,archive/'workflow'/p.name)
for p in out.iterdir():
 if p.name.endswith(('verification.json','proof.json'))or p.name=='build.json'or p.suffix=='.gif'or p.name.endswith('-sequence.png'):shutil.copy2(p,archive/'verification'/p.name)
report={'status':'passed','sourceFrames':370,'activeTextures':len(specs),'nativeFrameAndIndependentSlotCases':cold['nativeFrameAndIndependentSlotCases'],'actualCareRequests':runtime['actualCareRequests']+len(cold['actualColdCareClips']),'actualPlaybackClips':runtime['continuousPlaybackClips']+len(cold['actualColdCareClips']),'coldFeedingBodyHandoffRetested':True,'ttungttangEquipmentUnchanged':True,'equipmentStatsAndAcquisitionUnchanged':True,'sourceHashes':hashes,'privateAccountSnapshotsExcluded':True}
(out/'final-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');shutil.copy2(out/'final-verification.json',archive/'verification/final-verification.json')
(archive/'README.md').write_text('''# Pet equipment motion stability v8

Fixes Ducky walking ribbon shape changes, pendant size pumping, pose registration and intermittent sleep coat color changes. The native faces, feet and body frames stay in use. Bugi's already painted frame-specific body replacements are retained byte-for-byte, preserving all leg poses. Equipment remains independently removable; Ttungttang, stat values and test acquisition are unchanged.

The same jewel artwork is used at a fixed size per pet, with native head/bill occlusion. Ordinary coat and Ducky ribbon frames use rigid native-pixel registration, with the existing pose-specific painting retained when native anatomy differs too much for a reliable match. No image scaling/warping or blur was added. Textures use Point filtering.

The actual care controller's repeated whole-body injection shake is replaced with one small recoil. Actual playback inspection also caught a native body sprite missing momentarily at the first feeding transition, despite resource preload reporting success. The native UI renderer now warms incoming body frames at their real display footprint while holding the previous complete pose, then switches body and equipment together. Final cold-start feeding footage contains the body from its first captured frame.

Verification contains local frame checks, actual Maker care playback and 5,984 native-frame / independent-slot / facing cases. The first runtime report checks renderer hookups, and its initial feeding footage preserves the visual issue found in review; cold-runtime-verification and cold-fixed captures are the final handoff checks. Captures are screenshot sequences, not full-frame-rate video. They do not constitute a guarantee against every possible engine rendering fault.

Previous source artwork and v7 archive remain alongside this directory. Private account snapshots, credentials and upload URLs are excluded.
''',encoding='utf-8')
print(json.dumps(report),flush=True)
