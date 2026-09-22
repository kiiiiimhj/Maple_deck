const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

// 투명 오버레이 자식(TapBtn)으로는 클릭이 안 잡혔다(바인딩은 정상, 스프라이트도 렌더됨 — 실측).
// 동작이 확인된 BtnExit/BtnClaim과 같은 구조로 바꾼다: 패널 엔티티 **자신**이 버튼이 된다.
const UI_PATH = "ui/RaidGroup.ui";
const b = UIBuilder.load(UI_PATH);

b.remove("RewardBox/TapBtn");

b.patchComponent("RewardBox", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: true });
const ref = b.getComponent("BtnExit", "MOD.Core.ButtonComponent");
b.upsertComponent("RewardBox", "MOD.Core.ButtonComponent", ref);

b.write(UI_PATH, {
  bind: {
    mlua: "RootDesk/MyDesk/Raid/RaidUI.mlua",
    props: { btnRewardBox: "RewardBox" },
  },
});
console.log("reward box is now the button itself");
