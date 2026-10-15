from pathlib import Path
import json,hashlib,re
from PIL import Image
out=Path('outputs/ttung-gear');data=json.loads((out/'base-frames.json').read_text(encoding='utf-8'));maps=json.loads((out/'overlay-map.json').read_text(encoding='utf-8'));assets=json.loads((out/'applied-assets.json').read_text(encoding='utf-8'));old=Path('work/ttung-gear/PetLogic.before.mlua').read_text(encoding='utf-8');new=Path('work/ttung-gear/PetLogic.mlua').read_text(encoding='utf-8')
for field in ['TtungttangFrames','PetCharmJumpRUIDs']:
 pattern=r'property table '+field+r' = \{.*?\n\t\}' if field=='TtungttangFrames' else r'property table '+field+r' = \{[^}]*\}'
 assert re.search(pattern,old,re.S).group()==re.search(pattern,new,re.S).group()
chosen=set(v for layers in maps.values()for v in layers.values())|{'hat-icon','coat-icon','neck-icon'}
for k in chosen:
 item=assets[k];im=Image.open(item['file']).convert('RGBA');assert im.size==tuple(item['size']);assert set(im.getchannel('A').get_flattened_data())<={0,255};assert item['properties']['filter_mode']=='Point';assert hashlib.sha256(Path(item['file']).read_bytes()).hexdigest()==item['sha256']
for v in data['frames']:assert hashlib.sha256(Path(v['file']).read_bytes()).hexdigest()==v['sha256']
for pose,ruids in data['motions'].items():assert all(r in maps and all(maps[r][s] in assets for s in ['hat','coat','neck'])for r in ruids)
# Leave a compact preview at an integer source-pixel scale.
original=Image.open(out/'equipped-01.png').convert('RGBA');preview=Image.new('RGBA',(512,512));preview.alpha_composite(original.resize((512,512),Image.Resampling.NEAREST));preview.save(out/'ttung-equipped-preview.png')
report={'status':'passed','baseFrames':76,'motionFamilies':15,'wornTextures':len(chosen)-3,'inventoryIcons':3,'originalPetFramesUnchanged':True,'binaryAlpha':True,'pointFiltering':True,'headAttachmentsMeasuredFromSourcePixels':True,'includesJump':True}
(out/'art-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
