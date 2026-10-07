const fs = require('fs'); const cp = require('child_process');
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const name = 'EpisodeRewardGroup' + '.ui';
const old = cp.execSync('git show HEAD:Maple_Story_Deck/ui/' + name, { cwd: '..', maxBuffer: 1 << 28 }).toString();
const tmp = '.builder-work/_old_' + name; fs.writeFileSync(tmp, old);
const a = UIBuilder.load(tmp), b = UIBuilder.load('ui/' + name);
const tr = (x, p) => JSON.stringify(x.getComponent(p, 'MOD.Core.UITransformComponent'));
for (const e of b.listEntities()) {
  const before = a.find(e.path) ? tr(a, e.path) : null; const after = tr(b, e.path);
  if (before !== after) { console.log('CHANGED', e.path); console.log(' before', before); console.log(' after ', after); }
}
for (const e of b.listEntities()) if (/fx|effect|glow|shine|burst|light|open|box|chest/i.test(e.name)) console.log('FX?', e.path, JSON.stringify(e.pos), JSON.stringify(e.size), e.enable);
fs.unlinkSync(tmp);
