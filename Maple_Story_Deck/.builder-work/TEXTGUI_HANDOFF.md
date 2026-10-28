# TextComponent → TextGUIRendererComponent 전환 인수인계 (2차)

작성 2026-10-29. 1차 담당이 2차 담당에게 넘기는 문서예요. 이 문서만 보고 이어갈 수 있게 썼어요.

## 1. 왜 하는가

- 모바일 앱에서 **앱을 끄지 않고 월드를 나갔다가 다시 들어오면** 옛날 방식 글자(`MOD.Core.TextComponent`)만 전부 안 그려진다.
- PC는 정상. 앱을 완전히 껐다 켜면 정상. 새 방식 글자(`MOD.Core.TextGUIRendererComponent`)는 재입장해도 정상(로딩 화면 "Loading..." 10글자로 실기 확인).
- MSW 앱 버그로 판단하고 버그 제보를 올렸다. 답을 기다리는 동안 우회로 새 방식으로 옮긴다.
- MSW가 고쳐 주면 `develop`으로 돌아가면 된다(이 작업은 `develop`에 안 섞여 있다).

## 2. 현재 상태

| 항목 | 상태 |
|---|---|
| 브랜치 | `feature/textgui-migration` (develop `3c588796`에서 분기) |
| 1차 커밋 | `58ad8e29` — TitleGroup 771 / DefaultGroup 54 / WorldCharacterSelectGroup 17 = 842개 + 스크립트 8개 |
| 1차 검증 | 메이커 실행 오류 0, 번역 키 정상, 코드 연결 속성 49개 정상, 로비 4탭 비포/애프터 비교 완료 |
| 1차 미확인 | 인게임 한 판(스킬 슬롯·선택 카드·툴팁·골드·HP)을 실제로 플레이해서 눈으로 본 적 없음 |
| 2차 | **아무 파일도 안 바꿨다.** 사전 조사만 함(아래 4장). `.builder-work/textgui_<그룹>.json` 10개는 미리 돌리기 부산물이라 덮어써져도 된다 |

## 3. 도구 (`.builder-work/`)

| 파일 | 하는 일 |
|---|---|
| `textgui_convert.cjs <Group> [--dry]` | `ui/<Group>.ui`의 TextComponent를 지우고 같은 엔티티에 TextGUIRenderer를 붙인다(엔티티 ID·위치 그대로). 변환 목록을 `textgui_<Group>.json`에 남긴다. 두 컴포넌트가 이미 같이 붙은 엔티티는 건너뛴다 |
| `textgui_code.cjs <Group...>` | 위 json에 있는 엔티티 UUID를 기본값으로 가진 `property TextComponent x = "uuid"`를 `TextGUIRendererComponent`로 바꾼다 |
| `textgui_board.cjs` | 스타일 비교판 Lua 생성기(시각 보정용) |
| `ui_rewrite.cjs <Group...>` | 메이커가 옛 `.ui` 캐시를 들고 있을 때 내용 그대로 다시 써서 refresh가 새로 읽게 한다 |

`textgui_convert.cjs`는 `module.exports = { mapComponent }`도 내보낸다. `.model` 변환할 때 이 매핑 함수를 그대로 쓰면 된다.

### 변환 규칙(실측으로 정함, 바꾸지 말 것)

- 그대로 옮김: Text, IsLocalizationKey, FontColor, FontSize, MinSize, MaxSize, BestFit, SizeFit, Padding, Constraint*, IsRichText, 정렬 관련 정렬 기준, 소팅 필드.
- `Alignment`(0~8) → `HorizontalAlignment`(1/2/4) + `VerticalAlignment`(256/512/1024).
- `Bold` → `FontStyle` 1. `Font` 번호 → `"Default"/"Maple"/"Bazzi"/"Football"`.
- `Overflow` 번호가 뒤바뀌어 있다: 옛 Truncate=1·ellipsis=2 → 새 Ellipsis=1·Truncate=2.
- **굵은 메이플 글꼴은 새 엔진이 11~13% 넓다** → `SpacingOption {Character:-7}`. 크기와 무관하게 원래 폭과 2px 이내. `.ui`에 `"SpacingOption":{"Character":-7,"Line":0,"Paragraph":0,"Word":0}`로 저장되고 메이커가 읽는 것 확인함.
- **외곽선**: 옛 값은 글자 크기와 무관한 px → `OutlineWidth = px × 7.7 ÷ FontSize`(0.05~1), `FaceDilate`도 같은 값.
- **그림자**: `DropShadowAngle` 120 = 오른쪽 아래(관례와 반대). Underlay 오프셋 = (-cos, -sin) × 1.2(±1 제한), Dilate 0.4, Softness 0.
- 위치·칸 크기(UITransform)는 절대 건드리지 않는다(유저 지정).

## 4. 2차 범위 (사전 조사 결과)

### 4-1. `.ui` 10개 — 199개 (+ 중복 16개)

InventoryGroup 77, GameOverGroup 44, ShadowShopGroup 24, EquipmentGroup 23, RelicUpgradeGroup 8, SkillUpgradeGroup 8, GachaGroup 7, CharacterUnlockGroup 4, PopupGroup 3, ToastGroup 1.

이게 끝나면 `.ui` 안 TextComponent는 아래 중복 16개 말고 하나도 안 남는다.

- **GameOver 중복 16곳** `ItemSlot_26~41/CountText`: 옛 컴포넌트("x0")와 새 컴포넌트(글자 미설정)가 둘 다 켜져 있다. 코드(`GameOverUI.mlua` 256행 근처)는 `CountLabelV2`를 쓴다. 옛 컴포넌트만 지우는 정리가 맞아 보이지만, 지우기 전에 실제로 무엇이 보이는지 확인할 것.

