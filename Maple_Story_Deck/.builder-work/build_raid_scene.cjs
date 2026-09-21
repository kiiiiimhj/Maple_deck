// 주간 레이드 월드 씬 — Raid_1(발록의 무덤, TileMapMode 0 MapleTile)에 보스 + 캐릭터 5명 + 씬 컨트롤러 배치
// 2026-09-20. 캐릭터는 유저 아바타가 아니라 "레이드 전용 아바타 엔티티"(캐릭터별 코스튬을 코드에서 입힌다).
const path = require("path");
const { ModelBuilder, vector3 } = require("../.claude/skills/msw-general/scripts/model/msw_model_builder.cjs");
const { MapBuilder } = require("../.claude/skills/msw-general/scripts/map/msw_map_builder.cjs");

const TEMPLATES = path.join(process.cwd(), ".claude", "skills", "msw-general", "models");
const HERO_MODEL = "RootDesk/MyDesk/Models/Raid/RaidHero.model";

// ── 1) 레이드 히어로 모델 ────────────────────────────────────────────────────
// Player 템플릿에서 시작해 플레이어 전용 부품(입력/카메라/인벤/이름표 등)을 걷어내고
// "아바타를 그리고 모션을 재생하는" 최소 구성만 남긴다.
//   AvatarRendererComponent      — 실제 메이플 아바타 렌더
//   CostumeManagerComponent      — 캐릭터별 착장(코드에서 SetEquip)
//   AvatarStateAnimationComponent+ AvatarBodyActionSelectorComponent — stand/attack 등 실제 모션
//   DamageSkinSpawnerComponent   — 대미지 스킨 연출에 필요(플레이어와 동일 부품)
const hero = ModelBuilder.fromTemplate(path.join(TEMPLATES, "Player.model"), "RaidHero");
const dropComponents = [
  "MOD.Core.PlayerControllerComponent",
  "MOD.Core.PlayerComponent",
  "MOD.Core.CameraComponent",
  "MOD.Core.InventoryComponent",
  "MOD.Core.ChatBalloonComponent",
  "MOD.Core.NameTagComponent",
  "MOD.Core.TriggerComponent",
  "MOD.Core.KinematicbodyComponent",
  "MOD.Core.SideviewbodyComponent",
  "MOD.Core.MovementComponent",
];
for (const c of dropComponents) {
  if (hero.hasComponent(c)) hero.removeComponent(c);
}
if (!hero.hasComponent("MOD.Core.AvatarBodyActionSelectorComponent")) {
  hero.component("AvatarBodyActionSelectorComponent");
}
hero.write(HERO_MODEL);
console.log("RaidHero.model:", JSON.stringify(hero.listComponents()));

// ── 2) 맵 배치 ──────────────────────────────────────────────────────────────
// 발판 범위(실측): x -1.18 ~ 10.85 / y -2.62 ~ 1.68. 바닥 라인 y = -2.62 기준으로 세운다.
const GROUND_Y = -2.5;
const BOSS_X = 7.6;
const HERO_X0 = 2.2;
const HERO_GAP = 0.9;

const map = MapBuilder.read("map/Raid_1.map");

// 마왕 발록 — 1개뿐이라 인라인 스프라이트로 둔다. 월드 SpriteRenderer는 animationclip을 그대로 재생한다
map.sprite("RaidBoss", {
  ruid: "9846138384c745dbaabb6f7e062bbb48", // 마왕발록 stand animationclip
  pos: [BOSS_X, GROUND_Y + 1.2, 0],
  order: 30,
});

// 캐릭터 5명 — 같은 구성이 5개라 modelId 형식(.model 인스턴스)
for (let i = 0; i < 5; i++) {
  map.placeModel("RaidHero" + i, HERO_MODEL, { pos: [HERO_X0 + i * HERO_GAP, GROUND_Y, 0] });
}

// 씬 컨트롤러 — 맵 스코프 컴포넌트(맵을 벗어나면 정리돼야 하므로 Logic이 아니라 Component)
map.empty("RaidSceneController", { pos: [0, 0, 0], scripts: ["script.RaidScene"] });

map.write("map/Raid_1.map");
console.log("Raid_1.map: boss + 5 heroes + controller placed");
