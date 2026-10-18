from pathlib import Path
stage=Path('work/pet-variation-repair-v2')
p=stage/'verify_cold_render.py';s=p.read_text();s=s.replace("r['selected']==3","r['selected']==1");s=s.replace("namespace={};code=", "code=");s=s.replace(";exec(code,{'Path':Path,'Image':Image,'json':json,'out':out,'root':Path('G:/Maple_Story_Deck/ArtSource/PetEquipment')},namespace)","");p.write_text(s,encoding='utf-8')
p=stage/'verify_care.py';s=p.read_text();s=s.replace("r['active']==3","r['active']==1")
s=s.replace('body[H.HappyFaceRUID]=true;','for _,id in pairs(L.PetDressedFrameAtlases)do body[id]=true end;body[H.HappyFaceRUID]=true;')
old='local layers=L:GetPetGearLayers(H.CustomImageRUID,H:GetDisplayedPet().progress.GearDesigns);local selected={};for _,id in pairs(layers)do selected[id]=true end;local active=0;for id,e in pairs(pool.byRUID)do if e.SpriteGUIRendererComponent.Color.a>.99 then active=active+1;if not selected[id]then q.gearFrameErrors=q.gearFrameErrors+1 end end end;if active~=3 then q.gearFrameErrors=q.gearFrameErrors+1 end;'
new='local f=pool.frame;if pool.base~=H.CustomImageRUID or pool.code~=26 or not f.Enable or tostring(f.SpriteGUIRendererComponent.ImageRUID.DataId)~=L.PetDressedFrameAtlases[H.CustomImageRUID]then q.gearFrameErrors=q.gearFrameErrors+1 end;'
assert old in s;s=s.replace(old,new)
old='local layers=L:GetPetGearLayers(H.CustomImageRUID,H:GetDisplayedPet().progress.GearDesigns);local selected={};for _,id in pairs(layers)do selected[id]=true end;local n=0;for id,e in pairs(pool.byRUID)do if e.SpriteGUIRendererComponent.Color.a>.99 then n=n+1;if not selected[id]or e.Parent~=p then q.gearErrors=q.gearErrors+1 end end end;if n~=3 then q.gearErrors=q.gearErrors+1 end;'
new='local f=pool.frame;if pool.base~=H.CustomImageRUID or pool.code~=26 or not f.Enable or f.Parent~=p or tostring(f.SpriteGUIRendererComponent.ImageRUID.DataId)~=L.PetDressedFrameAtlases[H.CustomImageRUID]then q.gearErrors=q.gearErrors+1 end;'
assert old in s;s=s.replace(old,new);s=s.replace("'pixelComparisons':json.loads", "'atomicBodyAndGear':True,'pixelComparisons':json.loads");p.write_text(s,encoding='utf-8')
p=stage/'pixel_verify.py';s=p.read_text();needle=" result={'cases':reports,"
addition=""" for code in range(27):
  digits=[code%3,(code//3)%3,code//9];mask=sum(bit for bit,digit in zip([1,2,4],digits)if digit);selection=sum(weight for weight,digit in zip([1,100,10000],digits)if digit==2)
  r,_=snap(frames[0],selection,mask,code%2==1);reports.append(r)
"""
assert needle in s;s=s.replace(needle,addition+needle);p.write_text(s,encoding='utf-8')
print('Verification now checks the single visible frame and all 27 equipment combinations, without assuming separate visible gear actors.')
