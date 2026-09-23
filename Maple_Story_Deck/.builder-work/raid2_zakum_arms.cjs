// 2026-09-23 유저 "자쿰 팔은 어따 팔아먹음?" — 몸통만 있는 최종 페이즈(mob/8800002) 대신
// 팔 8개가 붙은 "위대한 자쿰"(mob/9303089.img, 416x304, 발밑 기준점)으로 교체한다.
// 몸통 스프라이트(416 높이)보다 키가 작아서 1.3배로 키운다(폭 약 5.4 / 높이 약 4.0).
const { MapBuilder } = require('../.claude/skills/msw-general/scripts/map/msw_map_builder.cjs');
const MAP = 'map/Raid_2.map';
const ZAKUM = {
  stand: '429420f7607e46acb0dd0d7294178150',
  attack: '828b4caca05d4578b0dcdf774decb6ac',
  hit: '5c69511eab434e22bd86668594e6474f',
};
const SCALE = 1.3;
const b = MapBuilder.read(MAP);
b.upsertComponent('RaidSceneController', 'script.RaidScene', {
  '@type': 'script.RaidScene', Enable: true,
  BossStandRUID: ZAKUM.stand, BossAttackRUID: ZAKUM.attack, BossHitRUID: ZAKUM.hit,
  BossBodyOffset: { x: 0.0, y: 2.0 },
});
const t = b.component('RaidBoss', 'MOD.Core.TransformComponent');
b.upsertComponent('RaidBoss', 'MOD.Core.TransformComponent', { ...t, Scale: { x: SCALE, y: SCALE, z: 1 } });
const s = b.component('RaidBoss', 'MOD.Core.SpriteRendererComponent');
b.upsertComponent('RaidBoss', 'MOD.Core.SpriteRendererComponent', { ...s, SpriteRUID: ZAKUM.stand });
b.write(MAP);
console.log(JSON.stringify(b.component('RaidBoss', 'MOD.Core.TransformComponent')));
console.log(b.component('RaidBoss', 'MOD.Core.SpriteRendererComponent').SpriteRUID);
const rs = b.component('RaidSceneController', 'script.RaidScene');
console.log(rs.BossStandRUID, rs.BossAttackRUID, rs.BossHitRUID);
