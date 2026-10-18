from pathlib import Path
from PIL import Image
import json,numpy as np
out=Path('outputs/pet-variation-repair-v2');old=json.loads(Path('outputs/pet-variation-v1/original-maps.json').read_text())['PetGearOverlays'];registry=json.loads(Path('G:/Maple_Story_Deck/ArtSource/PetEquipment/Maps/equipment-resources.json').read_text())['resources'];files={r['ruid']:Path('G:/Maple_Story_Deck/ArtSource/PetEquipment')/r['file']for r in registry};new=json.loads((out/'repair-map.json').read_text())['1'];report=[]
for base,layers in new.items():
 a=np.array(Image.open(files[old[base]['coat']]).convert('RGBA'));b=np.array(Image.open(out/(layers['coat']+'.png')).convert('RGBA'));r,g,blue=[b[:,:,i].astype(float)for i in range(3)];material=(b[:,:,3]>0)&(blue>r*1.12)&(blue>g*1.06)&(blue>20);restored=(a[:,:,3]==0)&material
 report.append({'base':base,'restoredFabricPixels':int(restored.sum()),'removedPreviousContourPixels':int(((a[:,:,3]>0)&(b[:,:,3]==0)).sum())})
(out/'material-recovery-proof.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print('Recovered original fabric pixels:',sum(r['restoredFabricPixels']for r in report),'across',sum(r['restoredFabricPixels']>0 for r in report),'frames.')
