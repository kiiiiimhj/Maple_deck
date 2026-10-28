Latest active walking/idle version: ../EventPolish20261028V3/README.md (TurkeyWalkV5). Earlier versions below are historical.

Latest active version: WalkV3/README.md and WalkV3/active-resources.json.

# Thanksgiving turkey (2026)
Native frames: 112 x 112 RGBA, binary alpha, shared 32-colour palette. All frames share one scale and foot baseline 79.
Registered sprites: resources.json. Point filter (0), Clamp wrap (1), pivot (0.5, 0.3).
Idle: 6 frames / 0.15 s. Walk: 6 frames / 0.12 s. Flee reuses walking at 0.05 s. Death: 6 frames / 0.13 s, non-looping.
No attack or impact FX. Nonlethal damage refreshes a 3-second escape, speed x3.5 and small native dust puffs every 0.22 s.
Runtime: RootDesk/MyDesk/Thanksgiving/ThanksgivingMonsterLogic.mlua. Random 60-180 seconds of active combat; all 5 episodes; 10 acorns per kill.
Season authorization uses PetLogic.IsThanksgivingActive (November 2026 KST). Maker testing bypasses dates only.
Reuse the existing monster model. MonsterAI has a passive update hook, death reward branch, and OnReachPlayer guard.
Do not rebuild or restore ThanksgivingUI/PetHouseUI or the /ui/TitleGroup/EventEntry layout from earlier snapshots.

Active final assets and resource manifest: Current/README.md and Current/active-resources.json.
