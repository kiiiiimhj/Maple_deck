// 2026-09-23 유저 "악령이 깃든 자쿰의 팔1~8 번보면 다 공격모션 각각있는디?"
// 통짜 자쿰(위대한 자쿰) → 팔 없는 몸통(mob/9834207) + 팔 8개(mob/9834209~9834216)로 교체.
// 팔 스프라이트 기준점이 전부 몸통 발밑과 같은 원점이라 RaidBoss와 같은 위치·크기로 겹치면 조립된다.
// 팔은 몸통 뒤(OrderInLayer 29 < 몸통 30). 팔 공격은 RaidScene.TickArms가 하나씩 돌린다.
// 클립 길이는 썸네일 GIF 프레임 수 × 0.15초로 잰 값.
const { MapBuilder } = require('../.claude/skills/msw-general/scripts/map/msw_map_builder.cjs');
const MAP = 'map/Raid_2.map';
const BODY = {
  stand: '1e9155f55b23443aa0836498ed14503b',
  attack: 'df8aff3e890148658c4cec1a6c4556ad',
  hit: 'bdb7d1f8a42e4382bad09d8bf5ef4d44',
};
// 팔1~8: [stand, attack(없으면 ''), 공격 초]
const ARMS = [
  ['c6c8e01a08064154ba133b4293bcd3a8', 'e9c3209d23234c8188c7de2c55be416b', 6.75],
  ['7d7d0c9b29fe4dac91c2adb7d9f4ebd0', '3b1fd8737c694c66aeb7d6863fa2722f', 5.55],
  ['3575e69307af43d19282b1d1de7df99f', '', 0],
  ['79953253e251431e9f1d41dd12edb1b3', 'd9b7b4b6860941e1a9b0dcad486ebd31', 6.9],
  ['23715401123f48cda15e213b2397220a', '0a35e468f5944902b4ef3e32dcc437f5', 3.45],
  ['f55e609abf94447ea295accdf989952e', '75e0ad3f74204ac3b55f3f994b459996', 1.95],
  ['72c641972f4442259ff96507c8801d07', '9fbf8c73915b48d4a5ffceb9fc2016d0', 8.25],
  ['8e61efae930a4b90b943b0ccc814095b', 'c3e561a5234542bc9c28f658a6967718', 7.05],
];
const SCALE = 1.0;
const POS = { x: 0, y: -1.28, z: 0 };
const PREFIX = 'RaidBossArm';

const b = MapBuilder.read(MAP);
const clone = (o) => JSON.parse(JSON.stringify(o));

// 몸통
const bt = b.component('RaidBoss', 'MOD.Core.TransformComponent');
b.upsertComponent('RaidBoss', 'MOD.Core.TransformComponent', { ...bt, Position: POS, Scale: { x: SCALE, y: SCALE, z: 1 } });
const bs = b.component('RaidBoss', 'MOD.Core.SpriteRendererComponent');
b.upsertComponent('RaidBoss', 'MOD.Core.SpriteRendererComponent', { ...bs, SpriteRUID: BODY.stand, FlipX: false, OrderInLayer: 30 });

// 팔 엔티티(없으면 만들고, 있으면 값만 맞춘다)
const armTransform = { ...clone(b.component('RaidBoss', 'MOD.Core.TransformComponent')) };
ARMS.forEach(([stand], i) => {
  const name = PREFIX + (i + 1);
  const sr = { ...clone(b.component('RaidBoss', 'MOD.Core.SpriteRendererComponent')), SpriteRUID: stand, OrderInLayer: 29 };
  if (!b.find(name)) b.entity(name, [clone(armTransform), sr], {});
  else {
    b.upsertComponent(name, 'MOD.Core.TransformComponent', clone(armTransform));
    b.upsertComponent(name, 'MOD.Core.SpriteRendererComponent', sr);
  }
});

// 장면 컨트롤러 — 좌우 반전 값은 지우고 팔 설정을 넣는다
const rs = { ...b.component('RaidSceneController', 'script.RaidScene') };
delete rs.BossMirrorAttackChance;
delete rs.BossMirrorShiftX;
Object.assign(rs, {
  BossStandRUID: BODY.stand, BossAttackRUID: BODY.attack, BossHitRUID: BODY.hit,
  BossAttackDuration: 2.4,
  BossBodyOffset: { x: 0.0, y: 1.9 },
  BossArmPrefix: PREFIX,
  BossArmStandRUIDs: ARMS.map((a) => a[0]).join(','),
  BossArmAttackRUIDs: ARMS.map((a) => a[1]).join(','),
  BossArmAttackSeconds: ARMS.map((a) => (a[1] ? String(a[2]) : '')).join(','),
});
b.upsertComponent('RaidSceneController', 'script.RaidScene', rs);
b.write(MAP);

for (const e of b.listEntities().filter((e) => /RaidBoss/.test(e.path))) {
  const s = b.component(e.path, 'MOD.Core.SpriteRendererComponent');
  const t = b.component(e.path, 'MOD.Core.TransformComponent');
  console.log(e.path.split('/').pop(), s.SpriteRUID.slice(0, 8), s.OrderInLayer, JSON.stringify(t.Position), JSON.stringify(t.Scale));
}
const r2 = b.component('RaidSceneController', 'script.RaidScene');
console.log(r2.BossArmPrefix, r2.BossArmAttackSeconds, r2.BossStandRUID.slice(0, 8), r2.BossMirrorShiftX);
