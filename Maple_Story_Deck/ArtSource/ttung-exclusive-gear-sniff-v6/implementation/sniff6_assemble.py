from pathlib import Path
from PIL import Image,ImageChops,ImageDraw
import json,hashlib

out=Path('outputs/ttung-gear-sniff-v6');old=Path('outputs/ttung-gear-fit5')
data=json.loads(Path('outputs/ttung-gear/base-frames.json').read_text(encoding='utf-8'))
assets=json.loads((old/'applied-assets.json').read_text(encoding='utf-8'))
maps=json.loads((old/'overlay-map.json').read_text(encoding='utf-8'))
cap=Image.open(out/'fitted-candidate-5.png').convert('RGBA')
reference=Image.open(data['frames'][64]['file']).convert('RGBA')

def head_shift(current,base):
    box=(24,59,76,90);a=base.crop(box);best=None
    for dy in range(-3,4):
        for dx in range(-3,4):
            b=current.crop((box[0]+dx,box[1]+dy,box[2]+dx,box[3]+dy))
            score=sum(abs(x-y)for x,y in zip(a.tobytes(),b.tobytes()))
            v=(score,abs(dx)+abs(dy),dx,dy)
            if best is None or v<best:best=v
    return best[2:]

specs=[];hashes={};proof=[]
for i in [65,66]:
    row=data['frames'][i-1];base=Image.open(row['file']).convert('RGBA')
    dx,dy=head_shift(base,reference);layer=Image.new('RGBA',(128,128));layer.alpha_composite(cap,(dx,dy))
    for y in range(128):
        for x in range(128):
            if layer.getpixel((x,y))[3]==0:layer.putpixel((x,y),(0,0,0,0))
    h=hashlib.sha256(layer.tobytes()).hexdigest()
    if h in hashes:name=hashes[h]
    else:
        name=f'hat-sniff-v6-{i}';path=out/(name+'.png');layer.save(path);hashes[h]=name
        specs.append({'name':name,'file':str(path.resolve()),'size':[128,128],'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    maps[row['ruid']]['hat']=name
    # The original pet remains authoritative; AI guide body pixels are never imported.
    eye=(25,91,70,109)
    assert layer.getchannel('A').crop(eye).getbbox()is None
    assert set(layer.getchannel('A').get_flattened_data())<={0,255}
    assert layer.getbbox()[0]>0 and layer.getbbox()[1]>0
    combo=base.copy()
    for slot in ['coat','neck']:
        combo=Image.alpha_composite(combo,Image.open(assets[maps[row['ruid']][slot]]['file']).convert('RGBA'))
    combo=Image.alpha_composite(combo,layer);combo.save(out/f'equipped-{i}.png')
    for flip in [False,True]:
        im=combo.transpose(Image.Transpose.FLIP_LEFT_RIGHT)if flip else combo
        im.resize((768,768),Image.Resampling.NEAREST).save(out/f'preview-{i}-{int(flip)}.png')
    proof.append({'frame':i,'headShift':[dx,dy],'cap':name,'originalEyesPreserved':True,'originalSourceHash':hashlib.sha256(Path(row['file']).read_bytes()).hexdigest()})

out.joinpath('asset-specs.json').write_text(json.dumps(specs,indent=2),encoding='utf-8')
out.joinpath('applied-assets.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2),encoding='utf-8')
out.joinpath('overlay-map.json').write_text(json.dumps(maps,indent=2),encoding='utf-8')
out.joinpath('art-verification.json').write_text(json.dumps({'changedFrames':[65,66],'unchangedOtherFrames':74,'binaryAlpha':True,'canvas128':True,'originalBodyNeverReplaced':True,'proof':proof},indent=2),encoding='utf-8')
img=Image.new('RGB',(1536,768),(206,200,183));d=ImageDraw.Draw(img)
for n,path in enumerate([old/'equipped-65.png',out/'equipped-65.png']):
    piece=Image.open(path).convert('RGBA').transpose(Image.Transpose.FLIP_LEFT_RIGHT).resize((768,768),Image.Resampling.NEAREST)
    img.paste(piece,(n*768,0),piece);d.text((n*768+8,736),'Before'if n==0 else'New sniff cap',fill=(0,0,0))
img.save(out/'before-after.png')
print('Dedicated nose-down cap fitted to both original sniff frames:',proof)
