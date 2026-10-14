from pathlib import Path
import json,hashlib
stage=Path('work/oduck-feeding-pool');sources=json.loads((stage/'sources.json').read_text(encoding='utf-8'))
line='\t\t\tlocal fill=_SpawnService:SpawnByEntity(self.vampirePotionBuff:GetChildByName("Fill"),"Fill",Vector3(0,0,0),panel,false)'
block='''
\t\t\tfor _,child in ipairs({icon,fill}) do
\t\t\t\tlocal t=child.UITransformComponent
\t\t\t\tt.AnchorsMin=Vector2(0,0) t.AnchorsMax=Vector2(1,1) t.Pivot=Vector2(0.5,0.5)
\t\t\t\tt.RectSize=Vector2(50,50) t.anchoredPosition=Vector2(0,0) t.UIScale=Vector3(1,1,1)
\t\t\tend'''
for name,v in sources.items():
 p=Path(v['path']);s=p.read_text(encoding='utf-8-sig');expected=s
 if name=='CardManager.mlua':assert s.count(line)==1;expected=s.replace(line,line+block)
 assert expected==(stage/name).read_text(encoding='utf-8'),name+' unexpected changes'
 (stage/(name+'.layout-before')).write_bytes(p.read_bytes());v['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
(stage/'repair-sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8');print('Only the two dynamic icon-child transforms are centered in this repair.')
