from pathlib import Path
import ast,json,sys
sys.path.insert(0,'work/ranged-lua-runtime')
from lupa import LuaRuntime
stage=Path('work/pet-variation-v1');out=Path('outputs/pet-variation-v1')
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text(encoding='utf-8'));fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');ns={};exec('import re\n'+ast.unparse(fn),ns)
rt=LuaRuntime(unpack_returned_tuples=True);rt.execute('function Vector2(x,y)return{x=x,y=y}end;function Vector3(x,y,z)return{x=x,y=y,z=z}end;function Color(r,g,b,a)return{r=r,g=g,b=b,a=a}end;function log(s)end')
for name,alias in [('PetProgress','Progress'),('PetLogic','L')]:rt.globals()[alias]=rt.execute(ns['translate']((stage/(name+'.mlua')).read_text(encoding='utf-8')))
rt.execute('''
function PetProgress() local p={} for k,v in pairs(Progress)do p[k]=v end return p end
_GameManager={GameStarted=false,GameOver=false}
_DateTimeLogic={now=10000,GetTimeElapsedWithoutOffset=function(self)return self.now end}
function L:MarkDirty(r)r.dirty=true end
function L:PushState(id,a,b)end
local r=L:ReadAccount(nil);assert(r~=nil);r.test=true;r.pets.ttungttang.Owned=true;L.States={qa=r}
local p=r.pets.ttungttang;p.GearOwnedMask=7;p.GearVariantOwnedMask=7;p.GearEquippedMask=7
local function gearcode(mask)return mask%2+math.floor(mask/2)%2*100+math.floor(mask/4)%2*10000 end
local base=L:GetPetStats('ttungttang',p);local requests=0
for mask=0,7 do
 p.GearDesigns=gearcode(mask)
 local st=L:GetPetStats('ttungttang',p)
 for k,v in pairs(base)do assert(st[k]==v,'duplicate stat '..k)end
 local saved=L:SerializeAccount(r);local loaded=L:ReadAccount(saved);assert(loaded~=nil and loaded.pets.ttungttang.GearDesigns==gearcode(mask))
end
for _,slot in ipairs({'Cap','Coat','Necklace'})do
 local def=L:GetPetGearDefinition(slot);p.GearEquippedMask=7;p.GearDesigns=0
 for _,variant in ipairs({2,1,2,2,1,1,2})do
  _DateTimeLogic.now=_DateTimeLogic.now+300;L:ApplyPetGearSelection('qa',slot,'ttungttang',variant);requests=requests+1
  assert(p.GearEquippedMask>=0 and p.GearEquippedMask<=7)
  local st=L:GetPetStats('ttungttang',p);assert(st.atkPct<=base.atkPct and st.critRate<=base.critRate and st.critDmg<=base.critDmg)
 end
end
local old=L:SerializeAccount(r);old.version=7
for _,profile in pairs(old.pets)do profile.GearDesigns=nil;profile.GearVariantOwnedMask=nil end
local migrated=L:ReadAccount(old);assert(migrated~=nil and migrated.pets.ttungttang.GearDesigns==0 and migrated.pets.ttungttang.GearVariantOwnedMask==0)
p.GearVariantOwnedMask=0;p.GearDesigns=0;p.GearEquippedMask=7;_DateTimeLogic.now=_DateTimeLogic.now+300;L:ApplyPetGearSelection('qa','Cap','ttungttang',2);assert(p.GearDesigns==0 and p.GearEquippedMask==7)
local only=PetProgress();assert(only:Deserialize({version=1,Owned=true,GearVariantOwnedMask=7,GearDesigns=10101,GearEquippedMask=7,GearOwnedMask=0}))
for _,pet in ipairs({'5002617','5000498','landturtle','oduck'})do assert(#L:GetPetGearVariants(pet,'Cap')==1)end
local count=0
for base,layers in pairs(L.PetGearOverlays)do
 for mix=0,7 do
  local selected=L:GetPetGearLayers(base,gearcode(mix))
  for slot,bit in pairs({hat=1,coat=2,neck=4})do
   local expected=L:HasPetGearBit(mix,bit)and L.PetGearVariantOverlays[base..':design2'][slot]or layers[slot]
   assert(selected[slot]==expected)
  end
  count=count+1
 end
end
local v8=L:SerializeAccount(r);v8.version=8
for id,profile in pairs(v8.pets)do profile.GearDesigns=nil;profile.GearVariantMask=id=='ttungttang'and 7 or 0;profile.GearVariantOwnedMask=id=='ttungttang'and 7 or 0 end
assert(L:ReadAccount(v8).pets.ttungttang.GearDesigns==10101)
-- Simulate a future third design to verify the selection is not a two-design toggle.
local catalogue=L.GetPetGearVariants
function L:GetPetGearVariants(petId,slot)
 local variants=catalogue(self,petId,slot)
 if petId=='ttungttang'then local a=variants[2];table.insert(variants,{id='future-'..slot,variant=3,bit=a.bit,slot=slot,icon=a.icon,key=a.key,statKey=a.statKey})end
 return variants
end
p.GearVariantOwnedMask=63;p.GearDesigns=0;p.GearEquippedMask=7
for _,slot in ipairs({'Cap','Coat','Necklace'})do _DateTimeLogic.now=_DateTimeLogic.now+300;L:ApplyPetGearSelection('qa',slot,'ttungttang',3)end
assert(p.GearDesigns==20202 and p.GearEquippedMask==7)
local saved=L:ReadAccount(L:SerializeAccount(r));assert(saved~=nil and saved.pets.ttungttang.GearDesigns==20202)
local st=L:GetPetStats('ttungttang',p);for k,v in pairs(base)do assert(st[k]==v)end
proof={requests=requests,frameCombinations=count,oldSaveMigration=true,legacyPrototypeMigration=true,futureThirdDesign=true,selectionRoundTrips=8,alternateOnlyOwnership=true,rejectUnowned=true,statStacking=false}
''')
proof={k:v for k,v in rt.globals().proof.items()};(out/'logic-verification.json').write_text(json.dumps(proof,indent=2),encoding='utf-8');print(proof)
