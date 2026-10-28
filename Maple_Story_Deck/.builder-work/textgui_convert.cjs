// TextComponent(레거시) → TextGUIRendererComponent 변환기 (2026-10-29)
// 모바일 앱에서 월드 재입장 시 TextComponent만 안 그려지는 MSW 버그 우회용.
// 사용: node .builder-work/textgui_convert.cjs <GroupName> [--dry]
//   변환한 엔티티 목록을 .builder-work/textgui_<Group>.json 에 남긴다(코드 쪽 property 타입 교체에 씀).
const path = require("path");
const fs = require("fs");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const FONTS = ["Default", "Maple", "Bazzi", "Football"];
const H = [1, 2, 4];          // Left, Center, Right
const V = [256, 512, 1024];   // Top, Middle, Bottom
// 옛 OverflowType: Overflow=0, Truncate=1, ellipsis=2 / 새 TextOverflowMode: Overflow=0, Ellipsis=1, Truncate=2
const OVERFLOW = { 0: 0, 1: 2, 2: 1 };

function has(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }

function mapComponent(o) {
  const n = { "@type": "MOD.Core.TextGUIRendererComponent", Enable: has(o, "Enable") ? o.Enable : true };
  // 그대로 옮기는 값(이름·형식이 같음)
  for (const k of ["Text", "IsLocalizationKey", "FontColor", "BestFit", "ConstraintX", "ConstraintY",
    "UseConstraintX", "UseConstraintY", "Padding", "SizeFit", "IsRichText", "OrderInLayer",
    "OverrideSorting", "SortingLayer", "IgnoreMapLayerCheck", "OutlineColor"]) {
    if (has(o, k)) n[k] = o[k];
  }
  n.FontSize = has(o, "FontSize") ? o.FontSize : 20;
  n.MinSize = has(o, "MinSize") ? o.MinSize : 10;
  n.MaxSize = has(o, "MaxSize") ? o.MaxSize : 40;
  n.Font = FONTS[has(o, "Font") ? o.Font : 0] || "Default";
  n.FontStyle = o.Bold ? 1 : 0;
  // 새 엔진의 굵게는 글자 사이도 벌어져서 메이플 글꼴 기준 11~13% 넓다 — 간격 -7이면 크기와 무관하게 원래 폭과 1~2px 차이(2026-10-29 실측)
  if (o.Bold && n.Font === "Maple") n.SpacingOption = { Character: -7, Line: 0, Paragraph: 0, Word: 0 };
  const a = has(o, "Alignment") ? o.Alignment : 4;
  n.HorizontalAlignment = H[a % 3];
  n.VerticalAlignment = V[Math.floor(a / 3)];
  n.Overflow = OVERFLOW[has(o, "Overflow") ? o.Overflow : 0] ?? 0;
  // 외곽선: 옛 값은 글자 크기와 무관한 px, 새 값은 글자 크기에 비례 → px × 7.7 ÷ 글자 크기
  // (2026-10-29 실험판 실측: 22px·2px → 0.7, 18px·1px → 0.43이 원래와 가장 비슷)
  if (o.UseOutLine) {
    const px = has(o, "OutlineWidth") ? o.OutlineWidth : 1;
    const size = has(o, "FontSize") ? o.FontSize : 20;
    const w = Math.round(Math.min(1, Math.max(0.05, px * 7.7 / size)) * 100) / 100;
    n.OutlineWidth = w;
    n.FaceDilate = w;
  } else {
    n.OutlineWidth = 0;
  }
  // 그림자: DropShadowAngle 120 = 우하단(실측) → x=-cos, y=-sin
  if (o.DropShadow) {
    const ang = (has(o, "DropShadowAngle") ? o.DropShadowAngle : 30) * Math.PI / 180;
    // 옛 그림자는 번짐 없는 진한 복사본이라 번짐 0 + 약간 두껍게 + 오프셋 크게(실험판 실측, 3px@120 기준 x 0.6 / y -1)
    const k = 1.2 * Math.min(1, Math.max(0.3, (has(o, "DropShadowDistance") ? o.DropShadowDistance : 3) / 3));
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    n.Underlay = true;
    n.UnderlayColor = has(o, "DropShadowColor") ? o.DropShadowColor : { r: 0, g: 0, b: 0, a: 0.72 };
    n.UnderlayOffsetX = Math.round(clamp(-Math.cos(ang) * k) * 100) / 100;
    n.UnderlayOffsetY = Math.round(clamp(-Math.sin(ang) * k) * 100) / 100;
    n.UnderlayDilate = 0.4;
    n.UnderlaySoftness = 0;
  } else {
    n.Underlay = false;
  }
  return n;
}

function convert(group, dry) {
  const file = `ui/${group}.ui`;
  const b = UIBuilder.load(file);
  const done = [];
  const skipped = [];
  for (const e of b.listEntities()) {
    const o = b.getComponent(e.path, "MOD.Core.TextComponent");
    if (!o) continue;
    if (b.getComponent(e.path, "MOD.Core.TextGUIRendererComponent")) { skipped.push(e.path); continue; }
    const n = mapComponent(o);
    if (!dry) {
      b.removeComponent(e.path, "MOD.Core.TextComponent");
      b.addComponent(e.path, "MOD.Core.TextGUIRendererComponent", n);
    }
    done.push({ id: b.getId(e.path), path: e.path, text: o.Text });
  }
  if (!dry) b.write(file, { strict: false });
  fs.writeFileSync(path.join(__dirname, `textgui_${group}.json`), JSON.stringify({ group, done, skipped }, null, 1));
  console.log(`CONVERT ${group}: ${done.length} converted, ${skipped.length} skipped (both components)${dry ? " [dry]" : ""}`);
}

module.exports = { mapComponent };
if (require.main === module) {
  const args = process.argv.slice(2);
  convert(args[0], args.includes("--dry"));
}
