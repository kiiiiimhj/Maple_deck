// 피격 가장자리 플래시 UI(ui/HitFeelGroup.ui) — 2026-09-30.
// Left / Right = 세로 띠 12장으로 만든 붉은 주황 그라데이션(바깥쪽이 진하고 안쪽으로 옅어짐). 컨트롤러: UI/HitFeelLogic.mlua
// 이미 파일이 있으면 그대로 읽어서 덮어쓴다(같은 경로는 UUID 유지) — 다시 돌려도 안전.
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/HitFeelGroup.ui";
const WHITE = "4fea64a3307cda641809ad8be0d4890b"; // 프로젝트 딤에 쓰는 흰 사각형
const STRIPS = 12, STRIP_W = 20, WIDTH = STRIPS * STRIP_W, HEIGHT = 2400;
const COLOR = { r: 1.0, g: 0.3, b: 0.12 };

const b = fs.existsSync(FILE) ? UIBuilder.load(FILE) : new UIBuilder("HitFeelGroup", 1, true);

// 인게임 HUD(DefaultGroup 0) 위, 토스트(3)·게임오버(4) 아래. 터치는 전부 통과시킨다.
b.patchComponent("/", "MOD.Core.UIGroupComponent", { DefaultShow: true, GroupOrder: 1, GroupType: 1 });
b.patchComponent("/", "MOD.Core.CanvasGroupComponent", { BlocksRaycasts: false, Interactable: false, GroupAlpha: 1 });

for (const side of ["Left", "Right"]) {
  const sign = side === "Left" ? -1 : 1;
  b.empty(side, { anchor: "middle-center", pos: [sign * (960 - WIDTH / 2), 0], rect_size: [WIDTH, HEIGHT], enable: false });
  b.upsertComponent(side, "MOD.Core.CanvasGroupComponent", {
    "@type": "MOD.Core.CanvasGroupComponent", BlocksRaycasts: false, GroupAlpha: 1, Interactable: false, Enable: true,
  });
  for (let i = 0; i < STRIPS; i++) {
    // i=0이 화면 바깥쪽(가장 진함). 알파는 제곱 곡선으로 안쪽으로 갈수록 빠르게 옅어진다
    const t = (STRIPS - i) / STRIPS;
    const x = sign * (WIDTH / 2 - STRIP_W / 2 - STRIP_W * i);
    b.sprite(`${side}/S${i}`, {
      anchor: "middle-center", pos: [x, 0], rect_size: [STRIP_W, HEIGHT],
      image_ruid: WHITE, sprite_type: 0, raycast: false,
      color: { r: COLOR.r, g: COLOR.g, b: COLOR.b, a: +(t * t).toFixed(3) },
    });
  }
}

// 위아래로 화면보다 길게 뽑은 띠라 lint의 화면 밖 경고는 의도된 것
b.write(FILE, {
  strict: false,
  bind: {
    mlua: "RootDesk/MyDesk/UI/HitFeelLogic.mlua",
    props: { rootGroup: "/", leftEdge: "Left", rightEdge: "Right", leftCanvas: "Left", rightCanvas: "Right" },
  },
});
const c = UIBuilder.read(FILE);
console.log("Left:", c.find("Left").componentNames, "| strips:", c.listEntities().filter(e => /\/S\d+$/.test(e.path)).length);
