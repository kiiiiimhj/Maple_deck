const path = require("path");
const { UIBuilder } = require(
  path.join(__dirname, ".claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs")
);

const b = UIBuilder.read("ui/DefaultGroup.ui");

// 기존 요소 제거
["Button_Jump", "UIJoystick", "UIChat", "Button_Attack"].forEach(name => {
  if (b.find(name)) b.remove(name);
});

// === 배경 ===
b.sprite("BGPanel", {
  anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080],
  color: "#0d0d1a", alpha: 1.0,
});

// === 경험치 BAR (상단 중앙) ===
b.panel("ExpBarGroup", { anchor: "top-center", pos: [0, -20], rect_size: [700, 45] });
b.sprite("ExpBarGroup/ExpBg", { anchor: "stretch", color: "#2a2a4a", alpha: 0.9 });
b.sprite("ExpBarGroup/ExpFill", {
  anchor: "middle-left", pos: [0, 0], rect_size: [700, 45],
  color: "#7c3aed", sprite_type: 3, fill_method: 0, alpha: 1.0,
});
b.text("ExpBarGroup/ExpText", "Lv.1  EXP 0 / 100", {
  anchor: "middle-center", pos: [0, 0], rect_size: [700, 45],
  size: 18, color: "#ffffff", alignment: 4,
});

// === 골드 (우상단, PC 예약 구역 외부) ===
b.panel("GoldGroup", { anchor: "top-right", pos: [-235, -20], rect_size: [200, 50] });
b.sprite("GoldGroup/GoldIcon", {
  anchor: "middle-left", pos: [0, 0], rect_size: [40, 40],
  color: "#fbbf24", alpha: 1.0,
});
b.text("GoldGroup/GoldText", "0", {
  anchor: "middle-right", pos: [0, 0], rect_size: [155, 45],
  size: 28, color: "#fbbf24", bold: true, alignment: 4,
});

// === 채팅창 (좌상단, 비활성) ===
b.panel("ChatPanel", {
  anchor: "top-left", pos: [20, -20], rect_size: [240, 240], enable: false,
});

// === 플레이어 HUD (좌하단) ===
b.panel("PlayerHUD", { anchor: "bottom-left", pos: [20, 235], rect_size: [240, 180] });
b.text("PlayerHUD/IDText", "Player", {
  anchor: "top-center", pos: [0, -10], rect_size: [240, 35],
  size: 20, color: "#e2e8f0", alignment: 4,
});
b.sprite("PlayerHUD/HPBg", {
  anchor: "top-center", pos: [0, -55], rect_size: [220, 28],
  color: "#374151", alpha: 0.9,
});
b.sprite("PlayerHUD/HPFill", {
  anchor: "middle-left", pos: [0, 0], rect_size: [220, 28],
  color: "#dc2626", sprite_type: 3, fill_method: 0, alpha: 1.0,
});
b.text("PlayerHUD/HPText", "HP 100 / 100", {
  anchor: "top-center", pos: [0, -55], rect_size: [220, 28],
  size: 13, color: "#ffffff", alignment: 4,
});

// === 공격 버튼 (좌하단, 원형) ===
b.panel("AttackBtnPanel", { anchor: "bottom-left", pos: [35, 30], rect_size: [195, 195] });
b.sprite("AttackBtnPanel/BtnBg", { anchor: "stretch", color: "#1e293b", alpha: 0.9 });
b.sprite("AttackBtnPanel/BtnIcon", {
  anchor: "middle-center", pos: [0, 0], rect_size: [120, 120],
  color: "#94a3b8", alpha: 1.0,
});
b.sprite("AttackBtnPanel/Cooldown", {
  anchor: "stretch", color: "#000000", alpha: 0.55,
  sprite_type: 3, fill_method: 4,
});
b.button("AttackBtnPanel/TouchBtn", "", { anchor: "stretch", color: "#ffffff" });
b.patchComponent("AttackBtnPanel/TouchBtn", "MOD.Core.SpriteGUIRendererComponent", {
  Color: { r: 0, g: 0, b: 0, a: 0 },
});

// === 몬스터 영역 (중앙) ===
b.panel("MonsterArea", { anchor: "middle-center", pos: [100, 60], rect_size: [850, 450] });

