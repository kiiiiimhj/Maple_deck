# 2026-10-28 event/potion/landing polish V3

Active scripts were patched from the latest on-disk contents, with fresh-content guards before writing. CurrentSources is a reference snapshot; never restore it wholesale over Claude or user changes.

- Turkey: preserve original head/eyes/beak/sack/tail. Only the wing/body repair region and generated legs were packed. One planted idle image; two walking poses (wide contact -> compact passing with 1px body lift). Normal frame step .24s, fleeing .07s. Native112px, binary alpha, original palette, nearest filter, matching sole baseline. Scale1.2 ->1.32 (+10%). Existing 120–180s spawn interval, toast, fleeing dust and save code preserved.
- Turkey bag5–10: each valid positive hit through all five MonsterAI damage methods reserves exactly one acorn. Final acorn ends the actor. No death lump reward. Existing pickup/inventory/run-results/save path retained. QA verified bags5 and10,15 individual native pickup callbacks, no duplicate death grant, ordinary monster damage unaffected. QA pickups were removed from their tagged queue before account credit.
- Ttunho: bottom foothold target unchanged; .6s descent with exactly one hit/enemy. Landing .9s tail: .28-unit hop, .11-unit hop, neutral foot dust, fade. Native per-frame equipment renderer follows the same body transform. Rejected ground effect387fc1... is not used.
- Results: count label keeps authored common position43,-18 instead of being moved by the icon's aspect ratio. GameOver/Clear! screenshots show acorn x25 aligned.
- Potion: removed Mode/포션 강화 subtree only; kept potion title. Floating time scales1 -> .38 over existing low arc, with halo/pulse/gauge intact. Final actual input success2/2 and +10s; final HUD discrepancy .015s after compensating snapshot elapsed time.

## Artwork method and prompt

Built-in imagegen edit, then native-size packing with sharp (no Python raster editing). Leg-motion edit prompt: preserve original turkey identity and head; exactly two poses, wide planted feet then compact bent/crossing feet under belly with subtle body lift; references2/3 specify motion only; sharp112px pixel art, transparent, no blur or ground. Wing edit prompt: remove the second cream-edged lobe below the one visible folded wing; replace with continuous body plumage. Generated upper-body variants were discarded. Original upper pixels were retained, only wing region and generated legs used. Full edit masters are in TurkeyWalkV5/ and the earlier workspace turkey-v4 folder.

## Verification

Verification/verification.json, final-potion-and-art.json, result-*-aligned.png; preservation-audit.json. Latest WalkFrames[1] resource7e564fb51be849999f19b3be3f26d720. Build/normal errors0.
