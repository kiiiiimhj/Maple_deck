# 구리 펫 시스템 · 1차 구현

단일 종: `item/pet/5002617`, 표시 이름 **구리**. 사용자가 제공한 기본·먹기·대화·산책·잠자기·사랑 모션을 사용한다.

## 사용 흐름

인벤토리에서 **능력치 → 펫 → 캐시 아이템** 순으로 버튼을 배치한다. 펫 보기에서는 왼쪽 아바타 대신 구리, 오른쪽 장비 목록 대신 돌봄 화면을 표시한다. 기존 인벤토리를 다시 열면 장비 보기를 복원한다.

먹이/씻기/산책은 에너지를 사용하고 성장 경험치를 준다. 포만감·청결·기분은 표정에 영향을 주며, 이미 얻은 대미지 보너스를 깎지 않는다. 전투 중에는 돌봄·장착 변경을 제한한다. 만렙에서도 돌볼 수 있지만 경험치를 쌓아 두지는 않는다.

| 행동 | 에너지 | 성장 경험치 | 효과 |
|---|---:|---:|---|
| 먹이 | -80 | 16 | 포만감 +35 |
| 씻기 | -120 | 24 | 청결 +40 |
| 산책 | -160 | 32 | 기분 +30 |
| 잠자기 | +100 | 0 | 1시간마다 한 번 |

에너지 최대 1000, 30초에 1 회복. 오프라인 회복도 접속 시 경과 시간으로 계산한다. 필요 수치는 30분마다 포만감 -3, 청결 -2, 기분 -2.

## 성장·승급

성장 요구 경험치는 `40 + 현재 레벨 × 12`. 승급마다 레벨 상한이 10 → 20 → 30 → 40으로 늘어난다. 성장석 비용은 10 → 30 → 60개. 기본 장착 대미지 보너스는 3% → 5% → 8% → 12%, 해당 단계의 레벨마다 추가 0.15%. 전투 시작 시 보너스를 고정하고 이어하기에서는 유지한다.

## 성장석 보상

점수 500 이상 + 실제 플레이 시간 2분 이상일 때부터 지급한다.

`floor(sqrt(점수 / 500) × 생존 보너스)` · **한 판 최대 6개**.

생존 보너스: 2분 1배, 5분 1.2배, 10분 1.5배. 예: 점수 2000일 때 2분이면 2개, 10분이면 3개. 게임이 멈춰 있던 시간은 기존 RunElapsedSec 계산에 따라 제외한다.

게임오버에서 보상 수량이 올라가는 연출을 보여주고, 인벤토리 전체/기타에 표시한다. 이어하기는 같은 판으로 계산하여 이전 지급액보다 증가한 차액만 준다. 마지막 아이템 획득을 한 번 더 확인하되 이전 판 타이머가 새 판에 보상을 지급할 수 없게 한다.

성장석은 계정 재화이며 인벤토리 용량을 쓰지 않고 판매/버리기할 수 없다. 수량과 승급 소모는 **같은 펫 저장 데이터**에 기록한다. 가상 ItemStruct는 표시 전용이며 일반 아이템 지급 API로 성장석을 지급하지 않는다.

## 저장·판매

PlayerDBManager의 기존 로그인 배치에 `Pets.v1.5002617`을 추가했다. 변경된 데이터만 저장하고 저장 성공 키와 세대가 일치할 때만 dirty 상태를 해제한다. 비동기 저장을 직렬화하여 옛 데이터가 최신 구매를 덮어쓰지 않게 한다. 결제 지급은 저장 확인 후 확정한다.

알 가격은 사용자 기획상 **약 6000원**. 아직 실제 상품이 등록되지 않았으므로 `PetEggProductId=""`, `PetEggPrice=0`이고 구매 버튼은 회색 **판매 준비 중**이다. 추후 포털 상품 ID와 실제 월드 코인 가격을 함께 넣으면 기존 결제 콜백을 통해 구매/부화/저장이 연결된다. 계정당 한 마리 상품으로 등록해야 한다.