const monsterSlots = [
  ["Monster_1", [-200, 100]],
  ["Monster_2", [-50,  140]],
  ["Monster_3", [120,  110]],
  ["Monster_4", [270,   70]],
  ["Monster_5", [-110, -30]],
  ["Monster_6", [80,   -60]],
  ["Monster_7", [220,  -30]],
];

monsterSlots.forEach(([name, pos]) => {
  const base = "MonsterArea/" + name;
  b.panel(base, { anchor: "middle-center", pos, rect_size: [130, 130], enable: false });
  b.sprite(base + "/MSprite", {
    anchor: "middle-center", pos: [0, 10], rect_size: [110, 110],
    color: "#6b7280", alpha: 1.0,
  });
  b.sprite(base + "/MHPBg", {
    anchor: "bottom-center", pos: [0, 14], rect_size: [120, 12],
    color: "#374151", alpha: 0.9,
  });
  b.sprite(base + "/MHPBg/MHPFill", {
    anchor: "stretch",
    color: "#16a34a", sprite_type: 3, fill_method: 0, alpha: 1.0,
  });
});

// === 카드 패 1~5 (하단 중앙) ===
b.panel("CardHandPanel", { anchor: "bottom-center", pos: [100, 20], rect_size: [660, 178] });

for (let i = 1; i <= 5; i++) {
  const xPos = (i - 3) * 125;
  const base = "CardHandPanel/Card_" + i;
  b.panel(base, { anchor: "middle-center", pos: [xPos, 0], rect_size: [110, 163] });
  b.sprite(base + "/CardBg", { anchor: "stretch", color: "#0f172a", alpha: 0.95 });
  b.sprite(base + "/CardBack", { anchor: "stretch", color: "#1e3a5f", alpha: 1.0 });
  b.sprite(base + "/CardSkill", {
    anchor: "middle-center", pos: [0, 8], rect_size: [88, 88],
    color: "#64748b", alpha: 1.0, enable: false,
  });
  b.sprite(base + "/CooldownOverlay", {
    anchor: "stretch", color: "#000000", alpha: 0.65,
    sprite_type: 3, fill_method: 1, enable: false,
  });
  b.text(base + "/CardName", "", {
    anchor: "bottom-center", pos: [0, 5], rect_size: [110, 28],
    size: 11, color: "#e2e8f0", alignment: 4, enable: false,
  });
}

// === 레벨업 선택 패널 (우측, 기본 비활성) ===
b.panel("LevelUpPanel", {
  anchor: "middle-right", pos: [-20, 0], rect_size: [178, 540], enable: false,
});

for (let i = 6; i <= 8; i++) {
  const yPos = (i - 7) * 165;
  const base = "LevelUpPanel/Card_" + i;
  b.panel(base, { anchor: "middle-center", pos: [0, yPos], rect_size: [158, 153] });
  b.sprite(base + "/CardBg", { anchor: "stretch", color: "#1e3a5f", alpha: 0.92 });
  b.text(base + "/LevelText", "NEW", {
    anchor: "top-center", pos: [0, -5], rect_size: [158, 25],
    size: 12, color: "#fbbf24", bold: true, alignment: 4,
  });
  b.sprite(base + "/CardSkill", {
    anchor: "middle-center", pos: [0, 10], rect_size: [88, 82],
    color: "#64748b", alpha: 1.0,
  });
  b.text(base + "/CardName", "???", {
    anchor: "bottom-center", pos: [0, 5], rect_size: [158, 28],
    size: 12, color: "#e2e8f0", alignment: 4,
  });
  b.button(base + "/SelectBtn", "", { anchor: "stretch", color: "#ffffff" });
  b.patchComponent(base + "/SelectBtn", "MOD.Core.SpriteGUIRendererComponent", {
    Color: { r: 0, g: 0, b: 0, a: 0 },
  });
}

// 다시뽑기 버튼
b.button("LevelUpPanel/RerollBtn", "다시뽑기\n0G", {
  anchor: "bottom-center", pos: [0, 8], rect_size: [148, 58],
  font_size: 14, color: "#ffffff",
});
b.patchComponent("LevelUpPanel/RerollBtn", "MOD.Core.SpriteGUIRendererComponent", {
  Color: { r: 0.55, g: 0.25, b: 0.08, a: 0.95 },
});

b.write("ui/DefaultGroup.ui", { lint_verbose: false });
console.log("UI 빌드 완료! 총 엔티티:", b.listEntities().length);
