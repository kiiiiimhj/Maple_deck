from pathlib import Path
from PIL import Image
import json,math,hashlib,re,sys,shutil
sys.path.insert(0,str(Path('work/pet-equipment-native-v11').resolve()));from frame_art import out,parts,composite,layouts,part
stage=Path('work/pet-equipment-native-v11');source=(stage/'PetLogic.mlua.before').read_text(encoding='utf-8-sig');ns={};p=Path('work/pet-gear-pose-v9/stage.py').read_text();exec(p[:p.index('maps=prop(')],ns);ns['source']=source
definitions=ns['prop']('NativePetGearDefinitions');clips=json.loads((out/'before-tables.json').read_text())['NativePetGearClips'];files=json.loads((out/'current-resource-files.json').read_text());refs=json.loads((out/'stand-reference.json').read_text());specs={r['name']:r for r in json.loads((out/'part-specs.json').read_text())};atlasMap={};worldMap={};iconMap={};layoutMap={};indexMap={}
def register(im,name):
 key=name+'-'+hashlib.sha256(im.tobytes()+str(im.size).encode()).hexdigest()[:14];file=out/(key+'.png')
 if key not in specs:im.save(file);specs[key]={'name':key,'file':str(file.resolve()),'size':list(im.size),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
 return key
def values(v):return [x for _,x in sorted(v.items(),key=lambda kv:int(kv[0]))]if isinstance(v,dict)else v
skillFrames={
 '5002617':[re.search(r'property string PetRollRUID = "([^"]+)"',source)[1]],
 'landturtle':[re.search(r'property string PetTurtleShellRUID = "([^"]+)"',source)[1]],
 '5000498':values(clips[ns['prop']('FoxMotions')['angry']]),
 'oduck':values(clips[ns['prop']('OduckMotions')['dance']]),
}
# Native GUI animations use a single sheet for the entire chosen equipment
# combination. Neither image RUID nor texture dimensions change during a pose.
for pet,frames in parts.items():
 keys=list(frames);l=layouts[pet];columns=math.ceil(math.sqrt(len(keys)));rows=math.ceil(len(keys)/columns);layoutMap[pet]={**l,'columns':columns,'rows':rows};indexMap[pet]={base:i for i,base in enumerate(keys)};atlasMap[pet]={};worldMap[pet]={base:{}for base in skillFrames[pet]}
 for code in range(27):
  sheet=Image.new('RGBA',(columns*l['tileW'],rows*l['tileH']))
  for i,base in enumerate(keys):
   tile=composite(pet,base,code);sheet.paste(tile,(i%columns*l['tileW'],i//columns*l['tileH']))
   if base in worldMap[pet]:worldMap[pet][base][str(code)]=register(tile,pet+'-world-'+str(code))
  atlasMap[pet][str(code)]=register(sheet,pet+'-motion-sheet-'+str(code))
  if code%9==8:print('Packed',pet,code+1,'/ 27 equipment sheets',flush=True)
 # Existing icon silhouettes are retained for coats; hairpins are exported
 # whole from the complete stand frame. New pendants use the generated shape.
 iconMap[pet]={}
 for slot,partName in [('Cap','hat'),('Coat','coat'),('Necklace','neck')]:
  iconMap[pet][slot]={}
  for design in ['1','2']:
   if slot=='Necklace'and design=='2':
    shape={'5002617':'heart','5000498':'star','landturtle':'heart','oduck':'bell'}[pet];im=Image.open(out/('pendant-'+shape+'-12x14.png')).convert('RGBA')
    if pet=='5002617':
     # Inventory uses the whole pendant, before the chin occlusion mask.
     import numpy as np
     a=np.array(im);r,g,b,al=a.transpose(2,0,1).astype(float);m=(r>g*1.3)&(b>g*1.1)&(r>80);v=np.maximum.reduce([r,g,b]);a[m,:3]=np.stack([v*.23,v*.87,v*.92],axis=2)[m].astype(np.uint8);im=Image.fromarray(a)
    im=im.resize((im.width*2,im.height*2),Image.Resampling.NEAREST)
   elif slot=='Cap':im=part(frames[refs[pet]['base']][design]['hat']['asset'])
   else:
    baseIcon=Image.open(files[definitions[pet][slot]['icon']]).convert('RGBA')
    if design=='2':
     # Load only the palette function, without executing the artwork exporter.
     art=Path('work/pet-equipment-native-v11/build_art.py').read_text();start=art.index('def recolor(');end=art.index('# Reuse the original native-head',start);env={};exec('import numpy as np\nfrom PIL import Image\nimport sys\nsys.path.insert(0,"work/pet-gear-contours-v7/python-libs")\nimport cv2\n'+art[start:end],env);baseIcon=env['recolor'](baseIcon,pet,partName)
    im=baseIcon
   box=im.getbbox();im=im.crop(box)if box else im
   size=max(48,im.width+4,im.height+4);canvas=Image.new('RGBA',(size,size));canvas.alpha_composite(im,((size-im.width)//2,(size-im.height)//2));iconMap[pet][slot][design]=register(canvas,pet+'-icon-'+slot.lower()+'-'+design)
(out/'asset-specs.json').write_text(json.dumps(list(specs.values()),indent=2));(out/'atlas-input.json').write_text(json.dumps(atlasMap,indent=2));(out/'world-input.json').write_text(json.dumps(worldMap,indent=2));(out/'icon-input.json').write_text(json.dumps(iconMap,indent=2));(out/'motion-layouts.json').write_text(json.dumps(layoutMap,indent=2));(out/'frame-index.json').write_text(json.dumps(indexMap,indent=2));(out/'before-definitions.json').write_text(json.dumps(definitions,indent=2))
upload=Path('work/pet-variation-repair-v2/upload_resume.py').read_text().replace('pet-variation-repair-v2','pet-equipment-native-v11').replace("'petrepair2_'","'pn11_'").replace('Original pet frame equipment contour export with Point filtering.','Native pet original frames and independent equipment. Point filtering.')
(stage/'upload.py').write_text(upload,encoding='utf-8');print('Packed',len(specs),'resources:',len(parts),'pets,',sum(len(r)for r in parts.values()),'original animation frames, 27 independent gear choices each; only 12 skill frames need standalone world images.')
