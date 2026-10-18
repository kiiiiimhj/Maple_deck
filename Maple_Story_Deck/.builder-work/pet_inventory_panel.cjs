// 인벤토리 펫 보기 전용 펫 장비 목록(전체/옷/모자/목걸이 4탭 + 24칸)을 EquipmentGroup.ui에 추가한다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const FILE = "ui/EquipmentGroup.ui";
const b = UIBuilder.load(FILE);
const P = "Inventory/Panel/PetInventoryPanel";
if (b.find(P)) b.remove(P);

b.empty(P, { anchor: "middle-right", pivot: [0.5, 0.5], pos: [-440, -38.1974], rect_size: [781.1024, 719], enable: false });
b.sprite(P + "/GridBackground", { pos: [-5, 0], rect_size: [761.1024, 510], image_ruid: "d64558d3613a4e9bbe94fb4223e9d88d", color: "#FFFFFF", sprite_type: 1 });

const tabs = [
  ["All", "c9a065e195784b9dacc41465a8192df2", 40],
  ["Coat", "b41b2a76b9cf4074baa4c727ca5e1ac9", 40],
  ["Cap", "c01afff596084f60b66e2763b0bb92aa", 48],
  ["Necklace", "2953509cd0ff43b9a0eb31abb5646853", 50],
];
b.empty(P + "/Tabs", { pos: [0, 303.5], rect_size: [781.1024, 100] });
tabs.forEach(([name, icon, size], i) => {
  const t = `${P}/Tabs/${name}`;
  b.button(t, "", { pos: [-150 + 100 * i, 0], rect_size: [100, 100], image_ruid: "62049d396c78487b8a49dd3872431ec8", bg_color: "#FFFFFF", sprite_type: 0 });
  b.sprite(t + "/Icon", { pos: [0, 13], rect_size: [size, size], image_ruid: icon, color: "#FFFFFF", sprite_type: 0 });
  b.text(t + "/Label", "", { pos: [0, -19], rect_size: [96, 32], size: 20, bold: true, color: "#FFFFFF" });
});

b.empty(P + "/Cells", { pos: [0, 0], rect_size: [781.1024, 719] });
for (let i = 0; i < 24; i++) {
  const c = `${P}/Cells/Cell${i}`;
  const x = -315.2 + 120.7 * (i % 6), y = 178.65 - 120.7 * Math.floor(i / 6);
  b.button(c, "", { pos: [x, y], rect_size: [112.7, 112.7], image_ruid: "dc47ae63ae6d4b489caae625640c06b8", bg_color: "#FFFFFF", sprite_type: 1 });
  b.sprite(c + "/Icon", { pos: [0, 0], rect_size: [80, 80], image_ruid: "1705e3c5b2c146ac9a699f96fb067408", color: "#FFFFFF", sprite_type: 0 });
  b.sprite(c + "/Dim", { pos: [0, 0], rect_size: [104, 104], color: { r: 0, g: 0, b: 0, a: 0.6 }, sprite_type: 1 });
  b.panel(c + "/Worn", { pos: [0, 38], rect_size: [84, 26], color: "#2E9E4F", alpha: 0.95, text: "", text_size: 15, text_bold: true, text_color: "#FFFFFF", enable: false });
}

b.write(FILE, {
  bind: {
    mlua: "RootDesk/MyDesk/Pet/PetUI.mlua",
    props: { PetInventoryPanel: P },
  },
});
