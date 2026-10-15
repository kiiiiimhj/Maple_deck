from pathlib import Path
import json, hashlib, runpy
from PIL import Image, ImageDraw, ImageChops

out = Path('outputs/ttung-gear-fit5')
old = Path('outputs/ttung-gear-fit3')
out.mkdir(exist_ok=True)

def polygon(points):
    m = Image.new('L', (128, 128))
    ImageDraw.Draw(m).polygon(points, fill=255)
    return m

def components(im, minimum=16):
    a = im.getchannel('A')
    todo = set((x, y) for y in range(128) for x in range(128) if a.getpixel((x, y)))
    keep = Image.new('L', (128, 128))
    groups = []
    while todo:
        start = todo.pop()
        group = {start}
        stack = [start]
        while stack:
            x, y = stack.pop()
            for point in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if point in todo:
                    todo.remove(point)
                    group.add(point)
                    stack.append(point)
        groups.append(group)
    # The cap/pompom is one connected object. Detached regions are puppy pixels,
    # even when an eye patch contains more than a few dozen opaque pixels.
    for point in max(groups, key=len): keep.putpixel(point, 255)
    im.putalpha(keep)
    return im

# The old extraction included the generated puppy's ears and detached eye pixels.
# These masks select only the existing cap artwork, with openings for the original ears.
ear_holes = {
    1: [[(26,70),(29,57),(37,47),(43,43),(46,47),(45,52),(41,57),(35,63)],
        [(70,50),(78,51),(81,57),(82,70),(77,72),(71,67),(68,61)]],
    2: [[(25,81),(28,69),(37,58),(42,57),(44,61),(42,65),(38,69),(31,76)],
        [(70,61),(77,61),(82,69),(83,80),(77,82),(71,77),(68,70)]],
    3: [[(26,87),(30,74),(37,64),(43,61),(46,65),(45,69),(41,74),(35,80)],
        [(69,68),(77,70),(82,77),(83,87),(78,89),(70,84),(67,77)]],
    4: [[(23,43),(27,28),(36,16),(42,12),(46,17),(46,23),(42,29),(34,36)],
        [(71,24),(79,24),(84,33),(86,47),(78,49),(73,44),(69,35)]]
}
masters = {}
for profile in range(1,5):
    masters[profile] = {}
    for slot in ['hat', 'neck', 'coat']:
        layer = Image.open(old / f'{slot}-master-{profile}.png').convert('RGBA')
        if slot == 'hat':
            layer = components(layer, 40)
            holes = Image.new('L', (128,128))
            for points in ear_holes[profile]:
                holes = ImageChops.lighter(holes, polygon(points))
            layer.putalpha(ImageChops.subtract(layer.getchannel('A'), holes))
            layer = components(layer)
        if slot == 'neck' and profile == 3:
            # Only the existing brown strap behind the sleeping cheek remains visible.
            # Exclude the pendant, gem, buckle, and isolated generated fur pixels.
            strap = polygon([(83,98),(88,96),(89,99),(85,103),(81,106),(78,105),(82,101)])
            layer.putalpha(ImageChops.multiply(layer.getchannel('A'), strap))
        for y in range(128):
            for x in range(128):
                if layer.getpixel((x,y))[3] == 0:
                    layer.putpixel((x,y),(0,0,0,0))
        masters[profile][slot] = layer
        layer.save(out / f'{slot}-master-{profile}.png')

# Reuse the established per-frame fitting and animation clock. Only the layer
# extraction changes; the original body sprite files remain byte-for-byte intact.
source = Path('work/ttung-gear/fit3_assemble.py').read_text(encoding='utf-8')
source = source.replace("out=Path('outputs/ttung-gear-fit3')", "out=Path('outputs/ttung-gear-fit5')")
source = source.replace("name=name+'-pom-full'", "name=name+'-left-edge'")
start = source.index('capBoxes=')
end = source.index('def head_shift(')
source = source[:start] + '''layers={}
for key in range(1,5):
 layers[key]={slot:Image.open(out/(slot+'-master-'+str(key)+'.png')).convert('RGBA')for slot in ['hat','coat','neck']}
''' + source[end:]
# Seed with the already uploaded artwork so unaffected coat/neck layers keep their RUIDs.
(out/'applied-assets.json').write_text(Path('outputs/ttung-gear-fit4/applied-assets.json').read_text(encoding='utf-8'),encoding='utf-8')
exec(compile(source,'clean-equipment-assembly','exec'))
