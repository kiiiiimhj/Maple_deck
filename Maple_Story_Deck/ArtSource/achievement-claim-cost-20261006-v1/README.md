# Achievement claim-all reward amount

The existing 312 × 96 button and its entity UUID/coordinates are retained. The translated label uses the existing `UI_ACHIEVEMENTGROUP_001` key in Korean, English, Traditional Chinese and Japanese. A second row shows the existing diamond icon and `x` + exact, comma-separated claimable diamond total.

The total is computed from the same claimable achievement count used by the existing button, multiplied by `AchievementLogic.RewardDiamond`. Snapshot updates, single-claim results and claim-all results already call RefreshList, which refreshes this row. No reward grants or storage logic changed. At zero rewards, the button retains the existing gray disabled image and shows x0.

The icon and number are centered together using the actual rendered text width, as in MonsterBookUI. No new translation text is needed for the numeric row.
