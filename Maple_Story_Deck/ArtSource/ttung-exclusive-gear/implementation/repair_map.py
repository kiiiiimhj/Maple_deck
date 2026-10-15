from pathlib import Path
p=Path('work/ttung-gear/PetLogic.mlua');s=p.read_text(encoding='utf-8')
edits={
'self.RunUserId=_UserService.SenderUserId':'self.RunUserId=senderUserId',
'routeJSON,anchor,self.PetSkillCastSerial,self.RunUserId)':'routeJSON,anchor,self.PetSkillCastSerial,self.RunPetGearMask,self.RunUserId)',
'method void StartPetSkillVisual(string petId, integer zone, integer run, string routeJSON, Vector3 anchor, integer serial)':'method void StartPetSkillVisual(string petId, integer zone, integer run, string routeJSON, Vector3 anchor, integer serial, integer gearMask)',
'anchor=anchor,serial=serial}':'anchor=anchor,serial=serial,gearMask=gearMask}',
'pending.anchor,pending.serial)':'pending.anchor,pending.serial,pending.gearMask)',
'v.gearMask=self.RunPetGearMask':'v.gearMask=math.max(0,math.min(7,gearMask))'}
for a,b in edits.items():assert s.count(a)==1,(a,s.count(a));s=s.replace(a,b)
p.write_text(s,encoding='utf-8');print('Skill cast carries its server gear snapshot; U uses the engine RPC sender id.')