메이커에서만 **임시 부화** 버튼으로 확인 가능. 임시 구리와 테스트 성장석은 저장되지 않는다. 배포 환경에서는 사용할 수 없다.

## 검증

오프라인 Lua 검사: 보유/에너지/쿨다운/레벨/승급/전투 잠금/오프라인 회복/계정 확인/중복 보상/다시하기/저장 실패/미래 저장 버전 등. UI는 원래 엔티티 ID를 유지하고 기존 대비 새 lint 오류가 없는지 확인했다. 실제 플레이 확인은 사용자가 진행한다.


## 2026-10-10: Separate lobby pet house

- Lobby battle tab has a Pet button on the left navigation rail. It opens PetHouseGroup with the approved wide wooden room; closing or leaving the lobby ends all care animations.
- Feeding, washing, walking, resting, equipping the pet, promotion and egg purchase entry are managed by PetHouseUI. Walking crosses the room floor; washing renders a falling stream, animated droplets and floor splashes only after the server confirms success.
- Inventory keeps Guri's portrait and the original inventory list. PetGearSlots is a distinct three-slot visual placeholder, currently non-interactive and labelled Coming soon. It does not bind character gear, modify character equipment or create pet equipment items. Actual pet equipment and its separate persistence are future work.
- Existing ownership, growth, energy, evolution-stone reward and durable account storage rules are retained. Newly drawn evolution stone is shared by the inventory item, care screen and game-over reward.
- Egg product remains unregistered; checkout is disabled until a real product ID and price are configured. Maker temporary hatch remains non-persistent.
- Removed the recursive PushState battle guard; RequestAction still validates battle lock on the server, and state replies are delivered once.
- UI/lua offline checks passed; Maker build checked after refresh. No new Play session was started automatically.


## 2026-10-11: 돌봄 게이지와 피로도

- 머리 위 포만감, 청결, 기분, 피로도는 0~100 게이지로 표시한다. 상단의 중복 수치는 숨기고, 행동 버튼에는 에너지 비용과 돌봄 효과를 표시한다.
- 먹이: 포만감 +35, 피로 +5, 에너지 -80. 목욕: 청결 +40, 피로 +10, 에너지 -120. 산책: 기분 +30, 포만감 -15, 청결 -20, 피로 +25, 에너지 -160.
- 해당 필요 수치가 100이면 그 행동은 회색으로 비활성화되며, 서버도 에너지/경험치/산책 보상 중복 획득을 차단한다. 피로가 100이면 먹이/목욕/산책을 할 수 없다.
- 잠자기는 피로가 있을 때만 가능하고 6초 연출 동안 중복 요청을 차단한다. 피로 -60, 에너지 +100으로 적용한다. 이전 1시간 잠자기 제한은 피로도 방식으로 대체되었다. 에너지 최대치는 잠자기를 막지 않는다.
- 에너지는 기존처럼 시간으로 회복하지만 피로도는 활동으로만 증가하며 잠자기로만 감소한다. 시간이 지나거나 재접속해도 피로가 줄지 않는다.
- Fatigue는 기존 v1 펫 저장에 추가되는 선택 필드다. 기존 데이터는 0으로 읽고, 이후 기존 로그인/저장 배치와 dirty generation 계약을 그대로 사용한다. 메이커 임시 부화는 필요 수치 50, 피로 0에서 시작하며 저장되지 않는다.
- 구리 산책 원본 프레임/미소, 버섯집과 바닥의 레이어 수정은 유지한다. 느낌표 말풍선은 머리 옆으로 옮겨 게이지를 가리지 않는다.
- 오프라인 수치/저장/중복 요청/연출 및 UI 배치 검사 후 메이커 빌드를 확인한다. 새 Play 세션은 자동 시작하지 않는다.


## 2026-10-11: 친밀도 하트와 주사

