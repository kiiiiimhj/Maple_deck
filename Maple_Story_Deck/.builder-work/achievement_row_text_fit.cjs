// 2026-09-23 유저 지정: 업적 행 글자 넘침 방지.
// 설명(DescText)이 진행도(ProgressText) 칸과 겹쳐 있었다(설명 x -272~128 / 진행도 x 65~255) →
// 설명 왼쪽 끝은 그대로 두고 폭을 330(-272~58)으로 줄이고, 설명·진행도 모두 BestFit(넘치면 글자 축소)을 켠다
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const FILE = 'ui/AchievementGroup.ui';
const ROW = 'Panel/List/Grid/RowTemplate';
const TXT = 'MOD.Core.TextGUIRendererComponent';
const b = UIBuilder.load(FILE);
const LEFT = -272, W = 330;
b.patch(ROW + '/DescText', { pos: [LEFT + W / 2, -19], rect_size: [W, 30] });
b.patchComponent(ROW + '/DescText', TXT, { BestFit: true, MinSize: 13, MaxSize: 20 });
b.patchComponent(ROW + '/ProgressText', TXT, { BestFit: true, MinSize: 13, MaxSize: 20 });
b.write(FILE);
for (const e of b.listEntities().filter(e => /RowTemplate\/(DescText|ProgressText|NameText)$/.test(e.path))) {
  const t = b.getComponent(e.path, TXT);
  console.log(e.path.split('RowTemplate/')[1], JSON.stringify(e.pos), JSON.stringify(e.size), 'bestfit=' + t.BestFit, t.MinSize + '~' + t.MaxSize);
}
