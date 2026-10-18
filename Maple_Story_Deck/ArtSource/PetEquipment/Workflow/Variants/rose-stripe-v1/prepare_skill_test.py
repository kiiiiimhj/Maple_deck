from pathlib import Path
p=Path('work/ttung-gear-fitting-v9/map_runtime.py').read_text(encoding='utf-8')
p=p.replace('ttung-gear-fitting-v9','pet-variation-v1').replace('TTUNG-GEAR-FITTING9-MAP-CHECK','PET-STRIPE-SKILL')
p=p.replace('rec.pets.ttungttang.GearEquippedMask=7;','rec.pets.ttungttang.GearEquippedMask=7;rec.pets.ttungttang.GearVariantOwnedMask=7;rec.pets.ttungttang.GearVariantMask=7;')
p=p.replace('local expected=L.PetGearOverlays[L.PetCharmJumpRUIDs[v.charmFrame]]','local expected=L:GetPetGearLayers(L.PetCharmJumpRUIDs[v.charmFrame],v.gearVariantMask or 0)')
p=p.replace('if gearActive~=3 or v.gearMask~=7 then','if gearActive~=3 or v.gearMask~=7 or v.gearVariantMask~=7 then')
p=p.replace("'equipmentLayers':3","'newStripeSet':True,'equipmentLayers':3")
# Avoid deleting the warmed pool after QA; the real session can keep using it.
p=p.replace("assert run('cleanup-pool','local L=_PetLogic;L:ClearPetCharmRenderPool();local alive=0;for _,a in ipairs(L._T.jumpActors)do if isvalid(a)then alive=alive+1 end end;local result={alive=alive}')['alive']==0","assert run('retained-pool','local L=_PetLogic;local p=L._T.petCharmRenderPool;local result={ready=p~=nil and p.ready or false}')['ready']")
Path('work/pet-variation-v1/verify_skill.py').write_text(p,encoding='utf-8')
