from pathlib import Path
import ast,sys,json
sys.path.insert(0,'work/ranged-lua-runtime');from lupa import LuaRuntime
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text());fn=next(x for x in tree.body if isinstance(x,ast.FunctionDef)and x.name=='translate');ns={};exec('import re\n'+ast.unparse(fn),ns);r=LuaRuntime();r.execute('function Vector2(x,y)return{x=x,y=y}end;function Vector3(x,y,z)return{x=x,y=y,z=z}end;function Color(r,g,b,a)return{r=r,g=g,b=b,a=a}end');obj=r.execute(ns['translate'](Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua').read_text(encoding='utf-8-sig')));r.globals().L=obj
r.execute('local entry=L:GetPetDefinition("ttungttang");missing={};for pose,list in pairs(entry.frames)do for i,id in ipairs(list)do if L.PetGearOverlays[id]==nil then table.insert(missing,{pose=pose,index=i,id=id})end end end')
print([{k:v for k,v in x.items()}for _,x in r.globals().missing.items()])
from PIL import Image
im=Image.open('outputs/pet-variation-repair-v2/after-actual-feed-sequence.png');im.crop((960,0,1440,360)).resize((960,720),Image.Resampling.NEAREST).save('outputs/pet-variation-repair-v2/feed-suspicious-frame.png')
