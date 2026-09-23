// 2026-09-23 자쿰 레이드(Raid_2) 배치.
// Maker "메이플 맵 가져오기"(자쿰의 제단 280030100)가 Raid_2 내용을 통째로 교체해서 레이드 엔티티
// (RaidBoss / RaidHero0~4 / RaidSceneController)가 사라졌다 → 가져오기 직전 백업에서 복원하고 자쿰 제단에 맞게 다시 놓는다.
//   · 바닥 = y -1.28 (x -5.6~5.8), 양옆 발판 y 0.05 / 1.0 / 1.9
//   · 자쿰(최종 페이즈 mob/8800002.img)은 가운데, 캐릭터는 발록 때처럼 양옆 바닥·발판에 나눠 선다
//   · 가져오기로 딸려 온 NPC(아도비스)와 포탈 2개는 레이드에 필요 없어 뺀다
const path = require('path');
const { MapBuilder } = require('../.claude/skills/msw-general/scripts/map/msw_map_builder.cjs');
const MAP = 'map/Raid_2.map';
const BACKUP = process.argv[2];
if (!BACKUP) throw new Error('usage: node raid2_zakum_setup.cjs <backup.map>');
const HERO_MODEL = 'RootDesk/MyDesk/Models/Raid/RaidHero.model';

// 자쿰 최종 페이즈 클립(발밑 기준점)
const ZAKUM = {
  stand: '56f8aeaf5ed64fe29c772d7f85b1704c',
  attack: '2d12d3c4d7a24f6fa2b339bd73e9039e',
  hit: 'f748e3bb697a46d28e8f34c660162deb',
};
const GROUND_Y = -1.28;
const BOSS_POS = [0.0, GROUND_Y, 0];
// 캐릭터 자리(발록 맵과 같은 인덱스 배치 — 0·2는 바닥 양옆, 1·3·4는 발판)
const HERO_POS = {
  RaidHero0: [-3.4, GROUND_Y + 0.1, 0],
  RaidHero1: [3.84, 1.09, 0],
  RaidHero2: [3.4, GROUND_Y + 0.1, 0],
  RaidHero3: [-3.62, 1.09, 0],
  RaidHero4: [4.39, 0.15, 0],
};

const old = MapBuilder.read(BACKUP);
const b = MapBuilder.read(MAP);
if (b.getTileMapMode() !== 0) throw new Error('Raid_2 must be MapleTile(0)');
const clone = (o) => JSON.parse(JSON.stringify(o));

for (const n of ['npc-2435', 'Portal', 'Portal_1']) if (b.find(n)) b.remove(n);

// 장면 컨트롤러(맵 스코프 RaidScene) — 자쿰 클립/몸통 기준점은 인스턴스 값으로 덮는다
if (!b.find('RaidSceneController')) {
  b.entity('RaidSceneController', clone(old.find('RaidSceneController').jsonString['@components']), {});
}
b.upsertComponent('RaidSceneController', 'script.RaidScene', {
  '@type': 'script.RaidScene', Enable: true,
  BossStandRUID: ZAKUM.stand, BossAttackRUID: ZAKUM.attack, BossHitRUID: ZAKUM.hit,
  BossBodyOffset: { x: 0.0, y: 2.0 },
});

// 보스 — 발록 엔티티 설정(정렬/크기)을 가져와 스프라이트·위치만 자쿰으로
const bossComps = clone(old.find('RaidBoss').jsonString['@components']);
const bt = bossComps.find((c) => c['@type'] === 'MOD.Core.TransformComponent');
bt.Position = { x: BOSS_POS[0], y: BOSS_POS[1], z: 0 };
bt.Scale = { x: 1, y: 1, z: 1 };
bossComps.find((c) => c['@type'] === 'MOD.Core.SpriteRendererComponent').SpriteRUID = ZAKUM.stand;
b.entity('RaidBoss', bossComps, {});

for (const [name, pos] of Object.entries(HERO_POS)) {
  if (!b.find(name)) b.placeModel(name, HERO_MODEL, { pos });
  else b.patch(name, { pos });
}

b.write(MAP);
for (const e of b.listEntities().filter((e) => /Raid|SpawnLocation|npc|Portal/.test(e.path))) {
  const t = b.component(e.path, 'MOD.Core.TransformComponent');
  console.log(e.path.split('/').pop(), t ? JSON.stringify(t.Position) : '', e.modelId || '');
}
console.log(JSON.stringify(b.getMapInfo()));
