from pathlib import Path
from PIL import Image,ImageDraw
import json
out=Path('outputs/pet-variation-v1');root=Path('G:/Maple_Story_Deck/ArtSource/PetEquipment')
rows=json.loads((out/'manifest-original.json').read_text())['resources'];files={r['ruid']:root/r['file'] for r in rows}
maps=json.loads((out/'original-maps.json').read_text())['PetGearOverlays']
data=json.loads(Path('outputs/ttung-eye-repair-v2/base-frames.json').read_text());print('keys',list(data));print('frame sample',str(data.get('frames'))[:500])
for slot,r in maps['7b473e3228c74169a41db5193f95666a'].items():
 im=Image.open(files[r]);box=im.getbbox();im.crop(box).resize(((box[2]-box[0])*8,(box[3]-box[1])*8),Image.Resampling.NEAREST).save(out/('original-'+slot+'.png'))
(out/'gear-files.json').write_text(json.dumps({r:str(f)for r,f in files.items()if any(r in z.values()for z in maps.values())},indent=2),encoding='utf-8')
refs=[data['frames'][i]for i in [0,50,72]]
sheet=Image.new('RGBA',(128*3,128),(0,0,0,0))
for i,frame in enumerate(refs):
 im=Image.open(frame['file']).convert('RGBA')
 for slot in ['coat','neck','hat']:im.alpha_composite(Image.open(files[maps[frame['ruid']][slot]]).convert('RGBA'))
 sheet.alpha_composite(im,(i*128,0))
sheet.resize((1536,512),Image.Resampling.NEAREST).save(out/'original-three-poses.png')
