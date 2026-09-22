// 레이드 관전 히어로 5명의 StateComponent.IsLegacy를 false로 (유저 지정 2026-09-22).
//
// 증상: 레이드 맵에 들어갈 때마다 5줄씩
//   [LWA-3019] NotRecommendedValue : Legacy 기능은 더 이상 지원하지 않으므로 ...
//              IsLegacy 프로퍼티 false 설정을 권장합니다. (/maps/Raid_1/RaidHeroN/StateComponent)
//
// StateComponent.IsLegacy 기본값이 true(레거시)라서 나는 엔진 권고 경고다. 에러가 아니고,
// 여기서는 실제로 깨지는 것도 없다:
//   · 아바타 애니메이션을 실제로 구동하는 AvatarStateAnimationComponent.IsLegacy는 이미 false
//   · RaidScene.DressHero가 입장 직후 hero.StateComponent.Enable = false 로 꺼버린다
//     (IDLE 상태머신이 매 프레임 자세를 Stand로 되돌려 공격 모션을 먹었기 때문 — 의도된 처리)
// 경고는 엔티티 생성 시점에 찍히므로 스크립트가 끄기 전에 이미 로그가 남는다. 값만 권고값으로
// 바꿔 로그를 없앤다 — 런타임에 어차피 꺼지므로 동작 변화는 없다.
const { MapBuilder } = require("../.claude/skills/msw-general/scripts/map/msw_map_builder.cjs");

const MAP_PATH = "map/Raid_1.map";
const m = MapBuilder.read(MAP_PATH);

// Map Work Preflight — TileMapMode 확인 (0 = MapleTile, 히어로는 Rigidbody)
console.log("TileMapMode =", m.getTileMapMode());

const heroes = m
  .listEntities()
  .map((e) => e.name)
  .filter((n) => /^RaidHero\d+$/.test(n || ""));

for (const h of heroes) {
  m.patchComponent(h, "MOD.Core.StateComponent", { IsLegacy: false });
}
m.write(MAP_PATH);

const after = MapBuilder.read(MAP_PATH);
for (const h of heroes) {
  const sc = after.component(h, "MOD.Core.StateComponent");
  const av = after.component(h, "MOD.Core.AvatarStateAnimationComponent");
  console.log(`RESULT ${h} StateComponent.IsLegacy=${sc.IsLegacy} / AvatarStateAnim.IsLegacy=${av.IsLegacy}`);
}
