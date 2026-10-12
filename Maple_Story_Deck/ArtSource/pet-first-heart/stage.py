from pathlib import Path
import re,json
stage=Path('work/pet-first-heart')
s=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig')
def method(name,body):
    global s
    p=r'(^\tmethod [^\n]+ '+name+r'\([^\n]*\)\n)(.*?)(^\tend\s*$)'
    m=re.search(p,s,re.M|re.S);assert m,name
    s=s[:m.start(2)]+body.rstrip()+'\n'+s[m.end(2):]
method('PreloadPetSkillArtwork','''\t\tself._T.petSkillArtReady=false
\t\tlocal assets={self.PetCharmRoarRUID,self.PetCharmWaveRUID,self.PetCharmHeartRUID,self.PetRollRUID,self.PetRollDustRUID,self.PetRollIconRUID,self.PetCharmIconRUID,self.PetFoxIconRUID,self.PetFoxWaveRUID}
\t\t_ResourceService:PreloadAsync(assets,function(results)
\t\t\tif not isvalid(self) then return end
\t\t\tlocal ready=true for _,r in pairs(results) do if r~=PreloadResultStatus.Success then ready=false end end
\t\t\t-- The image preload alone leaves the first geometry query yielding during a cast.
\t\t\t-- Warm dimensions/pivots now, while every effect is still absent from the map.
\t\t\tif ready then
\t\t\t\tfor _,ruid in ipairs(assets) do
\t\t\t\t\tlocal metrics=_CardManager:GetSpriteMetrics(ruid)
\t\t\t\t\tif metrics.w<=0 or metrics.h<=0 then ready=false end
\t\t\t\tend
\t\t\tend
\t\t\tself._T.petSkillArtReady=ready log("[VRF] PET-SKILL artwork and geometry ready="..tostring(ready))
\t\tend)''')
method('SpawnPetSkillSprite','''\t\tif not isvalid(map) or ruid=="" then return nil end
\t\tlocal fx=_SpawnService:SpawnByModelId("persistenteffect","PetSkill",Vector3.zero,map)
\t\tif not isvalid(fx) or fx.SpriteRendererComponent==nil then return nil end
\t\t-- A cold resource query may yield; never expose the prefab's origin/scale/opacity.
\t\tfx.Enable=false
\t\tlocal r=fx.SpriteRendererComponent r.Color=Color(1,1,1,0)
\t\tr.SpriteRUID=ruid r.SortingLayer="UI" r.OrderInLayer=order
\t\treturn fx''')
method('PlacePetSkillSprite','''\t\tif not isvalid(fx) then return end
\t\tlocal metrics=_CardManager:GetSpriteMetrics(fx.SpriteRendererComponent.SpriteRUID)
\t\tif metrics.w<=0 or metrics.h<=0 then
\t\t\tfx.Enable=false fx.SpriteRendererComponent.Color=Color(1,1,1,0) return
\t\tend
\t\tlocal scale=width/metrics.w
\t\t_MonsterProjectileFx:PlaceVisual(fx,metrics,pos,scale,rotation)
\t\tlocal opacity=math.max(0,math.min(1,alpha))
\t\tfx.SpriteRendererComponent.Color=Color(1,1,1,opacity)
\t\t-- Reveal last, after transform and alpha are both ready; hide inactive burst slots.
\t\tfx.Enable=opacity>0''')
(stage/'PetLogic.mlua').write_text(s,encoding='utf-8')
# Reuse the guarded Maker apply/save flow; only PetLogic is changed.
apply=Path('work/pet-skill-polish/apply.py').read_text(encoding='utf-8').replace('pet-skill-polish','pet-first-heart')
(stage/'apply.py').write_text(apply,encoding='utf-8')
common=stage/'runtime_common.py';p=common.read_text(encoding='utf-8')
p=p.replace("print(tag+': '+json.dumps(shown,ensure_ascii=False),flush=True)","\n   if tag.startswith('samples-'):shown={'frames':len(value['rows']),'earlyVisible':sum(v['visible'] for v in value['rows'] if v['age']<.34),'wrong':sum(v['wrong'] for v in value['rows'])}\n   print(tag+': '+json.dumps(shown,ensure_ascii=False),flush=True)")
common.write_text(p,encoding='utf-8')
print('Staged hidden initialization, prewarmed geometry and reveal-after-placement.')
