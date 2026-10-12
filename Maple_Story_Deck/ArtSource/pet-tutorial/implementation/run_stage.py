from pathlib import Path
import subprocess,sys
python=sys.executable
for args in [[python,'-X','utf8','work/pet-tutorial/stage.py'],['node','work/pet-tutorial/build.cjs']]:
 r=subprocess.run(args,capture_output=True,text=True,encoding='utf-8');Path('work/pet-tutorial/'+('stage.log'if args[0]==python else'build.log')).write_text(r.stdout+'\n'+r.stderr,encoding='utf-8')
 if r.returncode:print(r.stderr[-2400:]or r.stdout[-2400:]);sys.exit(r.returncode)
 print(r.stdout.splitlines()[-1],flush=True)
