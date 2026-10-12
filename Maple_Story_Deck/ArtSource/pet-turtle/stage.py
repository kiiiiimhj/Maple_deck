from pathlib import Path
import json,re,csv,io
stage=Path('work/pet-turtle');out=Path('outputs/pet-turtle')
def read(n):return (stage/(n+'.before')).read_text(encoding='utf-8-sig')
def write(n,s):(stage/n).write_text(s,encoding='utf-8')
def once(s,a,b,count=1):
    assert s.count(a)==count,(a[:80],s.count(a),count)
    return s.replace(a,b)
def append(s,part):
    i=s.rfind('\nend');assert i>=0
    return s[:i]+'\n'+part.rstrip()+'\n'+s[i:]
frames=json.loads((out/'native-frame-metrics.json').read_text())
shell=next(x for x in frames if x['name']=='what')['frames'][-1]
assert shell['w']==.3 and shell['h']==.16
s=read('PetLogic.mlua')
s=once(s,'property number PetRollDuration = 3','property number PetRollDuration = 4')
props='''
\tproperty string TurtleEggProductId = ""
\tproperty integer TurtleEggPrice = 0
\tproperty boolean TurtleReady = false
\tproperty number PetTurtleDropTime = 0.42
\tproperty number PetTurtleShieldDuration = 3
\tproperty number PetTurtleWidth = 2.6
\tproperty string PetTurtleShellRUID = "SHELL"
\tproperty table TurtleRankHp = {5,8,12,18}
\tproperty table TurtleMotions = {
\t\tangry="d25152782c704517ac8d0c04905d3fa4",chat="c97fb8315ea9440c8f464953650edbf3",
\t\tcry="6384cd9d454a4a0ab22e11eb8fabd225",dung="edeb0970e9ce4b388030aa1a208aeafa",
\t\teat="ef662acb5b2942e898fee063a0d0f2ba",hungry="0a1266f5c30e410797c1c09ef5edf8b5",
\t\ticon="7c5da2acaacf4e1db3fc639b79436506",love="8e29724cd92d4288be5608097fa4916d",
\t\tmove="8f30c5c55e6e4154bfc8200d1ceb3186",rest="34f1dd005a404a139d9260b4b559d082",
\t\troll="cd0e4d71db7041cabd8d0fe0fdac0951",sit="bbc594fe58ff4dafb8dfe20f512478a7",
\t\tsleep="c9b78e76d72b4ddaaaab815e0c3b87eb",stand="ca7fa1b76ac949d6b5008a6a906f195f",
\t\tstand1="5766dc81ccbb45e78437d2276541b880",what="3773ec3d2b954ac786cbd0ccbe99e342",
\t\tinject="3773ec3d2b954ac786cbd0ccbe99e342",gift="8e29724cd92d4288be5608097fa4916d"
\t}
'''.replace('SHELL',shell['ruid'])
s=once(s,'\t-- Independent pet profiles;',props+'\n\t-- Independent pet profiles;')
s=once(s,'\t\tself:PreloadFoxArtwork()','\t\tself:PreloadFoxArtwork()\n\t\tself:PreloadTurtleArtwork()')
s=once(s,'\t\tif petId~="ttungttang" then return nil end','''\t\tif petId=="landturtle" then return {id=petId,nameKey="PET_NAME_BUGI",stand=self.TurtleMotions.stand,motions=self.TurtleMotions,pixelScale=6,inventoryPixelScale=5.2,productId=self.TurtleEggProductId,price=self.TurtleEggPrice,bonusKey="PET_HOUSE_HP_FORMAT",nativeWalk=true} end
\t\tif petId~="ttungttang" then return nil end''')
s=once(s,'local kind=petId=="ttungttang" and 2 or (petId=="5000498" and 5 or 1)','local kind=petId=="ttungttang" and 2 or (petId=="5000498" and 5 or (petId=="landturtle" and 4 or 1))')
s=once(s,'\t\tif petId=="5000498" then\n\t\t\tlocal r=','''\t\tif petId=="landturtle" then
\t\t\tlocal r=math.max(0,math.min(3,rank))
\t\t\treturn self.TurtleRankHp[r+1]+math.max(0,level-r*10-1)*0.2
\t\tend
\t\tif petId=="5000498" then
\t\t\tlocal r=''')
s=once(s,'{"5002617","ttungttang","5000498"}','{"5002617","ttungttang","5000498","landturtle"}',3)
s=once(s,'(petId~="ttungttang" and petId~="5000498")','(petId~="ttungttang" and petId~="5000498" and petId~="landturtle")')
s=once(s,'(petId=="5000498" and "_DUCKY" or "_TTUNGTTANG")','(petId=="landturtle" and "_BUGI" or (petId=="5000498" and "_DUCKY" or "_TTUNGTTANG"))')
s=once(s,'entry.ready=self.ClientReady and (id~="5000498" or self.FoxReady)','entry.ready=self.ClientReady and (id~="5000498" or self.FoxReady) and (id~="landturtle" or self.TurtleReady)')
s=once(s,'local guri=PetProgress() local dog=PetProgress() local fox=PetProgress()','local guri=PetProgress() local dog=PetProgress() local fox=PetProgress() local turtle=PetProgress()')
s=once(s,'ttungttang=dog,["5000498"]=fox }','ttungttang=dog,["5000498"]=fox,landturtle=turtle }')
s=once(s,'if data.version==2 or data.version==3 then','if data.version==2 or data.version==3 or data.version==4 then')
s=once(s,'(data.version==3 and data.pets["5000498"]==nil)','(data.version>=3 and data.pets["5000498"]==nil) or (data.version==4 and data.pets.landturtle==nil)')
s=once(s,'if data.version==2 then migrated=true end','if data.version<4 then migrated=true end')
s=once(s,'return {version=3,pets=pets,','return {version=4,pets=pets,')
anchor='\t\telse\n\t\t\tlocal p=self:SamplePetRollRoute(cast.route,cast.age)'
s=once(s,anchor,'''\t\telseif cast.id=="landturtle" then
\t\t\tif cast.age>=self.PetTurtleDropTime and not cast.roared then
\t\t\t\tcast.roared=true cast.absorbed=0
\t\t\t\tlog("[VRF] PET-TURTLE landed shield="..self.PetTurtleShieldDuration.." zone="..cast.zone)
\t\t\tend
\t\t\tif cast.age>=self.PetTurtleDropTime+self.PetTurtleShieldDuration then
\t\t\t\tself:EndPetSkillVisual(cast.id,cast.zone,self.RunToken,cast.serial,self.RunUserId)
\t\t\t\tself._T.petSkillCast=nil
\t\t\t\tlog("[VRF] PET-TURTLE shield ended age="..cast.age.." absorbed="..(cast.absorbed or 0))
\t\t\tend
'''+anchor)
# Preserve the existing skill copy and add the fourth skill in every supported language.
s=once(s,'\t\tlocal t=texts[language] or texts.en local kind=','''\t\tif petId=="landturtle" then
\t\t\tlocal shellTexts={
\t\t\t\tko={"껍질 방패","중앙에 껍질이 떨어져 3초 동안\\n몬스터 공격을 대신 받아줍니다."},
\t\t\t\ten={"Shell Shield","A shell lands in the center and takes\\nenemy attacks for you for 3s."},
\t\t\t\tja={"甲羅の盾","中央に甲羅が落ち、3秒間\\n敵の攻撃を代わりに受けます。"},
\t\t\t\tzh={"龟壳护盾","龟壳落在中央，替你承受\\n怪物攻击，持续3秒。"}}
\t\t\tlocal t=shellTexts[language] or shellTexts.en
\t\t\treturn {name=t[1],interval=(texts[language] or texts.en)[4],description=t[2],icon=self.PetTurtleShellRUID}
\t\tend
\t\tlocal t=texts[language] or texts.en local kind=''')
for a,b in [('3초 동안 몬스터 사이','4초 동안 몬스터 사이'),('Roll between enemies for 3s','Roll between enemies for 4s'),('3秒間、敵の間','4秒間、敵の間'),('持续3秒。","引诱','持续4秒。","引诱')]:s=once(s,a,b)
s=once(s,'self.PetFoxIconRUID,self.PetFoxWaveRUID}','self.PetFoxIconRUID,self.PetFoxWaveRUID,self.PetTurtleShellRUID}')
s=once(s,'if petId=="ttungttang" or petId=="5000498" then center=anchor end','if petId=="ttungttang" or petId=="5000498" or petId=="landturtle" then center=anchor end')
s=once(s,'\t\tlocal fx=self:SpawnPetSkillSprite(bodyRUID,map,132)','\t\tif petId=="landturtle" then bodyRUID=self.PetTurtleShellRUID end\n\t\tlocal fx=self:SpawnPetSkillSprite(bodyRUID,map,132)')
s=once(s,'\t\telseif v.id=="5000498" then\n\t\t\tself:UpdatePetFoxVisual(v,t)','\t\telseif v.id=="landturtle" then\n\t\t\tself:UpdatePetTurtleVisual(v,t)\n\t\telseif v.id=="5000498" then\n\t\t\tself:UpdatePetFoxVisual(v,t)')
s=append(s,'''
\t@ExecSpace("ClientOnly")
\tmethod void PreloadTurtleArtwork()
\t\tself.TurtleReady=false local list={} local seen={}
\t\tfor _,ruid in pairs(self.TurtleMotions) do if not seen[ruid] then seen[ruid]=true table.insert(list,ruid) end end
\t\t_ResourceService:PreloadAsync(list,function(results)
\t\t\tif not isvalid(self) then return end
\t\t\tlocal ready=true for _,status in pairs(results) do if status~=PreloadResultStatus.Success then ready=false end end
\t\t\tlocal dustFrames=self:GetPetRollDustFrames()
\t\t\tif #dustFrames==0 then ready=false end
\t\t\tfor _,f in ipairs(dustFrames) do _CardManager:GetSpriteMetrics(f.ruid) end
\t\t\tself.TurtleReady=ready log("[VRF] PET-TURTLE original motions ready="..tostring(ready).." count="..#list)
\t\t\tif _PetHouseUI.PetMode then _PetHouseUI:Refresh() end
\t\tend)
\tend

\t@ExecSpace("ServerOnly")
\tmethod boolean AbsorbPetTurtleHit()
\t\tlocal c=self._T.petSkillCast
\t\tif c==nil or c.id~="landturtle" or c.zone~=_MapManager.CurrentMapIndex or _MapManager.AwayOnSideMap or not _GameManager.GameStarted or _GameManager.GameOver then return false end
\t\tif c.age<self.PetTurtleDropTime or c.age>=self.PetTurtleDropTime+self.PetTurtleShieldDuration then return false end
\t\t-- Paused attacks are blocked without accumulating flash or hit events.
\t\tif _GameManager:IsGamePaused() or _GameManager.SafeAreaFrozen then return true end
\t\tc.absorbed=(c.absorbed or 0)+1
\t\tself:PlayPetTurtleHit(c.zone,self.RunToken,c.serial,self.RunUserId)
\t\tif c.absorbed==1 then log("[VRF] PET-TURTLE intercepted monster attack serial="..c.serial) end
\t\treturn true
\tend

\t@ExecSpace("Client")
\tmethod void PlayPetTurtleHit(integer zone, integer run, integer serial)
\t\tlocal v=self._T.petSkillVisual
\t\tif v==nil or v.id~="landturtle" or v.zone~=zone or v.run~=run or v.serial~=serial or v.ending then return end
\t\tv.hitAt=v.age
\tend

\t@ExecSpace("ClientOnly")
\tmethod Vector3 GetPetTurtleTarget(integer zone)
\t\tlocal v=self._T.petSkillVisual
\t\tif v==nil or v.id~="landturtle" or v.zone~=zone or v.run~=self.RunToken or v.ending or not isvalid(v.body) or not _GameManager.GameStarted or _GameManager.GameOver or _MapManager.AwayOnSideMap then return nil end
\t\tif v.age<self.PetTurtleDropTime or v.age>=self.PetTurtleDropTime+self.PetTurtleShieldDuration then return nil end
\t\treturn Vector3(v.center.x,v.center.y+self.PetTurtleWidth*(16/30)*0.65,v.center.z)
\tend

\t@ExecSpace("ClientOnly")
\tmethod void UpdatePetTurtleVisual(table v, number t)
\t\tlocal p=v.center local width=self.PetTurtleWidth local ratio=16/30
\t\tlocal q=math.min(1,t/self.PetTurtleDropTime)
\t\tlocal offset=5*(1-q*q)
\t\tlocal landedAge=math.max(0,t-self.PetTurtleDropTime)
\t\tlocal squash=t>=self.PetTurtleDropTime and math.sin(math.min(1,landedAge/0.16)*math.pi)*0.08 or 0
\t\tlocal fade=math.min(1,t/0.06)*(v.ending and math.max(0,1-v.endAge/0.18) or 1)
\t\tself:PlacePetSkillSprite(v.body,Vector3(p.x,p.y+width*ratio*0.5+offset,p.z),width,0,fade)
\t\tlocal transform=v.body.TransformComponent local scale=transform.Scale.x
\t\ttransform.Scale=Vector3(scale*(1+squash),scale*(1-squash),1)
\t\tlocal flash=v.hitAt~=nil and math.max(0,1-(t-v.hitAt)/0.16) or 0
\t\tv.body.SpriteRendererComponent.Color=Color(1,1-flash*0.16,1-flash*0.35,fade)
\t\tif t>=self.PetTurtleDropTime and not v.landed then
\t\t\tv.landed=true
\t\t\tlocal camera=_CameraService:GetCurrentCameraComponent()
\t\t\tif camera~=nil then camera:ShakeCamera(0.18,0.18) end
\t\t\t_SoundOptionLogic:PlaySfx("b4b928d77bc3460b90c43f66e796dde9",0.5)
\t\t\tlocal frames=self:GetPetRollDustFrames()
\t\t\tfor i=1,(#frames>0 and 8 or 0) do
\t\t\t\tlocal direction=i%2==0 and 1 or -1
\t\t\t\tlocal fx=self:SpawnPetSkillSprite(frames[1].ruid,v.map,131)
\t\t\t\tif isvalid(fx) then table.insert(v.dusts,{fx=fx,age=0,direction=direction,x=p.x+direction*0.8,y=p.y,spread=0.65+math.floor((i-1)/2)*0.3}) end
\t\t\tend
\t\t\tlog("[VRF] PET-TURTLE impact shake=0.18 dust="..#v.dusts)
\t\tend
\t\tself:UpdatePetTurtleDust(v)
\t\tif v.ending and v.endAge>=0.18 then self:ClearPetSkillVisual() end
\tend

\t@ExecSpace("ClientOnly")
\tmethod void UpdatePetTurtleDust(table v)
\t\tlocal age=math.max(0,v.age-self.PetTurtleDropTime) local frames=self:GetPetRollDustFrames()
\t\tfor i=#v.dusts,1,-1 do
\t\t\tlocal dust=v.dusts[i]
\t\t\tif age>=0.60 or not isvalid(dust.fx) then
\t\t\t\tif isvalid(dust.fx) then dust.fx:Destroy() end table.remove(v.dusts,i)
\t\t\telse
\t\t\t\tlocal q=age/0.60 local frame=frames[math.min(#frames,math.floor(age/0.15)+1)]
\t\t\t\tdust.fx.SpriteRendererComponent.SpriteRUID=frame.ruid
\t\t\t\tlocal width=0.50+q*0.60
\t\t\t\tlocal pos=Vector3(dust.x+dust.direction*dust.spread*(1-(1-q)^2),dust.y+width*frame.ratio*0.5+math.sin(q*math.pi)*0.14,v.center.z-0.05)
\t\t\t\tlocal alpha=math.min(1,age/0.04)*(1-q)^2*0.46
\t\t\t\tself:PlacePetSkillSprite(dust.fx,pos,width,0,alpha)
\t\t\t\tdust.fx.SpriteRendererComponent.Color=Color(0.94,0.86,0.71,alpha)
\t\t\tend
\t\tend
\tend
''')
write('PetLogic.mlua',s)
# Route the final damage event through the same shield location as the existing scarecrow.
s=read('GameManager.mlua')
s=once(s,'\t\tlocal zoneScarecrow =','\t\tif _PetLogic:AbsorbPetTurtleHit() then return end\n\t\tlocal zoneScarecrow =')
write('GameManager.mlua',s)
# Projectiles keep their original release timing and art; only their shield target changes.
s=read('MonsterProjectileFx.mlua')
s=once(s,'\n        local endpoint=_UILogic:ScreenToWorldPosition(shot.targetScreen)','''
        local decoy=_PetLogic:GetPetTurtleTarget(shot.zone)
        if decoy~=nil then
            shot.targetScreen=_UILogic:WorldToScreenPosition(Vector2(decoy.x,decoy.y)) shot.decoy=true
        end
        local endpoint=_UILogic:ScreenToWorldPosition(shot.targetScreen)''')
