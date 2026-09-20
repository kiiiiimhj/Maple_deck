// 월드 선택 팝업 — 잠긴 에피소드 표시(2026-09-20)
// 가운데 사진(WorldImageCenterPhoto, 510x154) 위에 어두운 판 + 흰 자물쇠 + 안내 문구. 기본 꺼짐, 클릭 통과
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/WorldCharacterSelectGroup.ui";
const PHOTO = "Panel/WorldImageCenterPhoto";
const b = UIBuilder.load(FILE);

b.sprite(`${PHOTO}/LockOverlay`, {
  anchor: "stretch", pos: [0, 0], rect_size: [510, 154],
  color: "#000000", alpha: 0.6, sprite_type: 0, raycast: false, enable: false,
});
// 흰 자물쇠 — 인게임 슬롯6 잠금(DefaultGroup CardSlots/Card6/LockIcon)과 같은 에셋
b.sprite(`${PHOTO}/LockOverlay/LockIcon`, {
  anchor: "middle-center", pos: [0, 24], rect_size: [44, 51],
  image_ruid: "e7d6c99257db46e7a45b845b7615e5f5", color: "#FFFFFF", alpha: 1.0, sprite_type: 0, raycast: false,
});
b.patchComponent(`${PHOTO}/LockOverlay/LockIcon`, "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
b.text(`${PHOTO}/LockOverlay/Hint`, "태초의 마을 10분 생존 시 열림", {
  size: 26, color: "#FFFFFF", bold: true, alignment: 4,
  outline: true, outline_color: "#000000", outline_width: 3,
  anchor: "middle-center", pos: [0, -32], rect_size: [500, 40],
});
b.patchComponent(`${PHOTO}/LockOverlay/Hint`, "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

b.write(FILE, {
  bind: {
    mlua: "RootDesk/MyDesk/UI/WorldCharacterSelectUI.mlua",
    props: {
      lockOverlay: `${PHOTO}/LockOverlay`,
      lockHintText: `${PHOTO}/LockOverlay/Hint`,
    },
  },
});
console.log("overlay id", b.getId(`${PHOTO}/LockOverlay`), "hint id", b.getId(`${PHOTO}/LockOverlay/Hint`));
