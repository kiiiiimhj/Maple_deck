from pathlib import Path
p=Path('work/pet-variation-repair-v2/verify_care.py');s=p.read_text()
old="tree=ast.parse(Path('work/pet-gear-motion-v8/verify_runtime.py').read_text(encoding='utf-8'));exec(ast.unparse(next(x for x in tree.body if isinstance(x,ast.FunctionDef)and x.name=='capture')),globals())"
new="""tree=ast.parse(Path('work/pet-gear-motion-v8/verify_runtime.py').read_text(encoding='utf-8'));capture_code=ast.unparse(next(x for x in tree.body if isinstance(x,ast.FunctionDef)and x.name=='capture'))
capture_code=capture_code.replace(\"frames.append(im.crop((720, 390, 1200, 750)))\",\"rawdir=out/(name+'-raw');rawdir.mkdir(exist_ok=True);im.save(rawdir/('frame-%03d.png'%len(frames)));frames.append(im.crop((720, 390, 1200, 750)))\")
assert 'rawdir='in capture_code;exec(capture_code,globals())"""
assert old in s;s=s.replace(old,new)
# Keep a per-tick check running for all care actions, including pose switches.
needle="  capture('after-actual-'+action,max(.8,state['remaining']-.1))"
new="""  if action!='walk':
   run('watch-'+action,'''local L=_PetLogic;local H=_PetHouseUI;local q={samples=0,gearErrors=0};L._T.careCheck=q;local t=0;t=_TimerService:SetTimerRepeat(function()if H.Motion~="'''+action+'''"then return end;local p=H.PetDisplay:GetChildByName("Portrait");local pool=(L._T.petGearUI or {})[p.Id];if pool==nil or not pool.ready then return end;local layers=L:GetPetGearLayers(H.CustomImageRUID,H:GetDisplayedPet().progress.GearDesigns);local selected={};for _,id in pairs(layers)do selected[id]=true end;local n=0;for id,e in pairs(pool.byRUID)do if e.SpriteGUIRendererComponent.Color.a>.99 then n=n+1;if not selected[id]or e.Parent~=p then q.gearErrors=q.gearErrors+1 end end end;if n~=3 then q.gearErrors=q.gearErrors+1 end;q.samples=q.samples+1 end,.0167,.0167);L._T.careCheckTimer=t;local result={started=true}''')
  capture('after-actual-'+action,max(.8,state['remaining']-.1))
  if action!='walk':
   q=check('live-'+action,'_TimerService:ClearTimer(_PetLogic._T.careCheckTimer);local result=_PetLogic._T.careCheck');assert q['samples']>10 and q['gearErrors']==0,q"""
assert needle in s;s=s.replace(needle,new)
s=s.replace("'liveWalk':walk,","'liveWalk':walk,'allCareLayerChecks':{k:v for k,v in proof.items()if k.startswith('live-')},")
s=s.replace('if L._T.repairWalkTimer~=nil then','if L._T.careCheckTimer~=nil then _TimerService:ClearTimer(L._T.careCheckTimer)end;if L._T.repairWalkTimer~=nil then')
p.write_text(s,encoding='utf-8');print('Care captures now keep unquantized full frames and check every action per tick.')
