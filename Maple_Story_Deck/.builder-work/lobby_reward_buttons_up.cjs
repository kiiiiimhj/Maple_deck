// 로비 시작 버튼 위 에피소드 보상/방치 보상 버튼이 시작 버튼에 너무 붙어 있어 위로 띄운다(유저 지정 2026-10-02).
// 사용: node .builder-work/lobby_reward_buttons_up.cjs [--write]
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const WRITE = process.argv.includes("--write");
const T = "MOD.Core.UITransformComponent";
const DY = 25;
const FILE = "ui/TitleGroup.ui";
const b = UIBuilder.read(FILE);
for (const P of ["BattlePanel/EpisodeRewardButton", "BattlePanel/IdleRewardButton"]) {
  const t = b.getComponent(P, T);
  const np = { x: t.anchoredPosition.x, y: t.anchoredPosition.y + DY };
  const half = { x: t.RectSize.x / 2, y: t.RectSize.y / 2 };
  console.log(P, JSON.stringify(t.anchoredPosition), "->", JSON.stringify(np));
  if (WRITE) b.patchComponent(P, T, { anchoredPosition: np, OffsetMin: { x: np.x - half.x, y: np.y - half.y }, OffsetMax: { x: np.x + half.x, y: np.y + half.y } });
}
if (WRITE) b.write(FILE, { strict: false });
