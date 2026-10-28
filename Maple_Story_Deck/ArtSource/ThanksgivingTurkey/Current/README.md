# Active Thanksgiving turkey assets — 2026-10-27
Use this Current folder and active-resources.json. Parent assets retain the earlier art source.
18 native 112x112 frames. Binary alpha. Point/Clamp, pivot (0.5, 0.3). All body bounding boxes centred at x=56; feet at y=79.
Idle 0.15s/frame; walk 0.085; flee 0.045. First/last frames no longer jump horizontally by 11 pixels.
Defeat: 6 frames x 0.13s. Last 3 have closed eyes and the full acorn sack attached. Alpha fades over the last 0.28s.
Event: random 60-180 active-play seconds, all five episodes, no attacks, 3-second fast escape refreshed by damage and small foot dust.
10 acorns use GameManager.ScheduleLootDrop, including its regular junk size, bounce and flight to the in-game bag.
On pickup: credit and persist the PetLogic event wallet; record thanksgiving_acorn in the run PlayerInventory; RunLootLogic rank -1 puts it first in the GameOverUI.
Run inventory clears on restart; the saved event wallet remains. Acorns have zero gold/score conversion and are displayed only once in results.
Names localized in ko/en/zh-tw/zh-cn/ja/es. No .ui geometry or EventEntry edits.
Runtime: RootDesk/MyDesk/Thanksgiving/ThanksgivingMonsterLogic.mlua. Keep concurrent user/Claude edits; patch the latest sources only.
