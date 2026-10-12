from pathlib import Path
import json,hashlib
stage=Path('work/pet-first-heart');out=Path('outputs/pet-first-heart');stage.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
target=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua');before=stage/'PetLogic.mlua.before'
if not before.exists():before.write_bytes(target.read_bytes())
(stage/'sources.json').write_text(json.dumps({'PetLogic.mlua':{'path':str(target),'sha256':hashlib.sha256(before.read_bytes()).hexdigest()}},ensure_ascii=False,indent=2),encoding='utf-8')
(stage/'plan.json').write_text(json.dumps({'task':'Fix Ttungttang heart distortion on the first skill cast','steps':[{'name':'Compare fresh first/second casts and initial renderer state','status':'in_progress'},{'name':'Fix hidden spawn and first-use geometry initialization','status':'pending'},{'name':'Verify fresh first cast, repeated cast and cleanup in Maker','status':'pending'}]},indent=2),encoding='utf-8')
common=Path('work/pet-fox/runtime_common.py').read_text(encoding='utf-8').replace('outputs/pet-fox','outputs/pet-first-heart').replace('work/pet-fox','work/pet-first-heart').replace('[VRF] PET-FOX-TEST ','[VRF] PET-FIRST-HEART ')
(stage/'runtime_common.py').write_text(common,encoding='utf-8')
