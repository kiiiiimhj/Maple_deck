from runtime_common import *
server='server_main'
try:
 mode=s.call('maker_get_current_map');assert mode.get('mode')=='play'
 (stage/'battle-attempt-start.json').write_text(json.dumps({'start':datetime.now().isoformat(timespec='seconds')}),encoding='utf-8')
 run('ensure-temporary-account','''local L=_PetLogic;local id=L._T.oduckVerifyUser;assert(id~=nil);if L._T.oduckVerifyOriginal==nil then L._T.oduckVerifyOriginal=L.States[id];local r=L:ReadAccount(L:SerializeAccount(L.States[id]));r.test=true;r.dirty=false;r.generation=0;r.pets.oduck.Owned=true;for key,p in pairs(r.pets)do p.Equipped=key=="oduck" end;L.States[id]=r;L:PushState(id,"","")end;local result={temporary=L.States[id].test}''',server)
 run('guard-start','''local handle=0;handle=_TimerService:SetTimerRepeat(function()if _GameManager.GameStarted then _GameManager.OptionPaused=true;_MonsterSpawner:StopSpawning();_TimerService:ClearTimer(handle)end end,0.01,0.01);local result={guarded=true}''',server)
 run('request-game','_PetHouseUI:Close();_TitleUI.titleGroup.Enable=false;_GameManager:RequestStartGame(false,0,1);local result={requested=true}')
 wait_for('combat-ready','local result={started=_GameManager.GameStarted,entry=_GameManager.EntryPresentationPending}',lambda r:r['started']and not r['entry'],40)
 r=run('controlled-battle','''local G=_GameManager;G.OptionPaused=true;G.TutorialPaused=false;G.ShopPaused=false;G.EasterEggPaused=false;G.EntryPresentationPending=false;G.GameOver=false;G.PlayerHp=100000;G.PlayerMaxHp=100000;_MonsterSpawner:StopSpawning();_MonsterProjectileFx:ResetForRun();_Ep1ProjectileFx:ResetForRun();local map=_CardManager:GetCurrentMap();for _,m in ipairs(_CardManager:GetMonstersInCurrentZone(map))do if isvalid(m.Entity)then m.Entity:Destroy()end end;local L=_PetLogic;local r=L.States[L._T.oduckVerifyUser];for id,p in pairs(r.pets)do p.Equipped=id=="oduck" end;L:InitForRun(L._T.oduckVerifyUser);local result={pet=L.RunPetId,mult=L:GetRunDamageMult(),baseDamage=_CardManager:GetCardDamage(1),debug=_CardManager.DebugMode,paused=G:IsGamePaused()}''',server)
 assert r['pet']=='oduck'and abs(r['mult']-1.01)<1e-9 and r['baseDamage']>0 and r['debug']and r['paused']
 r=run('cast','''local G=_GameManager;G.OptionPaused=false;local L=_PetLogic;local base=L:GetRunDamageMult();local before=_CardManager:GetCardDamage(1);local cast=L:TryCastPetSkill();local result={cast=cast,active=L.PetDuckBuffActive,remaining=L.PetDuckBuffRemaining,mult=L:GetRunDamageMult(),base=base,damageRatio=_CardManager:GetCardDamage(1)/before,interval=L.PetSkillInterval}''',server)
 assert r['cast']and r['active']and r['remaining']==30 and abs(r['mult']/r['base']-1.2)<1e-9 and abs(r['damageRatio']-1.2)<1e-9 and r['interval']==60
 wait_for('visual-ready','local v=_PetLogic._T.petSkillVisual;local result={body=v~=nil and isvalid(v.body),mirror=v~=nil and isvalid(v.mirror),id=v~=nil and v.id or ""}',lambda r:r['body']and r['mirror'])
 run('native-animation-observer','''local v=_PetLogic._T.petSkillVisual;_PetLogic._T.oduckFrames={body=0,mirror=0};v.body:ConnectEvent(SpriteAnimPlayerChangeFrameEvent,function(e)_PetLogic._T.oduckFrames.body=_PetLogic._T.oduckFrames.body+1 end);v.mirror:ConnectEvent(SpriteAnimPlayerChangeFrameEvent,function(e)_PetLogic._T.oduckFrames.mirror=_PetLogic._T.oduckFrames.mirror+1 end);local result={observing=true}''')
 ground=run('server-ground','''local c=_PetLogic._T.petSkillCast;local root=_EntityService:GetEntityByPath("/maps/".._MapManager:GetMapName(_MapManager.CurrentMapIndex));local y=_MonsterSpawner:GetBottomGroundY(root,c.anchor.x);local result={ground=y,anchorY=c.anchor.y,onBottom=math.abs(c.anchor.y-y)<0.01}''',server)
 assert ground['onBottom']
 time.sleep(.6)
 r=run('dance-layout','''local L=_PetLogic;local v=L._T.petSkillVisual;local body=v.body.TransformComponent.WorldPosition;local mirror=v.mirror.TransformComponent.WorldPosition;local result={bodyRUID=v.body.SpriteRendererComponent.SpriteRUID,mirrorRUID=v.mirror.SpriteRendererComponent.SpriteRUID,above=mirror.y>body.y,anchorY=v.center.y,bodyOrder=v.body.SpriteRendererComponent.OrderInLayer,mirrorOrder=v.mirror.SpriteRendererComponent.OrderInLayer,age=v.age,frames=L._T.oduckFrames.body,mirrorFrames=L._T.oduckFrames.mirror}''')
 assert r['bodyRUID']=='bae8d87f1ca442d5bcbb68f3c9b37d69'and r['mirrorRUID']=='db884a33341341b9845aab1621fa8c49'and r['above']and abs(r['anchorY']-ground['ground'])<.01 and r['mirrorOrder']>r['bodyOrder']and r['frames']>0 and r['mirrorFrames']>0
 shot('oduck-dance-mirror.png')
 run('pause-server','_GameManager.OptionPaused=true;local result={remaining=_PetLogic.PetDuckBuffRemaining}',server)
 time.sleep(.2)
 first=run('pause-client','local v=_PetLogic._T.petSkillVisual;local result={bodyRate=v.body.SpriteRendererComponent.PlayRate,mirrorRate=v.mirror.SpriteRendererComponent.PlayRate,frames=_PetLogic._T.oduckFrames.body,mirrorFrames=_PetLogic._T.oduckFrames.mirror,age=v.age}')
 assert first['bodyRate']==first['mirrorRate']==0
 time.sleep(.6)
 r=run('pause-frozen-server','local result={remaining=_PetLogic.PetDuckBuffRemaining}',server);assert abs(r['remaining']-proofs['pause-server']['remaining'])<.01
 r=run('pause-frozen-client','local v=_PetLogic._T.petSkillVisual;local result={frames=_PetLogic._T.oduckFrames.body,mirrorFrames=_PetLogic._T.oduckFrames.mirror,age=v.age}');assert r=={k:first[k]for k in ['frames','mirrorFrames','age']}
 run('resume','_GameManager.OptionPaused=false;local result={resumed=true}',server)
 time.sleep(.55)
 r=run('animation-resumed','local result=_PetLogic._T.oduckFrames');assert r['body']>first['frames']and r['mirror']>first['mirrorFrames']
 # Native dance loops through its frame offsets; the actor and mirror leave after four seconds.
 time.sleep(3.6)
 r=run('short-visual-ended','local result={gone=_PetLogic._T.petSkillVisual==nil}');assert r['gone']
 r=run('buff-outlives-dance','local result={active=_PetLogic.PetDuckBuffActive,remaining=_PetLogic.PetDuckBuffRemaining,mult=_PetLogic:GetRunDamageMult()}',server);assert r['active']and 20<r['remaining']<30
 r=run('30-second-boundary','''local L=_PetLogic;L.PetDuckBuffRemaining=30;L.PetDuckBuffActive=true;L:UpdateOduckBuff(29.99);local edge=L.PetDuckBuffActive and math.abs(L.PetDuckBuffRemaining-0.01)<0.0001;L:UpdateOduckBuff(0.011);local ended=not L.PetDuckBuffActive and L.PetDuckBuffRemaining==0;local result={before30Active=edge,after30Ended=ended,baseRestored=math.abs(L:GetRunDamageMult()-L.RunDamageMultiplier)<0.0001}''',server)
 assert all(r.values())
 r=run('zone-transfer-buff','''local L=_PetLogic;L.PetDuckBuffActive=true;L.PetDuckBuffRemaining=30;local zone=_MapManager.CurrentMapIndex;_MapManager.CurrentMapIndex=zone+1;L:UpdateOduckBuff(1);local carry=L.PetDuckBuffActive and L.PetDuckBuffRemaining==29;_MapManager.CurrentMapIndex=zone;L:InitForRun(L._T.oduckVerifyUser);local result={transferKeepsRemaining=carry,newRunClears=not L.PetDuckBuffActive and L.PetDuckBuffRemaining==0}''',server)
 assert all(r.values())
 run('u-arm-bugi','_PetLogic.RunPetId="landturtle";_PetLogic._T.petSkillCast=nil;_PetLogic:ResetOduckBuff();_GameManager.OptionPaused=false;local result={armed=true}',server)
 s.call('maker_keyboard_input',{'action':'tap','keys':['U'],'duration_ms':70})
 r=wait_for('u-selects-oduck','local result={pet=_PetLogic.RunPetId,cooldown=_PetLogic._T.petSkillCooldown}',lambda r:r['pet']=='oduck',context=server)
 assert 1.5<r['cooldown']<=3
 wait_for('u-casts-after-delay','local result={active=_PetLogic.PetDuckBuffActive,cast=_PetLogic._T.petSkillCast~=nil}',lambda r:r['active']and r['cast'],context=server)
 r=run('gameover-reset','''_GameManager.GameOver=true;_PetLogic:UpdateOduckBuff(0);local result={cleared=not _PetLogic.PetDuckBuffActive and _PetLogic.PetDuckBuffRemaining==0}''',server);assert r['cleared']
 print('Actual damage +20%, native dance/mirror animation, paused timers, expiry, transfer/reset and U cheat passed.',flush=True)
finally:
 try:
  run('restore-original-account','''local L=_PetLogic;_MonsterSpawner:StopSpawning();_MonsterProjectileFx:ResetForRun();_Ep1ProjectileFx:ResetForRun();_GameManager.GameStarted=false;_GameManager.GameOver=false;_GameManager.OptionPaused=false;L:ResetOduckBuff();L._T.petSkillCast=nil;local id=L._T.oduckVerifyUser;if id~=nil and L._T.oduckVerifyOriginal~=nil then L.States[id]=L._T.oduckVerifyOriginal;L:InitForRun(id);L:PushState(id,"","");L._T.oduckVerifyOriginal=nil end;local result={restored=true}''',server)
  run('restore-lobby','_PetLogic:ClearPetSkillVisual();_PetHouseUI:Close();_TitleUI:ShowLobby();_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true;local result={noVisual=_PetLogic._T.petSkillVisual==nil}')
 finally:s.close()
