// 뽑기 화면 버튼 조사: ButtonComponent 엔티티와 그 아래(모든 깊이) 글씨, 버튼/자식 스프라이트 RUID
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const FILE = process.argv[2] || "ui/GachaGroup.ui";
const b = UIBuilder.read(FILE);
const comp = (e, t) => (e.jsonString["@components"] || []).find((c) => c["@type"] === "MOD.Core." + t);
const rid = (s) => (s && s.ImageRUID && (s.ImageRUID.DataId || s.ImageRUID)) || "";
const hex = (c) => c ? [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("") : "-";
for (const e of b.entities) {
  if (!comp(e, "ButtonComponent")) continue;
  const p = e.jsonString.path;
  console.log("BTN", p.replace(/^\/ui\/[^/]+\//, ""), "spr", String(rid(comp(e, "SpriteGUIRendererComponent"))).slice(0, 8));
  for (const c of b.entities) {
    const cp = c.jsonString.path;
    if (cp !== p && !cp.startsWith(p + "/")) continue;
    const s = comp(c, "SpriteGUIRendererComponent");
    const t = comp(c, "TextGUIRendererComponent") || comp(c, "TextComponent");
    const rel = cp === p ? "(self)" : cp.slice(p.length + 1);
    if (t && t.Text && String(t.Text).trim()) console.log("   txt", rel, t["@type"].split(".").pop().slice(0, 7), JSON.stringify(String(t.Text).slice(0, 16)), hex(t.FontColor), "ow", t.OutlineWidth, hex(t.OutlineColor), "dl", t.FaceDilate, "uo", t.UseOutLine);
    else if (s && cp !== p) console.log("   spr", rel, String(rid(s)).slice(0, 8));
  }
}
