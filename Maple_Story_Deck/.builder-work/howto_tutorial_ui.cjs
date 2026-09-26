// 인게임 옵션 "게임 방법" 이미지 튜토리얼을 OptionGroup.ui에 추가한다 (2026-09-26).
// 레이드 튜토리얼(raid_tutorial_ui.cjs)과 같은 배치: 4단계 이미지 지그재그 + 화살표 3개 + Tap To Skip.
// 문구는 GameText.csv 키(UI_OPTIONGROUP_011~014)라 IsLocalizationKey=true 필수.
// 재실행 안전(같은 경로는 upsert).
const path = require("path");
const UI_SKILL = "G:/Maple_Story_Deck/.claude/skills/msw-ui-system";
const { UIBuilder } = require(path.join(UI_SKILL, "scripts", "msw_ui_builder.cjs"));

const UI_PATH = "G:/Maple_Story_Deck/ui/OptionGroup.ui";
const MLUA = "G:/Maple_Story_Deck/RootDesk/MyDesk/UI/HowToPlayUI.mlua";

const SOLID = "4fea64a3307cda641809ad8be0d4890b"; // 단색 UI 스프라이트(딤 전용, 레이드 튜토리얼과 동일)

// 유저가 올린 게임방법 이미지(계정 리소스 tuto_1~4) — 비율은 64px 썸네일 불투명 영역 실측값
//   tuto_1 1.83 / tuto_2 1.44 / tuto_3 0.97 / tuto_4 1.40
const ROOT = "HowToTutorial";
const STEPS = [
  { ruid: "5542af3e4d564eac8989470c42a0f90e", size: [439, 240], img: [0, 130], key: "UI_OPTIONGROUP_011" },
  { ruid: "a9c7c1c9fc4c4900bf35e446dde2a697", size: [346, 240], img: [0, 130], key: "UI_OPTIONGROUP_012" },
  { ruid: "fe0da802578c4ad49f909f5f7b1cad79", size: [271, 280], img: [0, 150], key: "UI_OPTIONGROUP_013" },
  { ruid: "3920d074ba1349bdbde5ff6c2a793ed1", size: [336, 240], img: [0, 130], key: "UI_OPTIONGROUP_014" },
];
const STEP_POS = [[-450, 240], [450, 240], [-450, -250], [450, -250]];

// 화살표 2종(오른쪽 아래 / 왼쪽 아래) — 레이드 튜토리얼과 같은 리소스·자리
const ARROWS = [
  { name: "Arrow1", ruid: "8c8b3ce8dee3436bb6e55ee0ba233183", pos: [-16, 370], size: [150, 90] },
  { name: "Arrow2", ruid: "69a856a2944745e387cb6603172fc364", pos: [0, 95], size: [170, 86] },
  { name: "Arrow3", ruid: "8c8b3ce8dee3436bb6e55ee0ba233183", pos: [-27, -100], size: [150, 90] },
];

const LABEL_STYLE = {
  Font: "Maple", IsLocalizationKey: true,
  Underlay: true, UnderlayColor: { r: 0, g: 0, b: 0, a: 0.8 },
  UnderlayOffsetX: 0.06, UnderlayOffsetY: -0.06, UnderlayDilate: 0.25,
};

const b = UIBuilder.load(UI_PATH);

// 루트: 화면 전체(모바일 넓은 화면도 덮도록 stretch). 맨 위에 그려지도록 displayOrder를 가장 크게
b.empty(ROOT, { anchor: "stretch", pos: [0, 0], rect_size: [0, 0], enable: false });
b.patch(ROOT, { display_order: 100 });

// 화면 전체를 덮는 딤 = 탭 영역(아무 데나 누르면 닫힘)
b.button(ROOT + "/Dim", "", {
  anchor: "stretch", pos: [0, 0], rect_size: [0, 0],
  image_ruid: SOLID, sprite_type: 0, bg_color: { r: 0, g: 0, b: 0, a: 0.94 },
  font_size: 1, enable: true,
});

STEPS.forEach((step, i) => {
  const name = ROOT + "/Step" + (i + 1);
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
  b.text(name + "/Label", step.key, {
    anchor: "middle-center", pos: [0, -45], pivot: [0.5, 0.5], rect_size: [660, 100],
    size: 34, bold: true, color: "#FFFFFF", alignment: 4, enable: true,
  });
  b.patchComponent(name + "/Label", "MOD.Core.TextGUIRendererComponent", LABEL_STYLE);
  b.patch(name + "/Label", { localize: true });
});

ARROWS.forEach((a) => {
  b.sprite(ROOT + "/" + a.name, {
    anchor: "middle-center", pos: a.pos, pivot: [0.5, 0.5], rect_size: a.size,
    image_ruid: a.ruid, sprite_type: 0, color: { r: 1, g: 1, b: 1, a: 1 },
    raycast: false, enable: false,
  });
  b.patchComponent(ROOT + "/" + a.name, "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 1 });
});

b.text(ROOT + "/Skip", "Tap To Skip", {
  anchor: "bottom-center", pos: [0, 70], pivot: [0.5, 0.5], rect_size: [600, 60],
  size: 34, bold: true, color: "#FFFFFF", alignment: 4, enable: true,
});
b.patchComponent(ROOT + "/Skip", "MOD.Core.TextGUIRendererComponent", {
  Font: "Maple", FontColor: { r: 1, g: 1, b: 1, a: 0.85 },
  Underlay: true, UnderlayColor: { r: 0, g: 0, b: 0, a: 0.8 },
  UnderlayOffsetX: 0.06, UnderlayOffsetY: -0.06, UnderlayDilate: 0.25,
});

b.write(UI_PATH, {
  strict: false,
  lint_verbose: true,
  bind: {
    mlua: MLUA,
    props: {
      optionGroup: "/ui/OptionGroup",
      tutorialRoot: ROOT,
      tutorialRootTf: ROOT,
      tutorialDimBtn: ROOT + "/Dim",
      step1: ROOT + "/Step1",
      step2: ROOT + "/Step2",
      step3: ROOT + "/Step3",
      step4: ROOT + "/Step4",
      arrow1: ROOT + "/Arrow1",
      arrow2: ROOT + "/Arrow2",
      arrow3: ROOT + "/Arrow3",
    },
  },
});
console.log("done");
