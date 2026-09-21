// 레이드 온보딩 UI를 TitleGroup.ui에 추가한다 (2026-09-21).
//   · RaidUnlockBanner   "레이드가 생성되었습니다!" 알림 배너
//   · RaidGuideDim/Finger 로비 딤 + 레이드 아이콘을 가리키는 손가락
//   · RaidTutorial        4단계 이미지 + 화살표 + Tap To Skip (유저 제작 레퍼런스 흐름)
// 별도 .ui 그룹을 만들지 않는 이유: 딤 위로 레이드 아이콘만 올리려면 같은 UIGroup 안이어야 하고,
// 새 GroupOrder를 잡으면 Maker가 다른 .ui들의 순서까지 재정렬한 전례가 있다.
const path = require("path");
const UI_SKILL = "G:/Maple_Story_Deck/.claude/skills/msw-ui-system";
const { UIBuilder } = require(path.join(UI_SKILL, "scripts", "msw_ui_builder.cjs"));

const UI_PATH = "G:/Maple_Story_Deck/ui/TitleGroup.ui";
const MLUA = "G:/Maple_Story_Deck/RootDesk/MyDesk/Raid/RaidTutorialUI.mlua";

const SOLID = "4fea64a3307cda641809ad8be0d4890b";      // 단색 UI 스프라이트(딤 전용)
const TOAST_BOX = "7d614552ba7843049bb48ebd4509fb8f";  // 인게임 토스트와 같은 9슬라이스 박스
const FINGER = "3930c5d2e85b4bff8467aada64fda7f5";     // 온보딩 튜토리얼과 같은 손가락

// 유저가 올린 레이드 튜토리얼 이미지(계정 리소스) — 비율은 썸네일 불투명 영역 실측값
const STEPS = [
  { ruid: "0b858e7c4bd847ba81297c1679ee4c9b", size: [378, 240], img: [0, 130],
    text: "일반 게임을 진행하면 자동으로\n레이드 공격이 진행됩니다!" },
  { ruid: "a2c9c89d4b8c49c095aa95032b39048f", size: [445, 240], img: [0, 130],
    text: "일반 게임을 플레이할수록\n레이드 대미지가 높아집니다!" },
  { ruid: "8218e03efe9b4cba899c1826c0b6134e", size: [220, 280], img: [0, 150],
    text: "24시간 미접속 시 캐릭터가\n죽을 수 있으니 주의하세요!" },
  { ruid: "fb5ee9d5ecde45b3aee3b44db7cc1c05", size: [331, 250], img: [0, 135],
    text: "높은 등급을 달성하고 특별한\n보상을 획득하세요!" },
];
const STEP_POS = [[-450, 240], [450, 240], [-450, -250], [450, -250]];

// 화살표 2종(오른쪽 아래 방향 / 왼쪽 아래 방향) — 레퍼런스처럼 지그재그를 잇는다
const ARROWS = [
  { name: "Arrow1", ruid: "8c8b3ce8dee3436bb6e55ee0ba233183", pos: [-16, 370], size: [150, 90] },
  { name: "Arrow2", ruid: "69a856a2944745e387cb6603172fc364", pos: [0, 95], size: [170, 86] },
  { name: "Arrow3", ruid: "8c8b3ce8dee3436bb6e55ee0ba233183", pos: [-27, -100], size: [150, 90] },
];

const b = UIBuilder.load(UI_PATH);

// ── ① 알림 배너 ───────────────────────────────────────────────────────────
b.sprite("RaidUnlockBanner", {
  anchor: "top-center", pos: [0, -300], pivot: [0.5, 0.5], rect_size: [860, 130],
  image_ruid: TOAST_BOX, sprite_type: 1, color: { r: 1, g: 1, b: 1, a: 0.82 },
  raycast: false, enable: false,
  text: "레이드가 생성되었습니다!", text_size: 44, text_bold: true,
  text_color: "#FFFFFF",
});
b.patchComponent("RaidUnlockBanner", "MOD.Core.TextGUIRendererComponent", {
  Font: "Maple", Underlay: true, UnderlayColor: { r: 0, g: 0, b: 0, a: 0.75 },
  UnderlayOffsetX: 0.06, UnderlayOffsetY: -0.06, UnderlayDilate: 0.2,
});
if (!b.hasComponent("RaidUnlockBanner", "MOD.Core.CanvasGroupComponent")) {
  b.addComponent("RaidUnlockBanner", "MOD.Core.CanvasGroupComponent", {
    "@type": "MOD.Core.CanvasGroupComponent",
    GroupAlpha: 1, Interactable: false, BlocksRaycasts: false, Enable: true,
  });
}

// ── ② 로비 딤 + 손가락 ────────────────────────────────────────────────────
b.sprite("RaidGuideDim", {
  anchor: "middle-center", pos: [0, 0], pivot: [0.5, 0.5], rect_size: [1920, 1080],
  image_ruid: SOLID, sprite_type: 0, color: { r: 0, g: 0, b: 0, a: 0.72 },
  raycast: true, enable: false,
});
b.sprite("RaidGuideFinger", {
  anchor: "middle-right", pos: [-194, -55], pivot: [0.5, 0.5], rect_size: [130, 130],
  image_ruid: FINGER, sprite_type: 0, color: { r: 1, g: 1, b: 1, a: 1 },
  raycast: false, enable: false,
});
b.patchComponent("RaidGuideFinger", "MOD.Core.SpriteGUIRendererComponent", { FlipX: true });

