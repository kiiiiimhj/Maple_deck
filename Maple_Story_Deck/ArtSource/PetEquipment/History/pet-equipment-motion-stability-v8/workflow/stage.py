from pathlib import Path
import re,json,sys,shutil,ast
sys.path.insert(0,'work/ranged-lua-runtime')
from lupa import LuaRuntime
stage=Path('work/pet-gear-motion-v8');out=Path('outputs/pet-gear-motion-v8');source=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig');runtime=LuaRuntime()
def plain(v):return {str(k):plain(x)for k,x in v.items()}if hasattr(v,'items')else v
def lua(v):
 if isinstance(v,dict):return '{'+','.join('['+json.dumps(str(k))+']='+lua(x)for k,x in v.items())+'}'
 if isinstance(v,str):return json.dumps(v)
 if isinstance(v,bool):return 'true'if v else'false'
 return repr(v)
maps=plain(runtime.execute('return '+re.search(r'(?m)^\tproperty table NativePetGearOverlays = (.*)$',source)[1]));new=json.loads((out/'overlay-map.json').read_text());uploaded=json.loads((out/'applied-assets.json').read_text())
for pet,count in {'5002617':109,'5000498':98,'landturtle':82,'oduck':81}.items():
 assert len(new[pet])==count
 for base,layers in new[pet].items():
  maps[pet][base]={}
  for slot,z in layers.items():
   im=uploaded[z['asset']];assert im['size']==[round(z['w']*z['density']),round(z['h']*z['density'])]
   maps[pet][base][slot]={k:z[k]for k in ['x','y','w','h','density']};maps[pet][base][slot]['ruid']=im['ruid']
   if z.get('replacesBody'):maps[pet][base][slot]['replacesBody']=True
source,n=re.subn(r'(?m)^\tproperty table NativePetGearOverlays = .*$',lambda m:'\tproperty table NativePetGearOverlays = '+lua(maps),source);assert n==1
anchor='\t\tlocal selected={}\n\t\tlocal descriptors={}'
warm='''		-- A loaded sprite can still need its first full-size render. Warm the
		-- incoming native body frames before changing the visible body and gear.
		-- Keep the previous complete pose visible during that short handoff.
		pool.warmedBodies=pool.warmedBodies or {}
		local warmFrames=self.NativePetGearClips[clip] or {base}
		local needsWarm=false
		for _,key in ipairs(warmFrames) do if not pool.warmedBodies[key] then needsWarm=true break end end
		if needsWarm then
			if pool.warmingClip~=clip then pool.warmingClip=clip;pool.bodyWarmStart=now;pool.bodyWarmTicks=0 end
			pool.bodyWarmTicks=pool.bodyWarmTicks+1;pool.age=0;pool.lastTick=now
			for _,key in ipairs(warmFrames) do
				local actor=pool.actors[key] local metrics=self.NativePetGearSpriteMetrics[key]
				if actor~=nil and metrics~=nil and not (pool.selected or {})[key] then
					local bx=(metrics.w*.5-metrics.px*metrics.w)*sx
					local by=((1-metrics.py)*metrics.h-metrics.h*.5)*sy
					actor.UITransformComponent.RectSize=Vector2(metrics.w*sx,metrics.h*sy)
					actor.UITransformComponent.anchoredPosition=Vector2(origin.x+(image.FlipX and -bx or bx),origin.y+(image.FlipY and -by or by))
					actor.SpriteGUIRendererComponent.FlipX=image.FlipX;actor.SpriteGUIRendererComponent.FlipY=image.FlipY
					actor.SpriteGUIRendererComponent.Color=Color(1,1,1,1/255)
				end
			end
			if now-pool.bodyWarmStart<.16 or pool.bodyWarmTicks<8 then return end
			for _,key in ipairs(warmFrames) do
				pool.warmedBodies[key]=true
				if pool.actors[key]~=nil and not (pool.selected or {})[key] then pool.actors[key].SpriteGUIRendererComponent.Color=Color(1,1,1,0) end
			end
			pool.warmingClip=nil
		end
		local selected={}
		local descriptors={}'''
assert source.count(anchor)==1
source=source.replace(anchor,warm)
(stage/'PetLogic.mlua').write_text(source,encoding='utf-8',newline='\r\n')
for name in ['PetHouseUI.mlua','PetUI.mlua']:shutil.copy2(stage/(name+'.before'),stage/name)
house=(stage/'PetHouseUI.mlua').read_text(encoding='utf-8-sig')
old='local flinch=phase==1 and math.sin(elapsed*27)*math.max(0,1-(elapsed-1.2)/1.3) or 0'
new='local recoil=math.max(0,math.min(1,(elapsed-1.2)/0.28))\n\t\tlocal flinch=phase==1 and math.sin(recoil*math.pi)*0.75 or 0'
assert old in house
house=house.replace(old,new)
(stage/'PetHouseUI.mlua').write_text(house,encoding='utf-8',newline='\r\n')
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text(encoding='utf-8'));fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');ns={};exec('import re\n'+ast.unparse(fn),ns)
runtime.execute('function Vector2(x,y)return {x=x,y=y}end;function Vector3(x,y,z)return {x=x,y=y,z=z}end;function Color(r,g,b,a)return {r=r,g=g,b=b,a=a}end')
for code in [source,house]:runtime.execute(ns['translate'](code))
(out/'overlay-ruids.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');print('Staged motion-stable equipment and single injection recoil; both Lua syntax checks passed.')
