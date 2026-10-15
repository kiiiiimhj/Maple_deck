from pathlib import Path
import json,re,hashlib,shutil
stage=Path('work/ttung-gear-fit4');stage.mkdir(exist_ok=True);out=Path('outputs/ttung-gear-fit4');p=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua');s=p.read_text(encoding='utf-8-sig');shutil.copy2(p,stage/'PetLogic.before.mlua');assets=json.loads((out/'applied-assets.json').read_text(encoding='utf-8'));maps=json.loads((out/'overlay-map.json').read_text(encoding='utf-8'))
rows=['\tproperty table PetGearOverlays = {']
for base,layers in maps.items():rows.append('\t\t["'+base+'"]={'+','.join(k+'="'+assets[v]['ruid']+'"'for k,v in layers.items())+'},')
rows.append('\t}')
s,n=re.subn(r'\tproperty table PetGearOverlays = \{.*?\n\t\}',lambda _: '\n'.join(rows),s,count=1,flags=re.S);assert n==1;(stage/'PetLogic.mlua').write_text(s,encoding='utf-8')
(stage/'source.json').write_text(json.dumps({'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()},indent=2),encoding='utf-8')
print('Only the fitted artwork mapping changed; equipment logic, stats and the original pet images preserved.')
