from pathlib import Path
source=Path('work/pet-lobby-icon/upload.py').read_text(encoding='utf-8')
source=source.replace('pet-lobby-icon','pet-lobby-icon-v2').replace('pet-house-paw.png','pet-house-paw-v2.png')
source=source.replace('1412112','1446447').replace('bc40d62d66e0a507d39d60864ad817c09e9fedfeb0ddd7b09fd53ca83543762c','810e184cad32d25d81121a277cbca04d33a7c7d3f4439a84d1619af65fba7104')
source=source.replace("proof['resultList'][0]['request']['guid']=='5828fdca6b1d48198e257b2202833abb'","proof['resultList'][0]['request']['guid']=='9c00086f822540d5bacfe376c4c9c738'")
source=source.replace('pet_lobby_house_paw_20261012','pet_lobby_house_paw_centered_v2_20261012').replace('Generated pet-house with paw emblem, matching existing gold and wood lobby icons.','Corrected symmetric front-view pet-house and upright centered paw emblem.')
exec(compile(source,'guarded-pet-lobby-icon-v2-upload','exec'))
