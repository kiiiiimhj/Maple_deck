from pathlib import Path
import sys,time,json
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
s=MakerSession();time.sleep(3)
try:
 logs=s.call('maker_logs',{'kind':'normal'}).get('logs',[]);errs=[r for r in logs if r.get('logType')=='Error'];print(json.dumps(errs[-4:],ensure_ascii=False))
finally:s.close()
