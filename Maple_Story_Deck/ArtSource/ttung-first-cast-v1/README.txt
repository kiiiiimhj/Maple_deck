Ttungttang first-use effect repair

Only PetLogic.OnUpdate, PlacePetCharmSprite, WarmPetCharmRenderPool and EndPetSkillVisual changed.
Artwork RUIDs, eye repair v2, individual equipment layers, stats and skill timing are preserved.

The effect pool is marked as constructing before any potentially yielding spawn. A full actor count and valid geometry are required before readiness. It receives eight warm render updates covering at least 0.12 seconds before the pending visual is started. An ended pending request is cancelled instead of appearing later.

Verification: full translated PetLogic compilation; construction reentry and empty-pool regression; matching pending cancellation with stale-end protection; Maker build; actual U first cast queued during preparation and repeated U with all three equipment layers. Twelve poses checked, with zero blank/overlap/disabled/wrong-texture/tint/equipment samples and no current runtime or build errors. Actual screenshots cover startup, takeoff and burst for both casts. Test account and wallet restored.

These checks establish the corrected initialization and sampled render state; they are not a GPU video recording and cannot certify every display frame on all devices.
