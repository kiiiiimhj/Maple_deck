// 보상 팝업 장비 상자 툴팁(유저 지정 2026-09-24 "장비 상자 누르면 주문서 누르면 나오는 툴팁 나오게").
// 에피소드 보상 / 레벨 보상 팝업 둘 다:
//   · Panel/GearBoxTooltip — 인벤 ItemNameTooltip과 같은 말풍선(823c09…), 두 줄 들어가게 크게. 평소 꺼짐, 터치 안 막음
//   · Card{n}에 ButtonComponent(Transition 0 — 카드 색 연출을 버튼 틴트가 덮지 않게) + 카드 그림 RaycastTarget
// 위치·문구·자동 닫힘은 RewardTooltipLogic.mlua가 한다. Panel 마지막 자식이라 카드/버튼 위에 그려진다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const BUBBLE = "823c09bacaa54d1780577e455add2918";
const TARGETS = [
  { file: "ui/EpisodeRewardGroup.ui", cards: 9, mlua: "RootDesk/MyDesk/EpisodeReward/EpisodeRewardUI.mlua" },
  { file: "ui/LevelRewardGroup.ui", cards: 20, mlua: "RootDesk/MyDesk/PlayerLevel/LevelRewardUI.mlua" },
];

for (const t of TARGETS) {
  const b = UIBuilder.load(t.file);
  if (!b.find("Panel/GearBoxTooltip")) {
    b.sprite("Panel/GearBoxTooltip", { anchor: "middle-center", pos: [0, 0], rect_size: [440, 150], image_ruid: BUBBLE, sprite_type: 0, color: "#FFFFFF", alpha: 1, raycast: false, pivot: [0.5, 0.5], enable: false });
    b.patchComponent("Panel/GearBoxTooltip", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
    b.text("Panel/GearBoxTooltip/Label", "", { size: 24, bold: true, color: "#4A2A12", alignment: 4, anchor: "middle-center", pos: [0, 8], rect_size: [400, 96], overflow: 0, bestfit: true, min_size: 13, max_size: 24 });
    b.patchComponent("Panel/GearBoxTooltip/Label", "MOD.Core.TextGUIRendererComponent", { Font: "Maple", IsLocalizationKey: false, RaycastTarget: false });
  }
  for (let i = 1; i <= t.cards; i++) {
    const card = `Panel/Viewport/Strip/Card${i}`;
    if (!b.hasComponent(card, "MOD.Core.ButtonComponent")) b.addComponent(card, "MOD.Core.ButtonComponent");
    b.patchComponent(card, "MOD.Core.ButtonComponent", { Transition: 0 });
    b.patchComponent(card, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: true });
  }
  b.write(t.file, { strict: false, bind: { mlua: t.mlua, props: { gearTooltip: "Panel/GearBoxTooltip" } } });
}
