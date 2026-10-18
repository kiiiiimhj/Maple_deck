from pathlib import Path
p=Path('work/pet-gear-clean-v10/upload_resume.py').read_text(encoding='utf-8').replace('pet-gear-clean-v10','pet-variation-v1').replace("'petclean10_'","'petstripe1_'").replace("key[:key.index('-v10-')].replace('-','_')+'_'+key[-12:]","key.replace('-','_')")
Path('work/pet-variation-v1/upload_resume.py').write_text(p,encoding='utf-8')
