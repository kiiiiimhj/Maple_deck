# Pet equipment artwork inputs

For new Ttungttang colour/pattern variants, use `Maps/validated-ttung-equipment-inputs.json` and `Sources/Validated/ttungttang`. These are the current corrected frame masks. `Workflow/AppliedSource/PetLogic.mlua` is the current game mapping.

The old `outputs/pet-variation-v1/original-maps.json` and old colour-extraction exporters retain the defective masks. They are historical inputs, not a basis for another variation. Do not restore them over the current maps.

For a colour/pattern-only variant, preserve each validated mask, frame canvas, anchors and dark contour pixels. Never infer clothing visibility from broad rectangles or dilated fur colours: that erased valid fabric and copied adjacent paw lines. Preserve the original character's face, ears, paws and all source animation timings.

Fit necklace placement against the original naked frame. The chin differs from the generated clothing guide. The lowered head naturally hides the pendant in sniffing; sleeping shows only a small strap. Do not force the pendant onto cheek, ear, bowl or paw to keep it visible.

Check both the painting itself and its actual applied rendering. A correct RUID or an unchanged alpha mask proves nothing if the reference mask was already wrong. Use actual frozen frames and normal playback for care, discovery and the first skill, with independent slot combinations. Interpret Maker screenshots using their actual capture-to-render scale.

The custom UI now displays body and equipment together in a single selected tile from `Maps/ttung-atomic-ui-frames-v2.json`. The 5 by 6 atlas has 128px tiles and 27 independent equipment combinations. Slot selection and bonuses remain independent; only rendering is combined. Keep original body PNGs and each separate equipment mask as editable sources. For another design, regenerate every combination and update the atlas layout/code radix together. Never rescale source pixels while packing.

Do not restore separate UI body/hat/neck/coat visibility switching. In actual live playback, those renderers displayed neighbouring poses on different refreshes even after full-size warming; frozen screenshots and alpha/RUID metadata did not catch it. A single atomic frame fixes that failure structurally. The rect mask has zero softness, and horizontal flipping must also mirror the selected atlas column. Do not use unsupported SpriteGUIRenderer sorting setters.


Native pet equipment (Guri 5002617, Ducky 5000498, Bugi landturtle, Oduck oduck) now uses `Maps/validated-native-equipment-inputs-v11.json` and `Sources/Validated/<pet>`. These are the corrected original/variation parts with intact source body pixels. Use these as the starting point for future designs; older exploratory outputs have been retired. Every item remains independently selectable. Same-slot variants never stack.

UI native pets use ONE sheet per selected equipment combination, containing all original animation frames. During animation only the zero-softness crop moves; do not change the texture or use separate body/gear renderers. This prevents body/gear pose disagreement and repeated texture loads. The layout varies per pet; never force a common square canvas or interpolate pixels. Keep the original pivot and source timings. World skills use standalone complete painted body-and-gear frames. Slot state remains independent of this atomic rendering.

Bugi: keep the original head, feet, toes, food and effects; replace only the shell. Preserve the final native foot rows instead of erasing orange toes as shell colour. Ducky: use the complete stand ribbon as the stable ordinary-pose master. Pendant sizes stay fixed and the native head can naturally occlude them. Never force jewellery through the sleeping face or eating muzzle.

The final art was compared against actual Maker captures for every original/new source frame plus all 27 combinations. Normal care playback and real world skill playback were checked separately. Current evidence and final design comparison are in `Previews/NativeEquipmentV11`. `Workflow/AppliedSource` mirrors the actual applied source. The pendant source and built-in generation specification are retained under `Sources/Validated/PendantDesigns` and `Workflow/NativeEquipmentV11/pendant-prompt.txt`.

