from pathlib import Path
import sys,json
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
s=MakerSession()
try:
 logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message']for x in logs.get('logs',[])if any(k in x.get('message','')for k in ['PET-STATS run','U preview','PET-SKILL visual pet','PET-GEAR preloaded'])];print(json.dumps(hits[-16:],ensure_ascii=False,indent=2))
finally:s.close()
