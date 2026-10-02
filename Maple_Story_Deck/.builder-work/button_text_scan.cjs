// 버튼 글씨 스타일 조사: ButtonComponent + 스프라이트가 있는 엔티티의 글씨(자기 자신 또는 바로 아래 자식)를 나열한다.
// 출력: JSON(파일, 버튼 경로, 글씨 경로, 버튼 이미지 RUID, 글씨 컴포넌트 종류, 현재 색/외곽선/정렬)
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const SPR = "MOD.Core.SpriteGUIRendererComponent";
const BTN = "MOD.Core.ButtonComponent";
const TXT = "MOD.Core.TextComponent";
const TGR = "MOD.Core.TextGUIRendererComponent";

const out = [];
for (const f of fs.readdirSync("ui").filter((n) => n.endsWith(".ui"))) {
  const file = "ui/" + f;
  const b = UIBuilder.read(file);
  const byPath = new Map(b.entities.map((e) => [e.jsonString.path, e]));
  const comp = (e, t) => (e.jsonString["@components"] || []).find((c) => c["@type"] === t);
  for (const e of b.entities) {
    if (!comp(e, BTN)) continue;
    const spr = comp(e, SPR);
    if (!spr) continue;
    const p = e.jsonString.path;
    const cands = [e, ...b.entities.filter((c) => {
      const cp = c.jsonString.path;
      return cp.startsWith(p + "/") && !cp.slice(p.length + 1).includes("/");
    })];
    for (const t of cands) {
      const tc = comp(t, TGR) || comp(t, TXT);
      if (!tc) continue;
      out.push({
        file, btn: p, txt: t.jsonString.path, ruid: spr.ImageRUID || "", sprColor: spr.Color,
        kind: tc["@type"].split(".").pop(), text: tc.Text, loc: tc.IsLocalizationKey,
        enable: t.jsonString.enable !== false, compEnable: tc.Enable !== false,
        fontColor: tc.FontColor, outlineW: tc.OutlineWidth, outlineC: tc.OutlineColor, useOutline: tc.UseOutLine,
        dilate: tc.FaceDilate, align: tc.Alignment, hAlign: tc.HorizontalAlignment, vAlign: tc.VerticalAlignment,
        fontSize: tc.FontSize, bold: tc.Bold, dropShadow: tc.DropShadow,
      });
    }
  }
}
fs.writeFileSync(path.join(process.argv[2] || ".", "button_texts.json"), JSON.stringify(out, null, 1));
console.log("count", out.length);
