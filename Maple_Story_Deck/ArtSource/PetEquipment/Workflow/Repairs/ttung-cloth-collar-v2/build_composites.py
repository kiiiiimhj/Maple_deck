from pathlib import Path
from PIL import Image
import json,hashlib,itertools
out=Path('outputs/pet-variation-repair-v2');dest=out/'composites';dest.mkdir(exist_ok=True);root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment')
frames=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text())['frames'];maps=json.loads((out/'applied-overlay-map.json').read_text());uploads=json.loads((out/'applied-assets.json').read_text());files={r['ruid']:root/r['file']for r in json.loads((root/'Maps/equipment-resources.json').read_text())['resources']};files.update({r['ruid']:Path(r['file'])for r in uploads.values()});assets={};result={}
for row in frames:
 result[row['ruid']]={}
 for hat,coat,neck in itertools.product(range(3),repeat=3):
  code=hat+coat*3+neck*9
  if code==0:result[row['ruid']][str(code)]={'ruid':row['ruid']};continue
  im=Image.open(row['file']).convert('RGBA')
  for slot,design in [('coat',coat),('neck',neck),('hat',hat)]:
   if design:
    layer=maps['original'][row['ruid']][slot]if design==1 else maps['variants'][row['ruid']+':design2'][slot];im.alpha_composite(Image.open(files[layer]).convert('RGBA'))
  digest=hashlib.sha256(im.tobytes()).hexdigest();key='ttung-atomic-'+digest[:16];file=dest/(key+'.png')
  if key not in assets:im.save(file);assets[key]={'name':key,'file':str(file.resolve()),'size':[128,128],'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
  result[row['ruid']][str(code)]={'asset':key}
(out/'composite-specs.json').write_text(json.dumps(list(assets.values()),indent=2));(out/'composite-map-input.json').write_text(json.dumps(result,indent=2));print('Atomic full frames:',len(assets),'unique textures for',len(frames),'body frames and 27 independent slot combinations.')
