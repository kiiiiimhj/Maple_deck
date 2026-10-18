from pathlib import Path
from PIL import Image
import json,hashlib,shutil
root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment');out=Path('outputs/pet-variation-repair-v2');current=json.loads((out/'applied-overlay-map.json').read_text());registry=json.loads((root/'Maps/equipment-resources.json').read_text())['resources'];files={r['ruid']:root/r['file']for r in registry};dest=root/'Sources/Validated/ttungttang';dest.mkdir(parents=True,exist_ok=True);rows=[]
for frame,layers in current['original'].items():
 for slot,ruid in layers.items():
  src=files[ruid];target=dest/slot/(ruid+'.png');target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,target);im=Image.open(target).convert('RGBA')
  rows.append({'frame':frame,'slot':slot,'ruid':ruid,'file':target.relative_to(root).as_posix(),'size':list(im.size),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'alphaSha256':hashlib.sha256(im.getchannel('A').tobytes()).hexdigest()})
bodies=[]
for row in json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text())['frames']:
 target=dest/'body'/(row['ruid']+'.png');target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(row['file'],target);bodies.append({'frame':row['ruid'],'file':target.relative_to(root).as_posix(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(root/'Maps/validated-ttung-equipment-inputs.json').write_text(json.dumps({'schema':2,'repair':'cloth-collar-v2','source':'Actual applied PetLogic mappings, with 125 direct screenshot comparisons and live playback.','resources':rows,'originalBodyFrames':bodies},ensure_ascii=False,indent=2),encoding='utf-8')
guide='''# Pet equipment artwork inputs

For new Ttungttang colour/pattern variants, use `Maps/validated-ttung-equipment-inputs.json` and `Sources/Validated/ttungttang`. These are the current corrected frame masks. `Workflow/AppliedSource/PetLogic.mlua` is the current game mapping.

The old `outputs/pet-variation-v1/original-maps.json` and old colour-extraction exporters retain the defective masks. They are historical inputs, not a basis for another variation. Do not restore them over the current maps.

For a colour/pattern-only variant, preserve each validated mask, frame canvas, anchors and dark contour pixels. Never infer clothing visibility from broad rectangles or dilated fur colours: that erased valid fabric and copied adjacent paw lines. Preserve the original character's face, ears, paws and all source animation timings.

Fit necklace placement against the original naked frame. The chin differs from the generated clothing guide. The lowered head naturally hides the pendant in sniffing; sleeping shows only a small strap. Do not force the pendant onto cheek, ear, bowl or paw to keep it visible.

Check both the painting itself and its actual applied rendering. A correct RUID or an unchanged alpha mask proves nothing if the reference mask was already wrong. Use actual frozen frames and normal playback for care, discovery and the first skill, with independent slot combinations. Interpret Maker screenshots using their actual capture-to-render scale.

The custom UI now displays body and equipment together in a single selected tile from `Maps/ttung-atomic-ui-frames-v2.json`. The 5 by 6 atlas has 128px tiles and 27 independent equipment combinations. Slot selection and bonuses remain independent; only rendering is combined. Keep original body PNGs and each separate equipment mask as editable sources. For another design, regenerate every combination and update the atlas layout/code radix together. Never rescale source pixels while packing.

Do not restore separate UI body/hat/neck/coat visibility switching. In actual live playback, those renderers displayed neighbouring poses on different refreshes even after full-size warming; frozen screenshots and alpha/RUID metadata did not catch it. A single atomic frame fixes that failure structurally. The rect mask has zero softness, and horizontal flipping must also mirror the selected atlas column. Do not use unsupported SpriteGUIRenderer sorting setters.
'''
(root/'AGENTS.md').write_text(guide,encoding='utf-8')
workflow=root/'Workflow/Variants/rose-stripe-v1';readme=workflow/'README.md';old=readme.read_text(encoding='utf-8')if readme.exists()else''
if 'validated-ttung-equipment-inputs'not in old:readme.write_text('Current corrected inputs: `Maps/validated-ttung-equipment-inputs.json`. The initial v1 extraction scripts in this directory are historical; use the validated source masks and the current AppliedSource mappings for the next design. See `ArtSource/PetEquipment/AGENTS.md`.\n\n'+old,encoding='utf-8')
print('Saved',len(rows),'corrected, portable per-frame source masks as the basis for future variations.')
