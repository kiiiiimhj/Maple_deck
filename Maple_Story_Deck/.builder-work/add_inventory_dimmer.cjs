// 인벤토리(장비창)에 출석 보상과 똑같은 전체화면 딤을 새로 넣는다 (유저 지정 2026-09-22 + 스샷 2장).
//
// 지금까지 인벤토리에는 전체화면 딤이 **아예 없었다**(판매 확인 서브팝업용 SellConfirm/Dim만 있었음).
// 그래서 출석 팝업은 뒤가 어둡게 덮이는데 인벤토리는 로비가 그대로 밝게 보였다.
//
// 값은 추정하지 않고 /ui/AttendanceGroup/Dimmer에서 읽은 실제 값을 그대로 복제한다:
//   ImageRUID 4fea64a3307cda641809ad8be0d4890b / Color rgba(0,0,0,0.65) / Type 0(Simple) / RaycastTarget true
//   anchor stretch (= AlignmentOption 15) → 캔버스가 아이폰 안전영역 크기로 커져도 같이 늘어난다
// ⚠ alpha는 반드시 0.65 그대로 쓴다 — 같은 RUID라도 검정 alpha 0.72는 아예 렌더되지 않은 전례가 있고,
//   0.65는 출석 딤이 화면에서 정상 동작하는 게 확인된 값이다.
//
// displayOrder: 출석은 Dimmer(0) < Panel(1)이다. 인벤토리는 Panel이 0이었으므로 전부 한 칸씩 밀어
// Dimmer를 맨 아래에 깐다(기존 팝업들끼리의 상대 순서는 그대로 유지).
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI_PATH = "ui/EquipmentGroup.ui";
const DIM_RUID = "4fea64a3307cda641809ad8be0d4890b";

const b = UIBuilder.load(UI_PATH);

b.sprite("Inventory/Dimmer", {
  anchor: "stretch",
  pos: [0, 0],
  image_ruid: DIM_RUID,
  sprite_type: 0, // Simple — 출석 딤과 동일
  color: { r: 0, g: 0, b: 0, a: 0.65 },
  raycast: true, // 딤 뒤의 로비 버튼이 눌리지 않게 막는다(출석 딤도 true)
});

// 딤이 맨 아래, 나머지는 원래 상대 순서 그대로 한 칸씩 위로
const ORDER = [
  ["Inventory/Dimmer", 0],
  ["Inventory/Panel", 1],
  ["Inventory/EquipPopup", 2],
  ["Inventory/UsePopup", 3],
  ["Inventory/ComposePopup", 4],
  ["Inventory/SellConfirm", 5],
];
for (const [id, order] of ORDER) b.patch(id, { display_order: order });

b.write(UI_PATH, { strict: false });

const after = UIBuilder.load(UI_PATH);
const t = after.getComponent("Inventory/Dimmer", "MOD.Core.UITransformComponent");
const s = after.getComponent("Inventory/Dimmer", "MOD.Core.SpriteGUIRendererComponent");
console.log(`RESULT Dimmer id=${after.getId("Inventory/Dimmer")}`);
console.log(`RESULT align=${t.AlignmentOption} offMin=${JSON.stringify(t.OffsetMin)} offMax=${JSON.stringify(t.OffsetMax)}`);
console.log(`RESULT ruid=${JSON.stringify(s.ImageRUID)} color=${JSON.stringify(s.Color)} type=${s.Type} raycast=${s.RaycastTarget}`);
for (const [id] of ORDER) {
  console.log(`RESULT displayOrder ${id} = ${after.find(id).jsonString.displayOrder}`);
}
