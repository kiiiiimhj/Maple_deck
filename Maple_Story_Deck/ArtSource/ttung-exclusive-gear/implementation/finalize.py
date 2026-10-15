from pathlib import Path
import json,shutil,hashlib
stage=Path('work/ttung-gear');out=Path('outputs/ttung-gear');project=Path('G:/Maple_Story_Deck');archive=project/'ArtSource/ttung-exclusive-gear'
checks=[json.loads((out/p).read_text(encoding='utf-8'))for p in ['art-verification.json','runtime-verification.json','map-runtime-verification.json']];assert all(c['status']=='passed'for c in checks)
for n in ['PetLogic','PetUI','PetHouseUI','PetProgress']:
 assert (project/'RootDesk/MyDesk/Pet'/(n+'.mlua')).read_text(encoding='utf-8-sig')==(stage/(n+'.mlua')).read_text(encoding='utf-8-sig'),n
doc=project/'Docs/Pet-System.md';body=doc.read_text(encoding='utf-8-sig');before=body
old='- Inventory keeps Guri\'s portrait and the original inventory list. PetGearSlots is a distinct three-slot visual placeholder, currently non-interactive and labelled Coming soon. It does not bind character gear, modify character equipment or create pet equipment items. Actual pet equipment and its separate persistence are future work.'
assert body.count(old)==1;body=body.replace(old,'- PetGearSlots now equips Ttungttang-exclusive hat, clothes and necklace independently of character equipment. Click a possessed slot to equip/remove it; character inventory and equipment remain independent.')
body+='''

## Ttungttang exclusive equipment — 2026-10-14

- Starlight Beret / 별빛 베레모: critical damage +10 percentage points.
- Walking Vest / 산책 조끼: attack ×1.05.
- Heart Collar / 하트 목걸이: critical chance +5 percentage points.
- Account schema v6 stores each pet's GearOwnedMask and GearEquippedMask. V1–V5 saves migrate without resetting pets or wallet; non-owned/equipped bits and equipment on another species are rejected.
- `GrantPetGear(userId, mask)` is server-only (hat=1, clothes=2, necklace=4). Release acquisition is not configured yet. `RequestTestPetGear` is Maker-only and creates a non-persistent preview; it never grants live items or writes test progress.
- Inventory → Pet → Try gear / 장비 시험 equips all three for Maker tests. Slot clicks then toggle each item. Ttungttang must be owned/equipped for this inventory view.
- Existing PNG pet frames are preserved. Transparent 128×128 equipment layers have measured integer head anchors, foreground paw/fur masks, binary alpha and Point filtering. Inventory and house share the current pet frame and renderer flips. The combat charm jump uses warmed fixed-texture actors and an explicit server equipment snapshot; no independent animation clock.
- Validation: actual slot and care-button events, save/JSON round trip, old-save migration, invalid ownership/type rejection, every 76 frame in both directions, and actual first/repeated U casts. Original account and temporary combat fixtures restored after testing.
- Artwork, prompts, all pose previews and verification reports: `ArtSource/ttung-exclusive-gear/outputs`. Gear stats are snapshotted at run start alongside pet stats; unequipped/other pets receive no gear bonus.
'''
shutil.copy2(doc,archive/'source-backup/Pet-System.md');doc.write_text(body,encoding='utf-8');(stage/'Pet-System.md').write_text(body,encoding='utf-8')
shutil.copytree(out,archive/'outputs',dirs_exist_ok=True);shutil.copytree(stage,archive/'implementation',dirs_exist_ok=True)
notes='''뚱땅 전용 장비 3종 적용

모자: 크리티컬 대미지 +10%
옷: 공격력 +5%
목걸이: 크리티컬 확률 +5%

메이커에서 인벤토리 → 펫 → 장비 시험. 부위 슬롯을 누르면 장착/해제.
출시 획득 방식은 아직 미정이며, 시험 장비와 진행도는 저장되지 않음.
기존 뚱땅 원본 프레임은 유지. 먹기·목욕·수면·주사·산책·반응·점프 스킬에 착용 레이어 연결.
양방향 76개 프레임, 실제 버튼, 저장 복원 및 첫/반복 U 스킬 검증 완료.
생성 방식: built-in image_gen. 생성 프롬프트: generation-prompts.json.
'''
(out/'change-notes.txt').write_text(notes,encoding='utf-8');shutil.copy2(out/'change-notes.txt',archive/'outputs/change-notes.txt')
(out/'saved-source-hashes.json').write_text(json.dumps({n:hashlib.sha256((project/'RootDesk/MyDesk/Pet'/(n+'.mlua')).read_bytes()).hexdigest()for n in ['PetLogic','PetUI','PetHouseUI','PetProgress']},indent=2),encoding='utf-8')
print('Final artwork, source backups, gear documentation and passed verification archived.')
