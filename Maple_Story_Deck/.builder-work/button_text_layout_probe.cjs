// 버튼 글씨 위치 조사: 자식 라벨의 앵커/위치/크기, 자기 글씨의 Padding
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const T = "MOD.Core.UITransformComponent";
const items = require(process.argv[2] + "/button_texts.json");
const cache = {};
for (const x of items) {
  if (!x.text || !String(x.text).trim()) continue;
  const b = (cache[x.file] ??= UIBuilder.read(x.file));
  const tt = b.getComponent(x.txt, T), bt = b.getComponent(x.btn, T);
  const tc = b.getComponent(x.txt, "MOD.Core." + x.kind);
  const pad = tc.Padding ? JSON.stringify(tc.Padding) : "";
  console.log(x.file.slice(3, -3).padEnd(20), (x.btn.split("/").pop() + ">" + (x.txt === x.btn ? "self" : x.txt.split("/").pop())).padEnd(36),
    "btn", JSON.stringify(bt.RectSize), "txt", x.txt === x.btn ? "" : JSON.stringify([tt.AnchorsMin, tt.AnchorsMax, tt.anchoredPosition, tt.RectSize, tt.Pivot]), pad);
}
