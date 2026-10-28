# Historical Ttunho v3 front seam — superseded

Use ../ttunho-collar-v5 and Maps/ttunho-harvest-seam-v4.json. V3 had a cheek gap, a pointed collar junction and irregular gold trim from per-row remapping. Body/hat/necklace remain valid, but do not restore the old coat front mask.

# Current Ttunho seam fit v4

Use Maps/ttunho-harvest-seam-v4.json and this folder. V3 style is retained, but its cheek gap and broken variable-width front trim are superseded. The new front edge is a single fitted curve (seam-geometry.json), using generated ink/gold colours; coat-fitted-front.png is the editable double-density fitted master. Do not restore per-row border copying or clip the gold border again with the old generic head polygon. The original ear remains in front. Keep the cheek overlap and a continuous, even-width band, including the upper collar bend and lower hem junction. Judge native-size rendering and motion, not only enlarged pixels.

Native body crops are unchanged and Maker-verified. Preserve all original timings, pivots, ears, white cheek, paws, tail, cap, necklace motion, slot independence, price and options. The front seam stays fixed to the actual animated head; seated poses fold only the cape's rear panel, not the fitted cheek edge.

UI uses atomic 8x8 motion sheets, 192x176 pixels/cell at density=2, codes 0,1,3,4,9,10,12,13. Fitted-parts PNGs are ALREADY double-density and packed directly at x*2,y*2; only native body PNGs are nearest-neighbour doubled. World drop uses standalone complete frames. Never split the UI body/gear or interpolate pixels. Keep user shop layout and Claude PetHouseUI guards intact. Read fresh current code before changing only the necessary Ttunho artwork tables.

Verification: real Maker captures for all64 native poses and8 independent combinations; normal care/discovery/inventory; first and repeated drop. UI and unrelated code byte hashes preserved. Rebuild script: Workflow/TtunhoSeamV4/rebuild.cjs. Generation mode and prompt: seam-generation.txt (built-in image_gen).
