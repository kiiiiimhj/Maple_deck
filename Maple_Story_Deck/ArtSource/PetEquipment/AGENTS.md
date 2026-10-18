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
