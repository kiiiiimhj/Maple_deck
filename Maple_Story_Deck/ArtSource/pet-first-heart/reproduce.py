from runtime_common import *
try:
    mode=s.call('maker_get_current_map');print('Maker:',mode,flush=True)
    if mode.get('mode')=='play':
        print('Stop:',s.call('maker_stop'),flush=True);time.sleep(2)
    print('Play:',s.call('maker_play'),flush=True)
    for _ in range(15):
        time.sleep(1)
        try:mode=s.call('maker_get_current_map')
        except AssertionError as e:
            if 'no map loaded' in str(e):continue
            raise
        if mode.get('mode')=='play':break
    assert mode.get('mode')=='play';time.sleep(2)
    r=run('boot','local result={ready=_PetLogic._T.petSkillArtReady,zone=_MapManager.CurrentMapIndex}',pause=.1)
    logs=s.call('maker_logs',{'kind':'normal'});start=max(x['dateTime'] for x in logs.get('logs',[]) if prefix+'boot ' in x.get('message',''));(stage/'runtime-start.json').write_text(json.dumps({'start':start}),encoding='utf-8')
    script('_PetHouseUI:Close();_TitleUI.titleGroup.Enable=false;_GameManager:RequestStartGame(false,0,1)',pause=4)
    run('fixtures','''_MonsterSpawner:StopSpawning();_GameManager.PlayerHp=100000;_GameManager.PlayerMaxHp=100000;local map=_EntityService:GetEntityByPath("/maps/".._MapManager:GetMapName(_MapManager.CurrentMapIndex));for _,m in ipairs(_CardManager:GetMonstersInCurrentZone(map))do if isvalid(m) and isvalid(m.Entity)then m._dead=true;m.Entity:Destroy()end end;local cx=_MonsterSpawner:GetZoneOffsetX(_MapManager.CurrentMapIndex);local gy=_MonsterSpawner:GetBottomGroundY(map,cx);local e=_SpawnService:SpawnByModelId(_MonsterSpawner.MonsterModelId,"FirstHeartFixture",Vector3(cx+1.5,gy,0),map);local m=e:GetComponent("script.MonsterAI");m:InitializeStats(12,1,false,3);_MonsterSpawner:UnregisterZoneMonster(m._spawnZoneIndex,m);m:SetSpawnZone(_MapManager.CurrentMapIndex);m.MaxHp=100000000;m.CurrentHp=m.MaxHp;m._attackTimer=100;m.ApproachSpeed=0;_PetLogic._T.firstHeartMob=m;_PetLogic.RunPetId="ttungttang";_PetLogic._T.petSkillCooldown=60;local result={ground=gy}''','server_main',.2)
    for cast in [1,2]:
        script('''local P=_PetLogic;P._T.firstHeartSamples={};P._T.firstHeartFinished=false;local seen=false;local timer=0;timer=_TimerService:SetTimerRepeat(function()local v=P._T.petSkillVisual;if v~=nil and v.id=="ttungttang" then seen=true;local visible=0;local wrong=0;local maxScale=0;local minAlpha=1;local rows={};for i,w in ipairs(v.waves)do if isvalid(w)then local r=w.SpriteRendererComponent;local a=r.Color.a;local p=w.TransformComponent.WorldPosition;local scale=w.TransformComponent.Scale.x;if a>0.01 then visible=visible+1 end;if a>0.01 and (v.age<0.34 or r.SpriteRUID~=P.PetCharmWaveRUID)then wrong=wrong+1 end;maxScale=math.max(maxScale,scale);minAlpha=math.min(minAlpha,a);table.insert(rows,{index=i,alpha=a,x=p.x,y=p.y,scale=scale,ruid=r.SpriteRUID})end end;table.insert(P._T.firstHeartSamples,{age=v.age,visible=visible,wrong=wrong,maxScale=maxScale,minAlpha=minAlpha,waves=rows});elseif seen then P._T.firstHeartFinished=true;_TimerService:ClearTimer(timer)end end,.015,.015)''',pause=.1)
        run('arm-'+str(cast),'_PetLogic._T.petSkillCooldown=0;local result={armed=true}','server_main',.1)
        for _ in range(18):
            time.sleep(.35);r=run('watch-'+str(cast),'local result={done=_PetLogic._T.firstHeartFinished,count=#(_PetLogic._T.firstHeartSamples or {})}',pause=.05)
            if r['done']:break
        rows=run('samples-'+str(cast),'local result={rows=_PetLogic._T.firstHeartSamples}',pause=.1)['rows']
        (out/('before-cast-'+str(cast)+'.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
        print('cast',cast,'frames',len(rows),'early visible',sum(row['visible'] for row in rows if row['age']<.34),'wrong',sum(row['wrong'] for row in rows),flush=True)
        assert rows
    # Inspect a spawn before placement to prove whether initialization itself is visible.
    r=run('raw-spawn-before-place','''local map=_UserService.LocalPlayer.CurrentMap;local fx=_PetLogic:SpawnPetSkillSprite(_PetLogic.PetCharmWaveRUID,map,130);local result={enabled=fx.Enable,alpha=fx.SpriteRendererComponent.Color.a,x=fx.TransformComponent.WorldPosition.x,y=fx.TransformComponent.WorldPosition.y,scale=fx.TransformComponent.Scale.x};fx:Destroy()''',pause=.1)
    script('''_GameManager.GameStarted=false;_GameManager.GameOver=false;_GameManager.OptionPaused=false;_MonsterSpawner:StopSpawning();local m=_PetLogic._T.firstHeartMob;if isvalid(m) and isvalid(m.Entity)then m._dead=true;m.Entity:Destroy()end;_PetLogic._T.petSkillCast=nil;_PetLogic.RunPetId="";_PetLogic._T.petSkillCooldown=60;_GameManager.PlayerHp=100;_GameManager.PlayerMaxHp=100''','server_main',.2)
    script('_PetLogic:ClearPetSkillVisual();_TitleUI.titleGroup.Enable=true;_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true',pause=.2)
    (stage/'before-runtime-logs.json').write_text(json.dumps(s.call('maker_logs',{'kind':'normal'}),ensure_ascii=False,indent=2),encoding='utf-8')
finally:s.close()
