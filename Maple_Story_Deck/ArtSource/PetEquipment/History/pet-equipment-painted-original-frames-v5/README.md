# Pet equipment painted on original animation frames — v5

Four native pets: Guri (109 frames), Ducky fox (98), Bugi (82), Oduck (81). Ttungttang was left unchanged.

Each original source animation frame was supplied to the image generator in its original atlas cell and painted in place. Clean clothes and accessories were painted separately so removing a necklace cannot leave a pendant on the coat. The 42 atlas paintings and 2 special roll repair paintings, source atlases, exact prompts and source-frame registration records are retained here.

Native export isolates the pixels painted for each pose. It uses rigid alignment to the original head and preserves the original native body sprite. It does not fit a generic garment shape to a pose or recolor the original body using a material template. Identical original pixel geometry can share the same painted layer without rescaling. Headpieces retain their transparent margin and complete outlines. Sleeping/fully retracted poses hide jewelry that the original body occludes.

The two blurred Bugi roll frames use individually painted full-body replacements when the coat is equipped, retaining the original cream head blur. This prevents the original brown ring showing through the new green shell blur. Other frames retain the original body and independently removable head/clothes/neck layers.

Original native frame timing and pivots drive both body and equipment together. Static sprites are preloaded and prebound, Point filtering is used, and UI positions/scales use the integer native pixel grid.

Actual Maker validation: 16 care actions, 4 injection actions, 4 inventory portraits, 24 public slot toggles, 5,984 frame/mask/direction cases, 4 actual U-key skills, and 20 continuous motion captures. See the verification JSON files for the recorded outcomes and actual screenshots. The local layer-composition check covers all 2,960 frame/equipment combinations.

Before/apply source copies and hashes are retained. Private account snapshots, account data and configuration credentials are excluded.
