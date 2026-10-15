from pathlib import Path
stage=Path('work/ttung-gear');p=stage/'PetLogic.mlua';s=p.read_text(encoding='utf-8')
a='e.SpriteGUIRendererComponent.Color=Color(1,1,1,a);e.Enable=true'
b='''-- Sprite flips do not propagate to child UI renderers. Mirror the full gear canvas with the pet.
\t\t\te.SpriteGUIRendererComponent.FlipX=portrait.SpriteGUIRendererComponent.FlipX
\t\t\te.SpriteGUIRendererComponent.FlipY=portrait.SpriteGUIRendererComponent.FlipY
\t\t\te.SpriteGUIRendererComponent.Color=Color(1,1,1,a);e.Enable=true'''
assert s.count(a)==1;s=s.replace(a,b);p.write_text(s,encoding='utf-8')
print('Gear now follows the pet renderer flip in walking and scenery actions.')
