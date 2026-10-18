"""Rebuild native pet sheets from the portable validated source set.

Run the canonical copy under ArtSource/PetEquipment/Workflow/NativeEquipmentV11.
This uses no historic output folders, accounts, network, or Maker mutations.
"""
from pathlib import Path
from PIL import Image
import json,math,hashlib
root=Path(__file__).resolve().parents[2]
assert root.name=='PetEquipment',root
data=json.loads((root/'Maps/validated-native-equipment-inputs-v11.json').read_text())
live=json.loads((root/'Maps/equipment-resources.json').read_text())['resources']
dest=root/'Rebuilt';dest.mkdir(exist_ok=True)
checked=0
for pet,frames in data['parts'].items():
 l=data['layouts'][pet];indices=data['indices'][pet]
 for code in range(27):
  sheet=Image.new('RGBA',(l['columns']*l['tileW'],l['rows']*l['tileH']))
  for base,designs in frames.items():
   b=data['bodies'][pet][base];body=Image.open(root/b['file']).convert('RGBA').resize((b['w']*2,b['h']*2),Image.Resampling.NEAREST)
   ox=-round(b['px']*b['w']*2)-l['left'];oy=-round((1-b['py'])*b['h']*2)-l['top'];im=Image.new('RGBA',(l['tileW'],l['tileH']));im.alpha_composite(body,(ox,oy))
   for slot,digit in [('coat',code//3%3),('neck',code//9),('hat',code%3)]:
    if not digit:continue
    d=designs[str(digit)].get(slot)
    if not d:continue
    if d.get('replacesBody'):im=Image.new('RGBA',im.size)
    im.alpha_composite(Image.open(root/d['file']).convert('RGBA'),(ox+round(d['x']*2),oy+round(d['y']*2)))
   index=indices[base];sheet.paste(im,(index%l['columns']*l['tileW'],index//l['columns']*l['tileH']))
  path=dest/(pet+'-combination-'+str(code)+'.png');sheet.save(path)
  row=next(r for r in live if r['pet']==pet and r['slot']=='atomicMotionSheet'and r['code']==code)
  assert hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256'],path
  checked+=1
 print('Rebuilt and matched all 27 sheets:',pet,flush=True)
print('Portable sources match every applied sheet:',checked,flush=True)