+
+Ttungttang condition reaction repair v3: current mapping is Maps/ttung-condition-equipment-v3.json, with the existing validated input and atomic-sheet indices updated in place. Native body pixels and reaction timing are unchanged. In each two-frame reaction, the original animated head moves down by one source pixel; the chest portion of the shirt must use that same articulated movement, while its back and planted paws remain fixed. The cap and necklace move together with the head. Both existing and rose-stripe equipment were corrected; never reintroduce static reaction masks from historical exporters. No resampling, filtering, body repainting, or whole-shirt bob is needed.
+
+Actual needs-driven hungry/rest/cry/angry playback was checked in both Pet House and inventory, with both sets. Every reaction frame and all 27 independent combinations were compared against actual Maker captures. Evidence: Previews/TtungConditionV3.
+

Guri/Bugi anatomy repair v12: Maps/guri-bugi-anatomy-v12.json supersedes the affected v11 coat exports and motion sheets; validated-native-equipment-inputs-v11.json and native-equipment-v11.json are updated in place. Guri's four move frames must use the original animated paws: the old garment export contained a stationary paw, which must not be composited over the native foot stride. Garment rows at/below native source y=30 are transparent, retaining the original anatomy beneath. Bugi's original torso is opaque below the head; the former shell eraser cut this chest/belly material out. Restore the corresponding native body pixels, respecting left/right facing direction; do not erase orange/brown body material as if it were shell. Existing world skill shell frames are intentionally shell-only and unchanged. Evidence in Previews/GuriBugiAnatomyV12 includes actual care playback for both designs plus every Bugi body frame and independent gear combinations. These are technical recovery of original pixels, with no new creative image generation.

Ttunho equipment fit v2: current portable source is Sources/Validated/ttunho-fit-v2 and Maps/ttunho-harvest-fit-v2.json. V1 has been superseded. Official preview PNGs have padding; use the 64 Maker-verified crops in native-originals, never resize a padded preview to native dimensions. Torso coverage, necklace attachment and walking sway must be judged per frame and in normal-speed playback. Keep original body ink, ears, paws, tail and all motion timings.

Ttunho reference v3 supersedes the v2 artwork: use Maps/ttunho-harvest-reference-v3.json and Sources/Validated/ttunho-reference-v3. Keep the tall beret, shoulder cape/sloped gold hem, continuous gold front trim and visible acorn pendant from the approved reference. Do not restore v2 torso-fill/straight-hem code. Native body crops, all timings, atomic sheets and independent slot stats are preserved.

Ttunho seam v4 is the current artwork mapping: Maps/ttunho-harvest-seam-v4.json and Sources/Validated/ttunho-seam-v4. It retains the approved v3 design while correcting cheek overlap and the broken front gold trim using one continuous fitted curve. Never restore v3 per-row ribbon relocation/head clipping. The front seam stays intact while seated poses fold only the rear cape.

Ttunho collar v5 is current: Maps/ttunho-harvest-collar-v5.json and Sources/Validated/ttunho-collar-v5. It fixes the v4 opaque black shoulder bar: absent/transparent texture samples must retain alpha, never become opaque black. The fitted seam, original body, cap, necklace and timings are unchanged.


Ttunho directly painted v6 is current: Maps/ttunho-painted-used-v6.json and Sources/Validated/ttunho-painted-v6. Supersedes V1–V5 art. User rejected reusable accessory positioning/warping: paint each actually used original frame directly, preserve native anatomy, round/lower the upper collar behind the right ear. Read the current source AGENTS.md before changing Ttunho.

Ttunho junction gap repair v7 is current: Maps/ttunho-gap-repair-v7.json and Sources/Validated/ttunho-gap-repair-v7. Only fills the reported cape/head and walking cap/ear gaps in approved v6 art. Preserve all other art, UI and logic.

Ttunho care junction v8 is current: Maps/ttunho-care-junction-v8.json and Sources/Validated/ttunho-care-junction-v8. Fills the remaining feed/injection/sleep junctions and audits all56 used frame entries. Preserve all other approved artwork and current UI changes.
