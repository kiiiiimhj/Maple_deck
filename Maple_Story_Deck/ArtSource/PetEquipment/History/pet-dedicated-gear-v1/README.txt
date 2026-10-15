Dedicated pet equipment — 2026-10-15

Guri: Wildflower Hairpin / Breeze Vest / Amber Necklace.
Ducky: Bell Ribbon / Plum Bolero / Teardrop Necklace.
Bugi: Sprout Hairpin / Forest Shawl / Sky Gem Necklace.
Oduck: Sea Star Hairpin / Little Sailor Vest / Mint Star Necklace.

All head accessories: critical damage +10 percentage points. All clothes: attack x1.05. All necklaces: critical chance +5 percentage points. Each slot is independent. Test-only acquisition; no cash products or live rewards added.

Built-in ImageGen created the four transparent equipment atlases. Exact prompts are in image-prompts.json. Equipment is fitted to unchanged native pet sprites using integer source-pixel offsets and explicit face/paw/prop occlusion. Native frame-change events synchronize separate gear layers. Small item canvases extend beyond the pet texture to avoid cropped hairpins. Binary alpha, a fixed palette, Point filtering, preload and warm render pools reduce first-use swaps. Original Ttungttang artwork and dedicated gear, including the eye repair and first-use fix, are preserved.

Source validation: 40 stat/gear mask cases for all five pets; v7 save round trip; v6 migration preserves progress and Ttungttang gear; invalid/unowned gear rejected. Native overlay map covers 374 original sprites. Actual Maker verification: 748 frame/flip cases, 24 server slot toggles, 28 controlled care render scenes, four actual U casts, pause and gear cleanup. No current build or runtime errors.

Controlled care fixture screenshots can contain artificial walking-plan leftovers when actions are switched without their normal end transition; they are retained locally for diagnosis, not used as final product previews. An actual sleep care-button comparison confirmed a normal clean scene both with and without gear. Final house screenshots use ordinary idle controllers.

The Maker is left in a temporary test preview with all four added gear catalogs owned and equipped. Original progress is preserved locally in the private workspace snapshot and in the server-side gearDemoOriginalAccount pointer; the preview is not saved to live DataStorage. Account snapshots and logs containing them are excluded from this archive.

Checks inspect source, renderer state and actual screenshots; they do not certify every GPU display frame on every device.
