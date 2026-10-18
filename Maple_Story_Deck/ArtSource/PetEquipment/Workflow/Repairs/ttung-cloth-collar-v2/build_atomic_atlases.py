from pathlib import Path
from PIL import Image
import json,hashlib
out=Path('outputs/pet-variation-repair-v2');dest=out/'atomic-atlases';dest.mkdir(exist_ok=True)
frames=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text())['frames'];combos=json.loads((out/'composite-map-input.json').read_text());parts={r['name']:Path(r['file'])for r in json.loads((out/'composite-specs.json').read_text())};assets={};mapping={}
for row in frames:
 sheet=Image.new('RGBA',(640,768))
 for code in range(27):
  item=combos[row['ruid']][str(code)];file=parts[item['asset']]if'asset'in item else Path(row['file']);sheet.paste(Image.open(file).convert('RGBA'),(code%5*128,code//5*128))
 key='ttung-atomic-atlas-'+hashlib.sha256(sheet.tobytes()).hexdigest()[:16];file=dest/(key+'.png');sheet.save(file);assets[key]={'name':key,'file':str(file.resolve()),'size':[640,768],'sha256':hashlib.sha256(file.read_bytes()).hexdigest()};mapping[row['ruid']]=key
(out/'atomic-atlas-specs.json').write_text(json.dumps(list(assets.values()),indent=2));(out/'atomic-atlas-input.json').write_text(json.dumps(mapping,indent=2))
source=Path('work/pet-variation-repair-v2/upload_resume.py').read_text().replace("out/'applied-assets.json'","out/'atomic-atlas-assets.json'").replace("upload-private-checkpoint.json","atomic-atlas-private-checkpoint.json").replace("out/'asset-specs.json'","out/'atomic-atlas-specs.json'").replace('p.parent==out.resolve()','p.parent==(out/\"atomic-atlases\").resolve()').replace("'petrepair2_'","'petatomic2_'").replace('Original pet frame equipment contour export with Point filtering.','Atomic original-frame body and independent equipment combinations, Point filtering; 5 by 6 tiles of 128px.')
Path('work/pet-variation-repair-v2/upload_atomic_atlases.py').write_text(source,encoding='utf-8')
print('Packed',len(assets),'atomic frame sheets; each contains all 27 independent equipment combinations. No geometry, resampling or anatomy edits.')
