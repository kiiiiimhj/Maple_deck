// 인벤토리 딤을 출석 체크 딤과 같은 규격(stretch = AlignmentOption 15)으로 맞춘다 (유저 지정 2026-09-21).
//
// 원인: 전체화면 딤이 두 종류로 갈려 있었다.
//   · 출석/업적/가챠/옵션/그림자상점 등 → anchor stretch(15). 캔버스가 커지면 같이 늘어나 항상 꽉 찬다.
//   · 인벤토리 쪽 → anchor middle-center(0) + RectSize 1920x1080 고정. 16:9가 아닌 화면
//     (모바일 안전영역 캔버스, 울트라와이드 PC 창)에서는 딤이 화면보다 작아 가장자리가 비친다.
// 그래서 인벤토리 딤 2개만 stretch로 바꾼다. 나머지 고정 딤(TutorialDim / DiaShop /
// ConfirmDimmer / RunStartConfirm / RaidGuideDim / RaidTutorial)은 유저가 지목하지 않아 그대로 둔다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const TARGETS = [
  // 실제로 유저가 보는 인벤토리(장비창) 안의 판매 확인 딤
  ["ui/EquipmentGroup.ui", "Inventory/SellConfirm/Dim"],
  // 패키지 인벤토리 그룹의 딤 — 지금은 어떤 스크립트도 안 쓰지만 같은 규격으로 맞춰 둔다
  ["ui/InventoryGroup.ui", "Dimmer"],
];

for (const [path, id] of TARGETS) {
  const b = UIBuilder.load(path);
  b.patch(id, { anchor: "stretch", pos: [0, 0] });
  b.write(path, { strict: false });

  const after = UIBuilder.load(path).getComponent(id, "MOD.Core.UITransformComponent");
  console.log(
    `${path} :: ${id} -> AlignmentOption=${after.AlignmentOption}` +
      ` OffsetMin=${JSON.stringify(after.OffsetMin)} OffsetMax=${JSON.stringify(after.OffsetMax)}`
  );
}
