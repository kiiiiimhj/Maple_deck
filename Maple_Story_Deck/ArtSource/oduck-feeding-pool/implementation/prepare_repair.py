from pathlib import Path
import json,hashlib
stage=Path('work/oduck-feeding-pool');sources=json.loads((stage/'sources.json').read_text(encoding='utf-8'))
old='''\t\t\tpanel:GetChildByName("Icon").SpriteGUIRendererComponent.ImageRUID=DataRef(_PetLogic.PetDuckIconRUID)
\t\t\tself.oduckBuff=panel self.oduckBuffFill=panel:GetChildByName("Fill").SpriteGUIRendererComponent'''
new='''\t\t\t-- SpawnByEntity copies the panel itself; create its two children explicitly.
\t\t\tlocal icon=_SpawnService:SpawnByEntity(self.vampirePotionBuff:GetChildByName("Icon"),"Icon",Vector3(0,0,0),panel,false)
\t\t\tlocal fill=_SpawnService:SpawnByEntity(self.vampirePotionBuff:GetChildByName("Fill"),"Fill",Vector3(0,0,0),panel,false)
\t\t\ticon.SpriteGUIRendererComponent.ImageRUID=DataRef(_PetLogic.PetDuckIconRUID)
\t\t\t_UILogic:SetSiblingIndex(icon.UITransformComponent,0)
\t\t\t_UILogic:SetSiblingIndex(fill.UITransformComponent,1)
\t\t\tself.oduckBuff=panel self.oduckBuffFill=fill.SpriteGUIRendererComponent'''
for name,v in sources.items():
 p=Path(v['path']);s=p.read_text(encoding='utf-8-sig');expected=s
 if name=='PetHouseUI.mlua':expected=expected.replace('image.FillAmount=0.35','image.FillAmount=0.26')
 if name=='CardManager.mlua':assert expected.count(old)==1;expected=expected.replace(old,new)
 assert expected==(stage/name).read_text(encoding='utf-8'),name+' unexpected changes'
 (stage/(name+'.repair-before')).write_bytes(p.read_bytes());v['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
(stage/'repair-sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8');print('Only the pool foreground crop and explicit icon/fill child spawning change in this repair.')
