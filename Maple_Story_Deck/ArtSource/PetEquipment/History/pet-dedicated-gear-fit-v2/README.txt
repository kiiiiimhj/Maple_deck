Pet equipment anatomy/readability correction v2 — 2026-10-15

Guri, Ducky, Bugi and Oduck: regenerated torso-specific garments and eight readable headpiece/necklace sprites using built-in ImageGen. Final prompt set: image-prompts.json. Original pet sprites, faces, eyes, timing, skill effects, acquisition rules and gear options are preserved. Equipment remains three separate independently removable layers.

The v1 check verified hookups, not anatomical quality. v2 uses unchanged native frames and visual comparisons. Guri coat wraps the short torso, Ducky bolero sits below the jaw and before tail, Bugi cape follows visible shell curvature, Oduck vest leaves the original wing in front. Decorative effects no longer determine Guri's head position; matching landmarks were visually checked in every contact sheet. Fixed accessory designs and a shared palette prevent design/color changes between poses. Sleeping poses hide neck/garment parts occluded by the original head naturally.

Oduck's oversized house display was reduced from 5.2 to 4.0 native-pixel scale so its crown and headpiece clear the needs panel. Native walk jump amplitudes are measured from source dimensions and the needs panel, preserving the smooth parabolic hop. Inventory and world-skill sizes are unchanged.

Verification: 16 actual care requests covering the four pets, 748 renderer frame/flip hookup cases without mismatches, four actual U casts and gear cleanup. After the house-size/headroom correction, four real walks were measured with all headpieces below the needs panel, and Oduck's feed/wash/sleep were rechecked. Build and runtime probes passed. Screenshots and contact sheets were visually inspected; renderer checks are not a guarantee of every display frame on all devices.

Actual current Maker screenshot collage: actual-equipped-pets-v2.png. Same-display-scale bare/equipped comparison: actual-before-after-v2.png. All assets are binary-alpha, Point-filtered separate sprites. No merged pet-and-gear body images are used. Account snapshots are private and excluded from this archive. Maker is left in a nonpersistent gear test preview.
