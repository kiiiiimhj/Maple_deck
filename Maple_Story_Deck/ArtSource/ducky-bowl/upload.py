import json,urllib.request,sys,hashlib
from pathlib import Path
sys.path.insert(0,str(Path('work').resolve()))
from remote_mcp import initialize,request
def unpack(response):
 if 'error' in response:raise RuntimeError('MCP request failed')
 result=response['result']
 if result.get('isError'):raise RuntimeError('Resource tool failed')
 if result.get('structuredContent'):return result['structuredContent']
 return json.loads(next(c['text'] for c in result['content'] if c.get('type')=='text'))
def find(obj,key):
 if isinstance(obj,dict):
  for k,v in obj.items():
   if k.lower()==key.lower():return v
   found=find(v,key)
   if found is not None:return found
 if isinstance(obj,list):
  for v in obj:
   found=find(v,key)
   if found is not None:return found
 return None
initialize()
root=Path('outputs/ducky-bowl');manifest=root/'applied-assets.json'
results=json.loads(manifest.read_text(encoding='utf-8')) if manifest.exists() else {}
specs=json.loads((root/'asset-specs.json').read_text(encoding='utf-8'))
assert len(specs)==1 and specs[0]['name']=='food-bowl'
safe_file=Path(specs[0]['file'])
assert safe_file.stat().st_size==682
assert hashlib.sha256(safe_file.read_bytes()).hexdigest()=='8cdd726be88eb1fd41a7b521a9408add0ecad74c814b9428ea884981a4c81fa7'
for spec in specs:
 name=spec['name']
 if name in results:
  print(json.dumps({'name':name,'reused':True}),flush=True);continue
 path=Path(spec['file'])
 args={'category':'sprite','subcategory':'object','name':'ducky_feeding_'+name.replace('-','_')+'_20261012','description':'Reused fixed pixel pet food bowl for Ducky eating.','contentLength':path.stat().st_size}
 url=find(unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},3)),'presignedUrl')
 if not url:raise RuntimeError('Upload URL missing')
 with urllib.request.urlopen(urllib.request.Request(url,data=path.read_bytes(),method='PUT',headers={'Content-Type':'application/octet-stream'}),timeout=60) as r:
  if not 200<=r.status<300:raise RuntimeError('Upload failed')
 args['fileUrl']=url
 created=unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},4))
 guid=find(created,'guid') or find(created,'ruid')
 if not guid:raise RuntimeError('RUID missing')
 props={'pivot_x':'0.5','pivot_y':'0.5','border_left':str(spec['borders']['left']),'border_right':str(spec['borders']['right']),'border_top':str(spec['borders']['top']),'border_bottom':str(spec['borders']['bottom']),'filter_mode':spec.get('filter','Bilinear'),'wrap_mode':'Clamp'}
 updated=unpack(request('tools/call',{'name':'asset_update_resource_storage_info','arguments':{'guid':guid,'properties':[{'key':k,'value':v} for k,v in props.items()]}},5))
 if updated.get('status',{}).get('code',0)!=0:raise RuntimeError('Metadata update failed')
 results[name]={'ruid':guid,'file':str(path.resolve()),'properties':props,'size':[spec['width'],spec['height']]}
 manifest.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'name':name,'ruid':guid,'uploaded':True}),flush=True)
