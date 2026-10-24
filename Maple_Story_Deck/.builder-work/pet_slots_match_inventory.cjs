// 펫 장비 칸을 인벤토리 칸(UIItemSlot.model)·캐릭터 장비 칸(EquipInfoGrid)과 같은 모양으로 맞춘다 — 2026-10-21 유저 지정
// 오른쪽 펫 장비 목록 Cell0~23: 아이콘 80x80 (0,-8) / 딤 = 이미지 없는 100x100 (2,0) (0.05,0.05,0.05,0.85)
//   / 장착 중 = 배지 대신 가운데 흰 굵은 글자(UIItemSlot.SetEquippedMark와 같은 값)
// 왼쪽 장착 칸 Cap/Coat/Necklace: 배경 Sliced(캐릭터 칸과 같음) + 미보유 딤(알파 0.28 대신 인벤토리와 같은 딤)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/EquipmentGroup.ui";
const b = UIBuilder.load(FILE);
const SPR = "MOD.Core.SpriteGUIRendererComponent";
const TXT = "MOD.Core.TextGUIRendererComponent";
const CELLS = "Inventory/Panel/PetInventoryPanel/Cells";
const SLOTS = "Inventory/Panel/EquipPanel/PetGearSlots";
const DIM = { r: 0.05, g: 0.05, b: 0.05, a: 0.85 };

for (let i = 0; i < 24; i++) {
  const cell = `${CELLS}/Cell${i}`;
  if (!b.find(cell)) continue;
  b.patch(`${cell}/Icon`, { pos: [0, -8], rect_size: [80, 80] });
  b.patch(`${cell}/Dim`, { pos: [2, 0], rect_size: [100, 100] });
  b.patchComponent(`${cell}/Dim`, SPR, { ImageRUID: { DataId: "" }, Color: DIM });
  b.patch(`${cell}/Worn`, { pos: [2, 0], rect_size: [100, 40] });
  b.patchComponent(`${cell}/Worn`, SPR, { Color: { r: 1, g: 1, b: 1, a: 0 } });
  b.patchComponent(`${cell}/Worn`, TXT, {
    FontSize: 24, FontStyle: 1, FontColor: { r: 1, g: 1, b: 1, a: 1 },
    OutlineColor: { r: 0, g: 0, b: 0, a: 1 }, OutlineWidth: 2,
    HorizontalAlignment: 2, VerticalAlignment: 512,
  });
}

for (const slot of ["Cap", "Coat", "Necklace"]) {
  const p = `${SLOTS}/${slot}`;
  b.patchComponent(p, SPR, { Type: 1 });
  if (!b.find(`${p}/Dim`)) {
    b.sprite(`${p}/Dim`, { pos: [0, 0], rect_size: [84, 84], color: DIM, image_ruid: "", sprite_type: 0, raycast: false });
    b.patchComponent(`${p}/Dim`, SPR, { ImageRUID: { DataId: "" } });
  }
  // 그리는 순서: Icon → Dim → 글자들(딤이 이름·장착 표시를 덮지 않게)
  const order = ["Icon", "Dim", "Label", "Mark", "Stat"];
  order.forEach((name, idx) => { if (b.find(`${p}/${name}`)) b.patch(`${p}/${name}`, { display_order: idx }); });
}

b.write(FILE, { strict: false });
