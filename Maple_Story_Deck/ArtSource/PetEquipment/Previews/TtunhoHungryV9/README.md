# Ttunho hungry cape and inventory cleanup

Current live artwork: `G:/Maple_Story_Deck/ArtSource/PetEquipment/Maps/ttunho-hungry-cape-v9.json`.

- Kept the original perched beret and maple emblem. All 1,944 visible cap pixels across the four hungry frames match the original native cap. Lower face and mouth pixels remain unchanged.
- Directly redrew the requested upper mantle coverage for the four actual hungry frames. Kept natural necklace occlusion, original timing, atomic rendering and every other pose. The cape panel is sampled from the built-in image generation painting and cleaned on the native grid; no accessory attachment or clothing warp is used during playback.
- New standalone inventory illustrations match the other pets: three 80px icons and three 160px detail images, in `ArtSource/PetEquipment/InventoryIconsV3Ttunho`. Existing equipment prices/stats are unchanged.
- Product pictures no longer open description popups. All product press effects are suppressed; quantity purchase dialogs and scrolling remain available.
- Empty equipped slots do nothing. Right inventory items still equip and occupied slots still unequip.
- No `.ui` files were written; current user/Claude geometry was preserved. Source patches were made against freshly read live files with concurrency guards.

Verification: 32 actual frozen frame/gear combinations matched their source pixels with zero differences, including flipped rendering. Needs-driven normal playback observed all four hungry frames with zero atomic rendering errors. Twelve catalog picture clicks kept details closed; 24 registered press targets retained their scale/position. The purchase dialog opened normally. Three empty-slot clicks sent no equipment request. Real right-item equip and occupied-slot unequip succeeded against a temporary non-saving record, which was restored afterward. New runtime errors: 0.

The built-in image generation prompts are in `../ttunho-inventory-redraw-v1/generation-prompts.json` and copied beside the live archived art sources. The coat-only and perched-cap generated sheets are retained as reference masters; final output preserves the exact original native cap rather than replacing it with the generated cap.

Previews: `previews/hungry-equipped.gif`, `previews/hungry-equipped-four.png`. Actual game captures and machine-readable verification are in `runtime/`.
