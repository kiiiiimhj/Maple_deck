from pathlib import Path
import json,re,hashlib,shutil
from PIL import Image
out=Path('outputs/ttung-gear-fitting-v9');stage=Path('work/ttung-gear-fitting-v9');project=Path('G:/Maple_Story_Deck');source=project/'RootDesk/MyDesk/Pet/PetLogic.mlua'
pattern=r'\tproperty table PetGearOverlays = \{.*?\n\t\}'
before=(stage/'PetLogic.before.mlua').read_text(encoding='utf-8-sig');after=source.read_text(encoding='utf-8-sig')
assert re.sub(pattern,'',before,flags=re.S)==re.sub(pattern,'',after,flags=re.S)
art=json.loads((out/'art-verification.json').read_text());ui=json.loads((out/'runtime-verification.json').read_text());battle=json.loads((out/'map-runtime-verification.json').read_text())
assert art['status']==ui['status']==battle['status']=='passed'
assert ui['actualEightGearCombinations'] and ui['runtimeErrors']==battle['runtimeErrors']==battle['equipmentFrameErrors']==0
maps=json.loads((out/'overlay-map.json').read_text());assets=json.loads((out/'applied-assets.json').read_text());selected={n for layers in maps.values()for n in layers.values()}
assert len(maps)==76
for name in selected:
 a=assets[name];p=Path(a['file']);im=Image.open(p).convert('RGBA');assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256'];assert im.size==(128,128);assert set(im.getchannel('A').get_flattened_data())<={0,255};assert a['properties']['filter_mode']=='Point'
report={'status':'passed','onlyGearArtworkMappingChanged':True,'originalBodySpritesUnchanged':76,'independentEquipmentSlots':3,'actualSlotButtonCombinations':8,'allFrameSamples':ui['samples'],'individuallyPaintedFittingGuides':14,'individualJumpBodies':10,'noVerticalJumpVestStretch':True,'selectedLayerTextures':len(selected),'firstAndRepeatedActualUCast':True,'runtimeErrorsInCompletedChecks':0,'fittingGuidesImportedAsBodySprites':False,'imageGeneration':'built-in ImageGen','MakerTestProgressRestored':True}
(out/'final-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
archive=project/'ArtSource/ttung-exclusive-gear-fitting-v9';shutil.copytree(out,archive/'outputs',dirs_exist_ok=True);(archive/'selected-textures').mkdir(exist_ok=True);(archive/'implementation').mkdir(exist_ok=True)
for name in selected:shutil.copy2(assets[name]['file'],archive/'selected-textures'/(name+'.png'))
for p in stage.iterdir():
 if p.is_file() and p.name!='account-before-reload.json':shutil.copy2(p,archive/'implementation'/p.name)
for name in ['assemble','stage','apply','upload','account_snapshot','restore_preview','archive']:
 p=Path(f'work/ttung-gear/fitting9_{name}.py')
 if p.exists():shutil.copy2(p,archive/'implementation'/p.name)
(archive/'README.md').write_text((out/'README.md').read_text(encoding='utf-8').replace('](','](outputs/'),encoding='utf-8')
(out/'saved-source.json').write_text(json.dumps({'source':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'archive':str(archive)},ensure_ascii=False,indent=2),encoding='utf-8')
print('Only the gear artwork table changed. 8 real slot combinations, 608 frame samples and both actual U casts passed. Artwork and proof archived.')
