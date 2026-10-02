// 로비 스킬탭/유물탭 목록 슬롯의 조각 게이지(ProgressBg/Fill/Text, "1/2")가 x=-15로 왼쪽에 치우쳐 있던 것 →
// 슬롯 가운데(x=0)로 맞추고 위로 2px(유저 지정 2026-10-02). 같은 날 잘못 옮긴 강화 팝업 게이지(FragmentBar)는 -45로 원복.
// 사용: node .builder-work/slot_progress_center.cjs          → 바뀔 내용만 출력(dry run)
//       node .builder-work/slot_progress_center.cjs --write  → 실제로 쓴다(Maker stop 후)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const WRITE = process.argv.includes("--write");
const T = "MOD.Core.UITransformComponent";
const PARTS = ["ProgressBg", "ProgressFill", "ProgressText"];

const setPos = (b, path, np) => {
  const t = b.getComponent(path, T);
  const half = { x: t.RectSize.x / 2, y: t.RectSize.y / 2 };
  b.patchComponent(path, T, {
    anchoredPosition: np,
    OffsetMin: { x: np.x - half.x, y: np.y - half.y },
    OffsetMax: { x: np.x + half.x, y: np.y + half.y },
  });
};

// 1) 로비 목록 슬롯
const file = "ui/TitleGroup.ui";
const b = UIBuilder.read(file);
let n = 0;
const seen = {};
for (const e of b.entities) {
  const p = e.jsonString.path;
  const m = p.match(/\/(SkillPanel|RelicPanel)\/ScrollArea\/List\/(SkillSlot|RelicSlot)_\d+\/(ProgressBg|ProgressFill|ProgressText)$/);
  if (!m) continue;
  const t = b.getComponent(p, T);
  const from = t.anchoredPosition;
  const np = { x: 0, y: -105 }; // 원래 (-15, -107) → 가운데 + 위로 2px
  const key = `${m[1]} ${m[3]} ${from.x},${from.y}`;
  seen[key] = (seen[key] || 0) + 1;
  if (from.x === np.x && from.y === np.y) continue;
  if (WRITE) setPos(b, p, np);
  n++;
}
console.log("slots current positions:", JSON.stringify(seen));
console.log(WRITE ? "moved" : "would move", n, "entities -> (0,-105)");
if (WRITE) b.write(file, { strict: false });

// 2) 강화 팝업 게이지 원복
for (const name of ["RelicUpgradeGroup", "SkillUpgradeGroup"]) {
  const f = `ui/${name}.ui`;
  const pb = UIBuilder.read(f);
  const t = pb.getComponent("Panel/FragmentBar", T);
  console.log(name, "FragmentBar", JSON.stringify(t.anchoredPosition), "-> 0,-45");
  if (WRITE && t.anchoredPosition.y !== -45) { setPos(pb, "Panel/FragmentBar", { x: 0, y: -45 }); pb.write(f, { strict: false }); }
}