s=once(s,'        shot.w0=math.max','        if shot.decoy then shot.w1=math.min(shot.w1,0.65) end\n        shot.w0=math.max')
s=once(s,'shot.start,92)','shot.start,shot.decoy and 134 or 92)')
s=once(s,'shot.start,92-j)','shot.start,shot.decoy and (134-j) or (92-j))')
s=once(s,'player.CurrentMap,center,94)','player.CurrentMap,center,shot.decoy and 135 or 94)')
write('MonsterProjectileFx.mlua',s)
s=read('Ep1ProjectileFx.mlua')
s=once(s,'                        local endPos=_UILogic:ScreenToWorldPosition(shot.targetScreen)','''                        local decoy=_PetLogic:GetPetTurtleTarget(shot.zone)
                        if decoy~=nil then shot.targetScreen=_UILogic:WorldToScreenPosition(Vector2(decoy.x,decoy.y)) shot.decoy=true end
                        local endPos=_UILogic:ScreenToWorldPosition(shot.targetScreen)''')
s=once(s,'                        shot.fx=self:SpawnVisual','                        if shot.decoy then shot.s1=math.min(shot.s1,0.65/width) shot.s0=math.min(shot.s0,shot.s1*0.6) end\n                        shot.fx=self:SpawnVisual')
s=once(s,'shot.start,92)','shot.start,shot.decoy and 134 or 92)')
s=once(s,'shot.start,92-j)','shot.start,shot.decoy and (134-j) or (92-j))')
s=once(s,'player.CurrentMap,pos,93)','player.CurrentMap,pos,shot.decoy and 135 or 93)')
write('Ep1ProjectileFx.mlua',s)
# Append translated turtle strings; existing rows stay byte-for-byte unchanged.
s=read('GameText.csv');rows=list(csv.reader(io.StringIO(s)));header=rows[0];keys={r[0] for r in rows[1:]}
new=[['PET_NAME_BUGI','부기','pet-turtle','부기','Bugi','布基','布基','ブギ'],['PET_HOUSE_HP_FORMAT','최대 체력 +{0}%','pet-turtle','최대 체력 +{0}%','Max HP +{0}%','最大生命值 +{0}%','最大生命值 +{0}%','最大HP +{0}%']]
for row in rows[1:]:
    if row[0].endswith('_DUCKY') and row[0]!='PET_NAME_DUCKY':
        n=row.copy();n[0]=row[0][:-6]+'_BUGI';n[2]='pet-turtle'
        for i in [1,3,4,5,6,7]:
            for a,b in [('더키','부기'),('Ducky','Bugi'),('德奇','布基'),('ダッキー','ブギ')]:n[i]=n[i].replace(a,b)
        new.append(n)
buffer=io.StringIO();writer=csv.writer(buffer,lineterminator='\n')
for row in new:
    assert row[0] not in keys;keys.add(row[0]);writer.writerow(row)
write('GameText.csv',s.rstrip('\n')+'\n'+buffer.getvalue())
plan=json.loads((stage/'plan.json').read_text());plan['steps'][0]['status']='completed';plan['steps'][1]['status']='in_progress'
(stage/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print('Staged native Bugi pet, V4 migration, drop/impact/shield, projectile target and 4s Guri roll.')
