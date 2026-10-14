from pathlib import Path
import json,hashlib,csv,io,re
stage=Path('work/pet-oduck');out=Path('outputs/pet-oduck');out.mkdir(parents=True,exist_ok=True)
paths={'PetLogic.mlua':'G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua','GameText.csv':'G:/Maple_Story_Deck/RootDesk/MyDesk/Localization/GameText.csv'}
sources={}
for name,path in paths.items():
 b=Path(path).read_bytes();(stage/(name+'.before')).write_bytes(b);sources[name]={'path':path,'sha256':hashlib.sha256(b).hexdigest()}
preserved={str(p):hashlib.sha256(p.read_bytes()).hexdigest()for p in [Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet')/n for n in ['PetHouseUI.mlua','PetUI.mlua','PetProgress.mlua']]+[Path('G:/Maple_Story_Deck/ui/PetHouseGroup.ui')]}
(stage/'sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8');(stage/'preserved-sources.json').write_text(json.dumps(preserved,ensure_ascii=False,indent=2),encoding='utf-8')
s=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig')
def replace(a,b,count=1):
 global s
 assert s.count(a)==count,(a,s.count(a),count)
 s=s.replace(a,b)
props='''
	property string OduckEggProductId = ""
	property integer OduckEggPrice = 0
	property boolean OduckReady = false
	property table OduckRankAttack = {1,1.5,2,3}
	property number PetDuckBuffDuration = 30
	property number PetDuckDanceDuration = 4
	property number PetDuckDamageIncrease = 0.20
	property number PetDuckHeight = 1.35
	property number PetDuckBuffRemaining = 0
	@Sync property boolean PetDuckBuffActive = false
	property string PetDuckMirrorRUID = "db884a33341341b9845aab1621fa8c49"
	property table OduckMotions = {
		angry="23496411b7894a9d8b78e61a3a0bb808",chat="67ec0d6dc67d4cb4a7be3a4604da544a",
		cry="e8e7fbebf2b44e2c90da9f8c117ff086",dance="bae8d87f1ca442d5bcbb68f3c9b37d69",
		eat="1b43a3d250c64656be66bc04a9887fa5",hungry="f95159e73b65429caf8ee88a1329f896",
		icon="33c4c6cc49044cb19871522bfbd9071e",love="9ac825fbe4284bdc973cc1ef1bf2d1a5",
		move="d14e3254c4134f1eae318670d2167285",dung="b8e569f909524bbdbda0f5e82ee98639",
		rest="f198ec11ff564b678db4cd0b12a31327",sit="39dc6b481acd42d3955560eb6682a453",
		sleep="e5125fa1d39941489c7301b56f2fad24",stand="3abab5b4d3524b048606a95efa0a0f40",
		stand1="3abab5b4d3524b048606a95efa0a0f40",inject="6ebdb43959d148cdbb3f94d31465b55f",
		stunned="6ebdb43959d148cdbb3f94d31465b55f",surprise="2603ee96b4874dc9b1d3c5b8f12316bf",
		transform="8f3aebc5d5f94fa98a46ac5e5e4834fc",what="9e1b9ed82ef842bdb93c408f7b03dabf",
		gift="9ac825fbe4284bdc973cc1ef1bf2d1a5"
	}
'''
replace('\tproperty string FoxEggProductId = ""',props+'\n\tproperty string FoxEggProductId = ""')
replace('self:PreloadTurtleArtwork()','self:PreloadTurtleArtwork()\n\t\tself:PreloadOduckArtwork()')
replace('\t\tif petId~="ttungttang" then return nil end','\t\tif petId=="oduck" then return {id=petId,nameKey="PET_NAME_ODUCK",stand=self.OduckMotions.stand,motions=self.OduckMotions,pixelScale=5.2,inventoryPixelScale=4.5,productId=self.OduckEggProductId,price=self.OduckEggPrice,bonusKey="PET_HOUSE_ATTACK_FORMAT",nativeWalk=true} end\n\t\tif petId~="ttungttang" then return nil end')
replace('method number GetBonusPercent(string petId, integer level, integer rank)\n','method number GetBonusPercent(string petId, integer level, integer rank)\n\t\tif petId=="oduck" then\n\t\t\tlocal r=math.max(0,math.min(3,rank))\n\t\t\treturn self.OduckRankAttack[r+1]+math.max(0,level-r*10-1)*0.05\n\t\tend\n')
replace('{"5002617","ttungttang","5000498","landturtle"}','{"5002617","ttungttang","5000498","landturtle","oduck"}',3)
replace('petId~="5000498" and petId~="landturtle")','petId~="5000498" and petId~="landturtle" and petId~="oduck")')
replace('return base..(petId=="landturtle"','return base..(petId=="oduck" and "_ODUCK" or (petId=="landturtle"')
replace('or "_TTUNGTTANG"))..','or "_TTUNGTTANG")))..')
replace('(id~="landturtle" or self.TurtleReady)','(id~="landturtle" or self.TurtleReady) and (id~="oduck" or self.OduckReady)')
replace('return self.RunDamageMultiplier\n','return self.RunDamageMultiplier*(self.PetDuckBuffActive and (1+self.PetDuckDamageIncrease) or 1)\n')
replace('local turtle=PetProgress()','local turtle=PetProgress() local duck=PetProgress()')
replace('landturtle=turtle }','landturtle=turtle,oduck=duck }')
replace('data.version==2 or data.version==3 or data.version==4','data.version==2 or data.version==3 or data.version==4 or data.version==5')
replace('(data.version==4 and data.pets.landturtle==nil)','(data.version>=4 and data.pets.landturtle==nil) or (data.version>=5 and data.pets.oduck==nil)')
replace('if data.version<4 then migrated=true end','if data.version<5 then migrated=true end')
replace('return {version=4,pets=pets','return {version=5,pets=pets')
replace('method void InitForRun(string userId)\n','method void InitForRun(string userId)\n\t\tself:ResetOduckBuff()\n')
replace('if self:IsClient() then self:UpdatePetSkillVisual(delta) return end','if self:IsClient() then self:UpdatePetSkillVisual(delta) return end\n\t\tself:UpdateOduckBuff(delta)')
replace('if #targets==0 then return false end','if #targets==0 and self.RunPetId~="oduck" then return false end')
replace('\t\tlocal routeJSON=#route>0','\t\tif self.RunPetId=="oduck" then\n\t\t\tself.PetDuckBuffRemaining=self.PetDuckBuffDuration self.PetDuckBuffActive=true\n\t\t\tlog("[VRF] PET-ODUCK dance buff +20% duration="..self.PetDuckBuffDuration)\n\t\tend\n\t\tlocal routeJSON=#route>0')
replace('elseif cast.id=="landturtle" then','elseif cast.id=="oduck" then\n\t\t\tif cast.age>=self.PetDuckDanceDuration then\n\t\t\t\tself:EndPetSkillVisual(cast.id,cast.zone,self.RunToken,cast.serial,self.RunUserId)\n\t\t\t\tself._T.petSkillCast=nil\n\t\t\tend\n\t\telseif cast.id=="landturtle" then')
insert=r'''		if petId=="oduck" then
			local t={ko={"댄스 타임","춤을 추며 30초 동안\n대미지가 20% 증가합니다."},en={"Dance Time","Dance to increase damage by 20%\nfor 30 seconds."},ja={"ダンスタイム","ダンスで30秒間、\nダメージが20%増加します。"},zh={"舞蹈时间","跳舞使伤害增加20%，\n持续30秒。"}}
			local v=t[language] or t.en
			return {name=v[1],interval=(texts[language] or texts.en)[4],description=v[2],icon=self.OduckMotions.icon}
		end
'''
replace('\t\tif petId=="landturtle" then\n\t\t\tlocal shellTexts=',insert+'\t\tif petId=="landturtle" then\n\t\t\tlocal shellTexts=')
replace('petId=="5000498" or petId=="landturtle" then center=anchor','petId=="5000498" or petId=="landturtle" or petId=="oduck" then center=anchor')
replace('\t\tif petId=="landturtle" then bodyRUID=self.PetTurtleShellRUID end','\t\tif petId=="landturtle" then bodyRUID=self.PetTurtleShellRUID end\n\t\tif petId=="oduck" then bodyRUID=self.OduckMotions.dance end')
replace('\t\tself:UpdatePetSkillVisual(0)','\t\tif petId=="oduck" then\n\t\t\tfx.SpriteRendererComponent.PlayRate=1\n\t\t\tself._T.petSkillVisual.mirror=self:SpawnPetSkillSprite(self.PetDuckMirrorRUID,map,134)\n\t\tend\n\t\tself:UpdatePetSkillVisual(0)')
replace('\t\tif paused then return end','\t\tif v.id=="oduck" then\n\t\t\tfor _,e in ipairs({v.body,v.mirror}) do if isvalid(e) then e.SpriteRendererComponent.PlayRate=paused and 0 or 1 end end\n\t\tend\n\t\tif paused then return end')
replace('\t\telseif v.id=="landturtle" then','\t\telseif v.id=="oduck" then\n\t\t\tself:UpdateOduckVisual(v,t)\n\t\telseif v.id=="landturtle" then')
replace('\t\tif isvalid(v.hitFx) then v.hitFx:Destroy() end','\t\tif isvalid(v.hitFx) then v.hitFx:Destroy() end\n\t\tif isvalid(v.mirror) then v.mirror:Destroy() end')
replace('\t\tif self:IsClient() then self:ClearPetSkillVisual() end','\t\tif self:IsClient() then self:ClearPetSkillVisual() else self:ResetOduckBuff() end')
replace('\t\tself.RunPetId=ids[nextIndex]','\t\tself:ResetOduckBuff()\n\t\tself.RunPetId=ids[nextIndex]')
s=s.rstrip();assert s.endswith('\nend');s=s[:-4]+'\n'+(stage/'OduckMethods.mlua').read_text(encoding='utf-8')+'\nend\n';(stage/'PetLogic.mlua').write_text(s,encoding='utf-8')
raw=(stage/'GameText.csv.before').read_text(encoding='utf-8-sig');rows=list(csv.DictReader(io.StringIO(raw)));columns=list(rows[0]);add=[]
names={'ko':('부기','오덕'),'en':('Bugi','Oduck'),'zh-tw':('布基','奧德'),'zh-cn':('布基','奥德'),'ja':('ブギ','オドク')}
for row in rows:
 if row['Key'].endswith('_BUGI'):
  item=dict(row);item['Key']=row['Key'][:-5]+'_ODUCK';item['Note']='pet-oduck'
  for lang,(a,b)in names.items():item[lang]=item[lang].replace(a,b)
  item['Source']=item['Source'].replace('부기','오덕');add.append(item)
add.append(dict(zip(columns,['PET_HOUSE_ATTACK_FORMAT','공격력 +{0}%','pet-oduck','공격력 +{0}%','Attack +{0}%','攻擊力 +{0}%','攻击力 +{0}%','攻撃力 +{0}%'])))
buf=io.StringIO();w=csv.DictWriter(buf,fieldnames=columns,lineterminator='\n');w.writerows(add);(stage/'GameText.csv').write_text(raw.rstrip('\r\n')+'\n'+buf.getvalue(),encoding='utf-8')
(out/'translations.json').write_text(json.dumps(add,ensure_ascii=False,indent=2),encoding='utf-8')
(stage/'plan.json').write_text(json.dumps({'task':'Oduck native pet and 30-second dance damage buff','classification':'modify existing scripts and localization','steps':[{'name':'Inspect native pet/mirror and current catalog, saves, combat pipeline','status':'completed'},{'name':'Add pet, safe save migration, fixed stat, dance buff and native mirror visual','status':'in_progress'},{'name':'Verify migration, UI care, damage/pause/expiry/reset, visuals and U cheat in one runtime cycle','status':'pending'}]},ensure_ascii=False,indent=2),encoding='utf-8')
print('Oduck catalog, V5 migration, +1% innate attack, +20% 30s skill, native dance/mirror and localized copy staged.',flush=True)
