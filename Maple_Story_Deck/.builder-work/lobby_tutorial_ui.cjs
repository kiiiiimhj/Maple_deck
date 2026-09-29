// 로비 튜토리얼 UI(ui/LobbyTutorialGroup.ui) — 유저 지정 2026-09-29. 시안: 왼쪽 초상화 원 + 가로 대화 상자 + 오른쪽 아래 ▽.
// ⚠ Dialog/Box/Text 값은 2026-09-29 유저가 Maker에서 직접 조정한 값(덮어쓰지 말 것). 원래 좌표는 유저 시안 스샷(1920x1080 캔버스로 환산) 기준. 리소스는 유저 계정 스프라이트(전부 정사각 1024 텍스처 + 투명 여백):
//   box 6c76dd15 — 64px 썸네일 실측: 보이는 틀 x 1~63 / y 22~41, 크림색 안쪽 x 6~59 / y 27~37
//   portrait 3ef1c504 — 꽉 찬 원, triangle d248ffc5 — 보이는 부분 x 12~52 / y 18~47
// ⚠ 이미 있는 파일은 load로 열어 갱신(루트 UUID 유지). 같은 경로 remove→재생성 금지.
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const R = {
  box: "6c76dd15e3b5422a9881f602b85e13f8",
  portrait: "3ef1c504dab4487b83edf6605de5bfe2",
  triangle: "d248ffc505274e0fafa23764b7364baf",
  dim: "4fea64a3307cda641809ad8be0d4890b",
};
const SGR = "MOD.Core.SpriteGUIRendererComponent";
const TGR = "MOD.Core.TextGUIRendererComponent";
const white = { r: 1, g: 1, b: 1, a: 1 };
const PATH = "ui/LobbyTutorialGroup.ui";

const b = fs.existsSync(PATH) ? UIBuilder.load(PATH) : new UIBuilder("LobbyTutorialGroup", 1, false);
b.patchComponent("LobbyTutorialGroup", "MOD.Core.UIGroupComponent", { DefaultShow: false, GroupOrder: 28, GroupType: 2 });

b.sprite("Dim", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], image_ruid: R.dim, color: { r: 0, g: 0, b: 0, a: 0.72 }, raycast: true, sprite_type: 0 });
// 단계별 강조 아이콘 복제본이 들어가는 층(런타임 SpawnByEntity)
b.empty("Highlight", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080] });

// 대화창 — 부모 기준점 = 대화 상자 가운데 근처(등장 팝 연출이 여기 기준으로 커진다)
b.empty("Dialog", { pos: [54, 232], rect_size: [1200, 360] });
b.sprite("Dialog/Box", { rect_size: [1013.60571, 1000.80054], pos: [45.7753, -2.0012], image_ruid: R.box, color: white, sprite_type: 0 });
b.patchComponent("Dialog/Box", SGR, { PreserveSprite: 1 });
b.sprite("Dialog/Portrait", { rect_size: [340, 340], pos: [-450, 8], image_ruid: R.portrait, color: white, sprite_type: 0 });
b.patchComponent("Dialog/Portrait", SGR, { PreserveSprite: 1 });
// 대사 — 크림색 안쪽(초상화 테두리 오른쪽 ~ ▽ 왼쪽) 안에서만. BestFit으로 최대한 크게
b.text("Dialog/Text", "", { size: 40, color: "#4A2C14", pos: [78.9076, -3.00039959], rect_size: [693.815857, 148], bestfit: true, min_size: 16, max_size: 40 });
b.patchComponent("Dialog/Text", TGR, { Font: "Maple", HorizontalAlignment: 1, VerticalAlignment: 512, IsRichText: true });
b.sprite("Dialog/Triangle", { rect_size: [112, 112], pos: [378, -60], image_ruid: R.triangle, color: white, sprite_type: 0, enable: false });
b.patchComponent("Dialog/Triangle", SGR, { PreserveSprite: 1 });

// 화면 전체 터치(맨 위) — 글자 즉시 표시 / 다음 단계
b.button("Touch", "", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], alpha: 0, bg_color: { r: 1, g: 1, b: 1, a: 0 }, image_ruid: R.dim, sprite_type: 0 });

b.write(PATH, {
  strict: false,
  bind: {
    mlua: "RootDesk/MyDesk/UI/LobbyTutorialUI.mlua",
    props: {
      group: "LobbyTutorialGroup",
      highlight: "Highlight",
      dialog: "Dialog",
      box: "Dialog/Box",
      text: "Dialog/Text",
      triangle: "Dialog/Triangle",
      touch: "Touch",
    },
  },
});
