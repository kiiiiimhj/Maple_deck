const { ModelBuilder } = require('./.claude/skills/msw-general/scripts/model/msw_model_builder.cjs');
const m = ModelBuilder.read('RootDesk/MyDesk/Models/Monsters/Monster.model');
m.value('MOD.Core.SpriteRendererComponent', 'SpriteRUID', '37bd3ffa840f4558a179db705941b684');
m.write('RootDesk/MyDesk/Models/Monsters/Monster.model');
console.log('patched SpriteRUID to zombie stand');
