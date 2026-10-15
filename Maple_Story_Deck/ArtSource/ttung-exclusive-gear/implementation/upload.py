from pathlib import Path
source=Path('work/pet-tutorial/upload.py').read_text(encoding='utf-8')
exec(compile(source[:source.index("out=Path('outputs/pet-tutorial')")],'resource-upload-helpers','exec'))
out=Path('outputs/ttung-gear');specs=json.loads((out/'asset-specs.json').read_text(encoding='utf-8'));manifest=out/'applied-assets.json'
results=json.loads(manifest.read_text(encoding='utf-8')) if manifest.exists() else {}
initialize()
for i,spec in enumerate(specs):
 key=spec['name'];p=Path(spec['file']);assert p.parent==out.resolve() and hashlib.sha256(p.read_bytes()).hexdigest()==spec['sha256']
 if key in results:assert results[key]['sha256']==spec['sha256'];continue
 args={'category':'sprite','subcategory':'item','name':'ttung_gear_'+key.replace('-','_')+'_20261014','description':'Ttungttang exclusive equipment overlay. Fixed 128 pixel canvas, binary alpha, constant palette and continuous outlines.','contentLength':p.stat().st_size}
 url=find(unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},100+i*3)),'presignedUrl');assert url
 with urllib.request.urlopen(urllib.request.Request(url,data=p.read_bytes(),method='PUT',headers={'Content-Type':'application/octet-stream'}),timeout=60)as r:assert 200<=r.status<300
 args['fileUrl']=url;created=unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},101+i*3));guid=find(created,'guid')or find(created,'ruid');assert guid
 props={'pivot_x':'0.5','pivot_y':'0.5','border_left':'0','border_right':'0','border_top':'0','border_bottom':'0','filter_mode':'Point','wrap_mode':'Clamp'}
 result=unpack(request('tools/call',{'name':'asset_update_resource_storage_info','arguments':{'guid':guid,'properties':[{'key':k,'value':v}for k,v in props.items()]}},102+i*3));assert result.get('status',{}).get('code',0)==0
 results[key]={'ruid':guid,'file':spec['file'],'sha256':spec['sha256'],'properties':props,'size':spec['size']};manifest.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(key+' registered '+str(i+1)+'/'+str(len(specs)),flush=True)
