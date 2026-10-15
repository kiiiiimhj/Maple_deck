from pathlib import Path
import json,re
out=Path('outputs/ttung-gear');p=Path('work/ttung-gear/PetLogic.mlua');s=p.read_text(encoding='utf-8');assets=json.loads((out/'applied-assets.json').read_text(encoding='utf-8'));maps=json.loads((out/'overlay-map.json').read_text(encoding='utf-8'))
rows=['\tproperty table PetGearOverlays = {']
for base,layers in maps.items():rows.append('\t\t["'+base+'"]={'+','.join(k+'="'+assets[v]['ruid']+'"'for k,v in layers.items())+'},')
rows.append('\t}')
s,n=re.subn(r'\tproperty table PetGearOverlays = \{.*?\n\t\}',lambda _: '\n'.join(rows),s,count=1,flags=re.S);assert n==1;p.write_text(s,encoding='utf-8')
print('Updated 76 frame mappings to measured head positions, retaining already tested jump layers.')
