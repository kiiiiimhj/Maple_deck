// 버튼 엔티티 자체엔 스프라이트가 없고(또는 그림 RUID가 색 표에 없고) 글씨가 있는 버튼 찾기 — 글씨 통일 누락 점검용
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const comp = (e, t) => (e.jsonString["@components"] || []).find((c) => c["@type"] === "MOD.Core." + t);
const rid = (s) => { const v = s && s.ImageRUID; return (typeof v === "string" ? v : v && v.DataId) || ""; };
for (const f of fs.readdirSync("ui").filter((n) => n.endsWith(".ui"))) {
  const b = UIBuilder.read("ui/" + f);
  for (const e of b.entities) {
    if (!comp(e, "ButtonComponent")) continue;
    const p = e.jsonString.path;
    const kids = b.entities.filter((c) => c.jsonString.path === p || c.jsonString.path.startsWith(p + "/"));
    const texts = kids.map((c) => comp(c, "TextGUIRendererComponent") || comp(c, "TextComponent")).filter((t) => t && t.Text && String(t.Text).trim());
    if (!texts.length) continue;
    const selfSpr = comp(e, "SpriteGUIRendererComponent");
    if (selfSpr && rid(selfSpr)) continue;
    const childSpr = kids.filter((c) => c !== e && comp(c, "SpriteGUIRendererComponent")).map((c) => c.jsonString.path.slice(p.length + 1) + ":" + rid(comp(c, "SpriteGUIRendererComponent")).slice(0, 8));
    console.log(f, p.replace(/^\/ui\/[^/]+\//, ""), "self:", selfSpr ? "empty" : "none", "|", childSpr.slice(0, 3).join(", "), "|", texts.slice(0, 2).map((t) => String(t.Text).slice(0, 12)).join(" / "));
  }
}
