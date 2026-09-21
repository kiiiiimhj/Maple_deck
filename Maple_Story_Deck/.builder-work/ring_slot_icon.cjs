// EquipmentGroup.ui — 6번째 칸(예전 하의 자물쇠)을 반지 빈 슬롯 아이콘으로 교체
// (유저 지정 2026-09-21: 잠금 해제하고 레이드 보상 반지를 끼는 칸으로)
const { UIBuilder } = require("G:/Maple_Story_Deck/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI = "G:/Maple_Story_Deck/ui/EquipmentGroup.ui";
const SLOT = "Inventory/Panel/EquipPanel/EquipInfoGrid/Pants/Icon";
// GearCategoryEnum.EnumToRUIDTable[Ring] 과 같은 은색 민짜 반지 아이콘
const RING_ICON = "0abf98bb5e4f49bb8fb3b3cf84929812";

const b = UIBuilder.load(UI);

const before = b.getComponent(SLOT, "MOD.Core.SpriteGUIRendererComponent");
console.log("before ImageRUID =", JSON.stringify(before && before.ImageRUID));

// 자물쇠 그림(50x58)이라 다른 칸 아이콘(70x70)과 크기가 달랐다 — 같이 맞춘다
b.patch(SLOT, { rect_size: [70, 70] });
b.patchComponent(SLOT, "MOD.Core.SpriteGUIRendererComponent", {
  ImageRUID: { DataId: RING_ICON },
});

b.write(UI);

const after = b.getComponent(SLOT, "MOD.Core.SpriteGUIRendererComponent");
console.log("after  ImageRUID =", JSON.stringify(after && after.ImageRUID));
