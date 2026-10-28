// .model 안의 TextComponent(레거시) → TextGUIRendererComponent 변환기 (2026-10-29, 2차)
// 사용: node .builder-work/textgui_model.cjs <model 경로> [--dry]
// 매핑은 textgui_convert.cjs의 mapComponent를 그대로 쓴다. 모델은 값마다 엔진 타입 이름이 붙으므로
// 색·여백은 원래 값의 타입 이름을 복사하고, 정렬·굵기·넘침 같은 선택값은 Int32로 넣는다(메이커 실측으로 확인할 것).
const path = require("path");
const { ModelBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-general", "scripts", "model", "msw_model_builder.cjs"));
const { mapComponent } = require("./textgui_convert.cjs");

const OLD = "MOD.Core.TextComponent";
const NEW = "MOD.Core.TextGUIRendererComponent";
const INT = "System.Int32, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089";
const FLOAT = "System.Single, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089";
const BOOL = "System.Boolean, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089";
const STR = "System.String, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089";

// TextComponent 기본값(.d.mlua) — 모델은 바꾼 값만 저장하므로 빠진 값은 이걸로 채운다
const DEFAULTS = {
  Text: "Text", Font: 0, FontSize: 20, Alignment: 4, Bold: false, BestFit: false, MinSize: 10, MaxSize: 40,
  FontColor: { r: 0, g: 0, b: 0, a: 1 }, UseOutLine: false, OutlineWidth: 1, OutlineColor: { r: 0.7, g: 0.7, b: 0.7, a: 1 },
  DropShadow: false, DropShadowAngle: 30, DropShadowDistance: 32, DropShadowColor: { r: 0, g: 0, b: 0, a: 0.72 },
  Overflow: 0,
};
const FLOAT_KEYS = new Set(["FontSize", "MinSize", "MaxSize", "OutlineWidth", "FaceDilate", "UnderlayOffsetX", "UnderlayOffsetY", "UnderlayDilate", "UnderlaySoftness", "ConstraintX", "ConstraintY"]);
const INT_KEYS = new Set(["FontStyle", "HorizontalAlignment", "VerticalAlignment", "Overflow", "OrderInLayer"]);
const BOOL_KEYS = new Set(["Enable", "IsLocalizationKey", "BestFit", "SizeFit", "IsRichText", "UseConstraintX", "UseConstraintY", "OverrideSorting", "IgnoreMapLayerCheck", "Underlay"]);
const COLOR_KEYS = new Set(["FontColor", "OutlineColor", "UnderlayColor"]);

function plainColor(v) {
  if (!v || typeof v !== "object") return null;
  if ("r" in v) return { r: v.r, g: v.g, b: v.b, a: v.a ?? 1 };
  if ("x" in v) return { r: v.x, g: v.y, b: v.z ?? 0, a: 1 }; // 옛날에 Vector3로 잘못 저장된 색
  return null;
}

function convertModel(file, dry) {
  const b = ModelBuilder.read(file);
  let colorType = null;
  let rectType = null;
  for (const c of b.listChildren()) for (const v of c.Model.Values || []) {
    if (v.ValueType && /MODColor/.test(v.ValueType.type)) colorType = colorType || v.ValueType.type;
    if (v.ValueType && /MODRectOffset/.test(v.ValueType.type)) rectType = rectType || v.ValueType.type;
  }
  const report = [];
  for (const c of b.listChildren()) {
    const comps = c.Model.Components || [];
    if (!comps.includes(OLD)) continue;
    const vals = (c.Model.Values || []).filter((v) => v.TargetType === OLD);
    const o = { ...DEFAULTS };
    for (const v of vals) o[v.Name] = COLOR_KEYS.has(v.Name) || /Color$/.test(v.Name) ? plainColor(v.Value) || DEFAULTS[v.Name] : v.Value;
    const padding = vals.find((v) => v.Name === "Padding");
    const n = mapComponent(o);
    delete n["@type"];
    delete n.SpacingOption; // 모델에 구조체 타입 이름을 모름 — 굵은 메이플 글꼴이 모델에 없어서 필요 없음(있으면 경고)
    if (mapComponent(o).SpacingOption) report.push(`WARN ${c.Name}: 굵은 메이플 글꼴인데 모델이라 글자 간격 보정을 못 넣음`);
    report.push(`${c.Name}: ${vals.length}개 값 → ${Object.keys(n).length}개 (text=${JSON.stringify(o.Text)} size=${o.FontSize} bold=${o.Bold} outline=${n.OutlineWidth})`);
    if (dry) continue;
    for (const v of vals) b.removeChildValue(c.Name, OLD, v.Name);
    b.removeChildComponent(c.Name, OLD);
    b.childComponent(c.Name, NEW);
    for (const [k, v] of Object.entries(n)) {
      if (v === undefined || v === null) continue;
      if (COLOR_KEYS.has(k)) {
        if (!colorType) throw new Error("MODColor 타입 이름을 모델에서 못 찾음");
        b.childValue(c.Name, NEW, k, { $type: "MOD.Core.MODColor, MOD.Core", ...v }, colorType);
      } else if (k === "Padding") {
        if (padding && rectType) b.childValue(c.Name, NEW, k, padding.Value, rectType);
      } else if (FLOAT_KEYS.has(k)) b.childValue(c.Name, NEW, k, Number(v), FLOAT);
      else if (INT_KEYS.has(k)) b.childValue(c.Name, NEW, k, Math.round(Number(v)), INT);
      else if (BOOL_KEYS.has(k)) b.childValue(c.Name, NEW, k, Boolean(v), BOOL);
      else if (typeof v === "string") b.childValue(c.Name, NEW, k, v, STR);
    }
  }
  if (!dry) b.write(file);
  console.log(`MODEL ${file}${dry ? " [dry]" : ""}\n  ` + report.join("\n  "));
}

const args = process.argv.slice(2);
convertModel(args[0], args.includes("--dry"));
