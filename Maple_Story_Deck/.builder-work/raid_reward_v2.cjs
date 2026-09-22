const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

// 보상 개편(유저 지정 2026-09-23): 다이아가 보상에 추가되면서
//   ① 이번 주 보상 패널 = 반지 / 다이아 / 주문서 3줄
//   ② 등급표 = 등급 / 보스 체력 / 반지 / 다이아 / 주문서 5열
//   ③ 등급표는 아무 데나 탭하면 닫힌다(탭 투 스킵)
const UI_PATH = "ui/RaidGroup.ui";
const PANEL_RUID = "2860136c06ab075439721c027de365af";
const DIA_RUID = "81462aeb825b4660991cef05651271cf"; // TitleGroup/DiamondBadge/Icon과 같은 아이콘
const LEFT = 1;

const b = UIBuilder.load(UI_PATH);
const textLeft = (p) => b.patchComponent(p, "MOD.Core.TextGUIRendererComponent", { HorizontalAlignment: LEFT });

// ── ① 보상 패널: 3줄이 들어가게 키우고 다시 배치 ─────────────────────────
b.patch("RewardBox", { rect_size: [260, 300] });
b.patch("RewardBox/Title", { pos: [10, -10], rect_size: [240, 30] });

const ROWS = [
  { icon: "RewardBox/RingIcon", text: "RewardBox/RingGrade", y: -46, size: 56 },
  { icon: "RewardBox/DiaIcon", text: "RewardBox/DiaCount", y: -112, size: 48 },
  { icon: "RewardBox/ScrollIcon", text: "RewardBox/ScrollCount", y: -174, size: 48 },
];

// 다이아 줄은 새로 만든다(반지/주문서 줄은 이미 있다)
b.sprite("RewardBox/DiaIcon", {
  anchor: "top-center", pos: [-78, -112], rect_size: [48, 48],
  image_ruid: DIA_RUID, sprite_type: 0,
});
b.patchComponent("RewardBox/DiaIcon", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
b.text("RewardBox/DiaCount", "-", {
  anchor: "top-center", pos: [44, -120], rect_size: [160, 30],
  size: 22, bold: true, color: "#FFFFFF",
});
b.patchComponent("RewardBox/DiaCount", "MOD.Core.TextGUIRendererComponent",
  { Font: "Maple", HorizontalAlignment: LEFT, BestFit: true, MinSize: 12, MaxSize: 22 });

for (const r of ROWS) {
  b.patch(r.icon, { pos: [-78, r.y], rect_size: [r.size, r.size] });
  b.patch(r.text, { pos: [44, r.y - 8], rect_size: [160, 30] });
  textLeft(r.text);
}
b.patch("RewardBox/NextText", { pos: [10, -250], rect_size: [240, 30] });

// ── ② 등급표: 5열로 재배치 ────────────────────────────────────────────────
const COLS = [
  { name: "Grade", x: -300, w: 90, key: "UI_RAIDGROUP_010" },
  { name: "Cut", x: -195, w: 150, key: "UI_RAIDGROUP_011" },
  { name: "Ring", x: -25, w: 170, key: "UI_RAIDGROUP_012" },
  { name: "Dia", x: 140, w: 150, key: "UI_RAIDGROUP_014" },
  { name: "Scroll", x: 285, w: 130, key: "UI_RAIDGROUP_013" },
];

for (const c of COLS) {
  const p = "RewardTable/Head/" + c.name;
  b.text(p, c.key, {
    anchor: "middle-center", pos: [c.x, 0], rect_size: [c.w, 34],
    size: 22, bold: true, color: "#8FA3BF",
  });
  b.patchComponent(p, "MOD.Core.TextGUIRendererComponent",
    { Font: "Maple", IsLocalizationKey: true, HorizontalAlignment: LEFT, BestFit: true, MinSize: 11, MaxSize: 22 });
}

for (let i = 0; i < 7; i++) {
  for (const c of COLS) {
    const p = "RewardTable/Row" + i + "/" + c.name;
    b.text(p, "-", {
      anchor: "middle-center", pos: [c.x, 0], rect_size: [c.w, 40],
      size: 24, bold: true, color: "#FFFFFF",
    });
    b.patchComponent(p, "MOD.Core.TextGUIRendererComponent",
      { Font: "Maple", HorizontalAlignment: LEFT, BestFit: true, MinSize: 12, MaxSize: 24 });
  }
}

// ── ③ 탭 투 스킵: 딤과 표 본체 아무 데나 눌러도 닫힌다 ───────────────────
const btnRef = b.getComponent("BtnExit", "MOD.Core.ButtonComponent");
b.upsertComponent("RewardTableDim", "MOD.Core.ButtonComponent", btnRef);
b.upsertComponent("RewardTable", "MOD.Core.ButtonComponent", btnRef);

// ── 구석 "보상 받기" 버튼은 코드가 문구를 바꾸므로 번역 키 자동 해석을 끈다 ──
b.patchComponent("BtnClaim", "MOD.Core.TextGUIRendererComponent", { IsLocalizationKey: false });

b.write(UI_PATH, {
  bind: {
    mlua: "RootDesk/MyDesk/Raid/RaidUI.mlua",
    props: {
      rewardDiaCount: "RewardBox/DiaCount",
      btnRewardTableDim: "RewardTableDim",
      btnRewardTablePanel: "RewardTable",
      claimLabel: "BtnClaim",
    },
  },
});
console.log("reward v2 written");
