from runtime_common import *
import math
summary={}
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
    r=run('after-boot','local result={ready=_PetLogic._T.petSkillArtReady,zone=_MapManager.CurrentMapIndex}',pause=.1)
    assert r['ready'];summary['geometryReadyBeforeGame']=True
    logs=s.call('maker_logs',{'kind':'normal'});start=max(x['dateTime'] for x in logs.get('logs',[]) if prefix+'after-boot ' in x.get('message',''))
    (stage/'runtime-start.json').write_text(json.dumps({'start':start}),encoding='utf-8')
    script('_PetHouseUI:Close();_TitleUI.titleGroup.Enable=false;_GameManager:RequestStartGame(false,0,1)',pause=4)
    run('after-fixtures','''_MonsterSpawner:StopSpawning();_GameManager.PlayerHp=100000;_GameManager.PlayerMaxHp=100000;local map=_EntityService:GetEntityByPath("/maps/".._MapManager:GetMapName(_MapManager.CurrentMapIndex));for _,m in ipairs(_CardManager:GetMonstersInCurrentZone(map))do if isvalid(m) and isvalid(m.Entity)then m._dead=true;m.Entity:Destroy()end end;local cx=_MonsterSpawner:GetZoneOffsetX(_MapManager.CurrentMapIndex);local gy=_MonsterSpawner:GetBottomGroundY(map,cx);local e=_SpawnService:SpawnByModelId(_MonsterSpawner.MonsterModelId,"FirstHeartFixture",Vector3(cx+1.5,gy,0),map);local m=e:GetComponent("script.MonsterAI");m:InitializeStats(12,1,false,3);_MonsterSpawner:UnregisterZoneMonster(m._spawnZoneIndex,m);m:SetSpawnZone(_MapManager.CurrentMapIndex);m.MaxHp=100000000;m.CurrentHp=m.MaxHp;m._attackTimer=100;m.ApproachSpeed=0;_PetLogic._T.firstHeartMob=m;_PetLogic.RunPetId="ttungttang";_PetLogic._T.petSkillCooldown=60;local result={ground=gy}''','server_main',.2)
    casts=[]
    for cast in [1,2]:
        script('''local P=_PetLogic;P._T.firstHeartSamples={};P._T.firstHeartFinished=false;local seen=false;local timer=0;timer=_TimerService:SetTimerRepeat(function()local v=P._T.petSkillVisual;if v~=nil and v.id=="ttungttang" then seen=true;local visible=0;local wrong=0;local maxScale=0;local minAlpha=1;local rows={};local hearts=0;for i,w in ipairs(v.waves)do if isvalid(w)then local r=w.SpriteRendererComponent;local a=r.Color.a;local p=w.TransformComponent.WorldPosition;local scale=w.TransformComponent.Scale.x;local shown=w.Enable and a>0.01;if shown then visible=visible+1 end;if shown and (v.age<0.34 or r.SpriteRUID~=P.PetCharmWaveRUID or a>0.551)then wrong=wrong+1 end;maxScale=math.max(maxScale,scale);minAlpha=math.min(minAlpha,a);table.insert(rows,{index=i,enabled=w.Enable,alpha=a,x=p.x,y=p.y,scale=scale,ruid=r.SpriteRUID})end end;for _,h in ipairs(v.hearts)do if isvalid(h) and h.Enable and h.SpriteRendererComponent.Color.a>0.01 then hearts=hearts+1;if v.age<0.34 then wrong=wrong+1 end end end;table.insert(P._T.firstHeartSamples,{age=v.age,visible=visible,hearts=hearts,wrong=wrong,maxScale=maxScale,minAlpha=minAlpha,waves=rows});elseif seen then P._T.firstHeartFinished=true;_TimerService:ClearTimer(timer)end end,.015,.015)''',pause=.1)
        if cast==1:
            script('''local timer=0;timer=_TimerService:SetTimerRepeat(function()local c=_PetLogic._T.petSkillCast;if c~=nil and c.id=="ttungttang" and c.age>=0.75 then _GameManager.OptionPaused=true;_TimerService:ClearTimer(timer)end end,.025,.025)''','server_main',.1)
        run('after-arm-'+str(cast),'_PetLogic._T.petSkillCooldown=0;local result={armed=true}','server_main',.1)
        if cast==1:
            for _ in range(8):
                time.sleep(.2);r=run('after-await-pause','local result={paused=_GameManager.OptionPaused}','server_main',.05)
                if r['paused']:break
            assert r['paused'];time.sleep(.25)
            r=run('after-visible','''local v=_PetLogic._T.petSkillVisual;local result={age=v.age,body=v.body.Enable,waveCount=#v.waves,heartCount=#v.hearts,centerX=v.center.x,centerY=v.center.y}''',pause=.1)
            assert r['body'] and r['waveCount']==6 and r['heartCount']==16
            shot('first-cast-heart-fixed.png')
            script('_GameManager.OptionPaused=false','server_main',.1)
        for _ in range(18):
            time.sleep(.35);r=run('after-watch-'+str(cast),'local result={done=_PetLogic._T.firstHeartFinished,count=#(_PetLogic._T.firstHeartSamples or {})}',pause=.05)
            if r['done']:break
        assert r['done']
        rows=run('samples-after-'+str(cast),'local result={rows=_PetLogic._T.firstHeartSamples}',pause=.1)['rows']
        (out/('after-cast-'+str(cast)+'.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
        early=sum(row['visible']+row['hearts'] for row in rows if row['age']<.34)
        wrong=sum(row['wrong'] for row in rows)
        normal=[row for row in rows if .45<row['age']<.80 and row['visible']>0 and row['hearts']>0]
        assert rows and early==0 and wrong==0 and normal
        sample=min(normal,key=lambda row:abs(row['age']-.55));w=sample['waves'][0]
        metrics=run('after-wave-geometry-'+str(cast),'local m=_CardManager:GetSpriteMetrics(_PetLogic.PetCharmWaveRUID);local result={width=m.w}',pause=.05)
        expected=(1+7.4*((sample['age']-.34)/1.18))/metrics['width']
        assert w['enabled'] and abs(w['scale']-expected)<.06 and abs(w['alpha']-.55)<.001
        summary[str(cast)]={'frames':len(rows),'earlyVisible':early,'wrong':wrong,'visibleHearts':max(row['hearts'] for row in rows),'visibleWaves':max(row['visible'] for row in rows),'sampleAge':sample['age'],'sampleScale':w['scale'],'sampleAlpha':w['alpha']}
        casts.append(rows)
    r=run('after-raw-spawn','''local map=_UserService.LocalPlayer.CurrentMap;local fx=_PetLogic:SpawnPetSkillSprite(_PetLogic.PetCharmWaveRUID,map,130);local result={enabled=fx.Enable,alpha=fx.SpriteRendererComponent.Color.a};fx:Destroy()''',pause=.1)
    assert not r['enabled'] and r['alpha']==0;summary['spawnHiddenBeforePlacement']=True
    script('''_GameManager.GameStarted=false;_GameManager.GameOver=false;_GameManager.OptionPaused=false;_MonsterSpawner:StopSpawning();local m=_PetLogic._T.firstHeartMob;if isvalid(m) and isvalid(m.Entity)then m._dead=true;m.Entity:Destroy()end;_PetLogic._T.firstHeartMob=nil;_PetLogic._T.petSkillCast=nil;_PetLogic.RunPetId="";_PetLogic._T.petSkillCooldown=60;_GameManager.PlayerHp=100;_GameManager.PlayerMaxHp=100;_MonsterProjectileFx:ResetForRun();_Ep1ProjectileFx:ResetForRun()''','server_main',.2)
    run('after-cleanup','''_PetLogic:ClearPetSkillVisual();_TitleUI.titleGroup.Enable=true;_TitleUI.titleGroup:GetChildByName("BattlePanel").Enable=true;local result={visualCleared=_PetLogic._T.petSkillVisual==nil,lobby=_TitleUI.titleGroup.Enable}''',pause=.2)
    logs=s.call('maker_logs',{'kind':'normal'})
    errors=[x for x in logs.get('logs',[]) if x.get('logType')=='Error' and x.get('dateTime','')>=start]
    (stage/'after-runtime-logs.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8')
    assert not errors,errors
    summary['runtimeErrors']=0;summary['status']='passed'
    (out/'runtime-verification.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
    print('POST-FIX: '+json.dumps(summary),flush=True)
finally:s.close()
