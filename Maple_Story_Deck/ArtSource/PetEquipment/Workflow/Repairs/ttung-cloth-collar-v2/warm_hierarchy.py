from pathlib import Path
p=Path('work/pet-variation-repair-v2/PetLogic.mlua');s=p.read_text(encoding='utf-8')
start=s.index('\tmethod void RenderPetGearUI(');end=s.index('\n\t@ExecSpace',start);m=s[start:end]
m=m.replace('local e=_SpawnService:SpawnByEntity(template,"PetWear_"..slot,Vector3.zero,portrait,false)','local cover=portrait.Parent.Parent\n\t\t\t\t\t\tlocal e=_SpawnService:SpawnByEntity(template,"PetWear_"..slot,Vector3.zero,cover.Parent,false)\n\t\t\t\t\t\t_UILogic:SetSiblingIndex(e.UITransformComponent,0)')
m=m.replace('t.anchoredPosition=Vector2.zero;t.UIScale','t.anchoredPosition=cover.UITransformComponent.anchoredPosition;t.UIScale')
needle='\t\tlocal selected={} local layers='
insert='''		-- Prepare every full-size renderer underneath the opaque popup, then retain
		-- that same renderer when moving it into the portrait's draw hierarchy.
		if not pool.ready and pool.warmFrames>=8 and _UtilLogic.ElapsedSeconds-pool.warmStart>=0.16 then
			for _,e in ipairs(pool.actors) do e:AttachTo(portrait);e.UITransformComponent.anchoredPosition=Vector2.zero end
			pool.ready=true
		end
'''
assert needle in m;m=m.replace(needle,insert+needle)
old='''			-- Warm the actual full-size renderer behind the opaque popup background.
			e.SpriteGUIRendererComponent.OverrideSorting=not pool.ready
			e.SpriteGUIRendererComponent.SortingLayer="UI"
			e.SpriteGUIRendererComponent.OrderInLayer=pool.ready and 0 or -10000
'''
assert old in m;m=m.replace(old,'')
m=m.replace('pool.warmFrames=pool.warmFrames+1 if pool.warmFrames>=8 and _UtilLogic.ElapsedSeconds-pool.warmStart>=0.16 then pool.ready=true end','pool.warmFrames=pool.warmFrames+1')
s=s[:start]+m+s[end:];p.write_text(s,encoding='utf-8',newline='\r\n')
print('Warm actors under the opaque panel using the supported UI hierarchy; retain creation order on reparent.')
