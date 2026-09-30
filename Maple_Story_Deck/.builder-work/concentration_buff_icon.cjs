// 컨센트레이션(실피드 패시브, Card124) 하단 패시브 아이콘 — DefaultGroup의 CriticalShotBuff 3노드를 그대로 본떠 추가(2026-09-30).
// 이미 있으면 새로 만들지 않고 바인딩만 다시 넣는다(다시 돌려도 안전).
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const FILE = "ui/DefaultGroup.ui";
const ICON = "f0007cc9b4324713b0ad8ee938f40325";
const T = "MOD.Core.UITransformComponent", S = "MOD.Core.SpriteGUIRendererComponent", TOUCH = "MOD.Core.UITouchReceiveComponent";
const clone = (o) => JSON.parse(JSON.stringify(o));
const b = UIBuilder.read(FILE);

if (!b.find("ConcentrationBuff")) {
  const src = "CriticalShotBuff";
  // 자리는 런타임에 RepositionBuffIcons가 다시 잡는다 — 연속 사격(398) 다음 칸으로 둔다
  b.empty("ConcentrationBuff", { anchor: "middle-center", pos: [452, 195], rect_size: [50, 50], enable: false });
  const t = clone(b.getComponent(src, T));
  t.anchoredPosition = { x: 452, y: t.anchoredPosition.y };
  t.OffsetMin = { x: t.OffsetMin.x + 162, y: t.OffsetMin.y };
  t.OffsetMax = { x: t.OffsetMax.x + 162, y: t.OffsetMax.y };
  if (t.Position) t.Position = { x: t.Position.x + 162, y: t.Position.y, z: t.Position.z };
  b.upsertComponent("ConcentrationBuff", T, t);
  b.patch("ConcentrationBuff", { display_order: 62 });

  b.sprite("ConcentrationBuff/ConcentrationFill", { rect_size: [50, 50] });
  b.upsertComponent("ConcentrationBuff/ConcentrationFill", T, clone(b.getComponent(`${src}/CriticalShotFill`, T)));
  b.upsertComponent("ConcentrationBuff/ConcentrationFill", S, clone(b.getComponent(`${src}/CriticalShotFill`, S)));
  b.patch("ConcentrationBuff/ConcentrationFill", { display_order: 0 });

  b.sprite("ConcentrationBuff/ConcentrationIcon", { rect_size: [50, 50] });
  b.upsertComponent("ConcentrationBuff/ConcentrationIcon", T, clone(b.getComponent(`${src}/CriticalShotIcon`, T)));
  const icon = clone(b.getComponent(`${src}/CriticalShotIcon`, S));
  icon.ImageRUID = { DataId: ICON };
  b.upsertComponent("ConcentrationBuff/ConcentrationIcon", S, icon);
  b.upsertComponent("ConcentrationBuff/ConcentrationIcon", TOUCH, clone(b.getComponent(`${src}/CriticalShotIcon`, TOUCH)));
  b.patch("ConcentrationBuff/ConcentrationIcon", { display_order: 1 });
}

b.write(FILE, {
  strict: false,
  bind: {
    mlua: "RootDesk/MyDesk/Card/CardManager.mlua",
    props: { concentrationBuff: "ConcentrationBuff", concentrationFill: "ConcentrationBuff/ConcentrationFill" },
  },
});
const c = UIBuilder.read(FILE);
for (const p of ["CriticalShotBuff", "ConcentrationBuff", "ConcentrationBuff/ConcentrationFill", "ConcentrationBuff/ConcentrationIcon"]) {
  const e = c.find(p);
  console.log(p, e.componentNames, "enable=" + e.jsonString.enable, "order=" + e.jsonString.displayOrder);
}
console.log("src anchored", JSON.stringify(c.getComponent("CriticalShotBuff", T).anchoredPosition), "new", JSON.stringify(c.getComponent("ConcentrationBuff", T).anchoredPosition), JSON.stringify(c.getComponent("ConcentrationBuff", T).AnchorsMin));
