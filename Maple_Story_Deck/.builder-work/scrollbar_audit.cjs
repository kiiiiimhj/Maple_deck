// UIGridScrollBar(SliderComponent) 스크롤바 핸들 색·알파 조사 — 읽기 전용
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const files = fs.readdirSync("ui").filter(f => f.endsWith(".ui"));
for (const f of files) {
  const b = UIBuilder.load("ui/" + f);
  for (const e of b.listEntities()) {
    const p = e.path || e;
    const s = b.getComponent(p, "MOD.Core.SliderComponent");
    if (!s) continue;
    const sp = b.getComponent(p, "MOD.Core.SpriteGUIRendererComponent");
    const pick = {};
    for (const k of Object.keys(s)) if (/color|ruid|image|handle|fill|bg|background/i.test(k)) pick[k] = s[k];
    console.log(f, p, JSON.stringify(pick), "sprite:", sp && JSON.stringify({c: sp.Color, r: sp.ImageRUID}));
  }
}
