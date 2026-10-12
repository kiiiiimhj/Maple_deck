from pathlib import Path
source=Path('work/pet-lobby-icon/upload.py').read_text(encoding='utf-8')
source=source.replace('pet-lobby-icon','pet-lobby-icon-v3').replace('pet-house-paw.png','pet-house-paw-v3.png')
source=source.replace('1412112','1412835').replace('bc40d62d66e0a507d39d60864ad817c09e9fedfeb0ddd7b09fd53ca83543762c','e3ab8b5509b1a753a5905ec6c2b913ebf812babf33ca8a4244ec694c7bf6d06e')
source=source.replace("proof['resultList'][0]['request']['guid']=='5828fdca6b1d48198e257b2202833abb'","proof['resultList'][0]['request']['guid']=='f32b1ba470b0445cbe8ca474b900dad3'")
source=source.replace('pet_lobby_house_paw_20261012','pet_lobby_house_paw_side_v3_20261012').replace('Generated pet-house with paw emblem, matching existing gold and wood lobby icons.','Approved coherent side-view pet-house with paw centered in the entrance.')
exec(compile(source,'guarded-pet-lobby-icon-v3-upload','exec'))
