# Historical Ttunho v3 front seam — superseded

Use ../ttunho-seam-v4 and Maps/ttunho-harvest-seam-v4.json. V3 had a cheek gap, a pointed collar junction and irregular gold trim from per-row remapping. Body/hat/necklace remain valid, but do not restore the old coat front mask.

# Current Ttunho reference design v3

Mapping: Maps/ttunho-harvest-reference-v3.json. This replaces the rejected v2 style. The approved reference is approved-reference.png. Preserve its tall puffed beret, broad shoulder cape with a sloped gold hem, maple emblem and visible acorn pendant. Do not flatten the hat or fill the whole torso green. V2's procedural body fill and straight hem changed the approved garment and must not be restored.

Use native-originals/: all 64 actual native crops were checked against Maker. Official preview PNG padding must be cropped, never resized to native dimensions. Clothing is fitted at density=2; each fitted-parts PNG is ALREADY double-density. Body is doubled nearest; fitted parts are packed directly at x*2,y*2. Never enlarge the fitted parts twice.

Face/ear occlusion must not erase the cape's existing gold front rim. The original ink/gold ribbon is fitted to the resulting visible front contour; no synthetic body fill or replacement hem. Keep the full gold line from behind the ear down to the sloped hem in every ordinary pose. The walking chain follows the chest bob and its lower pendant sways; sleeping/eating/hungry/back/spin naturally hide it.

Keep one atomic UI texture for each independently selected combination, codes 0,1,3,4,9,10,12,13, layout 8x8 at 192x176 source pixels, original pivot and timing. World drop uses complete standalone frames. Never return to separate asynchronous body/gear UI renderers. Preserve price500 diamonds each, stats, item IDs, user shop positions and Claude PetHouseUI nil guards. Always read fresh source and change only the relevant Ttunho properties.

Real Maker frozen poses, independent combinations, care/discovery/inventory, first and repeated drop visuals were checked. A pixel/RUID match alone does not prove design fidelity; compare approved-reference.png, the actual captures and normal-speed motion. Rebuild via Workflow/TtunhoReferenceV3/rebuild-ttunho-reference-v3.cjs.
