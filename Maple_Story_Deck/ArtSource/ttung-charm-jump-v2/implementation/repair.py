from pathlib import Path
import hashlib,json
stage=Path('work/ttung-charm-jump-v2');path=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet/PetLogic.mlua')
s=path.read_text(encoding='utf-8-sig');assert s==(stage/'PetLogic.mlua').read_text(encoding='utf-8')
(stage/'PetLogic.first-applied.mlua').write_text(s,encoding='utf-8')
(stage/'repair-sources.json').write_text(json.dumps({'PetLogic.mlua':{'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}},indent=2),encoding='utf-8')
a='if not self.PetCharmJumpReady or pool==nil or not pool.ready then';b='if not self.PetCharmJumpReady or pool==nil or not pool.ready or pool.map~=_UserService.LocalPlayer.CurrentMap then';assert s.count(a)==1;s=s.replace(a,b)
a='''\t\t\t\t\t\tlocal sprite=_ResourceService:LoadSpriteAndWait(actor.SpriteRendererComponent.SpriteRUID)
\t\t\t\t\t\tif sprite==nil or not sprite.IsLoadComplete then loaded=false end
''';assert s.count(a)==1;s=s.replace(a,'')
# No resource calls in a warm draw: cached geometry avoids yielding OnUpdate and
# allowing a stale warming coroutine to hide an actor after its first cast.
a='''\t\tif not pool.ready then
\t\t\tlocal p=''';b='''\t\tif not pool.ready then
\t\t\tif pool.warming then return end
\t\t\tpool.warming=true
\t\t\tlocal p=''';assert s.count(a)==1;s=s.replace(a,b)
a='\t\t\tpool.warmFrames=loaded and pool.warmFrames+1 or 0';assert s.count(a)==1;s=s.replace(a,'\t\t\tpool.warmFrames=loaded and pool.warmFrames+1 or 0\n\t\t\tpool.warming=false')
(stage/'PetLogic.mlua').write_text(s,encoding='utf-8')
print('Warm loop no longer yields or overlaps; exactly four render frames and map-matched pool.')
