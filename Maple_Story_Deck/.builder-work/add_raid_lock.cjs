// RaidGroup.ui — 지난 시즌 미수령 보상이 남아 있을 때 새 시즌을 잠그는 딤드 + 중앙 창
// (유저 지정 2026-09-21: "보상 받아야만 시작 가능, 딤드깔고 공격x, 받으면 자동으로 딤드제거")
const { UIBuilder } = require("G:/Maple_Story_Deck/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI = "G:/Maple_Story_Deck/ui/RaidGroup.ui";
const MLUA = "G:/Maple_Story_Deck/RootDesk/MyDesk/Raid/RaidUI.mlua";

const b = UIBuilder.load(UI);

// 딤드. raycast=false로 둬서 "나가기" 버튼은 계속 눌리게 한다(레이드 맵에 갇히지 않도록).
// 전투 정지는 UI가 아니라 RaidScene이 IsGhost/HasPendingReward로 처리한다.
b.sprite("LockDim", {
  anchor: "stretch",
  pos: [0, 0],
  rect_size: [1920, 1080],
  color: { r: 0.0, g: 0.0, b: 0.0, a: 0.72 },
  raycast: false,
  enable: false,
});

b.panel("LockPanel", {
  anchor: "middle-center",
  pos: [0, -10],
  rect_size: [640, 330],
  color: { r: 0.05, g: 0.06, b: 0.1, a: 0.96 },
  enable: false,
});

b.text("LockPanel/Title", "지난 시즌 레이드 종료", {
  anchor: "top-center",
  pos: [0, -22],
  rect_size: [580, 40],
  size: 30,
  alignment: 4,
  color: "#e9eefb",
});

b.text("LockPanel/Grade", "S", {
  anchor: "top-center",
  pos: [0, -70],
  rect_size: [580, 72],
  size: 58,
  bold: true,
  alignment: 4,
  color: "#ffb340",
});

b.text("LockPanel/Msg", "보상을 받아야 새 시즌이 시작됩니다", {
  anchor: "top-center",
  pos: [0, -150],
  rect_size: [580, 40],
  size: 24,
  alignment: 4,
  color: "#9fb2d4",
});

b.button("LockPanel/BtnClaimPending", "보상 받기", {
  anchor: "bottom-center",
  pos: [0, 26],
  rect_size: [300, 96],
  font_size: 34,
  color: "#2a1a05",
  bg_color: { r: 0.94, g: 0.75, b: 0.25, a: 1.0 },
});

for (const p of ["LockPanel/Title", "LockPanel/Grade", "LockPanel/Msg", "LockPanel/BtnClaimPending"]) {
  b.patchComponent(p, "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
}

b.write(UI, {
  bind: {
    mlua: MLUA,
    props: {
      lockDim: "LockDim",
      lockPanel: "LockPanel",
      lockGradeText: "LockPanel/Grade",
      btnClaimPending: "LockPanel/BtnClaimPending",
    },
  },
});

console.log("lockDim        =", b.getId("LockDim"));
console.log("lockPanel      =", b.getId("LockPanel"));
console.log("lockGradeText  =", b.getId("LockPanel/Grade"));
console.log("btnClaimPending=", b.getId("LockPanel/BtnClaimPending"));
