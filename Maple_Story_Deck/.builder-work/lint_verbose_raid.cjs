// RaidGroup 린트 경고 중 RewardTable 관련만 보기(재기록 없이 같은 내용으로 write → verbose 출력)
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.load('ui/RaidGroup.ui');
const orig = console.log;
const lines = [];
console.log = (...a) => lines.push(a.join(' '));
try { b.write('ui/RaidGroup.ui', { lint_verbose: true }); } finally { console.log = orig; }
for (const l of lines.join('\n').split('\n')) if (/Grade/.test(l)) console.log(l);
