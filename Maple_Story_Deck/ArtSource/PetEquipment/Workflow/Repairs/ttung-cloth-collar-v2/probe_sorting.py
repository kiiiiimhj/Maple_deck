from pathlib import Path
import sys,json
sys.path.insert(0,str(Path('work/pet-variation-v1').resolve()));from runtime_common import s,run
try:
 r=run('sorting','local result={};for _,e in ipairs({_PetHouseUI.PetDisplay:GetChildByName("Portrait"),_PetUI.PetDisplay:GetChildByName("Portrait"),_PetUI.PetGearSlots:GetChildByName("Cap"):GetChildByName("Icon")})do local r=e.SpriteGUIRendererComponent;local item={name=e.Name,override=tostring(r.OverrideSorting),order=tostring(r.OrderInLayer),layer=tostring(r.SortingLayer),material=tostring(r.MaterialId),children={}};for _,c in ipairs(e.Children:ToTable())do local cr=c.SpriteGUIRendererComponent;if cr~=nil and #item.children<3 then table.insert(item.children,{name=c.Name,override=tostring(cr.OverrideSorting),order=tostring(cr.OrderInLayer),layer=tostring(cr.SortingLayer),index=tostring(_UILogic:GetSiblingIndex(c.UITransformComponent))})end end;if #item.children==0 then item.children=false end;table.insert(result,item)end');print(json.dumps(r));Path('outputs/pet-variation-repair-v2/sorting-probe.json').write_text(json.dumps(r,indent=2))
finally:s.close()

