// 아이언 바디(레이온 패시브, Card195) 하단 패시브 아이콘 — DefaultGroup의 SelfRecoveryBuff 3노드를 그대로 본떠 추가(2026-10-01).
// 이미 있으면 새로 만들지 않고 바인딩만 다시 넣는다(다시 돌려도 안전). 자리는 런타임에 RepositionBuffIcons가 잡는다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const FILE = "ui/DefaultGroup.ui";
const ICON = "52162587bc534b9385af8c77513d93d4";
const T = "MOD.Core.UITransformComponent", S = "MOD.Core.SpriteGUIRendererComponent", TOUCH = "MOD.Core.UITouchReceiveComponent";
const clone = (o) => JSON.parse(JSON.stringify(o));
const b = UIBuilder.read(FILE);
const src = "SelfRecoveryBuff";
if (!b.find("IronBodyBuff")) {
  const st = b.getComponent(src, T);
  b.empty("IronBodyBuff", { anchor: "middle-center", pos: [st.anchoredPosition.x, st.anchoredPosition.y], rect_size: [50, 50], enable: false });
  b.upsertComponent("IronBodyBuff", T, clone(st));
  b.patch("IronBodyBuff", { display_order: b.find(src).jsonString.displayOrder });

  b.sprite("IronBodyBuff/IronBodyFill", { rect_size: [50, 50] });
  b.upsertComponent("IronBodyBuff/IronBodyFill", T, clone(b.getComponent(`${src}/SelfRecoveryFill`, T)));
  b.upsertComponent("IronBodyBuff/IronBodyFill", S, clone(b.getComponent(`${src}/SelfRecoveryFill`, S)));
  b.patch("IronBodyBuff/IronBodyFill", { display_order: 0 });

  b.sprite("IronBodyBuff/IronBodyIcon", { rect_size: [50, 50] });
  b.upsertComponent("IronBodyBuff/IronBodyIcon", T, clone(b.getComponent(`${src}/SelfRecoveryIcon`, T)));
  const icon = clone(b.getComponent(`${src}/SelfRecoveryIcon`, S));
  icon.ImageRUID = { DataId: ICON };
  b.upsertComponent("IronBodyBuff/IronBodyIcon", S, icon);
  const touch = b.getComponent(`${src}/SelfRecoveryIcon`, TOUCH);
  if (touch) b.upsertComponent("IronBodyBuff/IronBodyIcon", TOUCH, clone(touch));
  b.patch("IronBodyBuff/IronBodyIcon", { display_order: 1 });
}
b.write(FILE, { strict: false, bind: { mlua: "RootDesk/MyDesk/Card/CardManager.mlua", props: { ironBodyBuff: "IronBodyBuff", ironBodyFill: "IronBodyBuff/IronBodyFill" } } });
const c = UIBuilder.read(FILE);
for (const p of [src, `${src}/SelfRecoveryIcon`, "IronBodyBuff", "IronBodyBuff/IronBodyFill", "IronBodyBuff/IronBodyIcon"]) {
  const e = c.find(p);
  console.log(p, e.componentNames, "enable=" + e.jsonString.enable, "order=" + e.jsonString.displayOrder);
}
