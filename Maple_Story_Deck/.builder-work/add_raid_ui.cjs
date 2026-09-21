// 주간 레이드 팝업(RaidGroup) + 로비 우측 아이콘(TitleGroup/RaidButton) — 2026-09-20
// 유저 지정: 로비에서 팝업 창 안에 자동사냥 장면(마왕 발록) + 보스 HP/등급/참여 캐릭터/받기 버튼
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const PANEL_RUID = "73383a22ca1645bfb1c7e2b22c3e13b2"; // 유저 지정 팝업 패널
const BTN_FRAME_RUID = "99420744f57e46f7bde06c3ebe037f61"; // 유저 지정 버튼 패널(업적 버튼과 동일)
const RAID_ICON_RUID = "549d8fbf2bb948f8be5328fc3863af00"; // 유저 지정 레이드 아이콘
const RECT_DIM_RUID = "4fea64a3307cda641809ad8be0d4890b"; // 다른 팝업 딤드와 같은 단색 사각
const REDDOT_RUID = "fd3837ce4fc04bdd9677e408c2fa776c"; // 업적 버튼 빨간점과 동일
const BOSS_FRAME0 = "f34ab8f601bb4d84ac7f1132578e0f90"; // 마왕발록 stand 0프레임
const CHAR_ICONS = [
  "f13366e4ab0c4523b3f96f131aafbe85",
  "c8d5851228a844da80c8c94586b06aa7",
  "c26beb96e46e41289ecd838a62c60da1",
  "a8348a83ab4343409cd461ddd83c6730",
  "e64d2ef49017475b925f18c98510ee7f",
];

// ── 1) 레이드 팝업 ──────────────────────────────────────────────────────────
// 업적 팝업과 같은 계열: GroupType 2 / DefaultShow false(로직은 @Logic이라 영향 없음)
const b = new UIBuilder("RaidGroup", 24, false);
b.group("RaidGroup", { default_show: false, group_order: 24, group_type: 2 });

b.sprite("Dimmer", {
  anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080],
  image_ruid: RECT_DIM_RUID, color: "#000000", alpha: 0.6, sprite_type: 0, raycast: true,
});

b.empty("Panel", { anchor: "middle-center", pos: [0, 0], rect_size: [1120, 780] });
b.sprite("Panel/Board", {
  anchor: "stretch", pos: [0, 0], rect_size: [1120, 780],
  image_ruid: PANEL_RUID, sprite_type: 1, raycast: true, color: "#FFFFFF", alpha: 1.0,
});

b.text("Panel/Title", "주간 레이드 · 마왕 발록", {
  size: 44, bold: true, color: "#FFFFFF", alignment: 4,
  outline: true, outline_color: "#000000", outline_width: 3,
  anchor: "top-center", pos: [0, -46], rect_size: [700, 56],
});
b.patchComponent("Panel/Title", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

b.button("Panel/BtnClose", "X", {
  anchor: "top-right", pos: [-28, -28], rect_size: [64, 64], font_size: 34,
  bg_color: { r: 0.15, g: 0.12, b: 0.2, a: 0.9 },
});

// ── 전투 장면 ──
b.empty("Panel/Stage", { anchor: "top-center", pos: [0, -108], rect_size: [1020, 330] });
b.sprite("Panel/Stage/Bg", {
  anchor: "stretch", pos: [0, 0], rect_size: [1020, 330],
  image_ruid: RECT_DIM_RUID, color: "#1b1430", alpha: 1.0, sprite_type: 0, raycast: false,
});
b.sprite("Panel/Stage/Boss", {
  anchor: "middle-right", pos: [20, -14], rect_size: [352, 252],
  image_ruid: BOSS_FRAME0, sprite_type: 0, raycast: false, color: "#FFFFFF", alpha: 1.0,
});
b.patchComponent("Panel/Stage/Boss", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });

for (let i = 0; i < 5; i++) {
  const p = `Panel/Stage/Hero${i}`;
  b.sprite(p, {
    anchor: "middle-left", pos: [70 + i * 96, -70], rect_size: [86, 86],
    image_ruid: CHAR_ICONS[i], sprite_type: 0, raycast: false, color: "#FFFFFF", alpha: 1.0, enable: false,
  });
  b.patchComponent(p, "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
}

b.text("Panel/Stage/DamageText", "", {
  size: 46, bold: true, color: "#ff5d5d", alignment: 4,
  outline: true, outline_color: "#000000", outline_width: 4,
  anchor: "middle-center", pos: [210, 10], rect_size: [420, 60], enable: false,
});
b.patchComponent("Panel/Stage/DamageText", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

// ── 보스 HP 바(= 누적 피해율) ──
b.sprite("Panel/HpBack", {
  anchor: "top-center", pos: [0, -470], rect_size: [900, 44],
  image_ruid: RECT_DIM_RUID, color: "#241d33", alpha: 1.0, sprite_type: 0, raycast: false,
});
b.sprite("Panel/HpBack/HpFill", {
  anchor: "middle-left", pos: [10, 0], rect_size: [880, 34], pivot: [0, 0.5],
  image_ruid: RECT_DIM_RUID, color: "#e04a4a", alpha: 1.0, sprite_type: 0, raycast: false,
});
b.text("Panel/HpBack/HpText", "0.00%", {
  size: 26, bold: true, color: "#FFFFFF", alignment: 4,
  outline: true, outline_color: "#000000", outline_width: 3,
  anchor: "middle-center", pos: [0, 0], rect_size: [880, 40],
});
b.patchComponent("Panel/HpBack/HpText", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

b.text("Panel/GradeText", "F", {
  size: 64, bold: true, color: "#9aa0a6", alignment: 4,
  outline: true, outline_color: "#000000", outline_width: 4,
  anchor: "top-right", pos: [-70, -40], rect_size: [120, 80],
});
b.patchComponent("Panel/GradeText", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

// ── 참여 캐릭터 목록 ──
b.empty("Panel/Members", { anchor: "bottom-center", pos: [0, 214], rect_size: [960, 200] });
for (let i = 0; i < 5; i++) {
  const row = `Panel/Members/Row${i}`;
  b.empty(row, { anchor: "top-center", pos: [0, -(12 + i * 38)], rect_size: [900, 34], enable: false });
  b.sprite(`${row}/Icon`, {
    anchor: "middle-left", pos: [12, 0], rect_size: [32, 32],
    image_ruid: CHAR_ICONS[i], sprite_type: 0, raycast: false, color: "#FFFFFF", alpha: 1.0,
  });
  b.patchComponent(`${row}/Icon`, "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
  b.text(`${row}/Name`, "-", {
    size: 26, color: "#FFFFFF", alignment: 3,
    anchor: "middle-left", pos: [56, 0], rect_size: [300, 32],
  });
  b.patchComponent(`${row}/Name`, "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
  b.text(`${row}/Dps`, "0 DPS", {
    size: 26, bold: true, color: "#ffd479", alignment: 5,
    anchor: "middle-right", pos: [12, 0], rect_size: [360, 32],
  });
  b.patchComponent(`${row}/Dps`, "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
}

b.button("Panel/BtnClaim", "보상 받기", {
  anchor: "bottom-center", pos: [0, 78], rect_size: [340, 92], font_size: 34,
  bg_color: { r: 0.36, g: 0.68, b: 0.34, a: 1.0 },
});
b.patchComponent("Panel/BtnClaim", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

b.text("Panel/Hint", "게임을 플레이할수록 누적 DPS가 올라가요", {
  size: 24, color: "#cbd5e1", alignment: 4,
  anchor: "bottom-center", pos: [0, 34], rect_size: [900, 32],
});
b.patchComponent("Panel/Hint", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

b.write("ui/RaidGroup.ui", {
  bind: {
    mlua: "RootDesk/MyDesk/Raid/RaidUI.mlua",
    props: {
      raidGroup: "/ui/RaidGroup",
      panel: "Panel",
      btnClose: "Panel/BtnClose",
      btnClaim: "Panel/BtnClaim",
      titleText: "Panel/Title",
      hpText: "Panel/HpBack/HpText",
      gradeText: "Panel/GradeText",
      hintText: "Panel/Hint",
      hpFill: "Panel/HpBack/HpFill",
      boss: "Panel/Stage/Boss",
      stage: "Panel/Stage",
      members: "Panel/Members",
    },
  },
});
console.log("RaidGroup.ui written");

// ── 2) 로비 우측 아이콘(업적 버튼 바로 아래) ────────────────────────────────
const t = UIBuilder.load("ui/TitleGroup.ui");
t.sprite("RaidButton", {
  anchor: "middle-right", pos: [-30, -15], rect_size: [156, 156], pivot: [1, 0.5],
  image_ruid: BTN_FRAME_RUID, sprite_type: 0, raycast: true, color: "#FFFFFF", alpha: 1.0, enable: false,
});
t.addComponent("RaidButton", "MOD.Core.ButtonComponent");
t.sprite("RaidButton/Overlay", {
  anchor: "middle-center", pos: [0, 0], rect_size: [110, 110],
  image_ruid: RAID_ICON_RUID, sprite_type: 0, raycast: false, color: "#FFFFFF", alpha: 1.0,
});
t.patchComponent("RaidButton/Overlay", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
t.sprite("RaidButton/RedDot", {
  anchor: "middle-center", pos: [57, 57], rect_size: [56, 56],
  image_ruid: REDDOT_RUID, sprite_type: 0, raycast: false, color: "#FFFFFF", alpha: 1.0, enable: false,
});
t.patchComponent("RaidButton/RedDot", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });

// ⚠ TitleGroup.ui는 기존 레거시 파일이라 off-canvas(L013) 린트 에러가 1000건 넘게 쌓여 있다
//   (실제 버그가 아니라 스크롤 영역 밖 슬롯들 — feedback_ui_offcanvas_lint_not_bug 참고).
//   strict를 끄지 않으면 이 파일에는 어떤 수정도 write할 수 없다.
t.write("ui/TitleGroup.ui", {
  strict: false,
  bind: {
    mlua: "RootDesk/MyDesk/Raid/RaidUI.mlua",
    props: {
      lobbyButton: "RaidButton",
      lobbyRedDot: "RaidButton/RedDot",
      lobbyButtonComp: "RaidButton",
    },
  },
});
console.log("TitleGroup.ui RaidButton added");
