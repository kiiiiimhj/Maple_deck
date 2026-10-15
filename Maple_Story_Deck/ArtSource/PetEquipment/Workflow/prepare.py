from pathlib import Path
import shutil
for name in ['pack.py','upload_resume.py','runtime_common.py','apply.py']:
 p=Path('work/pet-gear-pose-v9',name).read_text().replace('pet-gear-pose-v9','pet-gear-clean-v10').replace('petpose9_','petclean10_').replace('-v9-','-v10-').replace('POSE9','CLEAN10').replace('pose9','clean10')
 Path('work/pet-gear-clean-v10',name).write_text(p,encoding='utf-8')
shutil.copy2('outputs/pet-gear-pose-v9/applied-assets.json','outputs/pet-gear-clean-v10/applied-assets.json')
