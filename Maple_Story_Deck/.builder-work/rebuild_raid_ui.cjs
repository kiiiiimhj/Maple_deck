// 주간 레이드 팝업 재구성 — 레퍼런스 구도(액자 + 안쪽 전투화면 + 상단 보스체력/등급 + 좌측 DPS창 + 하단 받기)
// 2026-09-20. 액자 이미지(73383a22)는 위아래 투명 여백이 커서 실측 캘리브레이션 값으로 안쪽 화면을 맞춘다:
//   Board를 S×S로 두면 → 액자 안쪽 화면 = 가로 0.74S × 세로 0.46S, 중심은 (+0.03S, 아래 0.068S)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const PANEL_RUID = "73383a22ca1645bfb1c7e2b22c3e13b2";
const RECT_RUID = "4fea64a3307cda641809ad8be0d4890b";
const BOSS_FRAME0 = "f34ab8f601bb4d84ac7f1132578e0f90";
const CHAR_ICONS = [
  "f13366e4ab0c4523b3f96f131aafbe85", // 아르카나
  "c8d5851228a844da80c8c94586b06aa7", // 실피드
  "c26beb96e46e41289ecd838a62c60da1", // 레이온
  "a8348a83ab4343409cd461ddd83c6730", // 쉐이드
  "e64d2ef49017475b925f18c98510ee7f", // 린
];

const S = 1400;                 // Board 한 변
const STAGE_W = Math.round(S * 0.74);   // 1036
const STAGE_H = Math.round(S * 0.46);   // 644
const STAGE_X = Math.round(S * 0.03);   // +42
const STAGE_Y = -Math.round(S * 0.068); // -95 (아래)
const FRAME_CENTER_Y = Math.round(S * 0.047); // 액자 중심이 Board 중심보다 66 아래 → Panel을 그만큼 올린다

const b = new UIBuilder("RaidGroup", 24, false);
b.group("RaidGroup", { default_show: false, group_order: 24, group_type: 2 });

b.sprite("Dimmer", {
  anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080],
  image_ruid: RECT_RUID, color: "#000000", alpha: 0.72, sprite_type: 0, raycast: true,
});

// Panel 자체는 좌표 기준일 뿐 — 실제로 보이는 건 Board(액자)
b.empty("Panel", { anchor: "middle-center", pos: [0, FRAME_CENTER_Y], rect_size: [S, S] });
b.sprite("Panel/Board", {
  anchor: "middle-center", pos: [0, 0], rect_size: [S, S],
  image_ruid: PANEL_RUID, sprite_type: 0, raycast: true, color: "#FFFFFF", alpha: 1.0,
});

// ── 액자 안쪽 전투 화면 ──────────────────────────────────────────────────────
b.empty("Panel/Stage", { anchor: "middle-center", pos: [STAGE_X, STAGE_Y], rect_size: [STAGE_W, STAGE_H] });
b.sprite("Panel/Stage/Bg", {
  anchor: "stretch", pos: [0, 0], rect_size: [STAGE_W, STAGE_H],
  image_ruid: RECT_RUID, color: "#120c1c", alpha: 1.0, sprite_type: 0, raycast: false,
});
// 바닥 발판 — 캐릭터/보스가 서는 선
b.sprite("Panel/Stage/Ground", {
  anchor: "bottom-center", pos: [0, 54], rect_size: [STAGE_W, 108],
  image_ruid: RECT_RUID, color: "#2a1b3d", alpha: 1.0, sprite_type: 0, raycast: false,
});
b.sprite("Panel/Stage/GroundLine", {
  anchor: "bottom-center", pos: [0, 104], rect_size: [STAGE_W, 6],
  image_ruid: RECT_RUID, color: "#6b4ba8", alpha: 1.0, sprite_type: 0, raycast: false,
});

