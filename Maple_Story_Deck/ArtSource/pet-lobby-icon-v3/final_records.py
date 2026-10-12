from pathlib import Path
import json
stage=Path('work/pet-lobby-icon-v3');out=Path('outputs/pet-lobby-icon-v3')
p=out/'asset-spec.json';r=json.loads(p.read_text(encoding='utf-8'));r['content']='Generated coherent three-quarter pet-house icon with paw centered in the front doorway; no project code, user photos, private data, or text';p.write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
p=out/'saved-ui-verification.json';r=json.loads(p.read_text(encoding='utf-8'));r.pop('iconOnly',None);r['onlyPetButtonPresentationChanged']=True;p.write_text(json.dumps(r,indent=2),encoding='utf-8')
p=stage/'finalize.py';s=p.read_text(encoding='utf-8')
start=s.index("(out/'change-notes.md').write_text(");end=s.index('\nplan=',start)
notes='승인된 정면 펫 집 디자인의 형태·색감·재질을 유지하면서 집 전체를 살짝 측면으로 돌린 PNG를 적용했다. 입구와 발바닥은 같은 앞면에 놓여 원근과 중심을 유지한다. 원형 버튼은 156px 그대로 두고 아이콘을 104px에서 134px로 약 29% 확대해 거의 가득 차게 배치했다. 아이콘 중심은 (0,0), 펫 글씨는 (0,-93)으로 내려 9px 간격을 확보했다. 다른 UI 엔티티 2138개와 펫 하우스의 다른 메서드, 펫 능력치·스킬·저장은 유지했다. 메이커 로비에서 실제 모양과 버튼 열기·닫기를 확인했고 빌드/런타임 오류 0이다. 내장 image_gen으로 수정했으며 투명 PNG 원본을 그대로 사용했다.\n'
s=s[:start]+"(out/'change-notes.md').write_text("+repr(notes)+",encoding='utf-8')"+s[end:];p.write_text(s,encoding='utf-8')
exec(compile(s,'finalize-pet-side-view','exec'))
