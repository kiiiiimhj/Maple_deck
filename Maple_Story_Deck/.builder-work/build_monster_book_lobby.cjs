// 로비(ui/TitleGroup.ui) 오른쪽 아이콘 줄 맨 아래(레이드 버튼 아래)에 몬스터 도감 버튼 추가 — 유저 지정 2026-09-29
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const b = UIBuilder.read("ui/TitleGroup.ui");
if (b.find("MonsterBookButton")) throw new Error("already exists");
b.button("MonsterBookButton", "", {
  anchor: "middle-right", pos: [-30, -185], rect_size: [156, 156],
  image_ruid: "dacd1f3228684aa2846095ebead3c9fe", bg_color: { r: 1, g: 1, b: 1, a: 1 }, sprite_type: 0,
});
b.patchComponent("MonsterBookButton", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
// 레드닷은 업적 버튼 레드닷과 같은 그림/자리
const dot = b.getComponent("AchievementButton/RedDot", "MOD.Core.SpriteGUIRendererComponent");
b.sprite("MonsterBookButton/RedDot", { rect_size: [56, 56], pos: [57, 57], image_ruid: dot.ImageRUID.DataId, color: { r: 1, g: 1, b: 1, a: 1 }, sprite_type: 0, enable: false });
b.patchComponent("MonsterBookButton/RedDot", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1, DropShadow: true, DropShadowColor: { r: 0, g: 0, b: 0, a: 0.65 }, DropShadowDistance: 3.22 });
b.write("ui/TitleGroup.ui", {
  bind: {
    mlua: "RootDesk/MyDesk/MonsterBook/MonsterBookUI.mlua",
    props: { lobbyButton: "MonsterBookButton", lobbyRedDot: "MonsterBookButton/RedDot" },
  },
});
console.log("lobby button added");
