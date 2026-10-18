from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,shutil,numpy as np
out=Path('outputs/ducky-bowl-fit-v13');stage=Path('work/ducky-bowl-fit-v13');root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment')
generated=Path('C:/Users/려진/.codex/generated_images/01a133e3-93f8-7671-b730-56db4bbbed66/exec-3d5c6f3b-b66d-4eae-9b91-6c63abd60940.png')
shutil.copy2(generated,out/'bowl-generated-source.png')
im=Image.open(generated).convert('RGBA');a=np.array(im);a[:,:,3]=np.where(a[:,:,3]>=128,255,0);a[a[:,:,3]==0,:3]=0;im=Image.fromarray(a);im=im.crop(im.getbbox());dish=im.resize((32,10),Image.Resampling.NEAREST)
canvas=Image.new('RGBA',(128,128));canvas.alpha_composite(dish,(28,108));canvas.save(out/'food-bowl-v13.png')
spec={'name':'ducky_lowdish_v13','file':str((out/'food-bowl-v13.png').resolve()),'size':[128,128],'sha256':hashlib.sha256((out/'food-bowl-v13.png').read_bytes()).hexdigest()}
(out/'asset-specs.json').write_text(json.dumps([spec],indent=2))
upload=Path('work/pet-equipment-native-v11/upload.py').read_text().replace('pet-equipment-native-v11','ducky-bowl-fit-v13').replace("'pn11_'","'db13_'")
(stage/'upload.py').write_text(upload,encoding='utf-8')
d=json.loads((root/'Maps/validated-native-equipment-inputs-v11.json').read_text());n=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());clip=next(c for c in n['clips']if c['petId']=='5000498'and c['pose']=='eat');board=Image.new('RGB',(400*3,250*4),(110,91,69));dr=ImageDraw.Draw(board)
for i,f in enumerate(clip['frames'][:4]):
 b=d['bodies']['5000498'][f['ruid']];body=Image.open(root/b['file']).convert('RGBA').resize((b['w']*4,b['h']*4),Image.Resampling.NEAREST)
 for j,offset in enumerate([-56,-64,-72]):
  tile=Image.new('RGBA',(400,250));tile.alpha_composite(body,(200-round(b['px']*b['w']*4),200-b['h']*4));tile.alpha_composite(dish.resize((64,20),Image.Resampling.NEAREST),(200+offset-32,180));board.paste(tile,(j*400,i*250),tile);dr.text((j*400+4,i*250+4),'frame '+str(i)+' bowl center '+str(offset),fill='white')
board.save(out/'position-review.png');dish.resize((320,100),Image.Resampling.NEAREST).save(out/'dish-export-preview.png')
print('Prepared shallow 32x10 pixel dish and positional review.',flush=True)
