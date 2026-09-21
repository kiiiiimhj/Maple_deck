// 주간 레이드 HUD — 월드(Raid_1)에서 전투가 벌어지고, 화면에는 "액자 팝업"처럼 보이게 덮는다.
// 2026-09-20 유저 지정: "맵으로 되어있는 걸 팝업처럼".
//   엔진에 렌더 텍스처가 없어 월드를 UI 안에 그릴 수는 없으므로, 액자 바깥을 가리는 딤 4장 +
//   액자 프레임을 화면에 덮어 액자 안쪽으로만 월드가 보이게 만든다(결과는 팝업 안 전투와 동일).
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const PANEL_RUID = "73383a22ca1645bfb1c7e2b22c3e13b2";
const RECT_RUID = "4fea64a3307cda641809ad8be0d4890b";
const CHAR_ICONS = [
  "f13366e4ab0c4523b3f96f131aafbe85",
  "c8d5851228a844da80c8c94586b06aa7",
  "c26beb96e46e41289ecd838a62c60da1",
  "a8348a83ab4343409cd461ddd83c6730",
  "e64d2ef49017475b925f18c98510ee7f",
];

// 액자 실측 비율(캘리브레이션): Board S×S → 안쪽 창 = 0.74S × 0.46S, 중심은 (+0.03S, 아래 0.068S)
const S = 1400;
const BOARD_Y = 66;                 // 액자 자체가 화면 중앙에 오도록 Board를 올린다
const WIN_W = Math.round(S * 0.74); // 1036
const WIN_H = Math.round(S * 0.46); // 644
const WIN_CX = Math.round(S * 0.03);              // +42
const WIN_CY = BOARD_Y - Math.round(S * 0.068);   // 66 - 95 = -29
const WIN_L = WIN_CX - WIN_W / 2, WIN_R = WIN_CX + WIN_W / 2;
const WIN_B = WIN_CY - WIN_H / 2, WIN_T = WIN_CY + WIN_H / 2;

const b = new UIBuilder("RaidGroup", 24, false);
b.group("RaidGroup", { default_show: false, group_order: 24, group_type: 2 });

// ── 액자 바깥을 가리는 딤 4장 (안쪽은 월드가 그대로 보인다) ──────────────────
const dim = (name, cx, cy, w, h) =>
  b.sprite(name, {
    anchor: "middle-center", pos: [Math.round(cx), Math.round(cy)], rect_size: [Math.round(w), Math.round(h)],
    image_ruid: RECT_RUID, color: "#05030a", alpha: 1.0, sprite_type: 0, raycast: true,
  });
dim("DimTop", 0, (WIN_T + 540) / 2, 1920, 540 - WIN_T);
dim("DimBottom", 0, (WIN_B - 540) / 2, 1920, WIN_B + 540);
dim("DimLeft", (WIN_L - 960) / 2, WIN_CY, WIN_L + 960, WIN_H);
dim("DimRight", (WIN_R + 960) / 2, WIN_CY, 960 - WIN_R, WIN_H);

// ── 액자 프레임 ─────────────────────────────────────────────────────────────
b.sprite("Frame", {
  anchor: "middle-center", pos: [0, BOARD_Y], rect_size: [S, S],
  image_ruid: PANEL_RUID, sprite_type: 0, raycast: false, color: "#FFFFFF", alpha: 1.0,
});