// ── ③ 이미지 튜토리얼 ─────────────────────────────────────────────────────
b.empty("RaidTutorial", {
  anchor: "middle-center", pos: [0, 0], pivot: [0.5, 0.5], rect_size: [1920, 1080],
  enable: false,
});
// 화면 전체를 덮는 딤 = 탭 영역(아무 데나 누르면 닫힘)
b.button("RaidTutorial/Dim", "", {
  anchor: "middle-center", pos: [0, 0], pivot: [0.5, 0.5], rect_size: [1920, 1080],
  image_ruid: SOLID, sprite_type: 0, bg_color: { r: 0, g: 0, b: 0, a: 0.94 },
  font_size: 1, enable: true,
});

STEPS.forEach((step, i) => {
  const name = "RaidTutorial/Step" + (i + 1);
  b.empty(name, {
    anchor: "middle-center", pos: STEP_POS[i], pivot: [0.5, 0.5], rect_size: [700, 480],
    enable: false,
  });
  b.sprite(name + "/Img", {
    anchor: "middle-center", pos: step.img, pivot: [0.5, 0.5], rect_size: step.size,
    image_ruid: step.ruid, sprite_type: 0, color: { r: 1, g: 1, b: 1, a: 1 },
    raycast: false, enable: true,
  });
  // 원화 비율 유지(RectSize가 조금 어긋나도 눌리지 않게)
  b.patchComponent(name + "/Img", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
  b.text(name + "/Label", step.text, {
    anchor: "middle-center", pos: [0, -45], pivot: [0.5, 0.5], rect_size: [660, 100],
    size: 34, bold: true, color: "#FFFFFF", alignment: 4, enable: true,
  });
  b.patchComponent(name + "/Label", "MOD.Core.TextGUIRendererComponent", {
    Font: "Maple", Underlay: true, UnderlayColor: { r: 0, g: 0, b: 0, a: 0.8 },
    UnderlayOffsetX: 0.06, UnderlayOffsetY: -0.06, UnderlayDilate: 0.25,
  });
});

ARROWS.forEach((a) => {
  b.sprite("RaidTutorial/" + a.name, {
    anchor: "middle-center", pos: a.pos, pivot: [0.5, 0.5], rect_size: a.size,
    image_ruid: a.ruid, sprite_type: 0, color: { r: 1, g: 1, b: 1, a: 1 },
    raycast: false, enable: false,
  });
  b.patchComponent("RaidTutorial/" + a.name, "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
});

b.text("RaidTutorial/Skip", "Tap To Skip", {
  anchor: "bottom-center", pos: [0, 70], pivot: [0.5, 0.5], rect_size: [600, 60],
  size: 34, bold: true, color: "#FFFFFF", alignment: 4, enable: true,
});
b.patchComponent("RaidTutorial/Skip", "MOD.Core.TextGUIRendererComponent", {
  Font: "Maple", FontColor: { r: 1, g: 1, b: 1, a: 0.85 },
  Underlay: true, UnderlayColor: { r: 0, g: 0, b: 0, a: 0.8 },
  UnderlayOffsetX: 0.06, UnderlayOffsetY: -0.06, UnderlayDilate: 0.25,
});

// ⚠ strict:false 고정 — 이 파일의 스크롤 리스트(스킬/상점/랭킹/유물 패널) 항목들은 스크롤 전에는
//   캔버스 밖에 있는 게 정상이라 L013 off-canvas 에러가 항상 뜬다. strict면 write가 여기서 멈춰
//   바인딩 주입까지 건너뛴다.
b.write(UI_PATH, {
  strict: false,
  bind: {
    mlua: MLUA,
    props: {
      titleGroup: "/ui/TitleGroup",
      raidButton: "RaidButton",
      raidButtonTf: "RaidButton",
      guideDim: "RaidGuideDim",
      guideDimTf: "RaidGuideDim",
      guideFinger: "RaidGuideFinger",
      guideFingerTf: "RaidGuideFinger",
      banner: "RaidUnlockBanner",
      bannerText: "RaidUnlockBanner",
      bannerCanvas: "RaidUnlockBanner",
      tutorialRoot: "RaidTutorial",
      tutorialRootTf: "RaidTutorial",
      tutorialDimBtn: "RaidTutorial/Dim",
      step1: "RaidTutorial/Step1",
      step2: "RaidTutorial/Step2",
      step3: "RaidTutorial/Step3",
      step4: "RaidTutorial/Step4",
      arrow1: "RaidTutorial/Arrow1",
      arrow2: "RaidTutorial/Arrow2",
      arrow3: "RaidTutorial/Arrow3",
    },
  },
});
console.log("done");
