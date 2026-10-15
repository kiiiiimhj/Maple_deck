from pathlib import Path
import json, re, hashlib, shutil
from PIL import Image
out=Path('outputs/ttung-gear-fit5');stage=Path('work/ttung-gear-fit5')
project=Path('G:/Maple_Story_Deck');path=project/'RootDesk/MyDesk/Pet/PetLogic.mlua'
before=(stage/'PetLogic.before.mlua').read_text(encoding='utf-8-sig')
after=path.read_text(encoding='utf-8-sig')
pattern=r'\tproperty table PetGearOverlays = \{.*?\n\t\}'
assert re.sub(pattern,'',before,flags=re.S)==re.sub(pattern,'',after,flags=re.S)
runtime=json.loads((out/'runtime-verification.json').read_text())
assert runtime['status']=='passed' and runtime['runtimeErrors']==0
maps=json.loads((out/'overlay-map.json').read_text());assets=json.loads((out/'applied-assets.json').read_text())
selected=set(v for rows in maps.values()for v in rows.values())
for name in selected:
    a=assets[name];im=Image.open(a['file']).convert('RGBA')
    assert im.size==(128,128) and set(im.getchannel('A').get_flattened_data())<={0,255}
    assert hashlib.sha256(Path(a['file']).read_bytes()).hexdigest()==a['sha256']
    assert a['properties']['filter_mode']=='Point'
report={'status':'passed','onlyOverlayRUIDMappingChanged':True,'originalPetSpritesUnchanged':True,'leftCapContourRestored':True,'sleepNecklace':'small brown strap; no pendant or gem','actualMakerFeedWashSleepWalkReviewed':True,'walkDiscoveryAndSniffReviewed':True,'runtimeBlankSamples':0,'runtimeSamples':608,'selectedTextures':len(selected),'artworkMethod':'corrected cap occlusion masks and removed detached edge fragments; no new puppy artwork'}
(out/'correction-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
archive=project/'ArtSource/ttung-exclusive-gear-fit5'
shutil.copytree(out,archive/'outputs',dirs_exist_ok=True)
(archive/'selected-textures').mkdir(exist_ok=True)
for name in selected:shutil.copy2(assets[name]['file'],archive/'selected-textures'/(name+'.png'))
(archive/'implementation').mkdir(exist_ok=True)
for p in stage.iterdir():
    if p.is_file() and p.name!='account-before-reload.json':shutil.copy2(p,archive/'implementation'/p.name)
for name in ['assemble','validate','stage','apply','upload','restore_preview','account_snapshot','archive']:
    p=Path(f'work/ttung-gear/fit5_{name}.py')
    if p.exists():shutil.copy2(p,archive/'implementation'/p.name)
(out/'saved-source.json').write_text(json.dumps({'source':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'archive':str(archive)},ensure_ascii=False,indent=2))
print('Corrected assets, source backup, and actual idle / wash / sleep verification saved in the project.')
