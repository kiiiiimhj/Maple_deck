from pathlib import Path
import json
stage=Path('work/pet-variation-repair-v2');out=Path('outputs/pet-variation-repair-v2')
p=Path('work/pet-variation-v1/upload_resume.py').read_text().replace('pet-variation-v1','pet-variation-repair-v2').replace('petstripe1_','petrepair2_');(stage/'upload_resume.py').write_text(p,encoding='utf-8')
# Reuse identical, already registered textures by content hash.
old=json.loads(Path('outputs/pet-variation-v1/applied-assets.json').read_text());(out/'applied-assets.json').write_text(json.dumps(old,ensure_ascii=False,indent=2),encoding='utf-8')
p=Path('work/pet-variation-v1/apply.py').read_text().replace('pet-variation-v1','pet-variation-repair-v2').replace("names=['PetLogic.mlua','PetProgress.mlua','PetUI.mlua']","names=['PetLogic.mlua']").replace('PET-STRIPE-APPLY','PET-REPAIR2-APPLY');(stage/'apply.py').write_text(p,encoding='utf-8')
