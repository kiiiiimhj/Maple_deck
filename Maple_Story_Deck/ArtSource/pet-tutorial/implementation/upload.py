from pathlib import Path
import sys,json,hashlib,urllib.request
sys.path.insert(0,str(Path('work').resolve()))
from remote_mcp import initialize,request
def unpack(response):
    assert 'error' not in response
    result=response['result'];assert not result.get('isError')
    return result.get('structuredContent') or json.loads(next(c['text'] for c in result['content'] if c.get('type')=='text'))
def find(obj,key):
    if isinstance(obj,dict):
        for k,v in obj.items():
            if k.lower()==key.lower():return v
            found=find(v,key)
            if found is not None:return found
    elif isinstance(obj,list):
        for v in obj:
            found=find(v,key)
            if found is not None:return found
    return None
out=Path('outputs/pet-tutorial');manifest=out/'applied-assets.json'
specs=json.loads((out/'asset-specs.json').read_text(encoding='utf-8'));assert [s['name']for s in specs]==['care','rewards','stones','adventure']
allowed={'care':('cc7f78f4fa510e92f1e0552965e9ee69ea2db613724d73a41a9240cd5016221c',1245052),'rewards':('0f854d9ea27324210764669a7fbb88f68ae2c9d80ed9e0d37c092b6febbc6429',1130757),'stones':('918508f137379877f789337dd679d04379be510140231460e39e50bbb6b92dfa',1142236),'adventure':('27402a889bf71e0a8e2103c92f19090994211b876085642c8624653cb1a5333b',2080456)}
for spec in specs:
    p=out/(spec['name']+'.png');h,size=allowed[spec['name']];assert str(p.resolve())==spec['file'] and p.stat().st_size==size and hashlib.sha256(p.read_bytes()).hexdigest()==h
proof=unpack(json.loads(Path('work/pet-tutorial/existing-account-resource.json').read_text(encoding='utf-8')));assert len(proof['resultList'])==1 and proof['resultList'][0]['resultCode']==0
assert proof['resultList'][0]['request']['guid']=='5a92fc6b08a74049b46186bab0b049db'
results=json.loads(manifest.read_text(encoding='utf-8'))if manifest.exists()else{}
initialize()
for i,spec in enumerate(specs):
    key=spec['name']
    if key in results:print(key+' already registered.',flush=True);continue
    p=out/(key+'.png')
    args={'category':'sprite','subcategory':'object','name':'pet_tutorial_'+key+'_20261012','description':'Pet-house four-step illustrated tutorial: '+key+'. Text is localized separately.','contentLength':p.stat().st_size}
    url=find(unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},10+i*3)),'presignedUrl');assert url
    with urllib.request.urlopen(urllib.request.Request(url,data=p.read_bytes(),method='PUT',headers={'Content-Type':'application/octet-stream'}),timeout=60) as r:assert 200<=r.status<300
    args['fileUrl']=url;created=unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},11+i*3));guid=find(created,'guid')or find(created,'ruid');assert guid
    props={'pivot_x':'0.5','pivot_y':'0.5','border_left':'0','border_right':'0','border_top':'0','border_bottom':'0','filter_mode':'Bilinear','wrap_mode':'Clamp'}
    response=unpack(request('tools/call',{'name':'asset_update_resource_storage_info','arguments':{'guid':guid,'properties':[{'key':k,'value':v}for k,v in props.items()]}},12+i*3));assert response.get('status',{}).get('code',0)==0
    results[key]={'ruid':guid,'file':str(p.resolve()),'properties':props,'size':[spec['width'],spec['height']]};manifest.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'name':key,'ruid':guid,'registered':True}),flush=True)
