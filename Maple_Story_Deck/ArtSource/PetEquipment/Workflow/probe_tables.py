from pathlib import Path
import sys
sys.path.insert(0,'work/ranged-lua-runtime')
ns={};s=Path('work/pet-gear-pose-v9/stage.py').read_text();exec(s[:s.index("maps=prop(")],ns)
for name in ['Motions','PetGearOverlays','NativePetGearDefinitions']:
 t=ns['prop'](name)
 if name=='Motions':print(name,t)
 else:print(name,{k:(list(v)[:4]if isinstance(v,dict)else type(v).__name__)for k,v in t.items()})
motions=ns['prop']('Motions');clips=ns['prop']('NativePetGearClips');print('original Guri move frames:',clips[motions['move']])
house=Path('work/pet-gear-pose-v9/PetHouseUI.mlua.before').read_text(encoding='utf-8-sig');lines=house.splitlines();print('\n'.join(l for l in lines if 'WalkSmile'in l)[:3000])