// 마왕 발록 — 원본 352x252를 1.9배로 크게
b.sprite("Panel/Stage/Boss", {
  anchor: "bottom-right", pos: [-40, 70], rect_size: [669, 479],
  image_ruid: BOSS_FRAME0, sprite_type: 0, raycast: false, color: "#FFFFFF", alpha: 1.0,
});
b.patchComponent("Panel/Stage/Boss", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });

// 캐릭터 — 유저 아바타가 아니라 캐릭터 고유 아트(선택창과 동일 리소스). 왼쪽에 줄지어 선다
for (let i = 0; i < 5; i++) {
  const p = `Panel/Stage/Hero${i}`;
  b.sprite(p, {
    anchor: "bottom-left", pos: [70 + i * 92, 82], rect_size: [132, 132],
    image_ruid: CHAR_ICONS[i], sprite_type: 0, raycast: false, color: "#FFFFFF", alpha: 1.0, enable: false,
  });
  b.patchComponent(p, "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
}

// 캐릭터별 스킬 이펙트(프레임 교체) — 보스 앞에서 터진다
b.sprite("Panel/Stage/SkillFx", {
  anchor: "bottom-right", pos: [-240, 110], rect_size: [280, 280],
  image_ruid: BOSS_FRAME0, sprite_type: 0, raycast: false, color: "#FFFFFF", alpha: 1.0, enable: false,
});
b.patchComponent("Panel/Stage/SkillFx", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });

b.text("Panel/Stage/DamageText", "", {
  size: 44, bold: true, color: "#ffd479", alignment: 4,
  outline: true, outline_color: "#000000", outline_width: 4,
  anchor: "bottom-right", pos: [-230, 300], rect_size: [420, 60], enable: false,
});
b.patchComponent("Panel/Stage/DamageText", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

// ── 상단 오버레이: 등급 뱃지 + 보스 체력바 ──────────────────────────────────
b.sprite("Panel/Stage/GradeBadge", {
  anchor: "top-left", pos: [18, -14], rect_size: [64, 64],
  image_ruid: RECT_RUID, color: "#f5f5f5", alpha: 1.0, sprite_type: 1, raycast: false,
});
b.text("Panel/Stage/GradeBadge/Label", "F", {
  size: 38, bold: true, color: "#333333", alignment: 4,
  anchor: "middle-center", pos: [0, 0], rect_size: [64, 64],
});
b.patchComponent("Panel/Stage/GradeBadge/Label", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

b.sprite("Panel/Stage/HpBack", {
  anchor: "top-left", pos: [92, -22], rect_size: [STAGE_W - 130, 44],
  image_ruid: RECT_RUID, color: "#1d1430", alpha: 0.95, sprite_type: 0, raycast: false,
});
// 보스 체력바 — 처음이 가득(초록), 누적 피해가 쌓일수록 줄어든다
b.sprite("Panel/Stage/HpBack/HpFill", {
  anchor: "middle-left", pos: [4, 0], rect_size: [STAGE_W - 138, 36], pivot: [0, 0.5],
  image_ruid: RECT_RUID, color: "#48c95f", alpha: 1.0, sprite_type: 0, raycast: false,
});
b.text("Panel/Stage/HpBack/HpText", "보스 체력", {
  size: 26, bold: true, color: "#FFFFFF", alignment: 4,
  outline: true, outline_color: "#000000", outline_width: 3,
  anchor: "middle-center", pos: [0, 0], rect_size: [STAGE_W - 140, 40],
});
b.patchComponent("Panel/Stage/HpBack/HpText", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

// 남은시간
b.sprite("Panel/Stage/TimeBox", {
  anchor: "top-center", pos: [40, -76], rect_size: [230, 78],
  image_ruid: RECT_RUID, color: "#e9e9ef", alpha: 0.94, sprite_type: 1, raycast: false,
});
b.text("Panel/Stage/TimeBox/Label", "남은시간", {
  size: 24, bold: true, color: "#444444", alignment: 4,
  anchor: "top-center", pos: [0, -8], rect_size: [220, 28],
});
b.patchComponent("Panel/Stage/TimeBox/Label", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
b.text("Panel/Stage/TimeBox/Value", "7d 0h", {
  size: 32, bold: true, color: "#1b1b25", alignment: 4,
  anchor: "bottom-center", pos: [0, 8], rect_size: [220, 38],
});
b.patchComponent("Panel/Stage/TimeBox/Value", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

// ── 좌측 DPS 창 ─────────────────────────────────────────────────────────────
b.sprite("Panel/Stage/DpsWindow", {
  anchor: "middle-left", pos: [18, 26], rect_size: [252, 232],
  image_ruid: RECT_RUID, color: "#e9e9ef", alpha: 0.92, sprite_type: 1, raycast: false,
});
b.text("Panel/Stage/DpsWindow/Title", "누적 DPS", {
  size: 24, bold: true, color: "#444444", alignment: 4,
  anchor: "top-center", pos: [0, -10], rect_size: [230, 30],
});
b.patchComponent("Panel/Stage/DpsWindow/Title", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
for (let i = 0; i < 5; i++) {
  const row = `Panel/Stage/DpsWindow/Row${i}`;
  b.empty(row, { anchor: "top-center", pos: [0, -(46 + i * 36)], rect_size: [230, 32], enable: false });
  b.sprite(`${row}/Icon`, {
    anchor: "middle-left", pos: [8, 0], rect_size: [28, 28],
    image_ruid: CHAR_ICONS[i], sprite_type: 0, raycast: false, color: "#FFFFFF", alpha: 1.0,
  });
  b.patchComponent(`${row}/Icon`, "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
  b.text(`${row}/Value`, "0", {
    size: 22, bold: true, color: "#222222", alignment: 5,
    anchor: "middle-right", pos: [10, 0], rect_size: [180, 28],
  });
  b.patchComponent(`${row}/Value`, "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
}

// ── 하단 받기 버튼(보상 있을 때만 켠다) + 닫기 ──────────────────────────────
b.button("Panel/Stage/BtnClaim", "보상 받기", {
  anchor: "bottom-center", pos: [0, 24], rect_size: [300, 74], font_size: 30,
  bg_color: { r: 0.36, g: 0.72, b: 0.36, a: 1.0 }, enable: false,
});
b.patchComponent("Panel/Stage/BtnClaim", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });

b.button("Panel/BtnClose", "X", {
  anchor: "middle-center", pos: [Math.round(S * 0.40), Math.round(S * 0.19)], rect_size: [66, 66], font_size: 34,
  bg_color: { r: 0.18, g: 0.09, b: 0.12, a: 0.95 },
});

b.write("ui/RaidGroup.ui", {
  strict: false, // 액자 이미지가 캔버스보다 큰 정사각(투명 여백 포함)이라 L013 off-canvas가 잡힌다 — 의도된 구성
  bind: {
    mlua: "RootDesk/MyDesk/Raid/RaidUI.mlua",
    props: {
      raidGroup: "/ui/RaidGroup",
      panel: "Panel",
      btnClose: "Panel/BtnClose",
      btnClaim: "Panel/Stage/BtnClaim",
      hpText: "Panel/Stage/HpBack/HpText",
      gradeText: "Panel/Stage/GradeBadge/Label",
      hintText: "Panel/Stage/TimeBox/Value",
      hpFill: "Panel/Stage/HpBack/HpFill",
      boss: "Panel/Stage/Boss",
      stage: "Panel/Stage",
      members: "Panel/Stage/DpsWindow",
      skillFx: "Panel/Stage/SkillFx",
      damageText: "Panel/Stage/DamageText",
    },
  },
});
console.log("RaidGroup.ui rebuilt: stage " + STAGE_W + "x" + STAGE_H + " at (" + STAGE_X + "," + STAGE_Y + ")");
