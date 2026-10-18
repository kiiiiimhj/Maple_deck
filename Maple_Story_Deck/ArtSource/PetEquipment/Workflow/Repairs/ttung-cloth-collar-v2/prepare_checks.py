from pathlib import Path
stage=Path('work/pet-variation-repair-v2')
# Run the same real care paths using the new artwork. Slot-selection code is
# unchanged, so keep its existing successful tests rather than duplicating them.
p=Path('work/pet-variation-v1/verify_runtime.py').read_text(encoding='utf-8')
start=p.index(" # The real Maker-only grant button")
end=p.index(" open_house();capture('actual-stripe-idle',2)",start)
p=p[:start]+p[end:]
start=p.index(' # Exercise every fitted frame')
end=p.index(' # Normal care buttons',start)
p=p[:start]+p[end:]
p=p.replace("out=Path('outputs/pet-variation-v1')","out=Path('outputs/pet-variation-repair-v2')")
p=p.replace("from runtime_common import s,run,wait,preserve,setup,restore,out","import sys\nsys.path.insert(0,str(Path('work/pet-variation-v1').resolve()))\nfrom runtime_common import s,run,wait,preserve,setup,restore\nout=Path('outputs/pet-variation-repair-v2')")
p=p.replace("'actual-stripe-","'after-actual-")
p=p.replace("proof['frame-combinations']","json.loads((out/'actual-pixel-verification.json').read_text())")
p=p.replace("'frameCases':json.loads((out/'actual-pixel-verification.json').read_text())","'pixelComparisons':json.loads((out/'actual-pixel-verification.json').read_text())['frameCases']")
p=p.replace("'schemaVersion':9","'schemaVersion':9,'sourceArtworkRepair':True")
(stage/'verify_care.py').write_text(p,encoding='utf-8')
p=Path('work/pet-variation-v1/verify_skill.py').read_text(encoding='utf-8').replace('pet-variation-v1','pet-variation-repair-v2').replace('PET-STRIPE-SKILL','PET-GEAR-REPAIR2-SKILL')
(stage/'verify_skill.py').write_text(p,encoding='utf-8')
print('Prepared targeted live care and skill checks for the corrected artwork.')
