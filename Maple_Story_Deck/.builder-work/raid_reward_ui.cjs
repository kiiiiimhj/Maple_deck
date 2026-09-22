const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

// 레이드 보상 UI(2026-09-23 유저 지정):
//   ① Toast        — 수령 실패/성공 문구. 전역 _UIToast(GroupOrder 3)는 RaidGroup(24) 뒤에 깔려 안 보인다
//   ② RewardBox    — 액자 우측 상시 패널(DpsWindow의 좌우 대칭 자리). 지금 등급의 보상 + 다음 등급 미끼
//   ③ RewardTable  — 등급표 팝업(F~S 전 구간). 품질 확률은 유저 지정으로 넣지 않는다
const UI_PATH = "ui/RaidGroup.ui";
const b = UIBuilder.load(UI_PATH);

const PANEL_RUID = "2860136c06ab075439721c027de365af"; // DpsWindow/LockPanel과 같은 9-slice 패널
const CLOSE_RUID = "84bf090442a841899f5274ad5f7725dd"; // BtnExit와 같은 X 아이콘
const RING_RUID = "thumbnail://0abf98bb5e4f49bb8fb3b3cf84929812"; // 무명의 은반지(ItemDataTable 110002)
const SCROLL_RUID = "0c918aba18864e68bb83ba7caf7b8cb6"; // 반지 강화 주문서(510006)

const FRAME_X = -24; // Frame 중심 — 액자 기준으로 좌우를 맞춘다
const DPS_X = -397.7716;
const MIRROR_X = FRAME_X * 2 - DPS_X; // DpsWindow의 좌우 대칭 자리

// ── ① 수령 토스트 ──────────────────────────────────────────────────────────
b.text("Toast", "", {
  anchor: "middle-center", pos: [FRAME_X, -330], rect_size: [900, 64],
  size: 34, bold: true, alignment: 4, color: "#FFE0E0",
  outline: true, outline_color: "#1A0505", outline_width: 3, enable: false,
});
b.patchComponent("Toast", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
b.patch("Toast", { display_order: 18 });

// ── ② 이번 주 보상 패널 ────────────────────────────────────────────────────
b.sprite("RewardBox", {
  anchor: "middle-center", pos: [MIRROR_X, 97], rect_size: [260, 240],
  image_ruid: PANEL_RUID, sprite_type: 1, color: { r: 0, g: 0, b: 0, a: 0.45 },
  enable: false,
});
b.patch("RewardBox", { display_order: 15 });

b.text("RewardBox/Title", "UI_RAIDGROUP_008", {
  anchor: "top-center", pos: [0, -12], rect_size: [240, 30],
  size: 24, bold: true, alignment: 2, color: "#FFFFFF",
});
b.patchComponent("RewardBox/Title", "MOD.Core.TextGUIRendererComponent",
  { Font: "Maple", IsLocalizationKey: true, BestFit: true, MinSize: 12, MaxSize: 24 });

b.sprite("RewardBox/RingIcon", {
  anchor: "top-center", pos: [-74, -50], rect_size: [64, 64],
  image_ruid: RING_RUID, sprite_type: 0,
});
b.patchComponent("RewardBox/RingIcon", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });

b.text("RewardBox/RingGrade", "-", {
  anchor: "top-center", pos: [46, -68], rect_size: [150, 30],
  size: 22, bold: true, alignment: 1, color: "#FFFFFF",
});
b.patchComponent("RewardBox/RingGrade", "MOD.Core.TextGUIRendererComponent",
  { Font: "Maple", HorizontalAlignment: 1, BestFit: true, MinSize: 12, MaxSize: 22 });

b.sprite("RewardBox/ScrollIcon", {
  anchor: "top-center", pos: [-74, -126], rect_size: [58, 58],
  image_ruid: SCROLL_RUID, sprite_type: 0,
});
b.patchComponent("RewardBox/ScrollIcon", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });

b.text("RewardBox/ScrollCount", "-", {
  anchor: "top-center", pos: [46, -141], rect_size: [150, 30],
  size: 22, bold: true, alignment: 1, color: "#FFFFFF",
});
b.patchComponent("RewardBox/ScrollCount", "MOD.Core.TextGUIRendererComponent",
  { Font: "Maple", HorizontalAlignment: 1, BestFit: true, MinSize: 12, MaxSize: 22 });

b.text("RewardBox/NextText", "", {
  anchor: "top-center", pos: [0, -198], rect_size: [240, 30],
  size: 18, bold: false, alignment: 2, color: "#FFD65C",
});
b.patchComponent("RewardBox/NextText", "MOD.Core.TextGUIRendererComponent",
  { Font: "Maple", BestFit: true, MinSize: 11, MaxSize: 18 });

