const path = require('path');
const { ModelBuilder } = require('./.claude/skills/msw-general/scripts/model/msw_model_builder.cjs');

// 좀비 stand 애니메이션 RUID
const ZOMBIE_STAND = '37bd3ffa840f4558a179db705941b684';

const m = ModelBuilder.fromTemplate(
  '.claude/skills/msw-general/models/MapObject.model',
  'Monster'
);

// SpriteRendererComponent 에 RUID 세팅
m.component('MOD.Core.SpriteRendererComponent', {
  SpriteRUID: ZOMBIE_STAND,
  SortingLayer: 'MapLayer0',
  OrderInLayer: 5,
});

// MonsterAI 스크립트 컴포넌트 추가
m.addComponent('script.MonsterAI', {});

m.write('RootDesk/MyDesk/Models/Monsters/Monster.model');
console.log('Monster.model created');