### 4-2. ⚠ `.model` / `.map` 안의 TextComponent — 아직 안 셌다

- 인벤토리 아이템 칸(`UIItemSlot.mlua`가 다루는 Count, SelectedCheckText, EquippedText, QualityText)은 `.ui`가 아니라 **`.model`** 에 있다. `RootDesk/MyDesk/Models/` 아래와 맵 파일까지 TextComponent를 먼저 세어야 한다.
- `.model`은 `ModelBuilder`로만 다룬다(`msw-general` 스킬의 `references/model.md`, `builder-protocol-model.md` 먼저 읽기).
- `UIItemSlot.mlua` 주석에 "새 자식을 추가하면 원인불명으로 안 그려지는 문제"가 있었다는 기록이 있다. 컴포넌트를 바꾼 뒤 아이템 칸이 실제로 그려지는지 꼭 눈으로 확인할 것.

### 4-3. 코드

`.ui`가 다 바뀌면 코드의 옛 방식 접근도 사실상 전부 바꾸면 된다. 예외: `LobbyTutorialUI.SyncState`, `SkillUI.GetFilterText`는 두 방식을 다 처리하므로 그대로 둔다.

- **UUID 기본값 속성** → `node .builder-work/textgui_code.cjs <바꾼 그룹들>`로 자동: GachaUI.titleText, UIComposePopup.CapacityText, RelicUpgradeUI 6개, SkillUpgradeUI 6개, CharacterUnlockUI 2개, DiaShopUI.noticeText, GameOverUI 7개, ShadowShopUI 11개, UIPopup.message, UIToast.message.
  - ⚠ `LevelRewardUI.levelText/nameText`는 UUID가 가리키는 엔티티부터 확인(LevelRewardGroup엔 TextComponent가 없다).
- **런타임 대입 속성**(기본값 nil, `GetChildByName(...).TextComponent`로 채움) — 타입 선언과 대입 줄 둘 다 바꾼다: UIComposeTab, UIEquipPopup, UIInventory(TextName·TextLevel·TextCapacity), UIInventoryTab, UIUsePopup(4개), UIItemSlot(4개), UICommonPopup(2개).
- **`.TextComponent` 직접 접근**: GachaUI 500·2148, InventoryUI 211·213, Ep5Map4BarterShop 144~194(그림자상점 화면을 재사용), UIEquippedGearPanel 56, UICommonPopup 77·93·94.
- 바꾼 뒤 `Bold`/`Alignment`/`DropShadow*`/`UseOutLine`/`OutlineDistance`/`Overflow`/`Font =` 대입이 있는지 확인한다(1차에선 없었다). 있으면 새 필드 이름으로 바꾼다.

## 5. 작업 순서

1. `git switch feature/textgui-migration`, 작업 폴더 깨끗한지 확인.
2. 메이커 `stop` → 응답이 `already_stopped`인지 확인(`play_to_edit`면 한 번 더).
3. `.ui` 10개: `node .builder-work/textgui_convert.cjs <Group>` 하나씩.
4. `.model`/`.map`의 TextComponent를 세고, ModelBuilder로 같은 매핑(`mapComponent`) 적용.
5. 코드: `textgui_code.cjs`로 UUID 속성 → 나머지는 4-3 목록대로 손으로.
6. 메이커 반영: `ui_rewrite.cjs <바꾼 그룹들>` → `refresh`. **큰 `.ui`는 refresh 한 번으로 캐시가 안 풀린 적이 있다.** 실행 뒤 런타임에서 실제로 새 컴포넌트인지 꼭 확인할 것.
7. `logs(kind="build")` 오류 0 → `play` → 인벤토리·장비·합성 팝업·사용 팝업·게임오버·그림자상점·에피5 교환소·스킬/유물 강화창·뽑기·캐릭터 해금·공용 팝업·토스트를 `maker_execute_script`로 열어서 `logs(kind="normal")`에 오류가 없는지, 글자가 맞는지 확인.
8. 유저에게 커밋 요청. 커밋은 유저가 직접 하는 게 원칙(유저가 "커밋 ㄱㄱ"라고 하면 대신 해도 됨).

## 6. 함정 모음

- 셸로 `.ui`를 읽거나 고치면 훅이 막는다. 읽기·쓰기는 UIBuilder(`node`로 빌더 호출)만. 원본이 필요하면 `node -e`에서 `git show HEAD:./ui/X.ui`를 실행한다.
- 메이커가 실행 중일 때 빌더로 쓰면 런타임이 옛 값을 읽는다. 항상 `stop` → 쓰기 → `refresh` 순서.
- `ui_lint`의 L013(화면 밖) 오류는 스크롤 목록 칸이라 원래 나는 오탐이다. 그래서 `write(..., {strict:false})`로 저장한다.
- 메이커 MCP가 끊기면 도구가 안 보인다. 유저에게 메이커가 월드를 연 상태인지 확인하고 `/mcp`로 재연결해 달라고 하면 된다.
- 유저와는 **존댓말 한국어로만** 대화한다. 영어 단어도 최대한 풀어 쓴다.

## 7. 참고

- 1차 비포/애프터 비교 페이지: https://claude.ai/artifact/DJ3f55Cyh2rErMDcA5JDMg (유저 계정 비공개)
- 메이커 스크린샷 폴더: `C:/Users/려진/AppData/LocalLow/nexon/MapleStory Worlds/McpScreenshots/`
- 같은 내용이 Claude 메모리 `project_textgui_migration.md`에도 있다(Claude Code를 쓰는 경우).
