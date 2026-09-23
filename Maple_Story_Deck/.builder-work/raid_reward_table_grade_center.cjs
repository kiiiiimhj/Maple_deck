// 2026-09-23 유저 지정: 레이드 "등급별 보상" 표의 등급 열이 너무 왼쪽(x -360~-260, 줄 밖으로 삐져나옴)이고
// 왼쪽 정렬이라 F~S가 "등급" 글자 왼쪽 끝에 붙어 보였다 → 열 가운데를 -310 → -290으로 옮기고
// 헤더/각 줄 모두 가로 가운데 정렬(HorizontalAlignment Center=2)로 바꿔 F~S가 "등급" 글자 가운데 아래에 오게 한다
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const FILE = 'ui/RaidGroup.ui';
const TXT = 'MOD.Core.TextGUIRendererComponent';
const X = -290;
const b = UIBuilder.load(FILE);
const paths = ['RewardTable/Head/Grade'];
for (let i = 0; i < 7; i++) paths.push('RewardTable/Row' + i + '/Grade');
for (const p of paths) {
  b.patch(p, { pos: [X, 0] });
  b.patchComponent(p, TXT, { HorizontalAlignment: 2 });
}
b.write(FILE);
for (const p of paths) {
  const e = b.listEntities().find(e => e.path.endsWith(p));
  console.log(p, JSON.stringify(e.pos), JSON.stringify(e.size), 'H=' + b.getComponent(p, TXT).HorizontalAlignment);
}
