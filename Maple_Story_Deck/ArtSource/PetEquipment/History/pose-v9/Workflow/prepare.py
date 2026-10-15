from pathlib import Path
p=Path('work/pet-gear-motion-v8/review_frames.py').read_text()
p=p.replace("root=Path('outputs/pet-gear-motion-v8');source=Path('outputs/pet-gear-contours-v7')","root=Path('outputs/pet-gear-pose-v9');source=Path('outputs/pet-gear-motion-v8')")
p=p.replace('cases=[',"cases=[('5002617','stand'),('5002617','move'),('5002617','chat'),('oduck','move'),")
Path('work/pet-gear-pose-v9/review_frames.py').write_text(p,encoding='utf-8')
import shutil
for name in ['pack.py','upload_resume.py','runtime_common.py','apply.py']:
 p=Path('work/pet-gear-motion-v8',name).read_text().replace('pet-gear-motion-v8','pet-gear-pose-v9').replace('petmotion8_','petpose9_').replace('-v8-','-v9-').replace('MOTION8','POSE9').replace('motion8','pose9')
 Path('work/pet-gear-pose-v9',name).write_text(p,encoding='utf-8')
shutil.copy2('outputs/pet-gear-motion-v8/applied-assets.json','outputs/pet-gear-pose-v9/applied-assets.json')
