from pathlib import Path
import json,hashlib,shutil
from PIL import Image
out=Path('outputs/pet-tutorial');stage=Path('work/pet-tutorial')
specs=json.loads((out/'asset-specs.json').read_text(encoding='utf-8'))
names={'rewards':'exec-63b488e2-bccf-48d3-ba69-c0fa5012aefe.png','stones':'exec-70196a35-3b7f-4f43-9e63-697ff7d34cfc.png'}
corrected=[]
for key,name in names.items():
    p=out/(key+'-v2.png');shutil.copy2(Path('C:/Users/려진/.codex/generated_images/01a0f5b0-2545-75a3-b84c-9a6d84c27dc6',name),p)
    im=Image.open(p);assert im.mode=='RGBA' and im.getchannel('A').getextrema()==(0,255)
    spec={'name':key,'file':str(p.resolve()),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size,'width':im.width,'height':im.height,'alphaBBox':im.getchannel('A').getbbox(),'filter':'Bilinear','borders':{'left':0,'right':0,'top':0,'bottom':0}}
    corrected.append(spec);specs[next(i for i,s in enumerate(specs)if s['name']==key)]=spec
shutil.copy2(out/'asset-specs.json',out/'initial-asset-specs.json');shutil.copy2(out/'applied-assets.json',out/'initial-applied-assets.json')
(out/'asset-specs.json').write_text(json.dumps(specs,ensure_ascii=False,indent=2),encoding='utf-8');(out/'correction-specs.json').write_text(json.dumps(corrected,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(corrected,ensure_ascii=False),flush=True)
