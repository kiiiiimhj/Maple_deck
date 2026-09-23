// 2026-09-23 유저 지정 "등급은 원래대로": raid_reward_table_grade_col.cjs 되돌리기 —
// 줄 배경(Bg)을 원래대로 줄 전체(700x54, 가운데)로, 등급 칸 구분선(GradeLine)은 삭제.
// ⚠ GradeLine 이름은 다시 쓰지 말 것(같은 경로 remove 후 재생성하면 Maker가 임포트 안 함)
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const FILE = 'ui/RaidGroup.ui';
const b = UIBuilder.load(FILE);
for (let i = 0; i < 7; i++) {
  const row = 'RewardTable/Row' + i;
  b.patch(row + '/Bg', { pos: [0, 0], rect_size: [700, 54] });
  if (b.find(row + '/GradeLine')) b.remove(row + '/GradeLine');
}
b.write(FILE);
for (const e of b.listEntities().filter(e => /Row[0-6]\/(Bg|GradeLine)$/.test(e.path)))
  console.log(e.path.split('RewardTable/')[1], JSON.stringify(e.pos), JSON.stringify(e.size));
