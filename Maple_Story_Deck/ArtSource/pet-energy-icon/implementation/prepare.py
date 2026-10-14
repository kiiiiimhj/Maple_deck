from pathlib import Path
from PIL import Image
import json,shutil,hashlib
stage=Path('work/pet-energy-icon');out=Path('outputs/pet-energy-icon');out.mkdir(parents=True,exist_ok=True)
src=Path('C:/Users/려진/.codex/generated_images/01a133ca-75ee-7dc2-8110-f3590495be0e/exec-3c11dcb5-4c68-4195-bf7e-e8e744f8bfb9.png');dst=out/'energy-bolt.png';shutil.copy2(src,dst)
im=Image.open(dst);assert im.mode=='RGBA' and im.getextrema()[-1][0]==0
spec={'source':str(src),'file':str(dst.resolve()),'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'bytes':dst.stat().st_size,'size':list(im.size)}
(out/'asset-spec.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
ui=Path('G:/Maple_Story_Deck/ui/PetHouseGroup.ui');shutil.copy2(ui,stage/'PetHouseGroup.ui.before')
preserve=[Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet')/n for n in ['PetHouseUI.mlua','PetLogic.mlua','PetProgress.mlua']]
(stage/'source-hashes.json').write_text(json.dumps({'ui':{'path':str(ui),'sha256':hashlib.sha256(ui.read_bytes()).hexdigest()},'preserved':{str(p):hashlib.sha256(p.read_bytes()).hexdigest()for p in preserve}},ensure_ascii=False,indent=2),encoding='utf-8')
(stage/'plan.json').write_text(json.dumps({'classification':'modify existing UI','steps':[{'name':'Find existing lightning artwork and inspect energy row','status':'completed'},{'name':'Register unchanged artwork and add decorative icon beside gauge','status':'in_progress'},{'name':'Verify saved layout and actual Maker rendering in one runtime cycle','status':'pending'}]},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(spec,ensure_ascii=False),flush=True)
