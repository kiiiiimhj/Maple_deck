from pathlib import Path
import json,hashlib
stage=Path('work/ttung-charm-jump');out=Path('outputs/ttung-charm-jump');path=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua');s=path.read_text(encoding='utf-8-sig');assert s==(stage/'PetLogic.mlua').read_text(encoding='utf-8')
(stage/'PetLogic.first-applied.mlua').write_text(s,encoding='utf-8');sources={'PetLogic.mlua':{'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}}
timing=json.loads((out/'timing.json').read_text(encoding='utf-8'))
line='\tproperty number PetCharmJumpPeriod = 0.66'
assert s.count(line)==1;s=s.replace(line,'\tproperty table PetCharmJumpNods = {'+','.join(str(r['nod'])for r in timing['frames'])+'}\n'+line)
old='self:PlacePetSkillSprite(nextBody,Vector3(p.x,p.y+width*foot+jump,p.z),width,0,fade)';new='self:PlacePetSkillSprite(nextBody,self:GetPetCharmBodyPosition(v,index,width,jump),width,0,fade)';assert s.count(old)==1;s=s.replace(old,new)
needle='\tmethod integer GetPetCharmJumpFrameIndex(number elapsed)'
method='''\t@ExecSpace("ClientOnly")
\tmethod Vector3 GetPetCharmBodyPosition(table visual, integer index, number width, number jump)
\t\tlocal p=visual.center local pixel=math.max(0.000001,visual.pixel)
\t\tlocal origin=_UILogic:ScreenToWorldPosition(Vector2(0,0))
\t\tlocal y=p.y+width*self.PetCharmJumpFeet[index]+jump
\t\t-- Preserve the requested size. Snap the head's immutable source-pixel
\t\t-- reference to the screen, so its ink cannot shimmer with fractional motion.
\t\tlocal left=p.x-width*0.5
\t\tlocal x=origin.x+math.floor((left-origin.x)/pixel+0.5)*pixel+width*0.5
\t\tlocal headTop=y+width*0.5-self.PetCharmJumpNods[index]*width/128
\t\tlocal snapped=origin.y+math.floor((headTop-origin.y)/pixel+0.5)*pixel
\t\treturn Vector3(x,y+snapped-headTop,p.z)
\tend

'''
assert s.count(needle)==1;s=s.replace(needle,method+needle)
(stage/'PetLogic.mlua').write_text(s,encoding='utf-8');(stage/'repair-sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8');scope=json.loads((out/'scope.json').read_text(encoding='utf-8'));scope['newMethods'].append('GetPetCharmBodyPosition');scope['pixelReferenceSnappedWithoutSizeChange']=True;(out/'scope.json').write_text(json.dumps(scope,indent=2),encoding='utf-8');print('Face pixel phase snapped; character size unchanged.')
