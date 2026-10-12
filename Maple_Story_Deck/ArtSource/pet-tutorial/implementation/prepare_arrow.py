from pathlib import Path
from PIL import Image
import shutil,json,hashlib
out=Path('outputs/pet-tutorial')
src=Path('C:/Users/려진/.codex/generated_images/01a0f5b0-2545-75a3-b84c-9a6d84c27dc6/exec-da142990-a399-49c3-829a-eb53f789a1df.png')
dst=out/'connector-arrow-v3.png';shutil.copy2(src,dst)
im=Image.open(dst);assert im.mode=='RGBA' and im.getextrema()[-1][0]==0
spec={'name':'arrow','file':str(dst.resolve()),'size':list(im.size),'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'bytes':dst.stat().st_size,'alphaBounds':list(im.getchannel('A').getbbox())}
(out/'arrow-spec.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copy2('C:/Users/려진/AppData/Local/Temp/codex-clipboard-c7d1f9db-57bb-47d6-b86c-1eac67c85362.png',out/'arrow-shape-reference.png')
record=json.loads((out/'generation-record.json').read_text(encoding='utf-8'));record['prompts']=[x for x in record['prompts']if x['key']!='arrow'];record['prompts'].append({'key':'arrow','paths':[str((out/'connector-arrow-v2.png').resolve()),str((out/'arrow-shape-reference.png').resolve())],'prompt':Path('work/pet-tutorial/arrow-v3-prompt.txt').read_text(encoding='utf-8').strip()});(out/'generation-record.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(spec,ensure_ascii=False),flush=True)
