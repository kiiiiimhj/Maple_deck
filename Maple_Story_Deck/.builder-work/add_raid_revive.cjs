// RaidGroup.ui — 유령 상태에서 화면 중앙에 뜨는 "부활!" 창 추가 (유저 지정 2026-09-21)
const { UIBuilder } = require("G:/Maple_Story_Deck/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI = "G:/Maple_Story_Deck/ui/RaidGroup.ui";
const MLUA = "G:/Maple_Story_Deck/RootDesk/MyDesk/Raid/RaidUI.mlua";

const b = UIBuilder.load(UI);

// 액자 안쪽(전투 화면) 한가운데. 기본은 꺼둔 상태이고 RaidUI가 IsGhost일 때만 켠다.
b.panel("RevivePanel", {
  anchor: "middle-center",
  pos: [0, -20],
  rect_size: [560, 260],
  color: { r: 0.04, g: 0.05, b: 0.09, a: 0.9 },
  enable: false,
});

b.text("RevivePanel/Msg", "24시간 넘게 자리를 비워\n캐릭터들이 유령이 되었어요", {
  anchor: "top-center",
  pos: [0, -24],
  rect_size: [520, 88],
  size: 28,
  alignment: 4,
  color: "#cfe4ff",
});

b.button("RevivePanel/BtnRevive", "부활!", {
  anchor: "bottom-center",
  pos: [0, 30],
  rect_size: [320, 108],
  font_size: 46,
  color: "#2a1a05",
  bg_color: { r: 0.94, g: 0.75, b: 0.25, a: 1.0 },
});

b.patchComponent("RevivePanel/Msg", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
b.patchComponent("RevivePanel/BtnRevive", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

// 방치형 개편으로 이 창의 숫자는 "누적 대미지"가 아니라 캐릭터별 초당 피해량이 됐다
b.patchComponent("DpsWindow/Title", "MOD.Core.TextGUIRendererComponent", { Text: "캐릭터 화력 (초당)" });

b.write(UI, {
  bind: {
    mlua: MLUA,
    props: {
      revivePanel: "RevivePanel",
      btnRevive: "RevivePanel/BtnRevive",
    },
  },
});

console.log("revivePanel id =", b.getId("RevivePanel"));
console.log("btnRevive   id =", b.getId("RevivePanel/BtnRevive"));
