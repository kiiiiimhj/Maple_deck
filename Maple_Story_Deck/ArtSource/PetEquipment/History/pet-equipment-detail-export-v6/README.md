# Pet equipment detail export and Fox idle necklace — v6

The original frame paintings remain in ../pet-equipment-painted-original-frames-v5. This repair changes their technical extraction/export, not the chosen equipment design or Ttungttang.

The v5 export discarded too much painted detail by reducing the textures to the original body's coarse pixel grid. V6 exports all 1,019 mapped equipment layers at twice that texture density while preserving their logical display size. UI renderers use the same logical rectangle; world renderers divide their scale by the texture density. Point sampling and the shared native frame clock remain in place.

Complete eight-connected outlines and nearby edge pixels are retained. Detached extraction islands are removed, including the food fragments that had entered some Bugi shell exports. Alpha comes from the original paintings. No generic garment deformation or source-body recoloring is introduced.

Fox/Ducky's old idle necklaces sometimes sampled cyan eye pixels and changed pendant shape and height between frames. V6 excludes the face from necklace extraction and uses one consistent source-painted pendant attached to the original jaw baseline throughout stand/stand1, with a separate consistent rest-pose pendant. Sleeping occlusion is preserved.

The two Bugi roll replacements and the curled Guri frame are also exported at the same density. Original account progress is preserved; the final open gear preview is Maker-only.

See verification for actual care/inventory/skill captures, Fox idle and rest motion captures, all frame/mask/flip checks and the logical/world size assertions. The before/after image uses actual Maker screenshots. Private account snapshots and configuration are excluded.
