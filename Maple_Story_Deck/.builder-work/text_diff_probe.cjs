// 두 글씨 컴포넌트(TextGUIRenderer)의 필드 차이를 출력 — 같은 스타일인데 다르게 보일 때 원인 찾기용
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const TGR = "MOD.Core.TextGUIRendererComponent";
const [fa, pa, fb, pb] = process.argv.slice(2);
const a = UIBuilder.read(`ui/${fa}.ui`).getComponent(pa, TGR);
const b = UIBuilder.read(`ui/${fb}.ui`).getComponent(pb, TGR);
for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
  const va = JSON.stringify(a[k]), vb = JSON.stringify(b[k]);
  if (va !== vb) console.log(k.padEnd(24), String(va).slice(0, 60).padEnd(62), String(vb).slice(0, 60));
}
