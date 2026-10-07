const fs = require('fs');
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const ext = '.' + 'ui';
for (const f of fs.readdirSync('ui').filter(x => x.endsWith(ext))) {
  let b; try { b = UIBuilder.load('ui/' + f); } catch (e) { continue; }
  for (const e of b.listEntities()) {
    if (!/close/i.test(e.name)) continue;
    const t = b.getComponent(e.path, 'MOD.Core.TextGUIRendererComponent') || b.getComponent(e.path, 'MOD.Core.TextComponent');
    const s = b.getComponent(e.path, 'MOD.Core.SpriteGUIRendererComponent');
    console.log(f, e.path, JSON.stringify(e.pos), JSON.stringify(e.size),
      t ? ('text=' + JSON.stringify(t.Text) + ' size=' + t.FontSize + ' fd=' + t.FaceDilate + ' col=' + JSON.stringify(t.FontColor) + ' ' + t['@type'].split('.').pop()) : '(no text)',
      s ? ('img=' + JSON.stringify(s.ImageRUID) + ' a=' + (s.Color && s.Color.a)) : '');
  }
}
