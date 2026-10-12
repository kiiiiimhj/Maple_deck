from pathlib import Path
import re,json,ast,sys
stage=Path('work/pet-hit-feedback');out=Path('outputs/pet-hit-feedback')
def read(name):return (stage/(name+'.before')).read_text(encoding='utf-8-sig')
def write(name,s):(stage/name).write_text(s,encoding='utf-8')
def once(s,a,b,count=1):
    assert s.count(a)==count,(a[:80],s.count(a),count)
    return s.replace(a,b)
s=read('PetHouseUI.mlua');s=once(s,'Vector2(-30+(64-44.5)*scale','Vector2(-38+(64-44.5)*scale');write('PetHouseUI.mlua',s)
s=read('PetLogic.mlua')
s=once(s,'\tproperty number PetTurtleWidth = 2.6','\tproperty number PetTurtleWidth = 2.6\n\tproperty string PetTurtleHitRUID = "43b0698875a348229caaf9221a8c8b3a"\n\tproperty number PetTurtleHitDuration = 0.24\n\tproperty number PetTurtleRecoilDuration = 0.18')
s=once(s,'self.PetFoxWaveRUID,self.PetTurtleShellRUID}','self.PetFoxWaveRUID,self.PetTurtleShellRUID,self.PetTurtleHitRUID}')
s=once(s,'\t\t\tfor _,f in ipairs(dustFrames) do _CardManager:GetSpriteMetrics(f.ruid) end','\t\t\tfor _,f in ipairs(dustFrames) do _CardManager:GetSpriteMetrics(f.ruid) end\n\t\t\tlocal hitFrames=self:GetPetTurtleHitFrames()\n\t\t\tif #hitFrames==0 then ready=false end')
s=once(s,'\t\tself:UpdatePetSkillVisual(0)','''\t\tif petId=="landturtle" then
\t\t\tlocal frames=self:GetPetTurtleHitFrames()
\t\t\tif #frames>0 then self._T.petSkillVisual.hitFx=self:SpawnPetSkillSprite(frames[1].ruid,map,136) end
\t\tend
\t\tself:UpdatePetSkillVisual(0)''')
s=once(s,'\t\tv.hitAt=v.age','''\t\tif _GameManager:IsGamePaused() or _GameManager.SafeAreaFrozen then return end
\t\tv.hitAt=v.age
\t\t-- Coalesce bursts in a crowd: one actor and at most one recoil restart per 0.07s.
\t\tif v.recoilAt==nil or v.age-v.recoilAt>=0.07 then
\t\t\tv.recoilAt=v.age v.recoilDirection=(v.recoilDirection or -1)*-1
\t\tend
\t\tif v.sparkAt==nil or v.age-v.sparkAt>=0.04 then v.sparkAt=v.age end''')
s=once(s,'\t\tself:PlacePetSkillSprite(v.body,Vector3(p.x,p.y+width*ratio*0.5+offset,p.z),width,0,fade)','''\t\tlocal hitAge=v.recoilAt~=nil and math.max(0,t-v.recoilAt) or self.PetTurtleRecoilDuration
\t\tlocal recoil=math.max(0,1-hitAge/self.PetTurtleRecoilDuration)
\t\tlocal shake=(v.recoilDirection or 1)*0.055*math.cos(hitAge*55)*recoil*recoil
\t\tsquash=squash+0.025*math.sin(math.min(1,hitAge/self.PetTurtleRecoilDuration)*math.pi)*recoil
\t\tself:PlacePetSkillSprite(v.body,Vector3(p.x+shake,p.y+width*ratio*0.5+offset,p.z),width,0,fade)''')
s=once(s,'\t\tself:UpdatePetTurtleDust(v)','\t\tself:UpdatePetTurtleHitMarker(v,t,fade)\n\t\tself:UpdatePetTurtleDust(v)')
s=once(s,'\n\t\tif isvalid(v.body) then v.body:Destroy() end\n\t\tfor _,dust','\n\t\tif isvalid(v.body) then v.body:Destroy() end\n\t\tif isvalid(v.hitFx) then v.hitFx:Destroy() end\n\t\tfor _,dust')
part='''
\t@ExecSpace("ClientOnly")
\tmethod table GetPetTurtleHitFrames()
\t\tif self._T.turtleHitFrames~=nil then return self._T.turtleHitFrames end
\t\tlocal frames={} local clip=_ResourceService:LoadAnimationClipAndWait(self.PetTurtleHitRUID)
\t\tif clip~=nil and clip.Frames~=nil then
\t\t\tfor i=1,clip.Frames.Count do
\t\t\t\tlocal sprite=clip.Frames[i].FrameSprite
\t\t\t\tif sprite~=nil then
\t\t\t\t\tlocal metrics=_CardManager:GetSpriteMetrics(sprite.RUID)
\t\t\t\t\tif metrics.w>0 and metrics.h>0 then table.insert(frames,{ruid=sprite.RUID,w=metrics.w}) end
\t\t\t\tend
\t\t\tend
\t\tend
\t\tself._T.turtleHitFrames=frames
\t\tlog("[VRF] PET-TURTLE block hit frames="..#frames)
\t\treturn frames
\tend

\t@ExecSpace("ClientOnly")
\tmethod void UpdatePetTurtleHitMarker(table v, number t, number fade)
\t\tlocal fx=v.hitFx if not isvalid(fx) then return end
\t\tlocal age=v.sparkAt~=nil and math.max(0,t-v.sparkAt) or self.PetTurtleHitDuration
\t\tif age>=self.PetTurtleHitDuration then fx.Enable=false fx.SpriteRendererComponent.Color=Color(1,1,1,0) return end
\t\tlocal frames=self:GetPetTurtleHitFrames() if #frames==0 then return end
\t\tlocal index=math.min(#frames,1+math.floor(age/self.PetTurtleHitDuration*#frames))
\t\tlocal frame=frames[index]
\t\tif fx.SpriteRendererComponent.SpriteRUID~=frame.ruid then fx.SpriteRendererComponent.SpriteRUID=frame.ruid end
\t\tfx.SpriteRendererComponent.PlayRate=0
\t\tlocal scale=0.82/math.max(0.01,frames[1].w)
\t\tlocal pos=Vector3(v.center.x,v.center.y+self.PetTurtleWidth*(16/30)*0.65,v.center.z-0.1)
\t\tlocal alpha=math.max(0,1-(age/self.PetTurtleHitDuration)^2)*fade
\t\tself:PlacePetSkillSprite(fx,pos,frame.w*scale,0,alpha)
\tend
'''
i=s.rfind('\nend');s=s[:i]+'\n'+part+s[i:];write('PetLogic.mlua',s)
sys.path.insert(0,str(Path('work/ranged-lua-runtime').resolve()))
from lupa import LuaRuntime
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text(encoding='utf-8'));fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='translate');ns={'re':re};exec(compile(ast.Module(body=[fn],type_ignores=[]),'translator','exec'),ns)
lua=LuaRuntime();lua.execute('function Vector2(x,y)return {}end')
for name in ['PetHouseUI.mlua','PetLogic.mlua']:lua.execute(ns['translate']((stage/name).read_text(encoding='utf-8')))
plan=json.loads((stage/'plan.json').read_text());plan['steps'][0]['status']='completed';plan['steps'][1]['status']='in_progress';(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print('Staged 8px bowl shift and pooled shell hit/recoil; both scripts compile.')
