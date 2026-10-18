Current corrected inputs: `Maps/validated-ttung-equipment-inputs.json`. The initial v1 extraction scripts in this directory are historical; use the validated source masks and the current AppliedSource mappings for the next design. See `ArtSource/PetEquipment/AGENTS.md`.

# Rose stripe variation (test)

Three separate Ttungttang items. Original clothing remains available; any mix of original and rose stripe parts is valid. Clicking a different design swaps the slot. Clicking the currently equipped design removes it. Stat bonuses depend only on the occupied slots.

Add future designs to GetPetGearVariants and matching PetGearVariantOverlays keys FRAME:designN. Preserve the original per-frame transparency, outlines, canvas and anchors. Never replace a body sprite with a generated concept image. The saved selection stores separate design indexes per slot; up to 17 total designs per slot fit the validated ownership field.

Resources stay under the existing PetEquipment root. Maps/equipment-resources.json includes the variation marker; Maps/rose-stripe-v1.json is the portable variation catalogue. New grants are test-only through 장비 시험; no release acquisition rules were added.

Verification: real Maker inventory cell and slot button clicks, save migration, all 76 frames in independent slot/pattern/facing combinations, care playback, cold first and repeated U skill casts. Contact sheets and actual screenshots are in Previews/Variants/rose-stripe-v1.
