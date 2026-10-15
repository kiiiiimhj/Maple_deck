from pathlib import Path
import json,hashlib,shutil
out=Path('outputs/pet-gear-contours-v7');stage=Path('work/pet-gear-contours-v7')
archive=Path('G:/Maple_Story_Deck/ArtSource/pet-equipment-complete-contours-v7')
assert archive.resolve().is_relative_to(Path('G:/Maple_Story_Deck/ArtSource').resolve())
required=['local-verification.json','source-pixel-verification.json','source-scope-verification.json','runtime-verification.json','bugi-final-runtime-verification.json','extra-verification.json','final-review-verification.json','guri-exact-frame-comparison.json']
for name in required:assert json.loads((out/name).read_text(encoding='utf-8'))['status']=='passed',name
for name in ['native-layers','maps','source','verification','workflow']:(archive/name).mkdir(parents=True,exist_ok=True)
assets=json.loads((out/'applied-assets.json').read_text(encoding='utf-8'));specs=json.loads((out/'asset-specs.json').read_text(encoding='utf-8'))
for s in specs:
 p=Path(s['file']);assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256']==assets[s['name']]['sha256'];shutil.copy2(p,archive/'native-layers'/p.name)
(archive/'maps'/'applied-assets.json').write_text(json.dumps({s['name']:assets[s['name']]for s in specs},ensure_ascii=False,indent=2),encoding='utf-8')
for p in out.glob('*.json'):
 if p.name=='applied-assets.json':continue
 shutil.copy2(p,archive/('verification'if any(word in p.name for word in ['verification','proof','comparison','identity']) or p.name=='build.json'else'maps')/p.name)
for p in out.iterdir():
 if p.suffix=='.gif' or p.name.endswith('-sequence.png') or p.name.startswith(('final-worn-','worn-','inventory-','inject-','skill-','coat-only-','actual-four-pets','guri-user-reference','guri-reference-exact','oduck-reference','bugi-complete-rim','hat-source-review-','coat-source-review-','neck-source-review-')):
  if p.suffix in ['.png','.gif']:shutil.copy2(p,archive/'verification'/p.name)
hashes={}
for name in ['PetLogic.mlua','PetHouseUI.mlua','PetUI.mlua']:
 p=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet')/name;assert p.read_bytes()==(stage/name).read_bytes()
 shutil.copy2(p,archive/'source'/(name+'.applied'));shutil.copy2(stage/(name+'.before'),archive/'source'/(name+'.before'));hashes[name]=hashlib.sha256(p.read_bytes()).hexdigest()
(archive/'source'/'sha256.json').write_text(json.dumps(hashes,indent=2),encoding='utf-8')
workflow=['grab_contour.py','build_contour_assets.py','recover_missing_frames.py','replace_bugi_shell.py','stabilize_necklines.py','review_source_contours.py','pack.py','upload_resume.py','stage.py','verify_local.py','verify_runtime.py','verify_bugi_final.py','verify_extra.py','final_review.py','watch.lua','archive.py']
for name in workflow:shutil.copy2(stage/name,archive/'workflow'/name)
readme='''# Pet equipment complete source contours — v7

Original generated paintings remain in ../pet-equipment-painted-original-frames-v5. This repair changes extraction and native-frame mappings for Guri, Ducky, Bugi and Oduck. Ttungttang and gameplay behavior are unchanged. Hats, coats and necklaces remain independently removable.

Seeded contour segmentation retains original source palette, highlights, enclosed colors and connected borders. The source-pixel report verifies retained RGB/alpha; it does not claim every source pixel was selected or the generated full character is pixel-identical to the original native character. Original native face/paw pixels remain intentionally preserved. Fox idle/rest necklaces share artwork only when the native neckline pixels are identical. The Oduck pendant is the mint star, not a cropped piece of his vest. Bugi's tear effects are not exported as necklaces.

Bugi uses frame-specific whole-body coat replacement to remove the original orange shell outside the painted green silhouette, while retaining original native face pixels. Actual playback revealed a remaining missing cream rim after the first full pass. That rim was restored from the source painting and Bugi was rechecked separately in the final runtime report. Initial reports are retained for traceability and are not the final Bugi visual proof.

The reference comparison freezes Guri at native source frame 70 from the exact user-supplied coat sheet, with coat only. It displays an unaltered source-cell crop next to an actual Maker screenshot; the original native face/paws differ from the generated source face/paws. Gear colors, contours and placement are the comparison scope.

See verification for actual care, inventory, separate equipment toggle, skills and same-frame source comparisons. Private account snapshots, upload checkpoints, credentials and runtime libraries are excluded. Final gear preview is test-only; original account data is preserved.
'''
(archive/'README.md').write_text(readme,encoding='utf-8')
report={'status':'passed','activeTextures':len(specs),'sourceFrames':370,'archive':str(archive),'privateSnapshotsExcluded':True,'sourceHashes':hashes}
(out/'archive-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('Archived final active textures, source mappings, workflow and actual playback proof:',archive)
