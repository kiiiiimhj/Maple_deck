from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,shutil,colorsys,collections
import numpy as np
out=Path('outputs/pet-variation-v1');stage=Path('work/pet-variation-v1')
generated=Path('C:/Users/려진/.codex/generated_images/01a133e3-93f8-7671-b730-56db4bbbed66/exec-2b07f158-388e-4ab0-a27e-bc59f246799a.png')
shutil.copy2(generated,out/'stripe-design-reference.png')
root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment');rows=json.loads((out/'manifest-original.json').read_text())['resources']
files={r['ruid']:root/r['file']for r in rows};maps=json.loads((out/'original-maps.json').read_text())['PetGearOverlays']
frames=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text())['frames']
# Sample the generated material palette. No generated dog pixels are copied.
g=np.array(Image.open(generated).convert('RGBA'));r,gg,b,a=[g[:,:,i].astype(float)for i in range(4)]
fabric=(a>200)&(r>gg*1.7)&(r>b*1.16)&(b>gg*1.1)&(r>40)&(r<200)
colors=g[:,:,:3][fabric];assert len(colors)>1000
shade=np.mean(colors,axis=1);order=np.argsort(shade)
palette=[np.median(colors[order[max(0,int(len(order)*q)-100):int(len(order)*q)+100]],axis=0).astype(int)for q in [.08,.35,.65,.9]]
palette=[tuple(int(c)for c in x)for x in palette]
print('Generated cloth palette',palette)
bySlot={s:sorted({z[s]for z in maps.values()})for s in ['hat','coat','neck']}
specs=[];remap={};proof=[];allimages={}
for slot,ruids in bySlot.items():
 # Anchor the stripe phase to the largest material template; translated frames
 # receive the identical motif phase rather than restarting at their crop edge.
 templates=[(f,Image.open(files[maps[f['ruid']][slot]]).convert('RGBA'))for f in frames if f['index']in [1,16,51,65,69,73]]
 for old in ruids:
  im=Image.open(files[old]).convert('RGBA');src=np.array(im);dst=src.copy()
  def material(p):return p[3]>0 and p[2]>p[0]*1.12 and p[2]>p[1]*1.06 and p[2]>20
  srcpixels={(x,y):tuple(int(v)for v in src[y,x])for y,x in zip(*np.where(src[:,:,3]>0))}
  best=(0,0,0)
  if slot!='neck':
   # Exact-colour translation votes register only already fitted cloth pixels.
   for f,t in templates:
    tarr=np.array(t);byColor=collections.defaultdict(list)
    for y,x in zip(*np.where(tarr[:,:,3]>0)):
     v=tuple(int(c)for c in tarr[y,x])
     if material(v):byColor[v].append((x,y))
    votes=collections.Counter()
    for (x,y),v in srcpixels.items():
     if material(v):
      for tx,ty in byColor[v]:votes[(x-tx,y-ty)]+=1
    if votes:
     (dx,dy),n=votes.most_common(1)[0]
     if n>best[0]:best=(n,dx,dy)
  _,dx,dy=best;dx=int(dx);dy=int(dy)
  changed=0
  for (x,y),p in srcpixels.items():
   rr,gr,bb,aa=p
   if material(p) and slot!='neck':
    # Original luminance and shadow order are kept. The generated rose stripe
    # is clipped strictly to fabric, so seams and outlines never change alpha.
    lum=(rr+gr+bb)/3
    q=min(2,max(0,int((lum-20)/23)))
    rgb=palette[q]
    if (x-dx+(y-dy)//3)%6==0 and lum>26:rgb=palette[min(3,q+1)]
    dst[y,x,:3]=rgb;changed+=1
   elif slot=='neck'and gr>rr*1.14 and bb>rr*1.10 and max(rr,gr,bb)>65:
    # Keep the fitted gold chain; only the existing jewel changes to ruby.
    v=max(rr,gr,bb);dst[y,x,:3]=(min(255,v),int(v*.24),int(v*.37));changed+=1
  assert np.array_equal(src[:,:,3],dst[:,:,3])
  unchangedOutline=(np.max(src[:,:,:3],axis=2)<42)&(src[:,:,3]>0)
  assert np.array_equal(src[unchangedOutline],dst[unchangedOutline])
  result=Image.fromarray(dst);digest=hashlib.sha256(result.tobytes()).hexdigest()[:12]
  key=f'ttung-{slot}-v1-{digest}';target=out/(key+'.png');result.save(target)
  spec={'name':key,'file':str(target.resolve()),'size':list(result.size),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
  if key not in allimages:specs.append(spec);allimages[key]=result
  remap[old]=key;proof.append({'source':old,'asset':key,'slot':slot,'changedPixels':changed,'alphaExact':True,'outlineExact':True,'stripeAnchor':[dx,dy]})
# Icons use the identical material transfer on the existing inventory artwork.
for slot,old in [('hat','c01afff596084f60b66e2763b0bb92aa'),('coat','63976bbd67e84ac4a8fd31ae94d2bbe4'),('neck','ed42c7d372964cd0819b250f1564d459')]:
 im=Image.open(files[old]).convert('RGBA');src=np.array(im);dst=src.copy()
 for y,x in zip(*np.where(src[:,:,3]>0)):
  rr,gr,bb,aa=[int(v)for v in src[y,x]]
  if slot!='neck' and bb>rr*1.12 and bb>gr*1.06 and bb>20:
   q=min(2,max(0,int(((rr+gr+bb)/3-20)/23)));dst[y,x,:3]=palette[min(3,q+1)]if(x+y//3)%6==0 and max(rr,gr,bb)>45 else palette[q]
  elif slot=='neck'and gr>rr*1.14 and bb>rr*1.10 and max(rr,gr,bb)>65:
   v=max(rr,gr,bb);dst[y,x,:3]=(v,int(v*.24),int(v*.37))
 key=f'ttung-icon-{slot}-v1';target=out/(key+'.png');Image.fromarray(dst).save(target)
 specs.append({'name':key,'file':str(target.resolve()),'size':list(im.size),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()});remap[old]=key
new={base:{slot:remap[r]for slot,r in layers.items()}for base,layers in maps.items()}
(out/'asset-specs.json').write_text(json.dumps(specs,indent=2),encoding='utf-8')
(out/'variant-map.json').write_text(json.dumps(new,indent=2),encoding='utf-8')
(out/'art-verification.json').write_text(json.dumps({'palette':palette,'frames':len(new),'uniqueTextures':len(specs),'sourceMappings':proof},indent=2),encoding='utf-8')
# Nearest-neighbour contact sheets are QA exports, not a replacement dog image.
for kind in ['old','stripe']:
 sheet=Image.new('RGBA',(128*6,148*13),(53,42,39,255));draw=ImageDraw.Draw(sheet)
 for i,f in enumerate(frames):
  im=Image.open(f['file']).convert('RGBA')
  for slot in ['coat','neck','hat']:
   key=maps[f['ruid']][slot];layer=Image.open(files[key])if kind=='old'else allimages[remap[key]]
   im.alpha_composite(layer.convert('RGBA'))
  ox=i%6*128;oy=i//6*148;sheet.alpha_composite(im,(ox,oy));draw.text((ox+4,oy+128),str(f['index'])+' '+f['name'],fill='white')
 sheet.save(out/(kind+'-all-76-frames.png'))
sheet=Image.new('RGBA',(128*6,128),(0,0,0,0))
for i,f in enumerate([frames[j]for j in [0,15,50,64,68,72]]):
 im=Image.open(f['file']).convert('RGBA')
 for slot in ['coat','neck','hat']:im.alpha_composite(allimages[new[f['ruid']][slot]])
 sheet.alpha_composite(im,(i*128,0))
sheet.resize((1536,256),Image.Resampling.NEAREST).save(out/'stripe-six-poses.png')
print('Fitted',len(new),'frames and',len(specs),'unique textures; all alpha masks and dark outline pixels are exact.')
