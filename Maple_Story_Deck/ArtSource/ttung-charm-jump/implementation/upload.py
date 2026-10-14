from pathlib import Path
source=Path('work/pet-tutorial/upload.py').read_text(encoding='utf-8')
exec(compile(source[:source.index("out=Path('outputs/pet-tutorial')")],'resource-upload-helpers','exec'))
out=Path('outputs/ttung-charm-jump');specs=json.loads((out/'asset-specs.json').read_text(encoding='utf-8'));manifest=out/'applied-assets.json'
assert len(specs)==20
for spec in specs:
 p=Path(spec['file']);assert p.parent==out.resolve()and hashlib.sha256(p.read_bytes()).hexdigest()==spec['sha256']
results=json.loads(manifest.read_text(encoding='utf-8'))if manifest.exists()else{}
initialize()
for i,spec in enumerate(specs):
 name=spec['name']
 if name in results:continue
 duplicate=next((v for v in results.values()if v['sha256']==spec['sha256']),None)
 if duplicate is not None:
  results[name]={**duplicate,'file':spec['file'],'bottom':spec['bottom']};manifest.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(name+' identical texture reused',flush=True);continue
 p=Path(spec['file']);args={'category':'sprite','subcategory':'object','name':'ttung_charm_'+name.replace('-','_')+'_20261014','description':'Ttungttang charm skill jump, stable original pixel rig. Fixed palette/face, continuous ink, binary alpha, 128px canvas.','contentLength':p.stat().st_size}
 url=find(unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},100+i*3)),'presignedUrl');assert url
 with urllib.request.urlopen(urllib.request.Request(url,data=p.read_bytes(),method='PUT',headers={'Content-Type':'application/octet-stream'}),timeout=60)as r:assert 200<=r.status<300
 args['fileUrl']=url;created=unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},101+i*3));guid=find(created,'guid')or find(created,'ruid');assert guid
 props={'pivot_x':'0.5','pivot_y':'0.5','border_left':'0','border_right':'0','border_top':'0','border_bottom':'0','filter_mode':'Point','wrap_mode':'Clamp'}
 updated=unpack(request('tools/call',{'name':'asset_update_resource_storage_info','arguments':{'guid':guid,'properties':[{'key':k,'value':v}for k,v in props.items()]}},102+i*3));assert updated.get('status',{}).get('code',0)==0
 results[name]={'ruid':guid,'file':spec['file'],'sha256':spec['sha256'],'bottom':spec['bottom'],'size':[128,128],'properties':props};manifest.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(name+' registered',flush=True)
print('Twenty animation frames registered; eighteen unique textures.',flush=True)
