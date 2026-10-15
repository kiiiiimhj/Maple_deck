from pathlib import Path
from PIL import Image,ImageDraw,ImageChops,ImageFilter
import json,hashlib,colorsys
out=Path('outputs/ttung-gear-pixel-v8');data=json.loads(Path('outputs/ttung-gear/base-frames.json').read_text(encoding='utf-8'))
specs=[];hashes={};maps={};preview={}
def poly(points):
    m=Image.new('L',(128,128));ImageDraw.Draw(m).polygon(points,fill=255);return m
def move(im,dx,dy):
    layer=Image.new('RGBA',(128,128));layer.alpha_composite(im,(dx,dy));return layer
def clean(im):
    p=im.load()
    for y in range(128):
        for x in range(128):
            r,g,b,a=p[x,y]
            p[x,y]=(r,g,b,255) if a else (0,0,0,0)
    return im

def register(slot,i,im):
    clean(im);h=hashlib.sha256(im.tobytes()).hexdigest()
    if h in hashes:return hashes[h]
    name=f'{slot}-v8-{i:02d}';p=out/(name+'.png');im.save(p);hashes[h]=name
    specs.append({'name':name,'file':str(p.resolve()),'size':[128,128],'sha256':hashlib.sha256(p.read_bytes()).hexdigest()});return name

