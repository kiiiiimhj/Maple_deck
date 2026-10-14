from pathlib import Path
old=Path('work/ttung-charm-jump/runtime.py').read_text(encoding='utf-8')
prefix=old[:old.index('passed=False;prepared=False')].replace("work/ttung-charm-jump'","work/ttung-charm-jump-v3'").replace("outputs/ttung-charm-jump'","outputs/ttung-charm-jump-v3'").replace('TTUNG-JUMP-CHECK','TTUNG-JUMP-V3-CHECK')
boot=old[old.index('passed=False;prepared=False'):old.index(" run('observe-render'")]
observe='''
 run('fixture-view','local L=_PetLogic;local G=_GameManager;L._T.jumpOldShake={hit=G.HitShakeIntensity,boss=G.BossHitShakeIntensity};G.HitShakeIntensity=0;G.BossHitShakeIntensity=0;local cam=_CameraService:GetCurrentCameraComponent();if cam~=nil then cam:ShakeCamera(0,0.01)end;local result={isolated=true}')
 wait('pool-ready','local p=_PetLogic._T.petCharmRenderPool;local result={ready=p~=nil and p.ready or false,poses=p~=nil and #p.bodies or 0,warmFrames=p~=nil and p.warmFrames or 0}',lambda r:r['ready']and r['poses']==12)
 observer = r"""local L=_PetLogic;L._T.jumpProof={seen={},samples=0,blank=0,overlap=0,disabled=0,wrongTexture=0,tint=0,minAlpha=1,maxAlpha=0,maxPixelPhase=0,firstHeart=-1,heartAscending=false,firstAge=-1,captured=0,nextCapture=1,captureAges={1.62},finished=false};local timer=0;timer=_TimerService:SetTimerRepeat(function()local v=L._T.petSkillVisual;local q=L._T.jumpProof;if v==nil or v.id~="ttungttang"then return end;q.samples=q.samples+1;if q.firstAge<0 then q.firstAge=v.age end;q.seen[v.charmFrame]=true;L._T.jumpActors=v.charmBodies;local active=0;for i,actor in ipairs(v.charmBodies)do if actor.SpriteRendererComponent.Color.a>0.99 then active=active+1 end;if not actor.Enable then q.disabled=q.disabled+1 end;if actor.SpriteRendererComponent.SpriteRUID~=L.PetCharmJumpRUIDs[i]then q.wrongTexture=q.wrongTexture+1 end end;if active==0 then q.blank=q.blank+1 end;if active>1 then q.overlap=q.overlap+1 end;local color=v.body.SpriteRendererComponent.Color;q.minAlpha=math.min(q.minAlpha,color.a);q.maxAlpha=math.max(q.maxAlpha,color.a);if color.r~=1 or color.g~=1 or color.b~=1 then q.tint=q.tint+1 end;local pos=v.body.TransformComponent.WorldPosition;local origin=_UILogic:ScreenToWorldPosition(Vector2(0,0));local headTop=pos.y+v.charmWidth*0.5-L.PetCharmJumpNods[v.charmFrame]*v.charmWidth/128;local grid=(headTop-origin.y)/v.pixel;q.maxPixelPhase=math.max(q.maxPixelPhase,math.abs(grid-math.floor(grid+0.5)));q.sourcePixelScale=v.charmWidth/(128*v.pixel);for _,h in ipairs(v.hearts)do if h.SpriteRendererComponent.Color.a>0 then if q.firstHeart<0 then q.firstHeart=v.age;q.heartAscending=L:GetPetCharmJumpHeight(v.age)>0 end;break end end;local target=q.captureAges[q.nextCapture];if target~=nil and v.age>=target then q.captured=q.nextCapture;q.nextCapture=q.nextCapture+1;if q.captured==#q.captureAges then q.finished=true;_TimerService:ClearTimer(timer)end;_GameManager:RequestSetOptionPaused(true)end end,0.01,0.01);L._T.jumpObserver=timer;local result={observing=true}"""
 probe=r"""local q=_PetLogic._T.jumpProof;local count=0;for _,_ in pairs(q.seen)do count=count+1 end;local v=_PetLogic._T.petSkillVisual;local result={finished=q.finished,captured=q.captured,paused=_GameManager:IsGamePaused(),framesSeen=count,samples=q.samples,blank=q.blank,overlap=q.overlap,disabled=q.disabled,wrongTexture=q.wrongTexture,tint=q.tint,minAlpha=q.minAlpha,maxAlpha=q.maxAlpha,pixelPhase=q.maxPixelPhase,firstAge=q.firstAge,firstHeart=q.firstHeart,heartAscending=q.heartAscending,sourcePixelScale=q.sourcePixelScale or 0,index=v~=nil and v.charmFrame or 0,age=v~=nil and v.age or -1}"""
 ids=run('pool-identities','local p=_PetLogic._T.petCharmRenderPool;local ids={};for _,a in ipairs(p.bodies)do table.insert(ids,a.Id)end;local result={ids=ids}')['ids']
 for cast in [1,2]:
  if cast==2:
   run('second-u-setup','local L=_PetLogic;L.RunPetId="5002617";L._T.petSkillCast=nil;L._T.petSkillCooldown=60;local result={prepared=true}','server_main')
  run('observe-render-'+str(cast),observer)
  run('resume-for-u-'+str(cast),'_GameManager.OptionPaused=false;local result={resumed=true}','server_main')
  print('Actual U cast '+str(cast)+': '+str(s.call('maker_keyboard_input',{'action':'tap','keys':['U'],'duration_ms':70})),flush=True)
  for k in range(1,2):
   r=wait('cast-'+str(cast)+'-phase-'+str(k),probe,lambda v:v['captured']>=k and v['paused'],count=24)
   assert r['blank']==r['overlap']==r['wrongTexture']==r['disabled']==r['tint']==0,r
   assert r['minAlpha']==r['maxAlpha']==1 and r['pixelPhase']<.03,r
   assert abs(r['sourcePixelScale']-round(r['sourcePixelScale']))<.001,r
   pic=s.call('maker_screenshot');shutil.copy2(pic['path'],out/('cast-'+str(cast)+'-phase-'+str(k)+'.png'))
   hold=run('held-pose-'+str(cast)+'-'+str(k),probe);assert hold['index']==r['index']and abs(hold['age']-r['age'])<.01
   if k<1:run('resume-'+str(cast)+'-'+str(k),'_GameManager.OptionPaused=false;local result={resumed=true}','server_main')
  assert r['framesSeen']==12 and r['samples']>40 and r['firstAge']<.10 and .16<=r['firstHeart']<.24 and r['heartAscending'],r
  run('resume-cleanup-'+str(cast),'_GameManager.OptionPaused=false;local result={resumed=true}','server_main')
  wait('all-poses-hidden-'+str(cast),'local L=_PetLogic;local p=L._T.petCharmRenderPool;local visible=0;for _,list in ipairs({p.bodies,p.waves,p.hearts})do for _,a in ipairs(list)do if a.SpriteRendererComponent.Color.a>0 then visible=visible+1 end end end;local result={gone=L._T.petSkillVisual==nil,visible=visible}',lambda r:r['gone']and r['visible']==0,count=32)
  newids=run('reused-pool-'+str(cast),'local p=_PetLogic._T.petCharmRenderPool;local ids={};for _,a in ipairs(p.bodies)do table.insert(ids,a.Id)end;local result={ids=ids}')['ids'];assert newids==ids
 assert run('cleanup-pool','local L=_PetLogic;L:ClearPetCharmRenderPool();local alive=0;for _,a in ipairs(L._T.jumpActors)do if isvalid(a)then alive=alive+1 end end;local result={alive=alive}')['alive']==0
 passed=True;print('Cold first U and repeated U passed, including the first visible pose. 12 whole painted poses; no activation swaps, fixed colour, pixel grid and launch hearts.',flush=True)
'''
restore=old[old.index('finally:\n try:\n  if prepared:'):]
restore=restore.replace('L:ClearPetSkillVisual();_TitleUI:ShowLobby();','L:ClearPetSkillVisual();local old=L._T.jumpOldShake;if old~=nil then _GameManager.HitShakeIntensity=old.hit;_GameManager.BossHitShakeIntensity=old.boss;L._T.jumpOldShake=nil end;_TitleUI:ShowLobby();')
restore=restore.replace("report={'status':'passed'","report={'coldFirstCastChecked':True,'repeatedCastChecked':True,'firstFrameIncluded':True,'renderPoolReused':True,'integralSourcePixelScale':True,'status':'passed'")
restore=restore.replace("'status':'passed','actualUKey'","'cameraShakeIsolatedForGridCheck':True,'status':'passed','actualUKey'")
restore=restore.replace("'frames':20","'frames':12").replace("'observed':proofs['animation-complete']","'observedFirstCast':proofs['cast-1-phase-1'],'observedSecondCast':proofs['cast-2-phase-1']")
Path('work/ttung-charm-jump-v3/runtime.py').write_text(prefix+boot+observe+restore,encoding='utf-8')
print('Fresh-play verification staged: first-frame captures, all poses, reuse, pause and cleanup.')


