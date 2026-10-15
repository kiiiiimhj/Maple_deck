from pathlib import Path
stage=Path('work/pet-gear-painted-v5')
for old,new in [('work/pet_v4_verify_runtime.py','verify_runtime.py'),('work/pet_v4_verify_extra.py','verify_extra.py')]:
 s=Path(old).read_text(encoding='utf-8').replace('outputs/pet-gear-frame-v4','outputs/pet-gear-painted-v5').replace('work/pet-gear-frame-v4','work/pet-gear-painted-v5').replace('PET-GEAR-FRAME-V4-QA','PET-GEAR-PAINTED-V5-QA').replace('work/pet_v4_watch.lua','work/pet-gear-painted-v5/watch.lua')
 oldexp='local exp={[ruid]=true};for slot,layer in pairs(L.NativePetGearOverlays[e.id][ruid])do'
 if oldexp in s:
  s=s.replace(oldexp,'local layers=L.NativePetGearOverlays[e.id][ruid];local exp={};if not(layers.coat~=nil and layers.coat.replacesBody==true and L:HasPetGearBit(e.progress.GearEquippedMask,2))then exp[ruid]=true end;for slot,layer in pairs(layers)do')
 (stage/new).write_text(s,encoding='utf-8')
s=Path('work/pet_v4_watch.lua').read_text(encoding='utf-8')
s=s.replace('local expected={[pool.base]=true};local layers=L.NativePetGearOverlays[pool.petId][pool.base]','local expected={};local layers=L.NativePetGearOverlays[pool.petId][pool.base];local replaced=layers.coat~=nil and layers.coat.replacesBody==true and L:HasPetGearBit(pool.mask,2);if not replaced then expected[pool.base]=true end')
s=s.replace('bases~=1','bases~=(replaced and 0 or 1)')
(stage/'watch.lua').write_text(s,encoding='utf-8');print('Prepared actual Maker verification for source-painted gear and blurred shell replacement.')
