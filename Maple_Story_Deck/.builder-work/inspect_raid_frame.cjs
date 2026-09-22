// 레이드 액자/배경 현재 상태 점검 (읽기 전용)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const b = UIBuilder.load("ui/RaidGroup.ui");

const list = b.listEntities();
for (const e of list) {
  const t = b.getComponent(e.path, "MOD.Core.UITransformComponent");
  const pos = t ? `(${t.anchoredPosition?.x}, ${t.anchoredPosition?.y})` : "-";
  const size = t ? `(${t.RectSize?.x}, ${t.RectSize?.y})` : "-";
  const anc = t ? `A[${t.AnchorMin?.x},${t.AnchorMin?.y}]-[${t.AnchorMax?.x},${t.AnchorMax?.y}] P[${t.Pivot?.x},${t.Pivot?.y}]` : "";
  console.log(`${"  ".repeat(e.depth)}${e.name}  | ${e.kind} | do=${e.displayOrder ?? "?"} | pos=${pos} size=${size} ${anc}`);
}
