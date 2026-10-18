from pathlib import Path
from PIL import Image,ImageDraw
import json,collections
out=Path('outputs/pet-variation-repair-v2');data=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text());root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment')
manifest=json.loads((root/'Maps/equipment-resources.json').read_text())['resources'];files={r['ruid']:root/r['file']for r in manifest}
old=json.loads(Path('outputs/pet-variation-v1/original-maps.json').read_text())['PetGearOverlays'];new=json.loads(Path('outputs/pet-variation-v1/variant-map.json').read_text());uploaded=json.loads(Path('outputs/pet-variation-v1/applied-assets.json').read_text())
for i in [1,10,16,29,51,65,67,68,69,71,73,76]:
 row=data['frames'][i-1];base=Image.open(row['file']).convert('RGBA');layers={slot:Image.open(files[ruid]).convert('RGBA')for slot,ruid in old[row['ruid']].items()};board=Image.new('RGBA',(128*5,128),(128,110,90,255))
 board.alpha_composite(base,(0,0));combo=base.copy()
 for j,slot in enumerate(['coat','neck','hat']):board.alpha_composite(layers[slot],((j+1)*128,0));combo.alpha_composite(layers[slot])
 board.alpha_composite(combo,(512,0));board.resize((1280,256),Image.Resampling.NEAREST).save(out/f'parts-{i:02}.png')
 raw=Path('outputs/ttung-gear-fitting-v9')/({1:'standing',16:'feeding',51:'sleeping',65:'sniffing',69:'crouching',73:'jumping'}.get(i,'jump-'+str(i))+'-guide128.png')
 if raw.exists():
  im=Image.open(raw);im.resize((768,768),Image.Resampling.NEAREST).save(out/f'guide-{i:02}.png')
print('Diagnostic anatomy, clothing, jewellery and source-painting views exported.')
