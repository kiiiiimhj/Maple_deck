// 펫 장비 목록 Cell0~23: 살 수 있는(미해금) 장비 = 흰 자물쇠 + 아래 다이아 아이콘·가격 — 2026-10-22 유저 지정
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const FILE = "ui/EquipmentGroup.ui";
const b = UIBuilder.load(FILE);
const CELLS = "Inventory/Panel/PetInventoryPanel/Cells";
const LOCK = "e7d6c99257db46e7a45b845b7615e5f5"; // 흰 자물쇠(카드 슬롯 잠금 그림) — 9b0f8afa는 검은 그림이라 색을 흰색으로 줘도 검게 나옴
const DIA = "81462aeb825b4660991cef05651271cf";
for (let i = 0; i < 24; i++) {
  const cell = `${CELLS}/Cell${i}`;
  if (!b.find(cell)) continue;
  if (b.find(`${cell}/Lock`)) b.patchComponent(`${cell}/Lock`, "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: LOCK }, Color: { r: 1, g: 1, b: 1, a: 1 } });
  else b.sprite(`${cell}/Lock`, { pos: [2, 14], rect_size: [30, 35], image_ruid: LOCK, color: "#FFFFFF", raycast: false, preserve_aspect: true, enable: false });
  // 기본 색(어두운 회색 알파 0.24)이 들어가 다이아가 안 보였다 → 흰색 불투명
  // preserve_aspect=AspectOnly + Sliced면 다이아가 원본 피벗 기준으로 그려져 위(자물쇠 쪽)로 뜬다 → 다른 화면 다이아와 같은 Simple/None
  if (b.find(`${cell}/Price/Dia`)) b.patchComponent(`${cell}/Price/Dia`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 1, g: 1, b: 1, a: 1 }, PreserveSprite: 0, Type: 0 });
  if (b.find(`${cell}/Lock`)) b.patchComponent(`${cell}/Lock`, "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 0, Type: 0 });
  // 새로 만든 칸은 Position이 (0,0)으로 남아 있어 엔진이 그 값을 쓰면 다이아가 칸 가운데(자물쇠 위치)로 간다 → pos로 다시 맞춘다
  if (b.find(`${cell}/Lock`)) b.patch(`${cell}/Lock`, { pos: [2, 14], rect_size: [30, 35] });
  if (b.find(`${cell}/Price`)) {
    b.patch(`${cell}/Price`, { pos: [2, -26], rect_size: [90, 30] });
    b.patch(`${cell}/Price/Dia`, { pos: [-24, 0], rect_size: [26, 26] });
    b.patch(`${cell}/Price/Text`, { pos: [14, 0], rect_size: [52, 30] });
  }
  if (!b.find(`${cell}/Price`)) {
    b.empty(`${cell}/Price`, { pos: [2, -26], rect_size: [90, 30], enable: false });
    b.sprite(`${cell}/Price/Dia`, { pos: [-22, 0], rect_size: [26, 26], image_ruid: DIA, color: "#FFFFFF", raycast: false, preserve_aspect: true });
    b.text(`${cell}/Price/Text`, "500", { pos: [12, 0], rect_size: [52, 30], size: 22, bold: true, color: "#FFFFFF", alignment: 3, outline: true, outline_color: "#000000" });
  }
}
b.write(FILE, { strict: false });
