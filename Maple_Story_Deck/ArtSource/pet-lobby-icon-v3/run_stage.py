from pathlib import Path
import subprocess,sys
r=subprocess.run(['node','work/pet-lobby-icon-v3/stage.cjs'],capture_output=True,text=True,encoding='utf-8')
Path('work/pet-lobby-icon-v3/stage.log').write_text(r.stdout+'\n'+r.stderr,encoding='utf-8')
print(r.stdout.splitlines()[-1] if r.returncode==0 else r.stderr[-1200:])
sys.exit(r.returncode)
