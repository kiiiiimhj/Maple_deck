// 인트로 만화 5차(2026-09-24 유저: "글씨체 메이플, 줄바꿈 없이 한 줄, 흰 글씨가 잘 안 보임 — 딤 깔든지 색 바꾸든지")
//  · 자막·안내·건너뛰기 글꼴 = Maple
//  · 자막 뒤 반투명 검은 띠 = 자막 엔티티 자신의 스프라이트(둥근 기본 스킨, 검정 0.55) — 새 엔티티를 안 만들어 그리기 순서가 안 꼬인다.
//    띠 안에 자막(가운데)과 "화면을 터치하면 계속"(띠 아래쪽)이 같이 들어가게 크기를 잡는다
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/IntroComicGroup.ui";
const SKIN = "2860136c06ab075439721c027de365af"; // 기본 둥근 패널(9분할)
const b = UIBuilder.load(FILE);

for (const p of ["Screen/Subtitle", "Screen/TapHint", "Screen/SkipBtn"]) {
  b.patchComponent(p, "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
}

const band = (p) => {
  if (!b.getComponent(p, "MOD.Core.SpriteGUIRendererComponent")) throw new Error(p + " has no SpriteGUIRendererComponent");
  b.patchComponent(p, "MOD.Core.SpriteGUIRendererComponent", {
    ImageRUID: { DataId: SKIN }, Type: 1, Color: { r: 0, g: 0, b: 0, a: 0.55 }, RaycastTarget: false,
  });
};
// 자막 띠: 셋째 줄 컷 아래(-395) 바로 밑, 한 줄 자막이 가운데
b.patch("Screen/Subtitle", { pos: [0, -441], rect_size: [1400, 68] });
band("Screen/Subtitle");
// 안내 문구: 그 아래 작은 띠
b.patch("Screen/TapHint", { pos: [0, -495], rect_size: [420, 36] });
b.patchComponent("Screen/TapHint", "MOD.Core.TextGUIRendererComponent", { FontSize: 22 });
band("Screen/TapHint");
b.write(FILE);
