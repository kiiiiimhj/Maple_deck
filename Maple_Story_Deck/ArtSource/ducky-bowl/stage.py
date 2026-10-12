from pathlib import Path
import json,re,ast,sys
stage=Path('work/ducky-bowl');out=Path('outputs/ducky-bowl')
asset=json.loads((out/'applied-assets.json').read_text(encoding='utf-8'))['food-bowl']
s=(stage/'PetHouseUI.mlua.before').read_text(encoding='utf-8-sig')
def once(a,b,count=1):
    global s
    assert s.count(a)==count,(a[:80],s.count(a),count)
    s=s.replace(a,b)
once('\tproperty any SleepCushion = nil','\tproperty any DuckyFoodBowl = nil\n\tproperty boolean DuckyBowlReady = false\n\tproperty string DuckyBowlRUID = "'+asset['ruid']+'"\n\tproperty any SleepCushion = nil')
once('and ((action ~= "wash" and action ~= "inject") or self.CareBackdropReady)','and ((action ~= "wash" and action ~= "inject") or self.CareBackdropReady) and (entry.id~="5000498" or action~="feed" or self.DuckyBowlReady)')
once('\t self:InitializeArtwork()','\t self:InitializeArtwork()\n\t self:InitializeDuckyFoodBowl()')
once('\t\tif action=="feed" and entry.id=="5002617" and not self.FeedingReady then return end','\t\tif action=="feed" and entry.id=="5002617" and not self.FeedingReady then return end\n\t\tif action=="feed" and entry.id=="5000498" and not self.DuckyBowlReady then return end')
once('\t\tself.PetDisplay:GetChildByName("Food").Enable = false\n\t\tif not active','\t\tself.PetDisplay:GetChildByName("Food").Enable = false\n\t\tself:SetDuckyFoodBowl(active,elapsed)\n\t\tif not active')
once('\t self.SleepCushion=nil self.SleepCushionReady=false','\t self.SleepCushion=nil self.SleepCushionReady=false\n\t if isvalid(self.DuckyFoodBowl) then self.DuckyFoodBowl:Destroy() end\n\t self.DuckyFoodBowl=nil self.DuckyBowlReady=false')
part='''
\t@ExecSpace("ClientOnly")
\tmethod void InitializeDuckyFoodBowl()
\t\tif isvalid(self.DuckyFoodBowl) then return end
\t\tlocal portrait=self.PetDisplay:GetChildByName("Portrait")
\t\tlocal bowl=self:WalkLayer(self.PetDisplay,"DuckyFoodBowl",self.DuckyBowlRUID,256,256,0,0)
\t\tbowl.Enable=false self.DuckyFoodBowl=bowl self.DuckyBowlReady=false
\t\t_UILogic:SetSiblingIndex(bowl.UITransformComponent,_UILogic:GetSiblingIndex(portrait.UITransformComponent)+1)
\t\t_ResourceService:PreloadAsync({self.DuckyBowlRUID},function(results)
\t\t\tif not isvalid(self) then return end
\t\t\tlocal ready=true for _,result in pairs(results) do if result~=PreloadResultStatus.Success then ready=false end end
\t\t\tself.DuckyBowlReady=ready
\t\t\tlog("[VRF] DUCKY-BOWL pixel bowl ready="..tostring(ready))
\t\t\tif self.PetMode then self:Refresh() end
\t\tend)
\tend

\t@ExecSpace("ClientOnly")
\tmethod void SetDuckyFoodBowl(boolean active, number elapsed)
\t\tlocal bowl=self.DuckyFoodBowl if not isvalid(bowl) then return end
\t\tbowl.Enable=active and self.DuckyBowlReady and self:GetDisplayedPet().id=="5000498"
\t\tif not bowl.Enable then return end
\t\tlocal scale=_PetLogic:GetCustomPixelScale(bowl,2)
\t\tlocal size=128*scale
\t\tbowl.UITransformComponent.RectSize=Vector2(size,size)
\t\t-- Original 128px art: bowl bounds (25,96)-(64,118); keep the base on the paw plane.
\t\tbowl.UITransformComponent.anchoredPosition=Vector2(-30+(64-44.5)*scale,self:GetPortraitY()+(118-64)*scale)
\t\t_PetLogic:AlignCustomPortrait(bowl,{frames={},canvas=128},2)
\t\tlocal duration=_PetLogic:GetCareDuration("feed")
\t\tlocal fade=math.max(0,math.min(1,elapsed/0.14,(duration-elapsed)/0.22))
\t\tfade=fade*fade*(3-2*fade)
\t\tbowl.SpriteGUIRendererComponent.Color=Color(1,1,1,fade)
\tend
'''
i=s.rfind('\nend');s=s[:i]+'\n'+part+s[i:]
(stage/'PetHouseUI.mlua').write_text(s,encoding='utf-8')
# Compile the edited mLua methods without introducing another behavioral test suite.
sys.path.insert(0,str(Path('work/ranged-lua-runtime').resolve()))
from lupa import LuaRuntime
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text(encoding='utf-8'));fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='translate');ns={'re':re}
exec(compile(ast.Module(body=[fn],type_ignores=[]),'translator','exec'),ns)
lua=LuaRuntime();lua.execute('function Vector2(x,y)return {}end');lua.execute(ns['translate'](s))
plan=json.loads((stage/'plan.json').read_text());plan['steps'][0]['status']='completed';plan['steps'][1]['status']='in_progress';(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print('Staged fixed pixel bowl for Ducky feeding only; mLua compiles.')