// ── 상단: 등급 뱃지 + 보스 체력바 ───────────────────────────────────────────
b.sprite("GradeBadge", {
  anchor: "middle-center", pos: [WIN_L + 54, WIN_T - 46], rect_size: [72, 72],
  image_ruid: RECT_RUID, color: "#f7f7fb", alpha: 1.0, sprite_type: 1, raycast: false,
});
b.text("GradeBadge/Label", "F", {
  size: 42, bold: true, color: "#333333", alignment: 4,
  anchor: "middle-center", pos: [0, 0], rect_size: [72, 72],
});
b.patchComponent("GradeBadge/Label", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

b.sprite("HpBack", {
  anchor: "middle-center", pos: [WIN_CX + 48, WIN_T - 46], rect_size: [WIN_W - 140, 46],
  image_ruid: RECT_RUID, color: "#1d1430", alpha: 0.92, sprite_type: 0, raycast: false,
});
b.sprite("HpBack/HpFill", {
  anchor: "middle-left", pos: [5, 0], rect_size: [WIN_W - 150, 36], pivot: [0, 0.5],
  image_ruid: RECT_RUID, color: "#48c95f", alpha: 1.0, sprite_type: 0, raycast: false,
});
b.text("HpBack/HpText", "보스 체력", {
  size: 26, bold: true, color: "#FFFFFF", alignment: 4,
  outline: true, outline_color: "#000000", outline_width: 3,
  anchor: "middle-center", pos: [0, 0], rect_size: [WIN_W - 150, 40],
});
b.patchComponent("HpBack/HpText", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

// ── 남은시간 ────────────────────────────────────────────────────────────────
b.sprite("TimeBox", {
  anchor: "middle-center", pos: [WIN_CX + 40, WIN_T - 130], rect_size: [240, 84],
  image_ruid: RECT_RUID, color: "#ececf2", alpha: 0.94, sprite_type: 1, raycast: false,
});
b.text("TimeBox/Label", "남은시간", {
  size: 24, bold: true, color: "#444444", alignment: 4,
  anchor: "middle-center", pos: [0, 20], rect_size: [220, 28],
});
b.patchComponent("TimeBox/Label", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
b.text("TimeBox/Value", "7d 0h", {
  size: 34, bold: true, color: "#1b1b25", alignment: 4,
  anchor: "middle-center", pos: [0, -16], rect_size: [220, 40],
});
b.patchComponent("TimeBox/Value", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

// ── 좌측 DPS 창 ─────────────────────────────────────────────────────────────
b.sprite("DpsWindow", {
  anchor: "middle-center", pos: [WIN_L + 150, WIN_CY + 40], rect_size: [260, 240],
  image_ruid: RECT_RUID, color: "#ececf2", alpha: 0.9, sprite_type: 1, raycast: false,
});
b.text("DpsWindow/Title", "누적 DPS", {
  size: 24, bold: true, color: "#444444", alignment: 4,
  anchor: "top-center", pos: [0, -12], rect_size: [240, 30],
});
b.patchComponent("DpsWindow/Title", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
for (let i = 0; i < 5; i++) {
  const row = `DpsWindow/Row${i}`;
  b.empty(row, { anchor: "top-center", pos: [0, -(50 + i * 36)], rect_size: [240, 32], enable: false });
  b.sprite(`${row}/Icon`, {
    anchor: "middle-left", pos: [10, 0], rect_size: [28, 28],
    image_ruid: CHAR_ICONS[i], sprite_type: 0, raycast: false, color: "#FFFFFF", alpha: 1.0,
  });
  b.patchComponent(`${row}/Icon`, "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
  b.text(`${row}/Value`, "0", {
    size: 22, bold: true, color: "#222222", alignment: 5,
    anchor: "middle-right", pos: [12, 0], rect_size: [180, 28],
  });
  b.patchComponent(`${row}/Value`, "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
}

// ── 하단 받기 버튼(보상 있을 때만) + 나가기 ────────────────────────────────
b.button("BtnClaim", "보상 받기", {
  anchor: "middle-center", pos: [WIN_CX + 40, WIN_B + 58], rect_size: [320, 80], font_size: 32,
  bg_color: { r: 0.36, g: 0.72, b: 0.36, a: 1.0 }, enable: false,
});
b.patchComponent("BtnClaim", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

b.button("BtnExit", "나가기", {
  anchor: "middle-center", pos: [WIN_R - 90, WIN_T - 46], rect_size: [140, 64], font_size: 28,
  bg_color: { r: 0.22, g: 0.12, b: 0.16, a: 0.95 },
});
b.patchComponent("BtnExit", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

b.write("ui/RaidGroup.ui", {
  strict: false, // 액자 이미지가 캔버스보다 큰 정사각(투명 여백 포함) — L013은 의도된 구성
  bind: {
    mlua: "RootDesk/MyDesk/Raid/RaidUI.mlua",
    props: {
      raidGroup: "/ui/RaidGroup",
      panel: "Frame",
      btnClose: "BtnExit",
      btnClaim: "BtnClaim",
      hpText: "HpBack/HpText",
      gradeText: "GradeBadge/Label",
      hintText: "TimeBox/Value",
      hpFill: "HpBack/HpFill",
      members: "DpsWindow",
    },
  },
});
console.log("RaidGroup.ui rebuilt as HUD overlay: window " + WIN_W + "x" + WIN_H + " at (" + WIN_CX + "," + WIN_CY + ")");
