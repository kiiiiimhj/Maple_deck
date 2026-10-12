from pathlib import Path
root=Path('work/pet-lobby-icon-v3')
p=root/'verify.py';s=p.read_text(encoding='utf-8').replace("r['width']==r['height']==104 and r['x']==0 and r['y']==19","r['width']==r['height']==134 and r['x']==0 and r['y']==0");p.write_text(s,encoding='utf-8')
p=root/'finalize.py';s=p.read_text(encoding='utf-8').replace('다른 UI 엔티티 2139개','다른 UI 엔티티 2138개').replace('기존 금색 원형 버튼과 클릭 영역 및 펫 텍스트는 유지한다.','기존 금색 원형 버튼과 클릭 영역을 유지하고, 펫 텍스트는 원형 버튼 아래로 내려 그림과 간격을 확보했다.');p.write_text(s,encoding='utf-8')
