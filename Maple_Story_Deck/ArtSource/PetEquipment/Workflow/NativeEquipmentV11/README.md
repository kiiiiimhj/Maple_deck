

Native pet equipment (Guri 5002617, Ducky 5000498, Bugi landturtle, Oduck oduck) now uses `Maps/validated-native-equipment-inputs-v11.json` and `Sources/Validated/<pet>`. These are the corrected original/variation parts with intact source body pixels. Use these as the starting point for future designs; older exploratory outputs have been retired. Every item remains independently selectable. Same-slot variants never stack.

UI native pets use ONE sheet per selected equipment combination, containing all original animation frames. During animation only the zero-softness crop moves; do not change the texture or use separate body/gear renderers. This prevents body/gear pose disagreement and repeated texture loads. The layout varies per pet; never force a common square canvas or interpolate pixels. Keep the original pivot and source timings. World skills use standalone complete painted body-and-gear frames. Slot state remains independent of this atomic rendering.

Bugi: keep the original head, feet, toes, food and effects; replace only the shell. Preserve the final native foot rows instead of erasing orange toes as shell colour. Ducky: use the complete stand ribbon as the stable ordinary-pose master. Pendant sizes stay fixed and the native head can naturally occlude them. Never force jewellery through the sleeping face or eating muzzle.

The final art was compared against actual Maker captures for every original/new source frame plus all 27 combinations. Normal care playback and real world skill playback were checked separately. Current evidence and final design comparison are in `Previews/NativeEquipmentV11`. `Workflow/AppliedSource` mirrors the actual applied source. The pendant source and built-in generation specification are retained under `Sources/Validated/PendantDesigns` and `Workflow/NativeEquipmentV11/pendant-prompt.txt`.

Only rebuild_validated.py uses the current portable source inputs. The migration/export scripts are retained as repair implementation evidence; their historic exploratory image inputs are retired and must not be restored. Broad historical cleanup was not performed. Only confirmed defective images and discarded drafts were removed.
