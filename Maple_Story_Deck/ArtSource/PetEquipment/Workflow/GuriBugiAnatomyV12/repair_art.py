"""Repair exported source geometry without repainting native anatomy."""
from pathlib import Path
import json,copy,hashlib,math,sys
from PIL import Image,ImageDraw
import numpy as np
sys.path.insert(0,'work/pet-gear-contours-v7/python-libs')
import cv2
root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment')
out=Path('outputs/pet-guri-bugi-v12');out.mkdir(exist_ok=True,parents=True)
data=json.loads((root/'Maps/validated-native-equipment-inputs-v11.json').read_text())
native=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text())
fits=json.loads(Path('outputs/pet-gear-all-v1/pose-fitting.json').read_text())
parts=copy.deepcopy(data['parts']);changed={};proof=[]
def register(im,pet,base,design,d):
 sha=hashlib.sha256(im.tobytes()+str(im.size).encode()).hexdigest()[:16];name=pet+'_'+design+'_'+sha;path=out/(name+'.png');im.save(path)
 changed[name]={'name':name,'file':str(path.resolve()),'size':list(im.size),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
 d.update(asset=name,file=str(path.resolve()),sha256=changed[name]['sha256'])
move=next(c for c in native['clips']if c['petId']=='5002617'and c['pose']=='move')
for f in move['frames']:
 base=f['ruid'];b=data['bodies']['5002617'][base]
 for design in ['1','2']:
  d=parts['5002617'][base][design]['coat'];im=Image.open(root/d['file']).convert('RGBA');a=np.array(im);cut=round((30-d['y'])*2)
  # Native feet change stride on each of the four frames. The exported coat
  # accidentally contains a second, stationary paw and an opaque lower rim.
  # Keep garment material above the native paw row; the original frame supplies
  # every pixel of both feet, belly and tail below that row.
  count=int((a[cut:,:,3]>0).sum());a[cut:]=0;register(Image.fromarray(a),'5002617',base,design,d)
  proof.append({'pet':'5002617','base':base,'design':design,'removedBakedFootPixels':count,'nativePawsStartRow':30})
for base,designs in parts['landturtle'].items():
 b=data['bodies']['landturtle'][base];body=Image.open(root/b['file']).convert('RGBA').resize((b['w']*2,b['h']*2),Image.Resampling.NEAREST)
 for design in ['1','2']:
  d=designs[design].get('coat')
  if not d or not d.get('replacesBody'):continue
  im=Image.open(root/d['file']).convert('RGBA');canvas=Image.new('RGBA',im.size);canvas.alpha_composite(body,(round(-d['x']*2),round(-d['y']*2)))
  a=np.array(im);orig=np.array(canvas);r,g,bb,al=a.astype(int).transpose(2,0,1);yy,xx=np.indices(al.shape)
  # Restore original torso holes. The left edge of the painted shell is behind
  # the head and torso; only missing original pixels in front of that edge are
  # repaired. Existing shell pixels, native face, feet and effects stay exact.
  shell=((g>r*1.05)&(g>bb*1.04))if design=='1'else((bb>r*1.1)&(g>r*1.1))
  shell&=(al>0)&(g>30)
  n,labels,stats,centers=cv2.connectedComponentsWithStats(shell.astype(np.uint8),8)
  if n<=1:continue
  k=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]));xs=np.where(labels==k)[1]
  hb=fits.get(base,{}).get('headBounds')
  if hb is None:continue
  head_center=(hb[0]+hb[2])-d['x']*2
  facing_right=head_center>centers[k,0]
  edge=int(xs.max()if facing_right else xs.min())
  front=(xx>edge-2)if facing_right else(xx<edge+2)
  missing=(al==0)&(orig[:,:,3]>0)&front
  if not missing.any():continue
  a[missing]=orig[missing];register(Image.fromarray(a),'landturtle',base,design,d)
  proof.append({'pet':'landturtle','base':base,'design':design,'restoredTorsoPixels':int(missing.sum()),'shellFront':edge})
def comp(pet,base,code,before=False):
 l=data['layouts'][pet];b=data['bodies'][pet][base];body=Image.open(root/b['file']).convert('RGBA').resize((b['w']*2,b['h']*2),Image.Resampling.NEAREST)
 ox=-round(b['px']*b['w']*2)-l['left'];oy=-round((1-b['py'])*b['h']*2)-l['top'];im=Image.new('RGBA',(l['tileW'],l['tileH']));im.alpha_composite(body,(ox,oy))
 for slot,digit in [('coat',code//3%3),('neck',code//9),('hat',code%3)]:
  if not digit:continue
  d=(data['parts']if before else parts)[pet][base][str(digit)].get(slot)
  if not d:continue
  if d.get('replacesBody'):im=Image.new('RGBA',im.size)
  path=Path(d['file']);path=path if path.is_absolute()else root/path
  im.alpha_composite(Image.open(path).convert('RGBA'),(ox+round(d['x']*2),oy+round(d['y']*2)))
 return im
if __name__=='__main__':
 (out/'repaired-inputs.json').write_text(json.dumps({**data,'parts':parts},indent=2));(out/'part-specs.json').write_text(json.dumps(list(changed.values()),indent=2));(out/'anatomy-repair.json').write_text(json.dumps(proof,indent=2))
 for pet in ['5002617','landturtle']:
  bases=[f['ruid']for f in move['frames']]if pet=='5002617'else list(parts[pet])
  for start in range(0,len(bases),8):
   rows=bases[start:start+8];board=Image.new('RGB',(1000,220*len(rows)),(87,76,63));dr=ImageDraw.Draw(board)
   for i,base in enumerate(rows):
    for j,(code,before)in enumerate([(0,True),(3,True),(3,False),(6,False)]):
     im=comp(pet,base,code,before);im=im.crop(im.getbbox());im=im.resize((im.width*2,im.height*2),Image.Resampling.NEAREST);board.paste(im,(j*250,i*220+24),im)
    dr.text((4,i*220+3),str(start+i)+' '+base+' | native / old / repaired original / repaired variation',fill='white')
   board.save(out/(pet+'-repair-'+str(start)+'.png'))
 print('Repaired textures',len(changed),'source frames',len(proof),flush=True)
