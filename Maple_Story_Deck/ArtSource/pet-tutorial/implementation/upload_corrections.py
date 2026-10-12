from pathlib import Path
source=Path('work/pet-tutorial/upload.py').read_text(encoding='utf-8')
exec(compile(source[:source.index("out=Path('outputs/pet-tutorial')")],'resource-upload-helpers','exec'))
out=Path('outputs/pet-tutorial');manifest=out/'applied-assets.json'
specs=json.loads((out/'correction-specs.json').read_text(encoding='utf-8'));assert [s['name']for s in specs]==['rewards','stones']
allowed={'rewards':('f15204664f22b865b50fdf595156d974560d84a78060bfa76ad9455102383d4d',854053),'stones':('9be62c3ba1349393f54b060894565edc7e654bacf63cad7883ebee480ba9a10a',1962351)}
for spec in specs:
    p=out/(spec['name']+'-v2.png');h,size=allowed[spec['name']];assert str(p.resolve())==spec['file'] and p.stat().st_size==size and hashlib.sha256(p.read_bytes()).hexdigest()==h
proof=unpack(json.loads(Path('work/pet-tutorial/existing-account-resource.json').read_text(encoding='utf-8')));assert len(proof['resultList'])==1 and proof['resultList'][0]['resultCode']==0 and proof['resultList'][0]['request']['guid']=='5a92fc6b08a74049b46186bab0b049db'
results=json.loads(manifest.read_text(encoding='utf-8'));initialize()
for i,spec in enumerate(specs):
    key=spec['name'];p=out/(key+'-v2.png')
    if results.get(key,{}).get('file')==str(p.resolve()):continue
    args={'category':'sprite','subcategory':'object','name':'pet_tutorial_'+key+'_corrected_20261013','description':'Corrected pet tutorial artwork: native scroll inserted separately; gameplay with growth gem and no internal arrow.','contentLength':p.stat().st_size}
    url=find(unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},30+i*3)),'presignedUrl');assert url
    with urllib.request.urlopen(urllib.request.Request(url,data=p.read_bytes(),method='PUT',headers={'Content-Type':'application/octet-stream'}),timeout=60)as r:assert 200<=r.status<300
    args['fileUrl']=url;created=unpack(request('tools/call',{'name':'asset_create_account_resource_storage_item','arguments':args},31+i*3));guid=find(created,'guid')or find(created,'ruid');assert guid
    props={'pivot_x':'0.5','pivot_y':'0.5','border_left':'0','border_right':'0','border_top':'0','border_bottom':'0','filter_mode':'Bilinear','wrap_mode':'Clamp'}
    response=unpack(request('tools/call',{'name':'asset_update_resource_storage_info','arguments':{'guid':guid,'properties':[{'key':k,'value':v}for k,v in props.items()]}},32+i*3));assert response.get('status',{}).get('code',0)==0
    results[key]={'ruid':guid,'file':str(p.resolve()),'properties':props,'size':[spec['width'],spec['height']]};manifest.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'name':key,'ruid':guid,'corrected':True}),flush=True)
