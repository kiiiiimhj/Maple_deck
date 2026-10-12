import json,urllib.request,sys,hashlib
from pathlib import Path
sys.path.insert(0,str(Path('work').resolve()))
from remote_mcp import initialize,request
def unpack(response):
    if 'error' in response:raise RuntimeError('MCP request failed')
    result=response['result']
    if result.get('isError'):raise RuntimeError('Resource tool failed')
    return result.get('structuredContent') or json.loads(next(c['text'] for c in result['content'] if c.get('type')=='text'))
def find(obj,key):
    if isinstance(obj,dict):
        for k,v in obj.items():
            if k.lower()==key.lower():return v
            f=find(v,key)
            if f is not None:return f
    if isinstance(obj,list):
        for v in obj:
            f=find(v,key)
            if f is not None:return f
    return None
out=Path('outputs/pet-lobby-icon');manifest=out/'applied-assets.json'
if manifest.exists():print('Existing uploaded pet lobby artwork reused.');sys.exit(0)
spec=json.loads((out/'asset-spec.json').read_text(encoding='utf-8'));path=out/'pet-house-paw.png'
assert str(path.resolve())==spec['file'] and path.stat().st_size==1412112
assert hashlib.sha256(path.read_bytes()).hexdigest()==spec['sha256']=='bc40d62d66e0a507d39d60864ad817c09e9fedfeb0ddd7b09fd53ca83543762c'
proof=unpack(json.loads(Path('work/pet-lobby-icon/existing-account-resource.json').read_text(encoding='utf-8')))
assert len(proof['resultList'])==1 and proof['resultList'][0]['resultCode']==0
assert proof['resultList'][0]['request']['guid']=='5828fdca6b1d48198e257b2202833abb'
initialize()
args={'category':'sprite','subcategory':'object','name':'pet_lobby_house_paw_20261012','description':'Generated pet-house with paw emblem, matching existing gold and wood lobby icons.','contentLength':path.stat().st_size}
url=find(unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},3)),'presignedUrl')
if not url:raise RuntimeError('Upload URL missing')
with urllib.request.urlopen(urllib.request.Request(url,data=path.read_bytes(),method='PUT',headers={'Content-Type':'application/octet-stream'}),timeout=60) as r:
    assert 200<=r.status<300
args['fileUrl']=url
created=unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},4))
guid=find(created,'guid') or find(created,'ruid');assert guid,'RUID missing'
props={'pivot_x':'0.5','pivot_y':'0.5','border_left':'0','border_right':'0','border_top':'0','border_bottom':'0','filter_mode':'Bilinear','wrap_mode':'Clamp'}
updated=unpack(request('tools/call',{'name':'asset_update_resource_storage_info','arguments':{'guid':guid,'properties':[{'key':k,'value':v} for k,v in props.items()]}},5))
assert updated.get('status',{}).get('code',0)==0
manifest.write_text(json.dumps({'pet-house-paw':{'ruid':guid,'file':str(path.resolve()),'properties':props,'size':spec['size']}},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'ruid':guid,'uploaded':True}),flush=True)
