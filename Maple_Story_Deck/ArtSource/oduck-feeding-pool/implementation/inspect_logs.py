from pathlib import Path
import sys,json
sys.path.insert(0,str(Path('work').resolve()))
from maker_session import MakerSession
s=MakerSession()
try:
 logs=s.call('maker_logs',{'kind':'normal'})
 selected=[x for x in logs.get('logs',[])if 'PET-ODUCK'in x.get('message','')or x.get('logType')=='Error']
 print(json.dumps(selected[-25:],ensure_ascii=False,indent=2))
finally:s.close()
