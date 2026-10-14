from pathlib import Path
import hashlib
import json
import shutil

stage = Path('work/ttung-charm-jump')
out = Path('outputs/ttung-charm-jump')
proof = json.loads((out / 'runtime-verification.json').read_text(encoding='utf-8'))
assert proof['status'] == 'passed'
assert proof['testAccountRestored'] and proof['actualUKey']
assert proof['runtimeErrors'] == 0 and proof['buildErrors'] == 0
production = Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua')
assert production.read_text(encoding='utf-8-sig') == (stage / 'PetLogic.mlua').read_text(encoding='utf-8')
for path, expected in json.loads((stage / 'preserved.json').read_text(encoding='utf-8')).items():
    assert hashlib.sha256(Path(path).read_bytes()).hexdigest() == expected, path
(out / 'applied-source-hash.json').write_text(json.dumps({str(production): hashlib.sha256(production.read_bytes()).hexdigest()}, indent=2), encoding='utf-8')
(out / 'change-notes.md').write_text('''# Ttungttang charm jump

Applied and saved in Maker. The original charm pose was articulated with the existing editable pixel rig into 20 animation frames, with anticipation, takeoff, flight and landing. Hearts launch during ascent.

All frames retain a common palette, solid ink outline and rigid facial detail. Fixed-texture actors avoid texture replacement during playback; screen pixel anchoring reduces outline shimmer.

Actual U-key runtime verification passed: all 20 frames observed; 73 samples with zero blank, overlapping or wrong-texture frames; constant tint and alpha during active playback; pause and full cleanup verified. Test account restored. Build and runtime errors: zero.

PetHouseUI, CardManager, MonsterAI and PetProgress hashes are unchanged. Original backups are retained separately in source-backup.
''', encoding='utf-8')
archive = Path('G:/Maple_Story_Deck/ArtSource/ttung-charm-jump')
shutil.copytree(out, archive / 'outputs', dirs_exist_ok=True)
shutil.copytree(stage, archive / 'implementation', dirs_exist_ok=True)
print('Final source and preserved files verified. Artwork, implementation and runtime proof archived.')
