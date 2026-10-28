# Current version: V2 (2026-10-28)

V2/README.md, V2/layout.json and V2/registered.json are the current guide. The horizontal square cards, enlarged pixel turkey and long V2 draft arrows were rejected. Use three separately drawn text-free illustrations and the first three Pet House zigzag positions. Text is localized UI. Reuse connector 6643f10005754442948e6e60629b9359 at 210 x 204.05661; mirror only the second arrow. Arrows target visible next-illustration contours. Do not edit Pet House arrows; the user adjusts those themselves. Preserve all shop nodes outside Tutorial/Content and always reread fresh files before a narrow UIBuilder patch. Old snapshots and scripts below are historical, not restore sources.

---

# Acorn Exchange guide

The guide is live in ThanksgivingGroup/Overlay/Tutorial, entered from Overlay/Window/Help. All220 older entities remain unchanged. Use UIBuilder for changes; read fresh current files. Do not restore an entire old popup snapshot. Existing positions, sizes, stocks, wallet and purchase flow belong to the user and Claude.

Three steps: defeat the adventure turkey, collect dropped acorns, exchange items. All visible wording is localized real text in ThanksgivingUI.AcornGuideLabels (ko,zh-tw,en,ja,zh-cn,es); images contain no text. Use the current ThanksgivingMonsterLogic.IdleFrames[1] for turkey and its acorn icon. The info button is the same85x85 art as Pet House.

All three image+label cards and both arrows share one fitted Content canvas. Arrows are native82x48 art and never independently stretched; endpoints touch the visible next-card border. Cards and incoming arrows appear together, fade only, without scale animation. Re-verify on a screenshot because UILogic.LocalUIToWorldPosition probe offsets need the fitted parent scale applied explicitly. Current new-node positions and translated line breaks are in added-ui-nodes.json. On initialization, wait for UI nodes and bind only once. Stop Play before editing UI, refresh and allow the import to finish before starting Play.
