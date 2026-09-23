// 조사(읽기 전용): DefaultGroup 루트 자식들의 형제 순서/displayOrder — 튜토리얼 딤과 가짜 달팽이 순서 확인
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.read('ui/DefaultGroup.ui');
let idx = 0;
for (const e of b.listEntities()) {
  if (e.depth !== 1) continue;
  const j = b.find(e.path).jsonString;
  const mark = /Tutorial|Banner|Finger|Aim/i.test(e.path) ? '  <==' : '';
  console.log(String(idx++).padStart(3), 'displayOrder=' + j.displayOrder, e.path.split('/').pop(), e.enable, mark);
}
for (const e of b.listEntities()) if (/TutorialAimStage/.test(e.path)) console.log('  ', e.path, 'displayOrder=' + b.find(e.path).jsonString.displayOrder, JSON.stringify(e.size), e.enable);