// 패널 전체가 등급표를 여는 버튼(DpsWindow/ToggleBtn과 같은 방식 — 투명 스프라이트 + ButtonComponent)
b.sprite("RewardBox/TapBtn", {
  anchor: "top-center", pos: [0, 0], rect_size: [260, 240],
  image_ruid: PANEL_RUID, sprite_type: 1, color: { r: 1, g: 1, b: 1, a: 0 }, raycast: true,
});
b.addComponent("RewardBox/TapBtn", "MOD.Core.ButtonComponent");

// ── ③ 등급표 팝업 ──────────────────────────────────────────────────────────
b.sprite("RewardTableDim", {
  anchor: "middle-center", pos: [0, 0], rect_size: [1920, 1080],
  image_ruid: PANEL_RUID, sprite_type: 1, color: { r: 0, g: 0, b: 0, a: 0.66 },
  raycast: true, enable: false,
});
b.patch("RewardTableDim", { display_order: 16 });

b.sprite("RewardTable", {
  anchor: "middle-center", pos: [FRAME_X, 0], rect_size: [760, 620],
  image_ruid: PANEL_RUID, sprite_type: 1, color: { r: 0.05, g: 0.06, b: 0.1, a: 0.97 },
  raycast: true, enable: false,
});
b.patch("RewardTable", { display_order: 17 });

b.text("RewardTable/Title", "UI_RAIDGROUP_009", {
  anchor: "top-center", pos: [0, -22], rect_size: [700, 44],
  size: 32, bold: true, alignment: 2, color: "#FFD65C",
});
b.patchComponent("RewardTable/Title", "MOD.Core.TextGUIRendererComponent",
  { Font: "Maple", IsLocalizationKey: true, BestFit: true, MinSize: 16, MaxSize: 32 });

b.sprite("RewardTable/BtnClose", {
  anchor: "top-center", pos: [332, -14], rect_size: [64, 64],
  image_ruid: CLOSE_RUID, sprite_type: 1, color: { r: 1, g: 1, b: 1, a: 0.95 }, raycast: true,
});
b.addComponent("RewardTable/BtnClose", "MOD.Core.ButtonComponent");

// 4열: 등급 / 보스 체력 컷 / 반지 등급 / 강화 주문서
const COLS = [
  { name: "Grade", x: -290, w: 120, key: "UI_RAIDGROUP_010", align: 2 },
  { name: "Cut", x: -140, w: 180, key: "UI_RAIDGROUP_011", align: 2 },
  { name: "Ring", x: 60, w: 200, key: "UI_RAIDGROUP_012", align: 2 },
  { name: "Scroll", x: 260, w: 160, key: "UI_RAIDGROUP_013", align: 2 },
];

b.empty("RewardTable/Head", { anchor: "top-center", pos: [0, -82], rect_size: [700, 40] });
for (const c of COLS) {
  const p = "RewardTable/Head/" + c.name;
  b.text(p, c.key, {
    anchor: "middle-center", pos: [c.x, 0], rect_size: [c.w, 34],
    size: 22, bold: true, alignment: c.align, color: "#8FA3BF",
  });
  b.patchComponent(p, "MOD.Core.TextGUIRendererComponent",
    { Font: "Maple", IsLocalizationKey: true, BestFit: true, MinSize: 11, MaxSize: 22 });
}

// F~S 7줄. 셀 내용은 RaidUI가 런타임에 채운다(GradeCuts / 반지 등급 / 주문서 수는 전부 RaidLogic 값)
const ROW_TOP = -130;
const ROW_STEP = 62;
for (let i = 0; i < 7; i++) {
  const row = "RewardTable/Row" + i;
  b.empty(row, { anchor: "top-center", pos: [0, ROW_TOP - i * ROW_STEP], rect_size: [700, 56] });
  b.sprite(row + "/Bg", {
    anchor: "middle-center", pos: [0, 0], rect_size: [700, 54],
    image_ruid: PANEL_RUID, sprite_type: 1,
    color: { r: 1, g: 1, b: 1, a: i % 2 === 0 ? 0.06 : 0.02 },
  });
  for (const c of COLS) {
    const p = row + "/" + c.name;
    b.text(p, "-", {
      anchor: "middle-center", pos: [c.x, 0], rect_size: [c.w, 40],
      size: 24, bold: true, alignment: c.align, color: "#FFFFFF",
    });
    b.patchComponent(p, "MOD.Core.TextGUIRendererComponent",
      { Font: "Maple", BestFit: true, MinSize: 12, MaxSize: 24 });
  }
}

b.write(UI_PATH, {
  bind: {
    mlua: "RootDesk/MyDesk/Raid/RaidUI.mlua",
    props: {
      toastText: "Toast",
      rewardBox: "RewardBox",
      rewardRingIcon: "RewardBox/RingIcon",
      rewardRingGrade: "RewardBox/RingGrade",
      rewardScrollCount: "RewardBox/ScrollCount",
      rewardNextText: "RewardBox/NextText",
      btnRewardBox: "RewardBox/TapBtn",
      rewardTableDim: "RewardTableDim",
      rewardTable: "RewardTable",
      btnRewardTableClose: "RewardTable/BtnClose",
    },
  },
});
console.log("ok");
