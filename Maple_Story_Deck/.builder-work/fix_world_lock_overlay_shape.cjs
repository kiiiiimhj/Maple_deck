// 잠금 딤드가 둥근 기본 스프라이트라 타원처럼 보였다 → 다른 팝업 딤드와 같은 단색 사각 이미지로 교체(2026-09-20)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/WorldCharacterSelectGroup.ui";
const PATH = "Panel/WorldImageCenterPhoto/LockOverlay";
const b = UIBuilder.load(FILE);

console.log("before:", JSON.stringify(b.getComponent(PATH, "MOD.Core.SpriteGUIRendererComponent").ImageRUID));
b.patchComponent(PATH, "MOD.Core.SpriteGUIRendererComponent", {
  // AttendanceGroup/Dimmer 등 다른 딤드와 같은 단색 사각 스프라이트
  ImageRUID: { DataId: "4fea64a3307cda641809ad8be0d4890b" },
  Type: 0,
});
b.write(FILE);
console.log("after:", JSON.stringify(b.getComponent(PATH, "MOD.Core.SpriteGUIRendererComponent").ImageRUID));
