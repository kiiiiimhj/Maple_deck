from pathlib import Path
import sys,json,ast,shutil
sys.path.insert(0,'work/ranged-lua-runtime')
from lupa import LuaRuntime
stage=Path('work/pet-variation-v1');out=Path('outputs/pet-variation-v1');out.mkdir(parents=True,exist_ok=True)
root=Path('G:/Maple_Story_Deck');pet=root/'RootDesk/MyDesk/Pet'
for name in ['PetLogic.mlua','PetUI.mlua','PetProgress.mlua','PetHouseUI.mlua']:
 shutil.copy2(pet/name,stage/(name+'.before'))
ns={};p=Path('work/pet-gear-pose-v9/stage.py').read_text();exec(p[:p.index('maps=prop(')],ns)
ns['source']=(pet/'PetLogic.mlua').read_text(encoding='utf-8-sig')
data={n:ns['prop'](n) for n in ['PetGearOverlays','PetCharmJumpRUIDs']}
(out/'original-maps.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
manifest=json.loads((root/'ArtSource/PetEquipment/Maps/equipment-resources.json').read_text(encoding='utf-8'))
print('Manifest structure:',type(manifest),list(manifest)[:8] if isinstance(manifest,dict) else len(manifest))
print('Dog overlay frames',len(data['PetGearOverlays']),'unique textures',len({r for z in data['PetGearOverlays'].values() for r in z.values()}))
print('First frames',list(data['PetGearOverlays'].items())[:3])
(out/'manifest-original.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print((pet/'PetProgress.mlua').read_text(encoding='utf-8-sig'))