- 왼쪽 하트 온도계는 0~100 친밀도. 먹이 +8, 목욕 +10, 산책 +12, 잠자기 +6, 주사 +10. 행동 후 포만감·청결·건강이 모두 30 이상일 때만 증가한다.
- 30분 주기 필요 수치 감소 후 배고픔 또는 청결이 30 미만이면 해당 주기마다 친밀도 -5, 건강 -4. 오프라인도 같은 경과 시간으로 계산하며 중복 계산하지 않는다.
- 친밀도는 단계를 나누지 않는 0~100 수치이며 보상 수령으로 감소하지 않는다. 친밀도 30/60/100에서 성장석 3개/무기 강화 주문서 5장/다이아 100개를 각각 받을 수 있다. 각 보상은 계정별 한국 시간 자정 기준 하루 1회. 자정에는 수령 기록만 초기화하며 친밀도는 유지한다. 인벤토리 지급 실패 시 미수령 상태를 유지한다.
- 온도계 오른쪽 세 구간에 원래 보상 아이콘과 오른쪽 아래 수량 x3/x5/x100을 표시한다. 구간에 도달하면 해당 아이콘이 초록 받기 버튼으로 교체되고, 수령 후 회색 완료 버튼으로 바뀐다. 단계 표시와 기존 하단 단일 받기 버튼을 제거했다. 진행도/친밀도 등 문구에는 반투명 검정 라운드 배경을 사용한다.
- 주사: 건강 +40, 에너지 -100, 피로 +5, 성장 경험치 +16, 5.5초. 건강 최대치는 100, 이미 건강하면 비활성. 원본 구리 놀람→울음→사랑 모션과 원작 주사기 접근/움찔/회복 입자 연출을 사용한다.
- Health, Affinity, HeartDayKey, HeartClaimedMask는 기존 v1 펫 저장의 선택 필드다. 기존 계정은 건강 100, 친밀도 0, 당일 미수령에서 시작하며 다른 진행도는 유지한다. 보상은 서버에서만 지급하고 기존 계정 배치 저장을 사용한다. 임시 부화는 건강 60으로 주사 테스트가 가능하며 실제 아이템/다이아 지급 및 저장은 하지 않는다.


## Pet House layout refresh (2026-10-11)

- Newly drawn rounded green/gray/red controls use nine-slice borders, with original care icons and pet clips unchanged.
- Centered title, care board above pet, growth XP and level/name navigation below pet. Right-hand ability, evolution-stone balance, conditional growth and equipment controls.
- Daily milestone quantities overlap the icon lower-right. Claims and complete buttons have dedicated 108 x 48 artwork, avoiding sliced-border seams on compact controls.
- Growth is the existing rank action: visible only at the rank level cap, with enough stones, while idle. Entrance bounce plus a gentle pulse; costs remain 10/30/60. No growth currency or XP rules changed.
- Green Join Me equips; red Stay Home unequips. Pet arrows use catalog boundaries and never wrap. Guri is the only current catalog entry, so both arrows are gray. Future entries must supply their own progress and animations; unregistered profiles cannot mutate Guri.

## Pet House action scenery (2026-10-11)

- Walking now fills the measured room opening (1580 x 540, centered at 0,8) beneath the existing header/footer and gold rim. One rectangular mask clips all action scenery, including scrolling neighbors. Ground pieces cover the taller opening without exposing the old room at the bottom.
- Washing uses newly drawn warm wood/aqua bathroom art; injection uses a matching friendly veterinary clinic. Both backgrounds use their exact native UI size and fade in/out over 0.18 seconds. Other actions keep the original room.
- The shower stream starts at the new shower head and ends at the existing floor splash. Guri keeps the original animation clips, pixel scale and action coordinates; controls and care meters stay above every backdrop.
- Actions remain server-confirmed, with all costs/rewards/durations unchanged. Wash/inject wait for both backgrounds to preload. Closing, leaving the lobby or finishing care restores the room; runtime-created scenery is destroyed on editor reload.
- Artwork and the built-in image_gen prompt set are saved under ArtSource/pet-scenery.
- Native outdoor art contains transparent sky/snow edges. A matching sky fill and a winter-only floor fill sit beneath these assets, fully clipped inside the opening, so the original room cannot show through.

## 산책 동행 및 성장 표시 (2026-10-11)

