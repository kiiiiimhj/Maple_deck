from pathlib import Path
stage=Path('work/pet-variation-v1')
for name in ['verify_local.py','runtime_common.py','verify_runtime.py','verify_skill.py']:
 p=stage/name;s=p.read_text(encoding='utf-8').replace('RunPetGearVariantMask','RunPetGearDesigns').replace('GearVariantMask','GearDesigns').replace('gearVariantMask','gearDesigns')
 s=s.replace('GearDesigns=7','GearDesigns=10101').replace('v.gearDesigns~=7','v.gearDesigns~=10101')
 if name=='verify_local.py':
  s=s.replace('local base=L:GetPetStats',"local function gearcode(mask)return mask%2+math.floor(mask/2)%2*100+math.floor(mask/4)%2*10000 end\nlocal base=L:GetPetStats")
  s=s.replace('p.GearDesigns=mask','p.GearDesigns=gearcode(mask)').replace('GearDesigns==mask','GearDesigns==gearcode(mask)').replace('L:GetPetGearLayers(base,mix)','L:GetPetGearLayers(base,gearcode(mix))').replace("base..':stripe'","base..':design2'")
  s=s.replace('GearDesigns=10101,GearEquippedMask','GearDesigns=10101,GearEquippedMask')
 if name=='verify_runtime.py':
  s=s.replace("bool(r['variant']&bit)==(variant==2)","(r['variant']//(1 if bit==1 else 100 if bit==2 else 10000))%100==variant-1")
  s=s.replace('p.GearDesigns=mix','p.GearDesigns=mix%2+math.floor(mix/2)%2*100+math.floor(mix/4)%2*10000')
  s=s.replace("'version':8,'roundTrip':7,'runMask':7,'runVariant':7","'version':9,'roundTrip':10101,'runMask':7,'runVariant':10101")
  s=s.replace('phase<8 and phase or 7','phase<8 and (phase%2+math.floor(phase/2)%2*100+math.floor(phase/4)%2*10000) or 10101')
  s=s.replace("'schemaVersion':8","'schemaVersion':9")
 p.write_text(s,encoding='utf-8')
