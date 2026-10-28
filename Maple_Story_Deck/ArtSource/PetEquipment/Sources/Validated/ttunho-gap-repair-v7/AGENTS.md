# Current Ttunho junction gap repair v7

Use Maps/ttunho-gap-repair-v7.json and this folder. This is a narrowly scoped edit on the approved v6 frames: fill the missing cloth backing between the native ear/head and cape on standing, walking, washing and resting/seated frames; close the cap/ear notch only on walking frames. No redesign. Existing paint pixels were not repainted, only the small missing backing was added behind the original ear. Native body, ears, trim, timings, independent slots, prices, options, icons, UI and all gameplay code remain unchanged.

Do not restore older clothing masks or run v6 guide generation over the repaired final per-frame masks. Full-frame SVG sources contain the gap-backing-v7 paint group. Final per-frame masks, original native foreground and body are the authoritative rebuild input. Use rebuild-ttunho-painted-v6.cjs with this source folder and a new output directory; all80 assets must match SHA. Original image generation provenance remains in ../ttunho-painted-v6; v7 is a direct edit of the existing native SVG/pixel sources with no new image generation.

The user explicitly asked to fix only these holes. Preserve all other approved artwork and user/Claude changes. Read the current source and patch only the two Ttunho sheet/world mapping entries. Cap jump heights are unchanged.