- 산책 배경은 마을·숲·눈길 세 장의 불투명 가로 이미지이며 같은 ActivityScene 테두리 안에서만 스크롤한다.
- 금발 카드 마법사의 걷기 프레임을 별도 표시하고 다리부터 상반신까지 보이도록 카메라를 잡는다. 발견·탐색 중에는 배경과 동행 캐릭터 모두 멈춘다.
- 구리의 몸과 걷기 프레임은 원본 그대로 유지한다. 산책 중에는 원본 얼굴 위치에 맞춘 작은 행복한 표정 패치만 표시한다.
- 발견 말풍선은 상태 보드에 가리지 않도록 구리 오른쪽 옆에 표시한다.
- 성장석은 기존 Stones 저장 필드와 ItemId 520001을 그대로 사용한다. 명칭 변경으로 잔액·보상·비용·저장 데이터는 바뀌지 않는다.
- 재화의 상시 이름 라벨은 숨기고 아이콘/수량 영역을 0.4초 길게 누르면 설명을 표시한다. 손을 떼거나 영역 밖으로 나가거나 드래그·닫기·편집기 재시작하면 설명을 닫는다.
- 펫 아래 성장 진행도는 현재 경험치/다음 레벨 요구 경험치에 비례하는 진행 바로 표시하며 수치는 바 중앙에 남긴다. 레벨 상한에서는 가득 찬 바에 기존 성장 가능/대기 안내를 표시한다.


## 뚱땅 추가 (2026-10-11)

- 사진을 바탕으로 승인된 회색·흰색 포메라니안 도트를 사용한다. 이름은 **뚱땅**, 고유 능력은 **크리티컬 확률**이다. 구리와 같은 성장폭(승급별 3/5/8/12%, 해당 구간 레벨당 0.15%p)이며 두 펫 중 한 마리만 함께할 수 있다.
- 먹기, 씻기, 꼬리 흔들며 뚱땅뚱땅 걷기, 잠자기, 주사 반응을 새로 그렸다. 대기/놀람/슬픔/피곤함/탐색 포즈도 별도로 연결한다. 모든 프레임은 64×64 투명 캔버스, 같은 발 기준선, 고정 배율이다. 걷기는 6프레임이며 발견 시 탐색 포즈로 멈추고 동행 캐릭터와 배경도 함께 멈춘다.
- 펫하우스 화살표로 구리와 뚱땅을 오간다. 각 펫의 보유, 레벨, 성장, 에너지, 돌봄 수치와 친밀도는 독립적이다. 성장석과 하루 보상 수령 기록은 계정 공용이다. 펫을 바꿔도 성장석 잔액이나 하루 다이아 보상이 복제되지 않는다.
- 기존 `Pets.v1.5002617` 저장 키를 유지하고 v2 계정 묶음 안에 두 프로필을 보존한다. 기존 v1 구리 데이터는 그대로 이관하고, 뚱땅은 미보유 상태로 시작한다. 잘못된 데이터/알 수 없는 종/미래 저장 버전은 덮어쓰지 않는다. 저장 성공 키와 세대 확인 계약은 유지한다.
- 장착한 펫의 효과는 새 게임/다시하기 시작 시 고정한다. 이어하기에서는 보너스를 유지한다. 일반 치명타 판정 및 전용 에너지볼트/체인라이트닝 판정에 뚱땅의 확률을 더하며, 구리의 대미지와 동시에 적용하지 않는다. 인벤토리는 함께하는 펫의 외형을 표시하고 기존 펫 장비 3칸은 그대로 독립적으로 유지한다.
- 두 알 상품은 등록 전까지 구매할 수 없다. 메이커의 임시 부화는 선택한 펫만 부화하며 두 펫의 테스트 프로필과 공용 테스트 재화를 저장하지 않는다. 실제 다이아/아이템/뽑기권을 지급하지 않는다.
- 신규 그림, 프레임, 생성 프롬프트 및 적용 자산 정보는 `ArtSource/pet-ttungttang`에 보관한다.
