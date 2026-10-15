local L=_PetLogic
if L._T.v4WatchTimer~=nil then _TimerService:ClearTimer(L._T.v4WatchTimer)end
local q={ticks=0,houseTicks=0,poolTicks=0,samples=0,errors=0,frameChanges=0,lastBase=""};L._T.v4Watch=q
L._T.v4WatchTimer=_TimerService:SetTimerRepeat(function()
 q.ticks=q.ticks+1;local H=_PetHouseUI
 if not H.PetMode then return end
 q.houseTicks=q.houseTicks+1;local portrait=H.PetDisplay:GetChildByName("Portrait")
 local pool=(L._T.nativePetGearUI or {})[portrait.Id]
 if pool==nil or not pool.ready then return end
 q.poolTicks=q.poolTicks+1
 local expected={};local layers=L.NativePetGearOverlays[pool.petId][pool.base];local replaced=layers.coat~=nil and layers.coat.replacesBody==true and L:HasPetGearBit(pool.mask,2);if not replaced then expected[pool.base]=true end
 for slot,d in pairs(layers)do local bit=slot=="hat"and 1 or(slot=="coat"and 2 or 4);if L:HasPetGearBit(pool.mask,bit)then expected[d.ruid]=true end end
 local visible=0;local bases=0;local need=0;for _,_ in pairs(expected)do need=need+1 end
 for key,e in pairs(pool.actors)do
  if e.SpriteGUIRendererComponent.Color.a>.5 then
   visible=visible+1;if pool.baseActors[key]~=nil then bases=bases+1 end
   if not expected[key] or tostring(e.SpriteGUIRendererComponent.ImageRUID.DataId)~=key then q.errors=q.errors+1 end
  end
 end
 if visible~=need or bases~=(replaced and 0 or 1) or portrait.SpriteGUIRendererComponent.Enable then q.errors=q.errors+1 end
 if q.lastBase~=pool.base then q.lastBase=pool.base;q.frameChanges=q.frameChanges+1 end
 q.samples=q.samples+1
end,.03,.03)
local result={watching=true}
