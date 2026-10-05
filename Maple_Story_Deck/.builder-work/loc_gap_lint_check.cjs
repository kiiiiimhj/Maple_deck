// GameOverGroup 쓰기 결과 확인 + lint 에러가 원래(HEAD)부터 있던 것인지 비교 (읽기 전용)
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const F = 'ui/GameOverGroup.ui';
const b = UIBuilder.read(F);
for (let i = 1; i <= 3; i++) {
  const c = b.getComponent(`GameOverBack/GameOverPanel/ScoreBox/TopDps/Rank${i}/RankLabel`, 'MOD.Core.TextGUIRendererComponent');
  console.log('Rank' + i, c.Text, c.IsLocalizationKey);
}
function lintCounts(p) {
  let out = '';
  try { out = execSync(`node .claude/skills/msw-ui-system/scripts/ui_lint.cjs "${p}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const counts = {};
  for (const m of out.matchAll(/\b(L\d{3})\b[^\n]*?\b(ERROR|WARN)/g)) { const k = m[1] + ' ' + m[2]; counts[k] = (counts[k] || 0) + 1; }
  return { counts, tail: out.trim().split('\n').slice(-1)[0] };
}
const tmp = path.join(os.tmpdir(), 'GameOverGroup_head.ui');
fs.writeFileSync(tmp, execSync('git show HEAD:Maple_Story_Deck/' + F, { maxBuffer: 1 << 28 }));
console.log('NOW ', JSON.stringify(lintCounts(F)));
console.log('HEAD', JSON.stringify(lintCounts(tmp)));
