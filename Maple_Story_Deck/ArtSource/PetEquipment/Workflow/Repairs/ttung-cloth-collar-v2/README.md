# Corrected Ttungttang equipment and atomic UI frames

The current editable body and equipment masks are under Sources/Validated/ttungttang, indexed by Maps/validated-ttung-equipment-inputs.json. The current actual game source is under Workflow/AppliedSource. Historical exploratory scripts in this directory are evidence of the repair, not a batch to rerun in filename order.

The UI displays one 128px tile from a 640x768 sheet (5 columns, 6 rows). It contains body plus the selected equipment; digits 0=unequipped, 1=original, 2=rose stripe; code=hat+coat*3+neck*9. Maps/ttung-atomic-ui-frames-v2.json indexes the sheets. All 27 combinations preserve independent item selection and the existing bonuses. The original source PNGs remain separate and editable.

Do not restore the separate UI renderer visibility pool. Live eating captured body frame 25 together with the cap and collar from a neighbouring pose, despite static pixel checks passing. Prewarming did not fix that ordering failure. Atomic body-and-equipment frames remove that inconsistent intermediate state. Zero-softness native UI clipping shows only the selected tile; horizontal flipping also mirrors the selected column.

For a further equipment design, use the corrected editable masks and regenerate the complete combination sheets; update the layout and combination radix together. Preserve the native body, original canvas, source pixels, contours and animation timing. See ArtSource/PetEquipment/AGENTS.md for artwork and validation requirements.
