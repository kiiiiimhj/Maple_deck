from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,sys
AFTER='--after'in sys.argv
root=Path('outputs/pet-gear-pose-v9');source=Path('outputs/pet-gear-motion-v8')
n=json.loads(Path('outputs/pet-gear-all-v1/native-frames.json').read_text());meta={s['ruid']:s for s in n['sprites']}
maps=json.loads(((root if AFTER else source)/'overlay-map.json').read_text());assets={s['name']:s for s in json.loads(((root if AFTER else source)/'asset-specs.json').read_text())}
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',16)
def compose(pet,ruid,mask=7):
 m=meta[ruid];layers=maps[pet][ruid];im=Image.new('RGBA',(256,192));ox=128-round(m['px']*m['w']*2);oy=154-round((1-m['py'])*m['h']*2)
 if not(layers.get('coat',{}).get('replacesBody')and mask&2):
  base=Image.open(m['file']).convert('RGBA');im.alpha_composite(base.resize((m['w']*2,m['h']*2),Image.Resampling.NEAREST),(ox,oy))
 for slot,bit in [('coat',2),('neck',4),('hat',1)]:
  z=layers.get(slot)
  if z and mask&bit:
   tex=Image.open(assets[z['asset']]['file']).convert('RGBA');d=2/z['density'];tex=tex.resize((round(tex.width*d),round(tex.height*d)),Image.Resampling.NEAREST)
   im.alpha_composite(tex,(ox+round(z['x']*2),oy+round(z['y']*2)))
 return im
cases=[('5002617','stand'),('5002617','move'),('5002617','chat'),('oduck','move'),('5000498','move'),('5000498','eat'),('5000498','chat'),('5000498','dung'),('5000498','cry'),('5000498','love'),('5000498','sleep'),('oduck','stand1'),('oduck','chat'),('oduck','what'),('oduck','cry'),('oduck','love'),('oduck','sleep'),('landturtle','stand'),('landturtle','chat'),('landturtle','cry'),('landturtle','love'),('landturtle','sleep'),('5002617','cry'),('5002617','love')]
for pet,pose in cases:
 c=next(c for c in n['clips']if c['petId']==pet and c['pose']==pose);rows=(len(c['frames'])+3)//4;board=Image.new('RGB',(1200,rows*300),(60,53,46));draw=ImageDraw.Draw(board)
 for j,f in enumerate(c['frames']):
  im=compose(pet,f['ruid']).crop((60,45,208,165)).resize((296,240),Image.Resampling.NEAREST);x=j%4*300+2;y=j//4*300;board.paste(im,(x,y),im)
  draw.text((x,y+247),str(j)+' '+pose,font=font,fill='white')
  z=maps[pet][f['ruid']].get('neck');draw.text((x,y+272),'neck '+(str(z['w'])+'x'+str(z['h'])if z else'occluded'),font=font,fill='white')
 board.save(root/f'{"after"if AFTER else"before"}-{pet}-{pose}.png')
print('Generated pivot-aligned per-frame inspection sheets.')
