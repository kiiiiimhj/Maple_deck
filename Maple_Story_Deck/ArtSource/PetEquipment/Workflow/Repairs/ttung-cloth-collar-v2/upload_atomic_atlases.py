from pathlib import Path
import sys,json,hashlib,threading,time
from concurrent.futures import ThreadPoolExecutor
sys.path[:0]=[str(Path('work/pet-gear-contours-v7/python-libs').resolve()),str(Path('work').resolve())]
import requests
import remote_mcp as remote

out=Path('outputs/pet-variation-repair-v2')
manifest=out/'atomic-atlas-assets.json'
checkpoint=Path('work/pet-variation-repair-v2/atomic-atlas-private-checkpoint.json')
specs=json.loads((out/'atomic-atlas-specs.json').read_text(encoding='utf-8'))
results=json.loads(manifest.read_text(encoding='utf-8')) if manifest.exists() else {}
pending=json.loads(checkpoint.read_text(encoding='utf-8')) if checkpoint.exists() else {}
lock=threading.Lock();local=threading.local()
def session():
 if not hasattr(local,'session'):local.session=requests.Session()
 return local.session
def rpc(method,params=None,ident=1):
 payload={'jsonrpc':'2.0','method':method}
 if params is not None:payload['params']=params
 if ident is not None:payload['id']=ident
 for attempt in range(2):
  try:
   r=session().post(remote.cfg['url'],json=payload,headers=remote.headers,timeout=(10,25))
   r.raise_for_status()
   if r.headers.get('Mcp-Session-Id'):remote.headers['Mcp-Session-Id']=r.headers['Mcp-Session-Id']
   raw=r.text
   if not raw:return {}
   if raw.startswith(('event:','data:')):
    lines=[line[5:].strip() for line in raw.splitlines() if line.startswith('data:')]
    return json.loads(lines[-1]) if lines else {}
   return json.loads(raw)
  except (requests.exceptions.ConnectTimeout,requests.exceptions.SSLError):
   if attempt:raise RuntimeError('Remote connection handshake failed') from None
  except requests.exceptions.RequestException as error:
   raise RuntimeError('Remote request failed: '+type(error).__name__) from None
def unpack(response):
 if 'error' in response:raise RuntimeError('Remote RPC error')
 result=response['result']
 if result.get('isError'):raise RuntimeError('Remote tool rejected operation')
 return result.get('structuredContent') or json.loads(next(c['text'] for c in result['content'] if c.get('type')=='text'))
def find(obj,key):
 if isinstance(obj,dict):
  for k,v in obj.items():
   if k.lower()==key.lower():return v
   answer=find(v,key)
   if answer is not None:return answer
 elif isinstance(obj,list):
  for v in obj:
   answer=find(v,key)
   if answer is not None:return answer
def save_pending():checkpoint.write_text(json.dumps(pending,ensure_ascii=False,indent=2),encoding='utf-8')
def count():return sum(s['name'] in results for s in specs)
reusable={(v['sha256'],tuple(v['size'])):v for v in results.values()}
for s in specs:
 p=Path(s['file']);assert p.parent==(out/"atomic-atlases").resolve() and p.suffix=='.png'
 assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256']
 key=s['name']
 if key in results:assert results[key]['sha256']==s['sha256']
 elif (s['sha256'],tuple(s['size'])) in reusable:
  results[key]=dict(reusable[(s['sha256'],tuple(s['size']))],file=str(p.resolve()))
manifest.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print('Active textures already registered:',count(),'/',len(specs),flush=True)
rpc('initialize',{'protocolVersion':'2024-11-05','capabilities':{},'clientInfo':{'name':'pet-contour-registration','version':'7'}})
rpc('notifications/initialized',ident=None)
def upload(task):
 i,s=task;key=s['name'];p=Path(s['file'])
 args={'category':'sprite','subcategory':'item','name':'petatomic2_'+key.replace('-','_'),'description':'Atomic original-frame body and independent equipment combinations, Point filtering; 5 by 6 tiles of 128px.','contentLength':p.stat().st_size}
 state=pending.get(key,{})
 if state.get('ambiguous'):raise RuntimeError('Resource creation requires lookup before retry: '+key)
 if not state.get('ruid'):
  if not state.get('url'):
   url=find(unpack(rpc('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},100+i*3)),'presignedUrl')
   assert url
   with lock:state={'url':url};pending[key]=state;save_pending()
  if not state.get('uploaded'):
   try:
    r=session().put(state['url'],data=p.read_bytes(),headers={'Content-Type':'application/octet-stream'},timeout=(10,25));r.raise_for_status()
   except requests.exceptions.RequestException as error:raise RuntimeError('Texture upload failed: '+type(error).__name__) from None
   with lock:state['uploaded']=True;save_pending()
  args['fileUrl']=state['url']
  try:created=unpack(rpc('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},101+i*3))
  except Exception:
   with lock:state['ambiguous']=True;save_pending()
   raise
  ruid=find(created,'guid') or find(created,'ruid');assert ruid
  with lock:state['ruid']=ruid;save_pending()
 props={'pivot_x':'0.5','pivot_y':'0.5','border_left':'0','border_right':'0','border_top':'0','border_bottom':'0','filter_mode':'Point','wrap_mode':'Clamp'}
 response=unpack(rpc('tools/call',{'name':'asset_update_resource_storage_info','arguments':{'guid':state['ruid'],'properties':[{'key':k,'value':v} for k,v in props.items()]}},102+i*3))
 assert response.get('status',{}).get('code',0)==0
 with lock:
  results[key]={'ruid':state['ruid'],'file':str(p.resolve()),'sha256':s['sha256'],'size':s['size'],'properties':props}
  manifest.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
  del pending[key];save_pending()
  done=count()
  if done%10==0 or done==len(specs):print('Registered active textures',done,'/',len(specs),flush=True)
todo=[(i,s) for i,s in enumerate(specs) if s['name'] not in results]
with ThreadPoolExecutor(max_workers=4) as pool:
 for start in range(0,len(todo),4):
  futures=[pool.submit(upload,task) for task in todo[start:start+4]]
  for future in futures:future.result()
print('All active textures registered.',flush=True)
