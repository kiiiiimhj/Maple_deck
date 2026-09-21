// 인게임 HUD: 처치 수(KillPanel) 아래에 경과 시간 패널을 추가한다 (유저 지정 2026-09-21).
// KillPanel과 완전히 같은 구성(배경 스프라이트 148x48 + 아이콘 36x36 + 텍스트 90x28)을 54px 아래에 복제.
//   KillPanel  anchors(1,1) pivot(1,1) pos(-214,-64)
//   TimePanel                          pos(-214,-118)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI_PATH = "ui/DefaultGroup.ui";
const PANEL_RUID = "2860136c06ab075439721c027de365af"; // KillPanel 배경과 동일
const CLOCK_RUID = "81d6435397a64ba7b28bffa9616199b0"; // 유저가 준 시계 아이콘

const b = UIBuilder.load(UI_PATH);

b.sprite("TimePanel", {
  anchor: "top-right",
  pos: [-214, -118],
  rect_size: [148, 48],
  pivot: [1, 1],
  image_ruid: PANEL_RUID,
  sprite_type: 1, // Sliced
  color: { r: 0, g: 0, b: 0, a: 0.45 },
  raycast: false,
});

b.sprite("TimePanel/TimeIcon", {
  anchor: "top-right",
  pos: [-122, -26],
  rect_size: [36, 36],
  pivot: [1, 1],
  image_ruid: CLOCK_RUID,
  sprite_type: 0, // Simple
  raycast: false,
});

b.text("TimePanel/TimeText", ": 0:00", {
  anchor: "top-right",
  pos: [-6, -10],
  rect_size: [90, 28],
  pivot: [1, 1],
  size: 22,
  color: "#FFFFFF",
  alignment: 4, // MiddleCenter
});
// KillText와 같은 글꼴
b.patchComponent("TimePanel/TimeText", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

b.write(UI_PATH, {
  strict: false,
  bind: {
    mlua: "RootDesk/MyDesk/GameManager.mlua",
    props: {
      timePanel: "TimePanel",
      timeText: "TimePanel/TimeText",
    },
  },
});
console.log("TimePanel written + bound");
