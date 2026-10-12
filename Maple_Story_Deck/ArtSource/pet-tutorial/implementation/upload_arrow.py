from pathlib import Path
source=Path('work/pet-tutorial/upload.py').read_text(encoding='utf-8')
exec(compile(source[:source.index("out=Path('outputs/pet-tutorial')")],'resource-upload-helpers','exec'))
out=Path('outputs/pet-tutorial');spec=json.loads((out/'arrow-spec.json').read_text(encoding='utf-8'));p=out/'connector-arrow-v3.png'
assert str(p.resolve())==spec['file'] and p.stat().st_size==spec['bytes'] and hashlib.sha256(p.read_bytes()).hexdigest()==spec['sha256']
manifest=out/'applied-assets.json';results=json.loads(manifest.read_text(encoding='utf-8'))
if results.get('arrow',{}).get('file')!=str(p.resolve()):
 initialize()
 args={'category':'sprite','subcategory':'object','name':'pet_tutorial_connector_arrow_tapered_v3_20261013','description':'Tapered curved golden arrow matching customer shape reference. Mirrored for return connection.','contentLength':p.stat().st_size}
 url=find(unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},80)),'presignedUrl');assert url
 with urllib.request.urlopen(urllib.request.Request(url,data=p.read_bytes(),method='PUT',headers={'Content-Type':'application/octet-stream'}),timeout=60)as r:assert 200<=r.status<300
 args['fileUrl']=url;created=unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},81));guid=find(created,'guid')or find(created,'ruid');assert guid
 props={'pivot_x':'0.5','pivot_y':'0.5','border_left':'0','border_right':'0','border_top':'0','border_bottom':'0','filter_mode':'Bilinear','wrap_mode':'Clamp'}
 response=unpack(request('tools/call',{'name':'asset_update_resource_storage_info','arguments':{'guid':guid,'properties':[{'key':k,'value':v}for k,v in props.items()]}},82));assert response.get('status',{}).get('code',0)==0
 results['arrow']={'ruid':guid,'file':str(p.resolve()),'properties':props,'size':spec['size']};manifest.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results['arrow'],ensure_ascii=False),flush=True)
