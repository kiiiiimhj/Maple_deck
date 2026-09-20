// 강화/합성 성공 연출 칸 추가 (2026-09-20)
// - EquipPopup 아이콘 칸(IconFrame) 위: UpgradeFx 340x340
// - ComposePopup 베이스 슬롯(BaseSlot) 위: ComposeFx 240x240
// 둘 다 기본 꺼짐, 클릭 통과(raycast false), 스킬 이펙트 애니메이션 클립을 한 번 재생(Onetime)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/EquipmentGroup.ui";
const FX_RUID = "14bf6b37407143888f281f4523789f2b";
const b = UIBuilder.load(FILE);

const targets = [
  { path: "Inventory/EquipPopup/Panel/LeftColumn/IconFrame/UpgradeFx", size: [340, 340] },
  { path: "Inventory/ComposePopup/Panel/LeftColumn/BaseSlot/ComposeFx", size: [240, 240] },
];

for (const t of targets) {
  b.sprite(t.path, {
    anchor: "middle-center",
    pos: [0, 0],
    rect_size: t.size,
    sprite_type: 0,
    raycast: false,
    enable: false,
    image_ruid: FX_RUID,
    color: "#FFFFFF",
    alpha: 1.0,
  });
  // 원본 비율 유지 + 한 번만 재생
  b.patchComponent(t.path, "MOD.Core.SpriteGUIRendererComponent", {
    PreserveSprite: 1,
    AnimClipPlayType: 0,
  });
}

b.write(FILE, { lint_verbose: true });
b.injectBindings("RootDesk/MyDesk/Inventory/UI/UIEquipPopup.mlua", {
  UpgradeFx: "Inventory/EquipPopup/Panel/LeftColumn/IconFrame/UpgradeFx",
});
b.injectBindings("RootDesk/MyDesk/Inventory/UI/UIComposePopup.mlua", {
  ComposeFx: "Inventory/ComposePopup/Panel/LeftColumn/BaseSlot/ComposeFx",
});

for (const t of targets) console.log(t.path, "id=", b.getId(t.path));
