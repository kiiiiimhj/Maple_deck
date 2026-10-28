# Historical Ttunho fit v2 — design rejected

Use ../ttunho-reference-v3 and Maps/ttunho-harvest-reference-v3.json. The native body crops here are correct, but the flattened beret, full-torso green fill and straight hem changed the user-approved design. Do not restore that artwork.

# Ttunho equipment fit v2

Current mapping: ArtSource/PetEquipment/Maps/ttunho-harvest-fit-v2.json. This supersedes ttunho-harvest-v1.json and Sources/Validated/ttunho. The old costume left the back uncovered and placed a static pendant beside the leg; never restore those masks.

Use native-originals/ for body pixels. originals/ contains official preview PNGs with padding (for example 52x36 preview vs 51x33 native sprite): NEVER resize previews to native dimensions. Every native crop was checked against the real original sprite through Maker, all 64 frames. The exact crop offsets are in native-originals-proof.json. Preserve the original body pixels and timing.

Each frame has a fitted original-torso mask, exact native ink rim, protected ear/tail/paw regions, generated cloth backing and a hem following that frame. Walking necklace follows the head/chest bob and its lower part sways through 0,+1,0,-1 native pixels while its upper attachment follows the neck. Do not pin the pendant to one screen/pivot position or replace it with an empty chain. Sleep/eat/hungry and back view naturally hide it.

Use one complete UI sheet per independent selected combination, codes 0,1,3,4,9,10,12,13, 8x8 cells of 192x176 source pixels. Packed pixels are doubled only with nearest-neighbor; zero-softness crop. Never split body and clothing renderers. Keep standalone full frames for the world drop. Price, options and item IDs are unchanged. Re-read current game source before changing only Ttunho table entries. Do not touch user shop positions or Claude PetHouseUI guards. Inspect both frozen source frames and normal-speed actual playback, not just RUID or pixel comparisons.
