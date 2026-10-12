from pathlib import Path
source=Path('work/pet-lobby-icon-v2/prepare.py').read_text(encoding='utf-8')
source=source.replace('pet-lobby-icon-v2','pet-lobby-icon-v3').replace('pet-house-paw-v2','pet-house-paw-v3')
source=source.replace('exec-ebc1b548-9f7b-4faa-af56-7d4b9b23feff.png','exec-b48969ff-b13c-4422-b6a0-0de158d99705.png')
source=source.replace('9c00086f822540d5bacfe376c4c9c738','f32b1ba470b0445cbe8ca474b900dad3')
source=source.replace('Correct pet-house doorway and paw alignment; replace only icon art','Apply approved coherent side-view pet house and fill the lobby button')
source=source.replace('정면 형태로 다시 그려 지붕, 입구, 발바닥을 같은 세로 중심축에 맞췄다. 발바닥은 네 개 발가락과 중심 패드가 좌우 대칭이며 기울이지 않았다. 기존 104px 크기와 위치를 유지한다.','승인된 집 모양을 살짝 측면으로 돌렸으며 입구와 발바닥은 같은 앞면의 원근을 유지한다. 아이콘을 키워 버튼 내부에 거의 가득 차게 배치했다.')
exec(compile(source,'prepare-approved-side-view','exec'))