poses=['standing','feeding','sleeping','sniffing','crouching','jumping']
settings={n:{'ref':i}for n,i in zip(poses,[1,16,51,65,69,73])}
# These boxes are fitted in the ORIGINAL 128-pixel coordinate system.
boxes={
 'standing':{'hat':(42,48,72,68),'coat':(31,86,90,115),'neck':(35,97,66,110)},
 'feeding':{'hat':(41,62,71,81),'coat':(51,78,91,113),'neck':(60,96,77,108)},
 'sleeping':{'hat':(42,69,72,87),'coat':(65,88,92,111),'neck':(77,95,84,98)},
 'sniffing':{'hat':(38,68,68,92),'coat':(57,71,94,112),'neck':(63,98,79,111)},
 'crouching':{'hat':(44,47,75,69),'coat':(32,92,94,115),'neck':(40,101,71,113)},
 'jumping':{'hat':(43,24,75,47),'coat':(28,79,90,104),'neck':(34,81,70,94)}
}
# Common palette is held identical across every frame and pose.
palette=[(42,32,34),(24,31,55),(37,50,79),(62,81,116),(255,246,221),(223,204,170),(234,175,65),(255,218,106),(89,49,30),(147,89,51),(184,126,82),(40,133,143),(100,184,184)]
masters={n:{}for n in poses}
for slot in ['hat','coat','neck']:
 sheet=Image.open(out/(slot+'-source.png')).convert('RGBA')
 for k,n in enumerate(poses):
  cell=sheet.crop((k%3*512,k//3*512,k%3*512+512,k//3*512+512))
  a=cell.getchannel('A').point(lambda v:255 if v>=230 else 0);cell.putalpha(a);box=a.getbbox();assert box is not None
  x,y,right,bottom=boxes[n][slot]
  part=cell.crop(box).resize((right-x,bottom-y),Image.Resampling.NEAREST)
  pp=part.load()
  for v in range(part.height):
   for u in range(part.width):
    r,g,b,a=pp[u,v]
    if a:
     color=min(palette,key=lambda c:sum((t-j)**2 for t,j in zip((r,g,b),c)))
     pp[u,v]=(*color,255)
    else:pp[u,v]=(0,0,0,0)
  layer=Image.new('RGBA',(128,128));layer.alpha_composite(part,(x,y))
  masters[n][slot]=layer;layer.save(out/(n+'-'+slot+'-master.png'))

refs={name:Image.open(data['frames'][cfg['ref']-1]['file']).convert('RGBA')for name,cfg in settings.items()}
def head_shift(current,reference,box):
    a=reference.crop(box);best=None
    for dy in range(-3,4):
        for dx in range(-3,4):
            b=current.crop((box[0]+dx,box[1]+dy,box[2]+dx,box[3]+dy));score=sum(abs(x-y)for x,y in zip(a.tobytes(),b.tobytes()));v=(score,abs(dx)+abs(dy),dx,dy)
            if best is None or v<best:best=v
    return best[2:]
nods={67:0,68:12,69:23,70:2,71:0,72:0,73:0,74:0,75:8,76:17}
for row in data['frames']:
    i=row['index'];base=Image.open(row['file']).convert('RGBA');name='standing';dx=dy=0
    if 16<=i<=28:name='feeding';dx,dy=head_shift(base,refs[name],(24,57,78,91))
    elif i in [51,52]:name='sleeping'
    elif i in [65,66]:name='sniffing';dx,dy=head_shift(base,refs[name],(24,59,76,90))
    elif i>=67:
        name='jumping'if 71<=i<=73 else'crouching';dy=nods[i]-(0 if name=='jumping'else 23)
    else:dx,dy=head_shift(base,refs[name],(26,43,75,71))
    rows={};combo=base.copy()
    for slot in ['coat','neck','hat']:
        if i>=67 and slot=='coat':
            intervals={67:(77,112),68:(89,113),69:(99,113),70:(79,112),71:(77,104),72:(77,104),73:(77,104),74:(80,105),75:(87,111),76:(96,113)}
            src=masters[name][slot];box=src.getbbox();top,bottom=intervals[i]
            part=src.crop(box).resize((box[2]-box[0],bottom-top),Image.Resampling.NEAREST)
            layer=Image.new('RGBA',(128,128));layer.alpha_composite(part,(box[0],top))
        elif i>=67 and slot=='neck':
            tops={67:81,68:93,69:101,70:83,71:81,72:81,73:81,74:83,75:89,76:98}
            src=masters[name][slot];box=src.getbbox();layer=Image.new('RGBA',(128,128));layer.alpha_composite(src.crop(box),(box[0],tops[i]))
        else:layer=move(masters[name][slot],dx if slot!='coat'else 0,dy if slot!='coat'else 0)
        # Original foreground anatomy, never AI dog pixels, owns ears, face, paws.
        if name=='standing':
            head=poly([(0,0),(128,0),(128,82),(82,82),(77,91),(68,97),(56,101),(38,103),(26,96),(0,96)])
            paws=poly([(0,108),(68,108),(73,128),(0,128)])
            ears=[[(27,67),(31,56),(38,48),(43,44),(47,49),(47,54),(42,60),(35,65)],[(65,55),(69,50),(74,50),(77,57),(78,65),(75,68),(69,64)]]
        elif name=='feeding':
            head=poly([(0,0),(128,0),(128,75),(85,75),(84,88),(72,101),(62,107),(0,110)])
            paws=poly([(0,109),(70,109),(73,128),(0,128)])
            ears=[[(26,79),(30,69),(37,61),(42,57),(46,62),(48,69),(42,75),(34,78)],[(61,66),(65,61),(71,60),(76,66),(78,75),(73,79),(66,73)]]
        elif name=='sleeping':
            head=poly([(0,0),(128,0),(128,83),(86,83),(81,98),(76,105),(65,111),(0,116)])
            paws=poly([(0,111),(73,111),(74,128),(0,128)])
            ears=[[(27,85),(31,75),(38,66),(43,61),(47,67),(48,72),(42,78),(34,83)],[(64,75),(68,69),(73,69),(78,77),(79,85),(74,89),(68,82)]]
        elif name=='sniffing':
            head=poly([(0,0),(128,0),(128,73),(85,73),(81,87),(74,100),(60,110),(0,114)])
            paws=poly([(0,111),(70,111),(72,128),(0,128)])
            ears=[[(25,83),(30,72),(35,65),(41,62),(46,67),(45,72),(41,76),(34,82)],[(52,84),(55,80),(59,78),(63,79),(67,85),(69,94),(65,97),(59,95),(55,90)]]
        else:
            head=poly([(0,0),(128,0),(128,53+nods[i]),(83,53+nods[i]),(82,71+nods[i]),(69,82+nods[i]),(56,88+nods[i]),(0,83+nods[i])])
            paws=Image.new('L',(128,128));boxes={67:[(11,72,41,91),(66,73,83,93)],68:[(16,85,38,104),(58,91,84,111)],69:[(26,97,47,119),(56,102,84,124)],70:[(12,73,40,94),(66,75,84,94)],71:[(19,75,37,91),(48,80,80,103)],72:[(19,75,37,92),(48,80,80,103)],73:[(19,75,37,92),(48,80,80,103)],74:[(19,78,38,96),(49,81,80,103)],75:[(22,86,40,106),(47,91,79,114)],76:[(26,94,47,116),(47,99,80,122)]}[i]
            for b in boxes:ImageDraw.Draw(paws).rectangle(b,fill=255)
            n=nods[i];ears=[[(23,42+n),(28,28+n),(37,18+n),(43,12+n),(47,18+n),(47,25+n),(40,32+n),(32,37+n)],[(66,32+n),(70,25+n),(78,21+n),(84,29+n),(85,40+n),(81,49+n),(74,45+n)]]
        if slot=='coat':
            hide=ImageChops.multiply(ImageChops.lighter(head,paws),base.getchannel('A'))
            a=ImageChops.subtract(layer.getchannel('A'),hide)
            a=ImageChops.multiply(a,base.getchannel('A').filter(ImageFilter.MaxFilter(3)));layer.putalpha(a)
        elif slot=='hat':
            occlusion=Image.new('L',(128,128))
            for points in ears:occlusion=ImageChops.lighter(occlusion,poly(points))
            occlusion=ImageChops.multiply(occlusion,base.getchannel('A'));layer.putalpha(ImageChops.subtract(layer.getchannel('A'),occlusion))
        elif slot=='neck'and name in ['feeding','sniffing']:
            guard=Image.new('L',(128,128),255);ImageDraw.Draw(guard).rectangle((0,99,59,127),fill=0);layer.putalpha(ImageChops.multiply(layer.getchannel('A'),guard))
        # All deep crouch garments remain between chin and pelvis; no gear below feet.
        if i>=67 and slot!='hat':
            keep=Image.new('L',(128,128));ImageDraw.Draw(keep).rectangle((0,0,127,114 if i not in[71,72,73]else 104),fill=255);layer.putalpha(ImageChops.multiply(layer.getchannel('A'),keep))
        # The original face pixels are protected for every care and skill pose.
        if name=='standing':eye=(28,72,69,93)
        elif name=='feeding':eye=(27,83,66,97)
        elif name=='sleeping':eye=(27,91,73,109)
        elif name=='sniffing':eye=(26,95,66,107)
        else:eye=(20,49+nods[i],77,71+nods[i])
        protect=Image.new('L',(128,128),255);ImageDraw.Draw(protect).rectangle((eye[0],eye[1],eye[2]-1,eye[3]-1),fill=0)
        layer.putalpha(ImageChops.multiply(layer.getchannel('A'),protect))
        if slot=='coat':
            # A loose neckline edge must not become a floating cloth fragment.
            a=layer.getchannel('A');remaining={(x,y)for y in range(128)for x in range(128)if a.getpixel((x,y))};components=[]
            while remaining:
                root=remaining.pop();todo=[root];group={root}
                while todo:
                    x,y=todo.pop()
                    for dx2 in [-1,0,1]:
                        for dy2 in [-1,0,1]:
                            q=(x+dx2,y+dy2)
                            if q in remaining:remaining.remove(q);group.add(q);todo.append(q)
                components.append(group)
            if components:
                main=max(components,key=len);keep=Image.new('L',(128,128))
                for point in main:keep.putpixel(point,255)
                layer.putalpha(keep)
        asset=register(slot,i,layer);rows[slot]=asset;combo=Image.alpha_composite(combo,layer)
    maps[row['ruid']]=rows;preview[i]=combo;combo.save(out/f'equipped-{i:02d}.png')

for page in range(4):
    sheet=Image.new('RGB',(1536,1136),(208,200,184));d=ImageDraw.Draw(sheet)
    for n,row in enumerate(data['frames'][page*24:(page+1)*24]):
        im=preview[row['index']].resize((256,256),Image.Resampling.NEAREST);x=n%6*256;y=n//6*284;sheet.paste(im,(x,y),im);d.text((x+4,y+258),str(row['index'])+' '+row['name'],fill=(20,20,20))
    sheet.save(out/f'contact-{page+1}.png')
for motion,ruids in data['motions'].items():
    frames=[preview[next(x['index']for x in data['frames']if x['ruid']==r)].resize((512,512),Image.Resampling.NEAREST)for r in ruids]
    frames[0].save(out/(motion+'.gif'),save_all=True,append_images=frames[1:],duration=80,loop=0,disposal=2)
(out/'overlay-map.json').write_text(json.dumps(maps,indent=2),encoding='utf-8');(out/'asset-specs.json').write_text(json.dumps(specs,indent=2),encoding='utf-8')
print('Six equipment-only pixel variants fitted to',len(maps),'original frames;',len(specs),'distinct layers.')
