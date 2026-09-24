// 인트로 만화 1차 보정(2026-09-24 첫 확인 후) — 기존 파일을 불러와 고친다(새로 만들면 UUID가 바뀌어 바인딩이 깨진다)
//  ① 안내·건너뛰기 글자가 키 그대로 보임 → TextGUIRenderer.IsLocalizationKey = true
//  ② 3번 컷 아래 흰 띠 → 그림을 칸보다 더 크게 덮기(전체 6%, 3번 컷 14%)
//  ③ 건너뛰기가 1번 컷 모서리를 가림 → 오른쪽 아래로
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/IntroComicGroup.ui";
const b = UIBuilder.load(FILE);

for (const p of ["Screen/TapHint", "Screen/SkipBtn"]) {
  b.patchComponent(p, "MOD.Core.TextGUIRendererComponent", { IsLocalizationKey: true });
}

const COVER = { default: 1.06, 3: 1.14 };
for (let i = 1; i <= 7; i++) {
  const frame = b.getComponent(`Screen/Cut${i}/Frame`, "MOD.Core.UITransformComponent");
  const img = b.getComponent(`Screen/Cut${i}/Frame/Img`, "MOD.Core.UITransformComponent");
  const aspect = img.RectSize.x / img.RectSize.y; // 1차에서 실측 비율로 만든 크기 → 비율 유지
  const iw = frame.RectSize.x, ih = frame.RectSize.y;
  const c = COVER[i] || COVER.default;
  let pw = iw * c, ph = pw / aspect;
  if (ph < ih * c) { ph = ih * c; pw = ph * aspect; }
  b.patch(`Screen/Cut${i}/Frame/Img`, { rect_size: [Math.round(pw), Math.round(ph)] });
}

b.patch("Screen/SkipBtn", { anchor: "bottom-right", pos: [-40, 30] });
b.write(FILE);
