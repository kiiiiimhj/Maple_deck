// 베노아 패시브 6종(231~236) 하단 버프 아이콘 — DefaultGroup의 ThiefCunningBuff(린) 3노드를 그대로 본떠 추가(2026-10-03).
// 이미 있으면 새로 만들지 않고 아이콘/바인딩만 다시 넣는다(다시 돌려도 안전). 자리는 런타임에 RepositionBuffIcons가 잡는다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const FILE = "ui/DefaultGroup" + ".ui";
const T = "MOD.Core.UITransformComponent", S = "MOD.Core.SpriteGUIRendererComponent", TOUCH = "MOD.Core.UITouchReceiveComponent";
const clone = (o) => JSON.parse(JSON.stringify(o));
const src = "ThiefCunningBuff", srcFill = `${src}/ThiefCunningFill`, srcIcon = `${src}/ThiefCunningIcon`;
const items = [
  { name: "MagicAccel", prop: "magicAccel", icon: "c485fca6d6724e4cb1acb02e90f8239d" },
  { name: "ManaWave", prop: "manaWave", icon: "4aa43e3a1e584ba181ce7c991a3c3342" },
  { name: "ElementalDrain", prop: "elementalDrain", icon: "b114e58c48564b8cad6367aed2a1feed" },
  { name: "MagicGuard", prop: "magicGuard", icon: "4c930291470f4d1490a3bbb31dd09e91" },
  { name: "HighWisdom", prop: "highWisdom", icon: "8207f471051746bfa3be1bd2a47a844c" },
  { name: "ElementalAdept", prop: "elementalAdept", icon: "8d5f1b526b664d5094014e54e41040cf" },
];
const b = UIBuilder.read(FILE);
if (!b.find(src) || !b.find(srcFill) || !b.find(srcIcon)) throw new Error("source buff nodes missing");
const props = {};
for (const it of items) {
  const root = `${it.name}Buff`, fill = `${root}/${it.name}Fill`, icon = `${root}/${it.name}Icon`;
  if (!b.find(root)) {
    const st = b.getComponent(src, T);
    b.empty(root, { anchor: "middle-center", pos: [st.anchoredPosition.x, st.anchoredPosition.y], rect_size: [50, 50], enable: false });
    b.upsertComponent(root, T, clone(st));
    b.patch(root, { display_order: b.find(src).jsonString.displayOrder });
    b.sprite(fill, { rect_size: [50, 50] });
    b.upsertComponent(fill, T, clone(b.getComponent(srcFill, T)));
    b.upsertComponent(fill, S, clone(b.getComponent(srcFill, S)));
    b.patch(fill, { display_order: 0 });
    b.sprite(icon, { rect_size: [50, 50] });
    b.upsertComponent(icon, T, clone(b.getComponent(srcIcon, T)));
    b.upsertComponent(icon, S, clone(b.getComponent(srcIcon, S)));
    const touch = b.getComponent(srcIcon, TOUCH);
    if (touch) b.upsertComponent(icon, TOUCH, clone(touch));
    b.patch(icon, { display_order: 1 });
  }
  b.patchComponent(icon, S, { ImageRUID: { DataId: it.icon } });
  props[`${it.prop}Buff`] = root;
  props[`${it.prop}Fill`] = fill;
}
b.write(FILE, { strict: false, bind: { mlua: "RootDesk/MyDesk/Card/CardManager.mlua", props } });
const c = UIBuilder.read(FILE);
for (const it of items) {
  const e = c.find(`${it.name}Buff`), ic = c.getComponent(`${it.name}Buff/${it.name}Icon`, S);
  console.log(it.name, e ? e.id : "MISSING", "enable=" + (e && e.jsonString.enable), "icon=" + (ic && JSON.stringify(ic.ImageRUID)), "touch=" + c.hasComponent(`${it.name}Buff/${it.name}Icon`, TOUCH));
}
